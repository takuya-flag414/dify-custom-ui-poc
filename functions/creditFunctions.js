const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, Timestamp, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const { decrypt } = require('./kmsUtils');

// --- Helper Functions for JST ---

function getMostRecentMondayEpochMs() {
    // Current JST time (shift UTC by +9 hours)
    const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const day = jstNow.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const diffToMonday = (day + 6) % 7; // days since last Monday
    
    // Calculate last Monday's midnight in JST
    const recentMondayJST = new Date(jstNow.getTime() - diffToMonday * 24 * 60 * 60 * 1000);
    recentMondayJST.setUTCHours(0, 0, 0, 0); // 00:00:00 JST
    
    // Return true epoch milliseconds
    return recentMondayJST.getTime() - 9 * 60 * 60 * 1000;
}

function getNextResetDateStrJST() {
    const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const day = jstNow.getUTCDay();
    const daysToNextMonday = (8 - day) % 7 || 7;
    const nextMondayJST = new Date(jstNow.getTime() + daysToNextMonday * 24 * 60 * 60 * 1000);
    return `${nextMondayJST.getUTCMonth() + 1}月${nextMondayJST.getUTCDate()}日`;
}

// --- Helper for System Settings ---

async function getSystemSettings(db) {
    const fallback = {
        tiers: {
            "1": { limit: 1000, name: "Light" },
            "2": { limit: 5000, name: "Standard" },
            "3": { limit: 10000, name: "Pro" }
        }
    };

    try {
        const doc = await db.collection('system_settings').doc('global_config').get();
        if (doc.exists) {
            const data = doc.data();
            // Merge database data with fallback to ensure tiers exist
            return {
                ...fallback,
                ...data,
                tiers: {
                    ...fallback.tiers,
                    ...(data.tiers || {})
                }
            };
        }
    } catch (e) {
        logger.warn("Failed to fetch system_settings, using fallbacks:", e);
    }
    
    return fallback;
}

/**
 * 管理者がシステム設定（Tierの上限等）を更新する
 */
exports.updateSystemSettings = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "ログインが必要です");
    const adminUid = request.auth.uid;
    const { tiers } = request.data;

    if (!tiers || typeof tiers !== 'object') {
        throw new HttpsError("invalid-argument", "不正なリクエストパラメータです");
    }

    const db = getFirestore();

    try {
        // 管理者権限チェック
        const adminRolesQuery = await db.collection('user_roles')
            .where('user_id', '==', adminUid)
            .where('role_id', '==', 'role_admin')
            .get();

        if (adminRolesQuery.empty) {
            logger.warn(`Permission Denied: User ${adminUid} attempted to update system settings.`);
            throw new HttpsError("permission-denied", "管理者権限が必要です");
        }

        const configRef = db.collection('system_settings').doc('global_config');
        
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(configRef);
            let data = doc.exists ? doc.data() : {};
            
            // Only update tiers, preserve other fields
            data.tiers = {
                ...(data.tiers || {}),
                ...tiers
            };
            
            transaction.set(configRef, data, { merge: true });
        });

        logger.info(`Admin ${adminUid} updated system settings`);
        return { success: true };
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        logger.error(`updateSystemSettings failed:`, error);
        throw new HttpsError("internal", "システム設定の更新に失敗しました");
    }
});

// --- Callable Functions ---

/**
 * ① fetchUserCredit
 * ユーザーのクレジット情報とTierを取得し、必要なら遅延評価で週次リセットを行う
 */
