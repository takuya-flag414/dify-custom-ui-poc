/**
 * Cloud Functions for Firebase: Audit Log Bridge
 */

const { setGlobalOptions } = require("firebase-functions/v2");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
// v2 のインポートを整理
const { beforeUserSignedIn } = require("firebase-functions/v2/identity");
const functionsV1 = require("firebase-functions/v1");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

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
