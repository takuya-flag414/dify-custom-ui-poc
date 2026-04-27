// src/services/AuthService.ts
// Phase B: Firebase Integration - クライアントサイド認証サービス
// 基本設計書 DES-AUTH-001 準拠 - RBAC対応

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    sendEmailVerification,
    applyActionCode,
    checkActionCode,
    deleteUser,
    User as FirebaseUser
} from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { auth, adminAuth, db } from '../lib/firebase';
import {
    AccountStatus,
    PermissionCode,
    RoleCode,
    ResolvedUserRole,
    UserPreferences,
} from '../mocks/mockUsers';

// ============================================
// 型定義（正式仕様準拠）
// ============================================

/**
 * ユーザープロファイル（認証後に返却される情報）
 * 基本設計書 Section 5.1 準拠
 */
export interface UserProfile {
    userId: string;                    // Dify連携用ID (UUID)
    employeeCode?: string;             // 社員番号
    email: string;
    name: string;                      // 社員氏名（フルネーム）
    displayName?: string;              // 表示名（後方互換用）
    avatarUrl?: string | null;
    departmentId?: number;             // 所属部署ID
    departmentName?: string;           // 所属部署名（解決済み）
    accountStatus: AccountStatus;
    roles: ResolvedUserRole[];         // RBAC: 割り当てられたロール
    permissions: PermissionCode[];     // 実効権限リスト（解決済み）
    preferences: UserPreferences;
    createdAt?: string;
    updatedAt?: string;
    // 後方互換用フィールド（移行期間中）
    role?: string;                     // レガシーロール ('admin' | 'user')
}

/**
 * ログイン結果の型
 */
export interface LoginResult {
    token: string;
    user: UserProfile;
}

/**
 * セキュリティ情報の型
 */
export interface SecurityInfo {
    lastName: string;
    firstName: string;
    dateOfBirth: string;
}

// ============================================
// AuthService クラス（RBAC対応）
// ============================================

/**
 * 認証サービス (Firebase Implementation)
 * 
 * Phase B: Firebase Auth と Firestore を使用
 */
class AuthService {
    constructor() {
        // Firebase Auth の状態を監視して、セッション復元の準備をする
    }

    /**
     * Firestore からユーザーの RBAC 情報を取得
     */
    private async _resolveUserRBAC(userId: string): Promise<{ roles: ResolvedUserRole[], permissions: PermissionCode[] }> {
        // 1. ユーザーのロールを取得 (user_roles コレクション)
        const userRolesQuery = query(collection(db, 'user_roles'), where('user_id', '==', userId));
        const userRolesSnap = await getDocs(userRolesQuery);

        const roles: ResolvedUserRole[] = [];
        const permissionIds = new Set<string>();

        for (const userRoleDoc of userRolesSnap.docs) {
            const userRoleData = userRoleDoc.data();
            const roleId = userRoleData.role_id;

            // 2. ロール定義を取得 (roles コレクション)
            const roleDoc = await getDoc(doc(db, 'roles', roleId));
            if (roleDoc.exists()) {
                const roleData = roleDoc.data();
                roles.push({
                    roleId: roleId,
                    roleCode: roleData.role_code as RoleCode,
                    roleName: roleData.name,
                    assignedAt: userRoleData.assigned_at?.toDate().toISOString() || new Date().toISOString()
                });

                // 3. ロールの権限を取得 (role_permissions コレクション)
                const rolePermsQuery = query(collection(db, 'role_permissions'), where('role_id', '==', roleId));
                const rolePermsSnap = await getDocs(rolePermsQuery);
                rolePermsSnap.forEach(rpDoc => {
                    permissionIds.add(rpDoc.data().permission_id);
                });
            }
        }

        // 4. 権限コードを解決 (permissions コレクション)
        const permissions: PermissionCode[] = [];
        for (const permId of Array.from(permissionIds)) {
            const permDoc = await getDoc(doc(db, 'permissions', permId));
            if (permDoc.exists()) {
                permissions.push(permDoc.data().perm_code as PermissionCode);
            }
        }

        return { roles, permissions };
    }

