/**
 * Cloud Functions for Firebase: Audit Log Bridge
 * Last Updated: 2026-05-14T14:48:00
 */

const { setGlobalOptions } = require("firebase-functions/v2");
const { onDocumentCreated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
// v2 のインポートを整理
const { beforeUserSignedIn } = require("firebase-functions/v2/identity");
const functionsV1 = require("firebase-functions/v1");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const { encrypt, decrypt, createSearchHash } = require("./kmsUtils");

// グローバルオプションの設定
setGlobalOptions({ region: "asia-northeast1" });

initializeApp();

// 1. Firestoreの追加を検知してログ出力 (v2)
exports.onAuditLogCreated = onDocumentCreated("audit_logs/{logId}", (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;

    const data = snapshot.data();
    const action = data.action || "UNKNOWN_ACTION";
    const email = data.email || "unknown@example.com";

    const severity = action.includes("FAILED") ? "warn" : "info";
    
    const logPayload = {
        message: `Audit: ${action} - ${email}`,
        action: action,
        email: email,
        userId: data.user_id || null,
        sessionId: data.session_id || null,
        project_id: data.project_id || "unknown-project",
        details: data.details || {},
        timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
        origin: "firestore_trigger"
    };

    if (severity === "warn") {
        logger.warn(logPayload);
    } else {
        logger.info(logPayload);
    }
    return null;
});

// 2. ユーザー作成を検知してログ出力
exports.onNewUserCreated = functionsV1.region('asia-northeast1').auth.user().onCreate((user) => {
    logger.info({
        message: `Auth: New User Account Created - ${user.email}`,
        action: "ACCOUNT_CREATED_INTERNAL",
        email: user.email,
        userId: user.uid,
        projectId: "dify-custom-ui-poc",
        origin: "auth_trigger_created"
    });
    return null;
});

// 3. ユーザー削除を検知してログ出力＆データクリーンアップ
exports.onUserDeleted = functionsV1.region('asia-northeast1').auth.user().onDelete(async (user) => {
    // 1. 監査ログを出力
    logger.info({
        message: `Auth: User Account Deleted - ${user.email}`,
        action: "ACCOUNT_DELETED_INTERNAL",
        email: user.email,
        userId: user.uid,
        projectId: "dify-custom-ui-poc",
        origin: "auth_trigger_deleted"
    });
    
    // 2. Firestoreの関連データ（users, user_roles）をクリーンアップ
    try {
        const db = getFirestore();
        
        // usersコレクションのドキュメントを削除
        await db.collection('users').doc(user.uid).delete();
        logger.info(`Firestore: Deleted user profile for ${user.uid}`);
        
        // user_rolesコレクションから対象ユーザーのロールを削除
        const rolesQuery = await db.collection('user_roles').where('user_id', '==', user.uid).get();
        if (!rolesQuery.empty) {
            const batch = db.batch();
            rolesQuery.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            logger.info(`Firestore: Deleted ${rolesQuery.size} user_roles for ${user.uid}`);
        }
    } catch (error) {
        logger.error(`Error deleting user data for ${user.uid}:`, error);
    }
    return null;
});

// 4. Firestoreのユーザープロファイル削除を検知して関連データをクリーンアップ (user_roles等)
exports.onUserDocumentDeleted = onDocumentDeleted("users/{uid}", async (event) => {
    const uid = event.params.uid;
    const db = getFirestore();
    
    logger.info(`Firestore Trigger: User document deleted for ${uid}. Cleaning up roles...`);
    
    try {
        // user_rolesコレクションから対象ユーザーのロールを削除
        const rolesQuery = await db.collection('user_roles').where('user_id', '==', uid).get();
        if (!rolesQuery.empty) {
            const batch = db.batch();
            rolesQuery.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            logger.info(`Firestore: Deleted ${rolesQuery.size} user_roles for ${uid}`);
        }
    } catch (error) {
        logger.error(`Error cleaning up roles for deleted user doc ${uid}:`, error);
    }
    return null;
});

// 3. サインイン直前の割り込み（認証完了の検知 - v2）
// ※GCPコンソールでIAM権限（Cloud Run Invoker）を付与してから、Firebaseコンソールで紐付けること
exports.beforeSignIn = beforeUserSignedIn(async (event) => {
    const user = event.data;
    
    // エラーでログインが止まらないよう try-catch で囲む
    try {
        if (user && user.emailVerified) {
            const db = getFirestore();
            // Firestoreから現在のステータスを確認
            const userRef = db.collection('users').doc(user.uid);
            const userDoc = await userRef.get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                // まだ email_verified が true でない場合、これが「初回認証完了」のタイミング
                if (!userData.email_verified) {
                    logger.info({
                        message: `Auth: Email Verification Completed for ${user.email}`,
                        action: "EMAIL_VERIFIED_SUCCESS",
                        email: user.email,
                        userId: user.uid,
                        projectId: "dify-custom-ui-poc",
                        origin: "auth_blocking_signin"
                    });

                    // ステータスを更新
                    await userRef.update({
                        email_verified: true,
                        updated_at: new Date()
                    });
                }
            }
        }

        // ログイン成功ログ
        logger.info({
            message: `Auth: User Login - ${user.email} (Verified: ${user.emailVerified})`,
            action: user.emailVerified ? "ACCOUNT_VERIFIED_SIGNIN" : "ACCOUNT_SIGNIN_UNVERIFIED",
            email: user.email,
            userId: user.uid,
            projectId: "dify-custom-ui-poc",
            origin: "auth_blocking_signin"
        });
    } catch (error) {
        logger.error("Error in beforeSignIn trigger:", error);
    }
    
    // 何があっても undefined/void を返せばログインは続行される
    return;
});

