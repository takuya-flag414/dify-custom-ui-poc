// src/services/AuthService.ts
// Phase A: Mock Emulation - クライアントサイド認証サービス
// 基本設計書 DES-AUTH-001 準拠 - RBAC対応

import {
    MOCK_USERS,
    MOCK_USER_ROLES,
    AUTH_STORAGE_KEYS,
    MockUser,
    UserPreferences,
    PermissionCode,
    RoleCode,
    ResolvedUserRole,
    AccountStatus,
    getUserRolesById,
    resolvePermissionsByRoles,
    getDepartmentById,
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
 * 認証サービス (Mock Implementation)
 * 
 * Phase A: クライアントサイドのみで認証を完結
 * Phase B: AuthServiceInterface の実装をAPIクライアントに差し替え
 */
class AuthService {
    private mockDelay: { min: number; max: number };

    constructor() {
        this.mockDelay = { min: 500, max: 1000 };
    }

    /**
     * 認証遅延を演出（ネットワーク通信のシミュレーション）
     */
    private _simulateNetworkDelay(): Promise<void> {
        const delay = Math.random() * (this.mockDelay.max - this.mockDelay.min) + this.mockDelay.min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * ダミートークンを生成
     */
    private _generateToken(userId: string): string {
        return `mock_token_${userId}_${Date.now()}`;
    }

    /**
     * LocalStorageから新規作成ユーザーリストを取得
     */
    private _getLocalUsers(): MockUser[] {
        try {
            const stored = localStorage.getItem(AUTH_STORAGE_KEYS.LOCAL_USERS);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('[AuthService] Failed to parse local users:', e);
            return [];
        }
    }

    /**
     * LocalStorageに新規ユーザーを保存
     */
    private _saveLocalUsers(users: MockUser[]): void {
        try {
            localStorage.setItem(AUTH_STORAGE_KEYS.LOCAL_USERS, JSON.stringify(users));
        } catch (e) {
            console.error('[AuthService] Failed to save local users:', e);
        }
    }

    /**
     * トークンを保存
     */
    private _saveToken(token: string): void {
        try {
            localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
        } catch (e) {
            console.error('[AuthService] Failed to save token:', e);
        }
    }

    /**
     * トークンを取得
     */
    private _getToken(): string | null {
        try {
            return localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
        } catch (e) {
            console.error('[AuthService] Failed to get token:', e);
            return null;
        }
    }

    /**
     * トークンを削除
     */
    private _removeToken(): void {
        try {
            localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
        } catch (e) {
            console.error('[AuthService] Failed to remove token:', e);
        }
    }

    /**
     * ユーザー情報をトークンから抽出（userIdを取得）
     */
    private _extractUserIdFromToken(token: string): string | null {
        if (!token || !token.startsWith('mock_token_')) return null;
        const parts = token.split('_');
        if (parts.length >= 4) {
            return parts.slice(2, -1).join('_');
        }
        return null;
    }

    /**
     * 全ユーザーリストを取得（マスター + ローカル）
     */
    private _getAllUsers(): MockUser[] {
        const localUsers = this._getLocalUsers();
        return [...MOCK_USERS, ...localUsers];
    }

    /**
     * ユーザーをメールアドレスで検索
     */
    private _findUserByEmail(email: string): MockUser | undefined {
        const allUsers = this._getAllUsers();
        return allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    /**
     * ユーザーをIDで検索
     */
    private _findUserById(userId: string): MockUser | undefined {
        const allUsers = this._getAllUsers();
        return allUsers.find(u => u.user_id === userId);
    }

    /**
     * MockUser から UserProfile を生成（RBAC解決込み）
     */
    private _toUserProfile(user: MockUser): UserProfile {
        // RBAC解決: ロールと権限を取得
        const roles = getUserRolesById(user.user_id);
        const permissions = resolvePermissionsByRoles(roles);
        const department = getDepartmentById(user.department_id);

        // レガシーロール変換（後方互換用）
        const legacyRole = roles.length > 0 && roles[0].roleCode === 'admin' ? 'admin' : 'user';

        return {
            userId: user.user_id,
            employeeCode: user.employee_code,
            email: user.email,
            name: user.name,
            displayName: user.displayName || user.name,
            avatarUrl: user.avatarUrl,
            departmentId: user.department_id,
            departmentName: department?.name,
            accountStatus: user.account_status,
            roles,
            permissions,
            preferences: user.preferences || {
                theme: 'system',
                aiStyle: 'partner',
            },
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            // 後方互換用
            role: legacyRole,
        };
    }

    /**
     * ユーザーのセキュリティ関連フィールドを更新
     */
    private _updateUserSecurityFields(userId: string, fields: Partial<MockUser>): void {
        const isMasterUser = MOCK_USERS.some(u => u.user_id === userId);

        if (isMasterUser) {
            const key = `security_overlay_${userId}`;
            try {
                const existing = JSON.parse(localStorage.getItem(key) || '{}');
                localStorage.setItem(key, JSON.stringify({ ...existing, ...fields }));
            } catch (e) {
                console.error('[AuthService] Failed to save security overlay:', e);
            }
        } else {
            const localUsers = this._getLocalUsers();
            const idx = localUsers.findIndex(u => u.user_id === userId);
            if (idx !== -1) {
                localUsers[idx] = { ...localUsers[idx], ...fields };
                this._saveLocalUsers(localUsers);
            }
        }
    }

    /**
     * LocalStorageから新規ユーザーのロールマッピングを取得
     */
    private _getLocalUserRoles(): { user_id: string; role_id: string; assigned_at: string }[] {
        try {
            const stored = localStorage.getItem('app_mock_user_roles');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * LocalStorageに新規ユーザーのロールマッピングを保存
     */
    private _saveLocalUserRoles(userRoles: { user_id: string; role_id: string; assigned_at: string }[]): void {
        try {
            localStorage.setItem('app_mock_user_roles', JSON.stringify(userRoles));
        } catch (e) {
            console.error('[AuthService] Failed to save user roles:', e);
        }
    }

    // ============================================
    // 公開メソッド
    // ============================================

    /**
     * ログイン
     * - email/password でユーザーを検索
     * - account_status を検証（有効なユーザーのみ許可）
     * - RBAC を解決し、実効権限を含む UserProfile を返却
     */
    async login(email: string, password: string): Promise<LoginResult> {
        await this._simulateNetworkDelay();

        if (!email || !password) {
            throw new Error('メールアドレスとパスワードを入力してください');
        }

        const user = this._findUserByEmail(email);
        if (!user) {
            throw new Error('メールアドレスまたはパスワードが正しくありません');
        }

        // account_status 検証（正式仕様準拠）
        if (user.account_status === 0) {
            throw new Error('このアカウントは無効化されています。管理者にお問い合わせください');
        }
        if (user.account_status === 2) {
            throw new Error('このアカウントは退職済みです');
        }

        // アカウントロック確認
        if (user.lockedUntil) {
            const lockTime = new Date(user.lockedUntil);
            if (lockTime > new Date()) {
                const remainingMinutes = Math.ceil((lockTime.getTime() - new Date().getTime()) / 60000);
                throw new Error(`アカウントがロックされています。${remainingMinutes}分後に再試行してください`);
            } else {
                this._updateUserSecurityFields(user.user_id, {
                    failedLoginAttempts: 0,
                    lockedUntil: null,
                });
            }
        }

        // パスワード検証
        if (user.password_hash !== password) {
            const newAttempts = (user.failedLoginAttempts || 0) + 1;
            const maxAttempts = 5;
            const lockDurationMinutes = 15;

            if (newAttempts >= maxAttempts) {
                const lockUntil = new Date(Date.now() + lockDurationMinutes * 60000).toISOString();
                this._updateUserSecurityFields(user.user_id, {
                    failedLoginAttempts: newAttempts,
                    lockedUntil: lockUntil,
                });
                throw new Error(`ログイン試行回数が上限に達しました。アカウントは${lockDurationMinutes}分間ロックされます`);
            } else {
                this._updateUserSecurityFields(user.user_id, {
                    failedLoginAttempts: newAttempts,
                });
                throw new Error(`メールアドレスまたはパスワードが正しくありません（残り${maxAttempts - newAttempts}回）`);
            }
        }

        // ログイン成功: 失敗カウントリセット
        if (user.failedLoginAttempts && user.failedLoginAttempts > 0) {
            this._updateUserSecurityFields(user.user_id, {
                failedLoginAttempts: 0,
                lockedUntil: null,
            });
        }

        const token = this._generateToken(user.user_id);
        this._saveToken(token);

        console.log('[AuthService] Login successful:', user.email);

        return {
            token,
            user: this._toUserProfile(user),
        };
    }

    /**
     * サインアップ（新規ユーザー登録）
     * - 新規ユーザーを作成
     * - デフォルトで 'general' ロールを割り当て
     */
    async signup(
        email: string,
        password: string,
        displayName: string,
        securityInfo: Partial<SecurityInfo> = {}
    ): Promise<LoginResult> {
        await this._simulateNetworkDelay();

        const { lastName, firstName, dateOfBirth, securityQuestion, securityAnswer } = securityInfo;

        if (!email || !password || !displayName) {
            throw new Error('すべての項目を入力してください');
        }

        if (!lastName || !firstName) {
            throw new Error('姓・名を入力してください');
        }
        if (!dateOfBirth) {
            throw new Error('生年月日を入力してください');
        }
        if (!securityQuestion || !securityAnswer) {
            throw new Error('秘密の質問と回答を入力してください');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('メールアドレスの形式が正しくありません');
        }

        if (password.length < 8) {
            throw new Error('パスワードは8文字以上で入力してください');
        }
        if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
            throw new Error('パスワードは英字と数字を含めてください');
        }

        const existingUser = this._findUserByEmail(email);
        if (existingUser) {
            throw new Error('このメールアドレスは既に使用されています');
        }

        const newUserId = `usr_local_${Date.now()}`;
        const now = new Date().toISOString();

        const newUser: MockUser = {
            user_id: newUserId,
            email: email.toLowerCase(),
            password_hash: password,  // Phase A: 平文（Phase Bでハッシュ化）
            name: `${lastName} ${firstName}`,
            account_status: 1,  // 有効
            created_at: now,
            updated_at: now,
            // 後方互換用
            displayName,
            lastName,
            firstName,
            avatarUrl: null,
            // セキュリティフィールド
            dateOfBirth,
            securityQuestion,
            securityAnswer,
            failedLoginAttempts: 0,
            lockedUntil: null,
            // 設定
            preferences: {
                theme: 'system',
                aiStyle: 'partner',
                userProfile: {
                    role: '',
                    department: '',
                },
                customInstructions: '',
            },
        };

        // ユーザー保存
        const localUsers = this._getLocalUsers();
        localUsers.push(newUser);
        this._saveLocalUsers(localUsers);

        // デフォルトロール（general）を割り当て
        const localUserRoles = this._getLocalUserRoles();
        localUserRoles.push({
            user_id: newUserId,
            role_id: 'role_general',
            assigned_at: now,
        });
        this._saveLocalUserRoles(localUserRoles);

        const token = this._generateToken(newUser.user_id);
        this._saveToken(token);

        console.log('[AuthService] Signup successful:', newUser.email);

        return {
            token,
            user: this._toUserProfile(newUser),
        };
    }

    /**
     * セッション復元
     * - トークンからユーザー情報を復元
     * - account_status の再検証を実施
     */
    async restoreSession(token: string | null = null): Promise<UserProfile | null> {
        await this._simulateNetworkDelay();

        const storedToken = token || this._getToken();
        if (!storedToken) {
            console.log('[AuthService] No token found');
            return null;
        }

        const userId = this._extractUserIdFromToken(storedToken);
        if (!userId) {
            console.log('[AuthService] Invalid token format');
            this._removeToken();
            return null;
        }

        const user = this._findUserById(userId);
        if (!user) {
            console.log('[AuthService] User not found for token');
            this._removeToken();
            return null;
        }

        // account_status 再検証
        if (user.account_status !== 1) {
            console.log('[AuthService] User account is not active');
            this._removeToken();
            return null;
        }

        console.log('[AuthService] Session restored:', user.email);
        return this._toUserProfile(user);
    }

    /**
     * ログアウト
     */
    async logout(): Promise<void> {
        await this._simulateNetworkDelay();
        this._removeToken();
        console.log('[AuthService] Logged out');
    }

    /**
     * ユーザー設定を更新
     */
    async updatePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences> {
        await this._simulateNetworkDelay();

        const user = this._findUserById(userId);
        if (!user) {
            throw new Error('ユーザーが見つかりません');
        }

        const currentPrefs = user.preferences || { theme: 'system', aiStyle: 'partner' };
        const updatedPrefs: UserPreferences = {
            ...currentPrefs,
            ...prefs,
        };

        const isMasterUser = MOCK_USERS.some(u => u.user_id === userId);
        if (isMasterUser) {
            const key = `${AUTH_STORAGE_KEYS.USER_PREFS_PREFIX}${userId}`;
            try {
                localStorage.setItem(key, JSON.stringify(updatedPrefs));
            } catch (e) {
                console.error('[AuthService] Failed to save preferences:', e);
            }
        } else {
            const localUsers = this._getLocalUsers();
            const idx = localUsers.findIndex(u => u.user_id === userId);
            if (idx !== -1) {
                localUsers[idx].preferences = updatedPrefs;
                this._saveLocalUsers(localUsers);
            }
        }

        console.log('[AuthService] Preferences updated for:', userId);
        return updatedPrefs;
    }

    /**
     * ユーザー設定を取得（Overlay適用済み）
     */
    getUserPreferences(userId: string): UserPreferences | null {
        const user = this._findUserById(userId);
        if (!user) return null;

        const defaultPrefs: UserPreferences = { theme: 'system', aiStyle: 'partner' };
        const basePrefs = user.preferences || defaultPrefs;

        const isMasterUser = MOCK_USERS.some(u => u.user_id === userId);
        if (isMasterUser) {
            const key = `${AUTH_STORAGE_KEYS.USER_PREFS_PREFIX}${userId}`;
            try {
                const overlay = localStorage.getItem(key);
                if (overlay) {
                    return { ...basePrefs, ...JSON.parse(overlay) };
                }
            } catch (e) {
                console.error('[AuthService] Failed to load preferences overlay:', e);
            }
        }

        return basePrefs;
    }

    /**
     * 権限チェックユーティリティ
     * - ユーザーが指定された権限を持つかどうかを判定
     */
    hasPermission(user: UserProfile, permCode: PermissionCode): boolean {
        return user.permissions.includes(permCode);
    }

    /**
     * ユーザーのロールを取得
     */
    getUserRoles(userId: string): ResolvedUserRole[] {
        return getUserRolesById(userId);
    }

    /**
     * ロールから権限を解決
     */
    resolvePermissions(roles: ResolvedUserRole[]): PermissionCode[] {
        return resolvePermissionsByRoles(roles);
    }
}

// シングルトンインスタンスをエクスポート
export const authService = new AuthService();
export default AuthService;

// 型のre-export（他のファイルからの参照用）
export type { PermissionCode, RoleCode, ResolvedUserRole, AccountStatus, UserPreferences };
