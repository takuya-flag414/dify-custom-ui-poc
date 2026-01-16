// src/services/AuthService.ts
// Phase A: Mock Emulation - クライアントサイド認証サービス

import { MOCK_USERS, AUTH_STORAGE_KEYS, MockUser, UserPreferences } from '../mocks/mockUsers';

/**
 * ユーザープロファイル（パスワードを除いたユーザー情報）
 */
export type UserProfile = Omit<MockUser, 'password'>;

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
        return allUsers.find(u => u.userId === userId);
    }

    /**
     * ユーザープロファイルを生成（パスワードを除外）
     */
    private _toUserProfile(user: MockUser): UserProfile {
        const { password, ...profile } = user;
        return profile;
    }

    /**
     * ユーザーのセキュリティ関連フィールドを更新
     */
    private _updateUserSecurityFields(userId: string, fields: Partial<MockUser>): void {
        const isMasterUser = MOCK_USERS.some(u => u.userId === userId);

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
            const idx = localUsers.findIndex(u => u.userId === userId);
            if (idx !== -1) {
                localUsers[idx] = { ...localUsers[idx], ...fields };
                this._saveLocalUsers(localUsers);
            }
        }
    }

    /**
     * ログイン
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

        if (user.lockedUntil) {
            const lockTime = new Date(user.lockedUntil);
            if (lockTime > new Date()) {
                const remainingMinutes = Math.ceil((lockTime.getTime() - new Date().getTime()) / 60000);
                throw new Error(`アカウントがロックされています。${remainingMinutes}分後に再試行してください`);
            } else {
                this._updateUserSecurityFields(user.userId, {
                    failedLoginAttempts: 0,
                    lockedUntil: null,
                });
            }
        }

        if (user.password !== password) {
            const newAttempts = (user.failedLoginAttempts || 0) + 1;
            const maxAttempts = 5;
            const lockDurationMinutes = 15;

            if (newAttempts >= maxAttempts) {
                const lockUntil = new Date(Date.now() + lockDurationMinutes * 60000).toISOString();
                this._updateUserSecurityFields(user.userId, {
                    failedLoginAttempts: newAttempts,
                    lockedUntil: lockUntil,
                });
                throw new Error(`ログイン試行回数が上限に達しました。アカウントは${lockDurationMinutes}分間ロックされます`);
            } else {
                this._updateUserSecurityFields(user.userId, {
                    failedLoginAttempts: newAttempts,
                });
                throw new Error(`メールアドレスまたはパスワードが正しくありません（残り${maxAttempts - newAttempts}回）`);
            }
        }

        if (user.failedLoginAttempts > 0) {
            this._updateUserSecurityFields(user.userId, {
                failedLoginAttempts: 0,
                lockedUntil: null,
            });
        }

        const token = this._generateToken(user.userId);
        this._saveToken(token);

        console.log('[AuthService] Login successful:', user.email);

        return {
            token,
            user: this._toUserProfile(user),
        };
    }

    /**
     * サインアップ（新規ユーザー登録）
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

        const newUser: MockUser = {
            userId: `usr_local_${Date.now()}`,
            email: email.toLowerCase(),
            password,
            displayName,
            lastName,
            firstName,
            dateOfBirth,
            securityQuestion,
            securityAnswer,
            failedLoginAttempts: 0,
            lockedUntil: null,
            avatarUrl: null,
            role: 'user',
            preferences: {
                theme: 'system',
                aiStyle: 'partner',
                userProfile: {
                    role: '',
                    department: '',
                },
                customInstructions: '',
            },
            createdAt: new Date().toISOString(),
        };

        const localUsers = this._getLocalUsers();
        localUsers.push(newUser);
        this._saveLocalUsers(localUsers);

        const token = this._generateToken(newUser.userId);
        this._saveToken(token);

        console.log('[AuthService] Signup successful:', newUser.email);

        return {
            token,
            user: this._toUserProfile(newUser),
        };
    }

    /**
     * セッション復元
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

        const updatedPrefs: UserPreferences = {
            ...user.preferences,
            ...prefs,
        };

        const isMasterUser = MOCK_USERS.some(u => u.userId === userId);
        if (isMasterUser) {
            const key = `${AUTH_STORAGE_KEYS.USER_PREFS_PREFIX}${userId}`;
            try {
                localStorage.setItem(key, JSON.stringify(updatedPrefs));
            } catch (e) {
                console.error('[AuthService] Failed to save preferences:', e);
            }
        } else {
            const localUsers = this._getLocalUsers();
            const idx = localUsers.findIndex(u => u.userId === userId);
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

        const isMasterUser = MOCK_USERS.some(u => u.userId === userId);
        if (isMasterUser) {
            const key = `${AUTH_STORAGE_KEYS.USER_PREFS_PREFIX}${userId}`;
            try {
                const overlay = localStorage.getItem(key);
                if (overlay) {
                    return { ...user.preferences, ...JSON.parse(overlay) };
                }
            } catch (e) {
                console.error('[AuthService] Failed to load preferences overlay:', e);
            }
        }

        return user.preferences;
    }
}

// シングルトンインスタンスをエクスポート
export const authService = new AuthService();
export default AuthService;
