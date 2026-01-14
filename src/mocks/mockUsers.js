// src/mocks/mockUsers.js
// 開発・テスト用のマスターユーザーデータ
// Phase A: Mock Emulation - リポジトリ共有の固定アカウント

/**
 * マスターユーザー定義
 * - ソースコードに直接定義（開発者間で共有）
 * - パスワードは平文（Phase Aのみ、Phase Bでハッシュ化へ移行）
 */
/**
 * 秘密の質問の選択肢
 */
export const SECURITY_QUESTIONS = [
  { id: 1, question: '母親の旧姓は？' },
  { id: 2, question: '初めて飼ったペットの名前は？' },
  { id: 3, question: '出身の小学校名は？' },
  { id: 4, question: '初めて買った車の車種は？' },
  { id: 5, question: '子供の頃のあだ名は？' },
];

export const MOCK_USERS = [
  {
    userId: 'usr_admin_001',
    email: 'admin@example.com',
    password: 'password',
    displayName: 'Admin User',
    // セキュリティ強化フィールド（Phase A）
    lastName: '管理',
    firstName: '太郎',
    dateOfBirth: '1985-04-15',
    securityQuestion: '母親の旧姓は？',
    securityAnswer: '田中', // Phase B: ハッシュ化予定
    failedLoginAttempts: 0,
    lockedUntil: null,
    avatarUrl: null,
    role: 'admin',
    preferences: {
      theme: 'dark',
      aiStyle: 'efficient',
      userProfile: {
        role: 'システム管理者',
        department: '情報システム部',
      },
      customInstructions: '',
    },
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    userId: 'usr_partner_001',
    email: 'user@example.com',
    password: 'password',
    displayName: 'Standard User',
    // セキュリティ強化フィールド（Phase A）
    lastName: '山田',
    firstName: '花子',
    dateOfBirth: '1990-08-20',
    securityQuestion: '初めて飼ったペットの名前は？',
    securityAnswer: 'ポチ', // Phase B: ハッシュ化予定
    failedLoginAttempts: 0,
    lockedUntil: null,
    avatarUrl: null,
    role: 'user',
    preferences: {
      theme: 'system',
      aiStyle: 'partner',
      userProfile: {
        role: '営業担当',
        department: '営業部',
      },
      customInstructions: '',
    },
    createdAt: '2026-01-01T00:00:00Z',
  },
];

/**
 * LocalStorageキー定義
 * - 一元管理でキー名の重複・変更漏れを防止
 */
export const AUTH_STORAGE_KEYS = {
  TOKEN: 'auth_token',           // セッショントークン
  LOCAL_USERS: 'app_mock_users', // 新規作成ユーザーリスト
  USER_PREFS_PREFIX: 'user_prefs_', // ユーザー設定のプレフィックス
};
