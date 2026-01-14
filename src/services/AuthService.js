// src/services/AuthService.js
// Phase A: Mock Emulation - クライアントサイド認証サービス

import { MOCK_USERS, AUTH_STORAGE_KEYS } from '../mocks/mockUsers';

/**
 * 認証サービス (Mock Implementation)
 * 
 * Phase A: クライアントサイドのみで認証を完結
 * Phase B: AuthServiceInterface の実装をAPIクライアントに差し替え
 */
class AuthService {
  constructor() {
    this.mockDelay = { min: 500, max: 1000 }; // 遅延演出（ms）
  }

  /**
   * 認証遅延を演出（ネットワーク通信のシミュレーション）
   */
  _simulateNetworkDelay() {
    const delay = Math.random() * (this.mockDelay.max - this.mockDelay.min) + this.mockDelay.min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * ダミートークンを生成
   */
  _generateToken(userId) {
    return `mock_token_${userId}_${Date.now()}`;
  }

  /**
   * LocalStorageから新規作成ユーザーリストを取得
   */
  _getLocalUsers() {
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
  _saveLocalUsers(users) {
    try {
      localStorage.setItem(AUTH_STORAGE_KEYS.LOCAL_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('[AuthService] Failed to save local users:', e);
    }
  }

  /**
   * トークンを保存
   */
  _saveToken(token) {
    try {
      localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
    } catch (e) {
      console.error('[AuthService] Failed to save token:', e);
    }
  }

  /**
   * トークンを取得
   */
  _getToken() {
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
  _removeToken() {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
    } catch (e) {
      console.error('[AuthService] Failed to remove token:', e);
    }
  }

  /**
   * ユーザー情報をトークンから抽出（userIdを取得）
   */
  _extractUserIdFromToken(token) {
    if (!token || !token.startsWith('mock_token_')) return null;
    const parts = token.split('_');
    // mock_token_{userId}_{timestamp} → userId部分を取得
    // userId自体にアンダースコアが含まれる可能性があるため注意
    if (parts.length >= 4) {
      // "mock", "token", userId..., timestamp の構造
      // timestampを除去してuserIdを復元
      return parts.slice(2, -1).join('_');
    }
    return null;
  }

  /**
   * 全ユーザーリストを取得（マスター + ローカル）
   */
  _getAllUsers() {
    const localUsers = this._getLocalUsers();
    return [...MOCK_USERS, ...localUsers];
  }

  /**
   * ユーザーをメールアドレスで検索
   */
  _findUserByEmail(email) {
    const allUsers = this._getAllUsers();
    return allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  /**
   * ユーザーをIDで検索
   */
  _findUserById(userId) {
    const allUsers = this._getAllUsers();
    return allUsers.find(u => u.userId === userId);
  }

  /**
   * ユーザープロファイルを生成（パスワードを除外）
   */
  _toUserProfile(user) {
    const { password, ...profile } = user;
    return profile;
  }

  /**
   * ログイン
   * @param {string} email - メールアドレス
   * @param {string} password - パスワード
   * @returns {Promise<{ token: string, user: UserProfile }>}
   */
  async login(email, password) {
    await this._simulateNetworkDelay();

    // 入力検証
    if (!email || !password) {
      throw new Error('メールアドレスとパスワードを入力してください');
    }

    // ユーザー検索
    const user = this._findUserByEmail(email);
    if (!user) {
      throw new Error('メールアドレスまたはパスワードが正しくありません');
    }

    // アカウントロックチェック
    if (user.lockedUntil) {
      const lockTime = new Date(user.lockedUntil);
      if (lockTime > new Date()) {
        const remainingMinutes = Math.ceil((lockTime - new Date()) / 60000);
        throw new Error(`アカウントがロックされています。${remainingMinutes}分後に再試行してください`);
      } else {
        // ロック期限切れ - リセット
        this._updateUserSecurityFields(user.userId, {
          failedLoginAttempts: 0,
          lockedUntil: null,
        });
      }
    }

    // パスワード検証（平文比較 - Phase Aのみ）
    if (user.password !== password) {
      // ログイン失敗回数をインクリメント
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const maxAttempts = 5;
      const lockDurationMinutes = 15;

      if (newAttempts >= maxAttempts) {
        // アカウントロック
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

    // ログイン成功 - 失敗回数をリセット
    if (user.failedLoginAttempts > 0) {
      this._updateUserSecurityFields(user.userId, {
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
    }

    // トークン生成・保存
    const token = this._generateToken(user.userId);
    this._saveToken(token);

    console.log('[AuthService] Login successful:', user.email);

    return {
      token,
      user: this._toUserProfile(user),
    };
  }

  /**
   * ユーザーのセキュリティ関連フィールドを更新
   * @param {string} userId - ユーザーID
   * @param {object} fields - 更新するフィールド
   */
  _updateUserSecurityFields(userId, fields) {
    const isMasterUser = MOCK_USERS.some(u => u.userId === userId);
    
    if (isMasterUser) {
      // マスターユーザーの場合はLocalStorageにオーバーレイ保存
      const key = `security_overlay_${userId}`;
      try {
        const existing = JSON.parse(localStorage.getItem(key) || '{}');
        localStorage.setItem(key, JSON.stringify({ ...existing, ...fields }));
      } catch (e) {
        console.error('[AuthService] Failed to save security overlay:', e);
      }
    } else {
      // ローカルユーザーの場合は直接更新
      const localUsers = this._getLocalUsers();
      const idx = localUsers.findIndex(u => u.userId === userId);
      if (idx !== -1) {
        localUsers[idx] = { ...localUsers[idx], ...fields };
        this._saveLocalUsers(localUsers);
      }
    }
  }

  /**
   * サインアップ（新規ユーザー登録）
   * @param {string} email - メールアドレス
   * @param {string} password - パスワード
   * @param {string} displayName - 表示名
   * @param {object} securityInfo - セキュリティ情報（姓・名・生年月日・秘密の質問）
   * @returns {Promise<{ token: string, user: UserProfile }>}
   */
  async signup(email, password, displayName, securityInfo = {}) {
    await this._simulateNetworkDelay();

    const { lastName, firstName, dateOfBirth, securityQuestion, securityAnswer } = securityInfo;

    // 入力検証
    if (!email || !password || !displayName) {
      throw new Error('すべての項目を入力してください');
    }

    // セキュリティ情報の検証
    if (!lastName || !firstName) {
      throw new Error('姓・名を入力してください');
    }
    if (!dateOfBirth) {
      throw new Error('生年月日を入力してください');
    }
    if (!securityQuestion || !securityAnswer) {
      throw new Error('秘密の質問と回答を入力してください');
    }

    // メール形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('メールアドレスの形式が正しくありません');
    }

    // パスワード強度チェック
    if (password.length < 8) {
      throw new Error('パスワードは8文字以上で入力してください');
    }
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      throw new Error('パスワードは英字と数字を含めてください');
    }

    // 重複チェック
    const existingUser = this._findUserByEmail(email);
    if (existingUser) {
      throw new Error('このメールアドレスは既に使用されています');
    }

    // 新規ユーザー作成
    const newUser = {
      userId: `usr_local_${Date.now()}`,
      email: email.toLowerCase(),
      password, // Phase A: 平文保存
      displayName,
      // セキュリティ強化フィールド（Phase A）
      lastName,
      firstName,
      dateOfBirth,
      securityQuestion,
      securityAnswer, // Phase B: ハッシュ化予定
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

    // LocalStorageに保存
    const localUsers = this._getLocalUsers();
    localUsers.push(newUser);
    this._saveLocalUsers(localUsers);

    // トークン生成・保存
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
   * @param {string} token - セッショントークン（省略時はLocalStorageから取得）
   * @returns {Promise<UserProfile | null>}
   */
  async restoreSession(token = null) {
    await this._simulateNetworkDelay();

    const storedToken = token || this._getToken();
    if (!storedToken) {
      console.log('[AuthService] No token found');
      return null;
    }

    // トークンからユーザーIDを抽出
    const userId = this._extractUserIdFromToken(storedToken);
    if (!userId) {
      console.log('[AuthService] Invalid token format');
      this._removeToken();
      return null;
    }

    // ユーザー検索
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
  async logout() {
    await this._simulateNetworkDelay();

    this._removeToken();
    console.log('[AuthService] Logged out');
  }

  /**
   * ユーザー設定を更新
   * @param {string} userId - ユーザーID
   * @param {object} prefs - 更新する設定値
   * @returns {Promise<object>} 更新後の設定
   */
  async updatePreferences(userId, prefs) {
    await this._simulateNetworkDelay();

    const user = this._findUserById(userId);
    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // 設定をマージ
    const updatedPrefs = {
      ...user.preferences,
      ...prefs,
    };

    // マスターユーザーの場合はLocalStorageにOverlay保存
    const isMasterUser = MOCK_USERS.some(u => u.userId === userId);
    if (isMasterUser) {
      const key = `${AUTH_STORAGE_KEYS.USER_PREFS_PREFIX}${userId}`;
      try {
        localStorage.setItem(key, JSON.stringify(updatedPrefs));
      } catch (e) {
        console.error('[AuthService] Failed to save preferences:', e);
      }
    } else {
      // ローカルユーザーの場合は直接更新
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
   * @param {string} userId - ユーザーID
   * @returns {object | null} 設定値
   */
  getUserPreferences(userId) {
    const user = this._findUserById(userId);
    if (!user) return null;

    // マスターユーザーの場合はOverlayをマージ
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
