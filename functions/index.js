/**
 * Cloud Functions for Firebase: Audit Log Bridge
 */

const { setGlobalOptions } = require("firebase-functions/v2");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
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
            account_status: 1,
            email_verified: false,
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
        const [name, email, lastName, firstName, dob] = await Promise.all([
            decrypt(data.displayName),
            decrypt(data.email),
            decrypt(data.lastName),
            decrypt(data.firstName),
            decrypt(data.dateOfBirth)
        ]);

        // 復号したデータを結合して返す
        return {
            ...data,
            displayName: name,
            email: email,
            lastName: lastName,
            firstName: firstName,
            dateOfBirth: dob
        };
    } catch (error) {
        logger.error(`Secure Profile Retrieval Failed for ${uid}:`, error);
        // デバッグのためにエラーメッセージを詳細化（本番では汎用メッセージに戻すのが望ましい）
        throw new HttpsError("internal", `プロファイルの取得に失敗しました: ${error.message || 'Unknown Error'}`);
    }
});