    /**
     * Firestore ドキュメントを UserProfile に変換
     */
    private async _toUserProfile(userId: string, userData: any): Promise<UserProfile> {
        const { roles, permissions } = await this._resolveUserRBAC(userId);

        // 部署名の解決
        let departmentName = '';
        if (userData.department_id) {
            const deptDoc = await getDoc(doc(db, 'departments', userData.department_id.toString()));
            if (deptDoc.exists()) {
                departmentName = deptDoc.data().name;
            }
        }

        // レガシーロール変換（後方互換用）
        const legacyRole = roles.some(r => r.roleCode === 'admin') ? 'admin' : 'user';

        return {
            userId: userId,
            employeeCode: userData.employee_code,
            email: userData.email,
            name: userData.name,
            displayName: userData.displayName || userData.name,
            avatarUrl: userData.avatarUrl,
            departmentId: userData.department_id,
            departmentName,
            accountStatus: userData.account_status as AccountStatus,
            roles,
            permissions,
            preferences: userData.preferences || {
                theme: 'system',
                aiStyle: 'partner',
            },
            createdAt: userData.created_at?.toDate ? userData.created_at.toDate().toISOString() : userData.created_at,
            updatedAt: userData.updated_at?.toDate ? userData.updated_at.toDate().toISOString() : userData.updated_at,
            role: legacyRole,
        };
    }

    /**
     * システム監査ログの記録
     */
    private async _logAuditAction(
        action: string, // 型を緩和して柔軟なアクション記録を可能にする
        targetEmail: string,
        targetUserId: string | null = null,
        details: Record<string, any> = {}
    ): Promise<void> {
        try {
            // セッションID生成（ブラウザセッション単位でユニーク）
            const sessionId = this._getSessionId();
            
            const logRef = doc(collection(db, 'audit_logs'));
            await setDoc(logRef, {
                timestamp: Timestamp.now(),
                action,
                email: targetEmail,
                user_id: targetUserId,
                session_id: sessionId,
                project_id: import.meta.env.VITE_PROJECT_ID || 'unknown-project',
                details
            });
            console.log(`[AuthService] Audit logged: ${action} for ${targetEmail} (session: ${sessionId})`);
        } catch (e) {
            console.error('[AuthService] Failed to record audit log:', e);
        }
    }

    /**
     * セッションIDを取得（ブラウザセッション単位でユニーク）
     */
    private _getSessionId(): string {
        let sessionId = sessionStorage.getItem('audit_session_id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('audit_session_id', sessionId);
        }
        return sessionId;
    }


    // ============================================
    // 公開メソッド
    // ============================================