/**
 * 暗号化を伴うユーザープロファイル作成 (Callable Function)
 */
exports.createSecureUserProfile = onCall(async (request) => {
    logger.info("Function createSecureUserProfile started", { uid: request.auth?.uid });
    // 認証チェック
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "ログインが必要です");
    }

    const { userData, securityInfo } = request.data;
    const uid = request.auth.uid;
    const db = getFirestore();

    try {
        // PIIの暗号化
        const encryptedName = await encrypt(userData.displayName || "");
        const encryptedEmail = await encrypt(userData.email || "");
        const encryptedLastName = await encrypt(securityInfo?.lastName || "");
        const encryptedFirstName = await encrypt(securityInfo?.firstName || "");
        const encryptedDob = await encrypt(securityInfo?.dateOfBirth || "");
        const encryptedEmployeeCode = await encrypt(userData.employeeCode || "");

        // 検索用ハッシュの生成
        const emailHash = createSearchHash(userData.email?.toLowerCase().trim() || "");

        const now = Timestamp.now();
        
        const secureDoc = {
            user_id: uid,
            email: encryptedEmail,
            email_h: emailHash, // 検索用
            last_login_at: now, // 最終アクティビティ
            displayName: encryptedName,
            lastName: encryptedLastName,
            firstName: encryptedFirstName,
            dateOfBirth: encryptedDob,
            employee_code: encryptedEmployeeCode,
            department_id: userData.departmentId || null,
            account_status: 1,
            email_verified: false,
            role: 'user', // Security rules 用
            created_at: now,
            updated_at: now,
            is_encrypted: true, // 暗号化済みフラグ
            preferences: userData.preferences || {
                theme: 'system',
                aiStyle: 'partner',
                isOnboardingCompleted: false
            }
        };

        // Firestoreに保存
        await db.collection('users').doc(uid).set(secureDoc);

        // 権限も併せて作成
        await db.collection('user_roles').add({
            user_id: uid,
            role_id: 'role_general',
            assigned_at: now
        });

        logger.info(`KMS: Secure Profile Created for ${uid}`);
        return { success: true };
    } catch (error) {
        logger.error(`Secure Profile Creation Failed for ${uid}:`, error);
        throw new HttpsError("internal", `プロファイルの作成に失敗しました: ${error.message || 'Unknown Error'}`);
    }
});

