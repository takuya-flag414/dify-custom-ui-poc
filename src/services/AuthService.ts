// src/services/AuthService.ts
// Phase B: Firebase Integration - クライアントサイド認証サービス
// 基本設計書 DES-AUTH-001 準拠 - RBAC対応

import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import { 
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    query, 
    where, 
    getDocs,
    Timestamp 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
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
    securityQuestion: string;
    securityAnswer: string;
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
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (!userDoc.exists()) {
                throw new Error('ユーザープロファイルが見つかりません');
            }

            const userData = userDoc.data();

            // 3. アカウント状態の検証
            if (userData.account_status === 0) {
                await signOut(auth);
                throw new Error('このアカウントは無効化されています。管理者にお問い合わせください');
            }
            if (userData.account_status === 2) {
                await signOut(auth);
                throw new Error('このアカウントは退職済みです');
            }

            const profile = await this._toUserProfile(firebaseUser.uid, userData);
            const token = await firebaseUser.getIdToken();

            console.log('[AuthService] Login successful:', profile.email);

            return {
                token,
                user: profile,
            };
        } catch (error: any) {
            console.error('[AuthService] Login failed:', error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                throw new Error('メールアドレスまたはパスワードが正しくありません');
            }
            throw error;
        }
    }

    /**
     * サインアップ
     */
    async signup(
        email: string,
        password: string,
        displayName: string,
        securityInfo: Partial<SecurityInfo> = {}
    ): Promise<LoginResult> {
        const { lastName, firstName, dateOfBirth, securityQuestion, securityAnswer } = securityInfo;

        if (!email || !password || !displayName) {
            throw new Error('すべての項目を入力してください');
        }

        try {
            // 1. Firebase Auth でユーザー作成
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // 2. Firestore にプロファイルを保存
            const now = Timestamp.now();
            const userData = {
                user_id: firebaseUser.uid,
                email: email.toLowerCase(),
                name: `${lastName} ${firstName}`,
                account_status: 1, // 有効
                created_at: now,
                updated_at: now,
                displayName,
                lastName,
                firstName,
                avatarUrl: null,
                dateOfBirth,
                securityQuestion,
                securityAnswer,
                preferences: {
                    theme: 'system',
                    aiStyle: 'partner',
                }
            };

            await setDoc(doc(db, 'users', firebaseUser.uid), userData);

            // 3. デフォルトロール（general）を割り当て
            // 注: 'role_general' ID が存在することを確認しておく必要がある（Seeding）
            await setDoc(doc(collection(db, 'user_roles')), {
                user_id: firebaseUser.uid,
                role_id: 'role_general',
                assigned_at: now
            });

            const profile = await this._toUserProfile(firebaseUser.uid, userData);
            const token = await firebaseUser.getIdToken();

            console.log('[AuthService] Signup successful:', profile.email);

            return {
                token,
                user: profile,
            };
        } catch (error: any) {
            console.error('[AuthService] Signup failed:', error);
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('このメールアドレスは既に使用されています');
            }
            throw error;
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
                        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            if (userData.account_status === 1) {
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
     * ログアウト
     */
    async logout(): Promise<void> {
        await signOut(auth);
        console.log('[AuthService] Logged out');
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