    /**
     * ログイン
     */
    async login(email: string, password: string): Promise<LoginResult> {
        if (!email || !password) {
            throw new Error('メールアドレスとパスワードを入力してください');
        }

        try {
            // 1. Firebase Auth で認証
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // 2. Firestore からプロファイルを取得
            let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            let userData: any;

            if (!firebaseUser.emailVerified) {
                // メール未認証でも、管理者が作成したアカウントならログインを許可する
                if (userDoc.exists() && userDoc.data().is_admin_created === true) {
                    console.log('[AuthService] Admin-created user logging in without email verification');
                } else {
                    await signOut(auth);
                    throw new Error('メール認証が完了していません。ご登録のメールアドレスに届いた確認リンクをクリックしてください。');
                }
            }

            if (!userDoc.exists()) {
                // 通常のJIT (SSOなど、想定外の経路で来た場合)
                console.log('[AuthService] Profile missing. Creating default profile for:', firebaseUser.email);
                const now = Timestamp.now();
                userData = {
                    user_id: firebaseUser.uid,
                    email: firebaseUser.email?.toLowerCase() || '',
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Unknown User',
                    account_status: 1, // 有効
                    created_at: now,
                    updated_at: now,
                    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                    preferences: {
                        theme: 'system',
                        aiStyle: 'partner',
                        isOnboardingCompleted: false,
                    }
                };

                const batch = writeBatch(db);
                batch.set(doc(db, 'users', firebaseUser.uid), userData);
                batch.set(doc(collection(db, 'user_roles')), {
                    user_id: firebaseUser.uid,
                    role_id: 'role_general',
                    assigned_at: now
                });
                await batch.commit();
            } else {
                userData = userDoc.data();
            }

            // 3. アカウント状態の検証
            const status = Number(userData.account_status);
            if (status === 0) {
                await signOut(auth);
                throw new Error('このアカウントは無効化されています。管理者にお問い合わせください');
            }
            if (status === 2) {
                await signOut(auth);
                throw new Error('このアカウントは退職済みです');
            }

            const profile = await this._toUserProfile(firebaseUser.uid, userData);
            const token = await firebaseUser.getIdToken();

            // ログ記録
            this._logAuditAction('LOGIN_SUCCESS', profile.email, firebaseUser.uid, {
                role: profile.role,
                displayName: profile.displayName,
                method: firebaseUser.providerData[0]?.providerId || 'password',
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                language: typeof navigator !== 'undefined' ? navigator.language : 'unknown'
            });

            console.log('[AuthService] Login successful:', profile.email);

            return {
                token,
                user: profile,
            };
        } catch (error: any) {
            console.error('[AuthService] Login failed full error:', error);
            
            // ログイン失敗をログ記録 (ブラウザ情報追加)
            this._logAuditAction('LOGIN_FAILED', email, null, {
                reason: error.code || 'unknown',
                message: error.message || 'Login failed',
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
            });
            
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                throw new Error('メールアドレスまたはパスワードが正しくありません');
            }
            throw error;
        }
    }

    /**
     * ログアウト
     */
    async logout(): Promise<void> {
        try {
            const currentEmail = auth.currentUser?.email || 'unknown';
            const currentUid = auth.currentUser?.uid || null;

            // ログアウトを記録（認証状態が有効なうちに）
            if (currentEmail !== 'unknown') {
                this._logAuditAction('LOGOUT', currentEmail, currentUid, {
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
                });
            }
            
            await signOut(auth);
            
            console.log('[AuthService] Logged out successfully');
        } catch (error: any) {
            console.error('[AuthService] Logout failed:', error);
            throw error;
        }
    }

    /**
     * パスワードリセットメールを送信
     */
    async resetPassword(email: string): Promise<void> {
        if (!email) {
            throw new Error('メールアドレスを入力してください');
        }

        try {
            await sendPasswordResetEmail(auth, email);
            
            // メール送信成功を記録
            this._logAuditAction('EMAIL_SENT_SUCCESS', email, null, {
                type: 'password_reset',
                status: 'accepted_by_firebase'
            });
            
            console.log('[AuthService] Password reset email sent to:', email);
        } catch (error: any) {
            console.error('[AuthService] Password reset failed:', error);
            
            // メール送信失敗を記録
            this._logAuditAction('EMAIL_SENT_FAILED', email, null, {
                type: 'password_reset',
                error_code: error.code,
                error_message: error.message
            });

            if (error.code === 'auth/user-not-found') {
                throw new Error('このメールアドレスは登録されていません');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('有効なメールアドレスを入力してください');
            }
            throw new Error('パスワード再設定メールの送信に失敗しました');
        }
    }

    /**
     * サインアップ（Firebase標準 メール確認フロー）
     */
    async signup(
        email: string,
        password: string,
        displayName: string,
        securityInfo: Partial<SecurityInfo> = {}
    ): Promise<{ message: string }> {
        const { lastName, firstName, dateOfBirth } = securityInfo;

        if (!email || !password || !displayName) {
            throw new Error('すべての項目を入力してください');
        }

        const normalizedEmail = email.toLowerCase().trim();
        if (!normalizedEmail.endsWith('@iflag.co.jp')) {
            throw new Error('このアプリは会社用ドメイン（@iflag.co.jp)でのみ登録可能です');
        }

        try {
            // 1. Firebase Authアカウント作成（この時点で重複チェックが行われる）
            const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
            const firebaseUser = userCredential.user;

            // 2. 確認メール送信 (Firebase標準のハンドラーを使用)
            const actionCodeSettings = {
                // 認証完了後に「アプリに戻る」ボタンの遷移先
                url: `${window.location.origin}`,
                handleCodeInApp: false,
            };
            
            await sendEmailVerification(firebaseUser, actionCodeSettings);
            
            // メール送信成功を記録
            this._logAuditAction('EMAIL_SENT_SUCCESS', normalizedEmail, firebaseUser.uid, {
                type: 'email_verification',
                status: 'standard_flow',
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
            });

            // 3. Firestoreに未認証ベースでプロファイルを作成 (WriteBatch)
            const now = Timestamp.now();
            const userData = {
                user_id: firebaseUser.uid,
                email: normalizedEmail,
                name: `${lastName || ''} ${firstName || ''}`.trim() || displayName,
                account_status: 1,
                created_at: now,
                updated_at: now,
                displayName,
                lastName: lastName || '',
                firstName: firstName || '',
                dateOfBirth: dateOfBirth || '',
                avatarUrl: null,
                preferences: {
                    theme: 'system',
                    aiStyle: 'partner',
                    isOnboardingCompleted: false,
                }
            };

            const batch = writeBatch(db);
            batch.set(doc(db, 'users', firebaseUser.uid), userData);
            batch.set(doc(collection(db, 'user_roles')), {
                user_id: firebaseUser.uid,
                role_id: 'role_general',
                assigned_at: now
            });
            await batch.commit();

            // 4. 強制的にサインアウト（メール認証完了まで待つ）
            await signOut(auth);

            // ログ記録：仮登録
            this._logAuditAction('ACCOUNT_CREATED_PROVISIONAL', normalizedEmail, firebaseUser.uid);

            return {
                message: '認証リンクをお送りしました。メール内のリンクから認証をお願いします。',
            };
        } catch (error: any) {
            console.error('[AuthService] Signup failed:', error);
            
            // アカウント作成自体の失敗ログ
            this._logAuditAction('ACCOUNT_CREATE_FAILED', normalizedEmail, null, {
                error_code: error.code
            });

            if (error.code === 'auth/email-already-in-use') {
                throw new Error('このメールアドレスは既に登録されています');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('メールアドレスの形式が不正です');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('パスワードは6文字以上である必要があります');
            }
            throw new Error('アカウントの作成に失敗しました');
        }
    }

    /**
     * パスワードリセットメール送信
     */
    async resetPassword(email: string): Promise<void> {
        if (!email) {
            throw new Error('メールアドレスを入力してください');
        }

        try {
            await sendPasswordResetEmail(auth, email);
            console.log('[AuthService] Password reset email sent to:', email);
            
            // 監査ログ記録
            this._logAuditAction('PASSWORD_RESET_REQUESTED', email, null, {
                status: 'success',
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                language: typeof navigator !== 'undefined' ? navigator.language : 'unknown'
            });
        } catch (error: any) {
            console.error('[AuthService] Password reset failed:', error);
            
            // 監査ログ記録（失敗）
            this._logAuditAction('PASSWORD_RESET_FAILED', email, null, {
                error_code: error.code,
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
            });

            if (error.code === 'auth/user-not-found') {
                throw new Error('このメールアドレスは登録されていません');
            }
            throw new Error('パスワードリセットメールの送信に失敗しました');
        }
    }

    /**
     * アカウント削除
     */
    async deleteAccount(): Promise<void> {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('ログインしていません');
            }

            const currentEmail = currentUser.email || 'unknown';
            const currentUid = currentUser.uid;

            // Firestoreデータの削除（ユーザープロファイルとロール）
            const batch = writeBatch(db);
            batch.delete(doc(db, 'users', currentUid));
            
            // 関連するロール割り当ても削除
            const userRolesQuery = query(collection(db, 'user_roles'), where('user_id', '==', currentUid));
            const userRolesSnap = await getDocs(userRolesQuery);
            userRolesSnap.docs.forEach(doc => batch.delete(doc.ref));
            
            await batch.commit();

            // Firebase Authアカウント削除
            await deleteUser(currentUser);

            // ログ記録（削除後に記録するため、事前に情報を保持）
            this._logAuditAction('ACCOUNT_DELETED', currentEmail, currentUid, {
                deletedAt: new Date().toISOString()
            });

            console.log('[AuthService] Account deleted successfully:', currentEmail);
        } catch (error: any) {
            console.error('[AuthService] Account deletion failed:', error);
            if (error.code === 'auth/requires-recent-login') {
                throw new Error('セキュリティのため、最近ログインしてから再度お試しください');
            }
            throw new Error('アカウント削除に失敗しました');
        }
    }

    /**
     * 【管理者用】アカウントの発行 (メール認証不要のパスワード渡しフロー)
     */
    async adminCreateUser(
        email: string,
        password: string,
        displayName: string,
        roleId: string = 'role_general',
        departmentId: number | null = null,
        securityInfo: Partial<SecurityInfo> = {}
    ): Promise<{ message: string }> {
        const { lastName, firstName, dateOfBirth } = securityInfo;

        if (!email || !password || !displayName) {
            throw new Error('必須項目の入力が足りません');
        }

        const normalizedEmail = email.toLowerCase().trim();
        if (!normalizedEmail.endsWith('@iflag.co.jp')) {
            throw new Error('このアプリは会社用ドメイン（@iflag.co.jp)でのみ登録可能です');
        }

        try {
            // 1. セカンダリFirebaseアプリを使ってアカウントを作成
            // （これによって、操作している管理者が不本意にログアウトされるのを防ぐ）
            const userCredential = await createUserWithEmailAndPassword(adminAuth, normalizedEmail, password);
            const firebaseUser = userCredential.user;

            // 2. セカンダリアプリ側はすぐにサインアウト
            await signOut(adminAuth);

            // 3. Firestoreにプロファイルを作成し、"is_admin_created: true" を明記する
            const now = Timestamp.now();
            const userData = {
                user_id: firebaseUser.uid,
                email: normalizedEmail,
                name: `${lastName || ''} ${firstName || ''}`.trim() || displayName,
                account_status: 1,
                created_at: now,
                updated_at: now,
                displayName,
                lastName: lastName || '',
                firstName: firstName || '',
                dateOfBirth: dateOfBirth || '',
                avatarUrl: null,
                department_id: departmentId,
                is_admin_created: true, // ★ このフラグによりメール認証がスキップされる
                preferences: {
                    theme: 'system',
                    aiStyle: 'partner',
                    isOnboardingCompleted: false,
                }
            };

            const batch = writeBatch(db);
            batch.set(doc(db, 'users', firebaseUser.uid), userData);
            batch.set(doc(collection(db, 'user_roles')), {
                user_id: firebaseUser.uid,
                role_id: roleId,
                assigned_at: now
            });
            await batch.commit();

            // ログ記録
            this._logAuditAction('ADMIN_CREATED_USER', normalizedEmail, firebaseUser.uid, {
                roleId,
                departmentId,
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
            });

            return {
                message: 'アカウントを発行しました。設定したパスワードでログイン可能です。',
            };
        } catch (error: any) {
            console.error('[AuthService] Admin Create User failed:', error);
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('このメールアドレスは既に登録されています');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('メールアドレスの形式が不正です');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('パスワードは6文字以上である必要があります');
            }
            throw new Error('アカウントの作成に失敗しました');
        }
    }

    /**
     * セッション復元
     */
    async restoreSession(): Promise<UserProfile | null> {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                unsubscribe();
                if (firebaseUser) {
                    try {
                        // ユーザーの情報をリロード（トークン更新）
                        try {
                            await firebaseUser.reload();
                        } catch (reloadError) {
                            console.warn('[AuthService] Failed to reload user, proceeding with cached data:', reloadError);
                        }
                        try {
                            await firebaseUser.reload();
                        } catch (reloadError) {
                            console.warn('[AuthService] Failed to reload user, proceeding with cached data:', reloadError);
                        }
                        
                        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                        const userData = userDoc.exists() ? userDoc.data() : null;

                        if (!firebaseUser.emailVerified) {
                            if (userData && userData.is_admin_created === true) {
                                // 管理者作成アカウントなので未認証でも許可
                            } else {
                                console.log('[AuthService] Unverified user session detected, signing out:', firebaseUser.email);
                                await signOut(auth);
                                resolve(null);
                                return;
                            }
                        }

                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            const status = Number(userData.account_status);
                            if (status === 1) {
                                const profile = await this._toUserProfile(firebaseUser.uid, userData);
                                resolve(profile);
                                return;
                            }
                        }
                    } catch (error) {
                        console.error('[AuthService] Session restoration failed:', error);
                    }
                }
                resolve(null);
            });
        });
    }

    /**
     * ユーザー設定を更新
     */
    async updatePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences> {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            throw new Error('ユーザーが見つかりません');
        }

        const currentPrefs = userDoc.data().preferences || { theme: 'system', aiStyle: 'partner' };
        const updatedPrefs: UserPreferences = {
            ...currentPrefs,
            ...prefs,
        };

        await setDoc(userRef, {
            preferences: updatedPrefs,
            updated_at: Timestamp.now()
        }, { merge: true });

        console.log('[AuthService] Preferences updated for:', userId);
        return updatedPrefs;
    }

    /**
     * 権限チェックユーティリティ
     */
    hasPermission(user: UserProfile, permCode: PermissionCode): boolean {
        return user.permissions.includes(permCode);
    }

    /**
     * 【DevMode専用】ロール切り替え（デバッグ用）
     * Firebase環境では実際のDBを一時的に書き換えるのが難しいため、メモリ上のオブジェクトのみ更新
     */
    async switchRoleDebug(currentUser: UserProfile, newRoleCode: RoleCode): Promise<UserProfile> {
        // ロール定義をFirestoreから取得
        const rolesQuery = query(collection(db, 'roles'), where('role_code', '==', newRoleCode));
        const rolesSnap = await getDocs(rolesQuery);

        if (rolesSnap.empty) {
            throw new Error(`Role definition not found for code: ${newRoleCode}`);
        }

        const roleData = rolesSnap.docs[0].data();
        const roleId = rolesSnap.docs[0].id;

        const newRole: ResolvedUserRole = {
            roleId: roleId,
            roleCode: roleData.role_code as RoleCode,
            roleName: roleData.name,
            assignedAt: new Date().toISOString()
        };

        // 権限を取得
        const permsQuery = query(collection(db, 'role_permissions'), where('role_id', '==', roleId));
        const permsSnap = await getDocs(permsQuery);

        const permissionCodes: PermissionCode[] = [];
        for (const rpDoc of permsSnap.docs) {
            const permDoc = await getDoc(doc(db, 'permissions', rpDoc.data().permission_id));
            if (permDoc.exists()) {
                permissionCodes.push(permDoc.data().perm_code as PermissionCode);
            }
        }

        return {
            ...currentUser,
            roles: [newRole],
            permissions: permissionCodes,
            role: newRoleCode === 'admin' ? 'admin' : 'user'
        };
    }
}

// シングルトンインスタンスをエクスポート
export const authService = new AuthService();
export default AuthService;

// 型のre-export
export type { PermissionCode, RoleCode, ResolvedUserRole, AccountStatus, UserPreferences };