/**
 * 管理者によるセキュアなユーザープロファイル作成 (Callable Function)
 * 権限チェックを行い、他ユーザーのデータを暗号化して保存する
 */
exports.adminCreateSecureUserProfile = onCall(async (request) => {
    logger.info("Function adminCreateSecureUserProfile started", { adminUid: request.auth?.uid });
    
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "ログインが必要です");
    }

    const { targetUid, userData, roleId, departmentId, employeeCode } = request.data;
    const adminUid = request.auth.uid;
    const db = getFirestore();

    try {
        // 1. 管理者権限チェック (簡易版: role == 'admin' または role_id == 'role_admin' を確認)
        // ここでは user_roles コレクションを確認する
        const adminRolesQuery = await db.collection('user_roles')
            .where('user_id', '==', adminUid)
            .where('role_id', '==', 'role_admin')
            .get();

        if (adminRolesQuery.empty) {
            logger.warn(`Permission Denied: User ${adminUid} attempted admin action.`);
            throw new HttpsError("permission-denied", "管理者権限が必要です");
        }

        // 2. PIIの暗号化
        const [encryptedName, encryptedEmail, encryptedLastName, encryptedFirstName, encryptedDob, encryptedEmployeeCode] = await Promise.all([
            encrypt(userData.displayName || ""),
            encrypt(userData.email || ""),
            encrypt(userData.lastName || ""),
            encrypt(userData.firstName || ""),
            encrypt(userData.dateOfBirth || ""),
            encrypt(employeeCode || "")
        ]);

        const emailHash = createSearchHash(userData.email?.toLowerCase().trim() || "");
        const now = Timestamp.now();
        
        const secureDoc = {
            user_id: targetUid,
            email: encryptedEmail,
            email_h: emailHash,
            displayName: encryptedName,
            lastName: encryptedLastName,
            firstName: encryptedFirstName,
            dateOfBirth: encryptedDob,
            employee_code: encryptedEmployeeCode,
            department_id: departmentId || null,
            account_status: 1,
            email_verified: false,
            role: roleId === 'role_admin' ? 'admin' : 'user', // Security rules 用
            is_admin_created: true, // 管理者作成フラグ
            require_password_change: true, // 初回ログイン時のパスワード変更要求フラグ
            is_encrypted: true,
            created_at: now,
            updated_at: now,
            preferences: userData.preferences || {
                theme: 'system',
                aiStyle: 'partner',
                isOnboardingCompleted: false
            }
        };

        // 3. Firestoreに保存 (Batch処理)
        const batch = db.batch();
        batch.set(db.collection('users').doc(targetUid), secureDoc);
        
        // 権限の割り当て
        batch.set(db.collection('user_roles').doc(), {
            user_id: targetUid,
            role_id: roleId || 'role_general',
            assigned_at: now
        });

        await batch.commit();

        logger.info(`KMS: Admin Secure Profile Created for target: ${targetUid} by admin: ${adminUid}`);
        return { success: true };
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        logger.error(`Admin Secure Profile Creation Failed:`, error);
        throw new HttpsError("internal", `プロファイルの作成に失敗しました: ${error.message}`);
    }
});

/**
 * 暗号化されたユーザープロファイルの取得と復号 (Callable Function)
 */