exports.fetchUserCredit = onCall(async (request) => {
    logger.info("Function fetchUserCredit started", { uid: request.auth?.uid });
    if (!request.auth) throw new HttpsError("unauthenticated", "ログインが必要です");

    const uid = request.auth.uid;
    const db = getFirestore();

    try {
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) throw new HttpsError("not-found", "ユーザーが見つかりません");

        const data = userDoc.data();
        let currentBalance = data.credit_balance ?? 0;
        const tier = data.tier ?? 2;
        const lastResetTimeMs = data.last_reset_time ?? 0;

        const mostRecentMondayMs = getMostRecentMondayEpochMs();
        
        // 月曜日を跨いでいるか判定
        if (lastResetTimeMs < mostRecentMondayMs) {
            // リセット処理
            const settings = await getSystemSettings(db);
            const tierConfig = settings.tiers[tier.toString()] || settings.tiers["2"];
            const newLimit = tierConfig.limit;

            currentBalance = newLimit;
            await userRef.update({
                tier: tier,
                credit_balance: newLimit,
                credit_limit: newLimit,
                last_reset_time: Date.now()
            });
            logger.info(`User ${uid} credit reset to ${newLimit} for tier ${tier}`);
        }

        return {
            balance: currentBalance,
            nextResetDateStr: getNextResetDateStrJST(),
            tier: tier
        };
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        logger.error(`fetchUserCredit failed for ${uid}:`, error);
        throw new HttpsError("internal", "クレジット情報の取得に失敗しました");
    }
});

/**
 * ② deductUserCredit
 * クレジットを減算する。遅延評価を噛ませてからトランザクションで安全に減算する。
 */
exports.deductUserCredit = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "ログインが必要です");
    const uid = request.auth.uid;
    const amount = Number(request.data.amount);
    
    if (isNaN(amount) || amount <= 0) throw new HttpsError("invalid-argument", "正の数値を指定してください");

    const db = getFirestore();
    const userRef = db.collection('users').doc(uid);

    try {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw new HttpsError("not-found", "ユーザーが見つかりません");

            const data = userDoc.data();
            let currentBalance = data.credit_balance ?? 0;
            const tier = data.tier ?? 2;
            const lastResetTimeMs = data.last_reset_time ?? 0;
            const mostRecentMondayMs = getMostRecentMondayEpochMs();
            let limitToUpdate = null;
            let timeToUpdate = null;

            // リセットの遅延評価
            if (lastResetTimeMs < mostRecentMondayMs) {
                const settings = await getSystemSettings(db);
                const tierConfig = settings.tiers[tier.toString()] || settings.tiers["2"];
                currentBalance = tierConfig.limit;
                limitToUpdate = tierConfig.limit;
                timeToUpdate = Date.now();
            }

            const newBalance = Math.max(0, currentBalance - amount); // 0未満にはしない

            const updateData = { credit_balance: newBalance };
            if (limitToUpdate !== null) {
                updateData.tier = tier;
                updateData.credit_limit = limitToUpdate;
                updateData.last_reset_time = timeToUpdate;
            }

            transaction.update(userRef, updateData);
        });

        logger.info(`User ${uid} credit deducted by ${amount}`);
        return { success: true };
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        logger.error(`deductUserCredit failed for ${uid}:`, error);
        throw new HttpsError("internal", "クレジット減算処理に失敗しました");
    }
});

/**
 * ③ addUserCredit
 * クレジットを通常の加算する
 */
exports.addUserCredit = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "ログインが必要です");
    const uid = request.auth.uid;
    const amount = Number(request.data.amount);
    
    if (isNaN(amount) || amount <= 0) throw new HttpsError("invalid-argument", "正の数値を指定してください");

    const db = getFirestore();
    const userRef = db.collection('users').doc(uid);

    try {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw new HttpsError("not-found", "ユーザーが見つかりません");

            const data = userDoc.data();
            let currentBalance = data.credit_balance ?? 0;
            const tier = data.tier ?? 2;
            const lastResetTimeMs = data.last_reset_time ?? 0;
            const mostRecentMondayMs = getMostRecentMondayEpochMs();
            let limitToUpdate = null;
            let timeToUpdate = null;

            // リセットの遅延評価
            if (lastResetTimeMs < mostRecentMondayMs) {
                const settings = await getSystemSettings(db);
                const tierConfig = settings.tiers[tier.toString()] || settings.tiers["2"];
                currentBalance = tierConfig.limit;
                limitToUpdate = tierConfig.limit;
                timeToUpdate = Date.now();
            }

            const newBalance = currentBalance + amount;

            const updateData = { credit_balance: newBalance };
            if (limitToUpdate !== null) {
                updateData.tier = tier;
                updateData.credit_limit = limitToUpdate;
                updateData.last_reset_time = timeToUpdate;
            }

            transaction.update(userRef, updateData);
        });

        logger.info(`User ${uid} credit added by ${amount}`);
        return { success: true };
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        logger.error(`addUserCredit failed for ${uid}:`, error);
        throw new HttpsError("internal", "クレジット加算処理に失敗しました");
    }
});