exports.getSecureUserProfile = onCall(async (request) => {
    logger.info("Function getSecureUserProfile started", { uid: request.auth?.uid });
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "ログインが必要です");
    }

    const uid = request.auth.uid;
    const db = getFirestore();

    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            throw new HttpsError("not-found", "ユーザーが見つかりません");
        }

        const data = userDoc.data();
        const now = Timestamp.now();
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

        // 30日間のアクティビティチェック
        const lastActive = data.last_login_at; 
        if (lastActive && (now.toMillis() - lastActive.toMillis() > thirtyDaysInMs)) {
            logger.warn(`Session Expired for ${uid}: Last active ${lastActive.toDate()}`);
            throw new HttpsError("unauthenticated", "セッションの有効期限（30日間）が切れました。再度ログインしてください");
        }

        // アクティビティ時刻を更新 (スライディング有効期限)
        await db.collection('users').doc(uid).update({ 
            last_login_at: now,
            updated_at: now 
        });

        // 暗号化されていない古いデータの場合はそのまま返す
        if (!data.is_encrypted) {
            return data;
        }

        // PIIの復号
        const [name, email, lastName, firstName, dob, employee_code] = await Promise.all([
            decrypt(data.displayName),
            decrypt(data.email),
            decrypt(data.lastName),
            decrypt(data.firstName),
            decrypt(data.dateOfBirth),
            decrypt(data.employee_code)
        ]);

        // 復号したデータを結合して返す
        return {
            ...data,
            displayName: name,
            email: email,
            lastName: lastName,
            firstName: firstName,
            dateOfBirth: dob,
            employee_code: employee_code
        };
    } catch (error) {
        logger.error(`Secure Profile Retrieval Failed for ${uid}:`, error);
        // デバッグのためにエラーメッセージを詳細化（本番では汎用メッセージに戻すのが望ましい）
        throw new HttpsError("internal", `プロファイルの取得に失敗しました: ${error.message || 'Unknown Error'}`);
    }
});

/**
 * 初回パスワード変更要求フラグのクリア (Callable Function)
 */
exports.clearRequirePasswordChange = onCall(async (request) => {
    logger.info("Function clearRequirePasswordChange started", { uid: request.auth?.uid });
    
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "ログインが必要です");
    }

    const uid = request.auth.uid;
    const db = getFirestore();

    try {
        await db.collection('users').doc(uid).update({
            require_password_change: false,
            updated_at: Timestamp.now()
        });
        
        logger.info(`Cleared require_password_change flag for user ${uid}`);
        return { success: true };
    } catch (error) {
        logger.error(`Failed to clear require_password_change for ${uid}:`, error);
        throw new HttpsError("internal", "フラグの更新に失敗しました");
    }
});

/**
 * 全ユーザーのID、名前、部署IDを復号して取得する (管理者用分析マッピング)
 */
exports.getDecryptedUserMappings = onCall(async (request) => {
    logger.info("Function getDecryptedUserMappings started", { adminUid: request.auth?.uid });
    
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "ログインが必要です");
    }

    const adminUid = request.auth.uid;
    const db = getFirestore();

    try {
        // 1. 管理者権限チェック
        const adminRolesQuery = await db.collection('user_roles')
            .where('user_id', '==', adminUid)
            .where('role_id', '==', 'role_admin')
            .get();

        if (adminRolesQuery.empty) {
            logger.warn(`Permission Denied: User ${adminUid} attempted to fetch all user mappings.`);
            throw new HttpsError("permission-denied", "管理者権限が必要です");
        }

        // 2. ユーザー一覧を取得
        const usersSnap = await db.collection('users').get();
        const userMap = {};

        // 名前を復号化しながらマッピングを作成
        const decryptPromises = usersSnap.docs.map(async (doc) => {
            const data = doc.data();
            let name = "Unknown";
            
            try {
                if (data.is_encrypted && data.displayName) {
                    name = await decrypt(data.displayName);
                } else {
                    name = data.displayName || data.name || "Unknown";
                }
            } catch (e) {
                logger.error(`Decryption failed for user ${doc.id}:`, e);
                name = "Decryption Error";
            }

            userMap[doc.id] = {
                name: name,
                departmentId: data.department_id || null
            };
        });

        await Promise.all(decryptPromises);

        // 3. 部署一覧も取得して返す
        const deptsSnap = await db.collection('departments').get();
        const deptMap = {};
        deptsSnap.forEach(doc => {
            deptMap[doc.id] = doc.data().name;
        });

        return { userMap, deptMap };
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        logger.error(`getDecryptedUserMappings Failed:`, error);
        throw new HttpsError("internal", `マッピングの取得に失敗しました: ${error.message}`);
    }
});