/**
 * ④ grantBonusCredit
 * 管理者が特定のユーザーにボーナスクレジットを付与する
 */
exports.grantBonusCredit = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "ログインが必要です");
    const adminUid = request.auth.uid;
    const targetUid = request.data.targetUserId;
    const amount = Number(request.data.amount);

    if (!targetUid) throw new HttpsError("invalid-argument", "対象ユーザーが指定されていません");
    if (isNaN(amount)) throw new HttpsError("invalid-argument", "数値を指定してください"); // Removed amount <= 0 check

    const db = getFirestore();

    try {
        // 管理者権限チェック
        const adminRolesQuery = await db.collection('user_roles')
            .where('user_id', '==', adminUid)
            .where('role_id', '==', 'role_admin')
            .get();

        if (adminRolesQuery.empty) {
            logger.warn(`Permission Denied: User ${adminUid} attempted to grant bonus credit.`);
            throw new HttpsError("permission-denied", "管理者権限が必要です");
        }

        const userRef = db.collection('users').doc(targetUid);

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw new HttpsError("not-found", "ユーザーが見つかりません");

            const data = userDoc.data();
            let currentBalance = data.credit_balance ?? 0;
            const tier = data.tier ?? 2;
            const lastResetTimeMs = data.last_reset_time ?? 0;
            const mostRecentMondayMs = getMostRecentMondayEpochMs();
            let limitToUpdate = null;
            let timeToUpdate = null;

            // リセットの遅延評価
            if (lastResetTimeMs < mostRecentMondayMs) {
                const settings = await getSystemSettings(db);
                const tierConfig = settings.tiers[tier.toString()] || settings.tiers["2"] || {};
                const limit = Number(tierConfig.limit) || 5000;
                currentBalance = limit;
                limitToUpdate = limit;
                timeToUpdate = Date.now();
            }

            const newBalance = Math.max(0, currentBalance + amount); // Clamp at 0

            const updateData = { credit_balance: newBalance };
            if (limitToUpdate !== null) {
                updateData.tier = tier;
                updateData.credit_limit = limitToUpdate;
                updateData.last_reset_time = timeToUpdate;
            }

            transaction.update(userRef, updateData);
        });
        
        logger.info(`Admin ${adminUid} granted ${amount} bonus credit to ${targetUid}`);
        return { success: true };
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        logger.error(`grantBonusCredit failed:`, error);
        throw new HttpsError("internal", "ボーナスクレジットの付与に失敗しました");
    }
});

/**
 * ⑤ updateUserTier
 * ユーザーのTierを変更し、即座に差額を加算する
 */
exports.updateUserTier = onCall(async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "ログインが必要です");
    const adminUid = request.auth.uid;
    const targetUid = request.data.targetUserId;
    const newTier = Number(request.data.newTier);

    if (!targetUid || isNaN(newTier)) throw new HttpsError("invalid-argument", "不正なリクエストパラメータです");

    const db = getFirestore();
    const userRef = db.collection('users').doc(targetUid);

    try {
        // 管理者権限チェック
        const adminRolesQuery = await db.collection('user_roles')
            .where('user_id', '==', adminUid)
            .where('role_id', '==', 'role_admin')
            .get();

        if (adminRolesQuery.empty) {
            logger.warn(`Permission Denied: User ${adminUid} attempted to update tier.`);
            throw new HttpsError("permission-denied", "管理者権限が必要です");
        }

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw new HttpsError("not-found", "ユーザーが見つかりません");

            const data = userDoc.data();
            const currentTier = data.tier ?? 2;
            let currentBalance = data.credit_balance ?? 0;
            const lastResetTimeMs = data.last_reset_time ?? 0;
            const mostRecentMondayMs = getMostRecentMondayEpochMs();
            
            if (currentTier === newTier) {
                return; // 変更なし
            }

            const settings = await getSystemSettings(db);
            const oldConfig = settings.tiers[currentTier.toString()] || settings.tiers["2"] || {};
            const newConfig = settings.tiers[newTier.toString()] || settings.tiers["2"] || {};

            const oldLimit = Number(oldConfig.limit) || 5000;
            const newLimit = Number(newConfig.limit) || 5000;

            let newBalance;
            let newLastResetTime = lastResetTimeMs;

            // リセットの遅延評価
            if (lastResetTimeMs < mostRecentMondayMs) {
                // まだ今週リセットされていない場合は、新Tierの規定枠にリセットするだけでOK
                newBalance = newLimit;
                newLastResetTime = Date.now();
            } else {
                // 既に今週リセット済みの場合は、Tier変更による枠の差分を加減算する
                const diff = newLimit - oldLimit;
                newBalance = Math.max(0, currentBalance + diff);
            }

            if (isNaN(newBalance)) {
                newBalance = 0; // Fallback in case of severe NaN issues
            }

            transaction.update(userRef, {
                tier: newTier,
                credit_limit: newLimit,
                credit_balance: newBalance,
                last_reset_time: newLastResetTime
            });
        });

        logger.info(`Admin ${adminUid} updated tier for ${targetUid} to ${newTier}`);
        return { success: true };
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        logger.error(`updateUserTier failed:`, error);
        throw new HttpsError("internal", "Tierの更新に失敗しました");
    }
});

/**
 * ⑥ adminGetUserCreditsList
 * 管理者が全ユーザーのクレジット情報を一覧取得する
 */
exports.adminGetUserCreditsList = onCall(async (request) => {
    logger.info("Function adminGetUserCreditsList started", { adminUid: request.auth?.uid });
    
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "ログインが必要です");
    }

    const adminUid = request.auth.uid;
    const db = getFirestore();

    try {
        // 管理者権限チェック
        const adminRolesQuery = await db.collection('user_roles')
            .where('user_id', '==', adminUid)
            .where('role_id', '==', 'role_admin')
            .get();

        if (adminRolesQuery.empty) {
            logger.warn(`Permission Denied: User ${adminUid} attempted to fetch all user credits.`);
            throw new HttpsError("permission-denied", "管理者権限が必要です");
        }

        const usersSnap = await db.collection('users').get();
        const settings = await getSystemSettings(db);
        const usersList = [];

        const mostRecentMondayMs = getMostRecentMondayEpochMs();

        const decryptPromises = usersSnap.docs.map(async (doc) => {
            const data = doc.data();
            let name = "Unknown";
            let email = "Unknown";
            
            try {
                if (data.is_encrypted && data.displayName) {
                    name = await decrypt(data.displayName);
                } else {
                    name = data.displayName || data.name || "Unknown";
                }
                
                if (data.is_encrypted && data.email) {
                    email = await decrypt(data.email);
                } else {
                    email = data.email || "Unknown";
                }
            } catch (e) {
                logger.error(`Decryption failed for user ${doc.id}:`, e);
                name = "Decryption Error";
            }

            let tier = data.tier ?? 2;
            let currentBalance = data.credit_balance ?? 0;
            let lastResetTimeMs = data.last_reset_time ?? 0;

            // 未リセットユーザーの仮想計算（読み取りのみでDB更新はしない）
            if (lastResetTimeMs < mostRecentMondayMs) {
                const tierConfig = settings.tiers[tier.toString()] || settings.tiers["2"];
                currentBalance = tierConfig.limit;
            }

            usersList.push({
                user_id: doc.id,
                name: name,
                email: email,
                tier: tier,
                credit_balance: currentBalance,
                last_reset_time: lastResetTimeMs
            });
        });

        await Promise.all(decryptPromises);

        return { users: usersList };
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        logger.error(`adminGetUserCreditsList failed:`, error);
        throw new HttpsError("internal", "ユーザー一覧の取得に失敗しました");
    }
});
