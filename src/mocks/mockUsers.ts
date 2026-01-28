// src/mocks/mockUsers.ts
// Phase A: Mock Emulation - 正式仕様準拠のRBACテーブル構造
// 基本設計書 DES-AUTH-001 Section 6.1 準拠

// ============================================
// 1. 型定義（正式仕様準拠）
// ============================================

/**
 * アカウント状態
 * 0: 無効, 1: 有効, 2: 退職
 */
export type AccountStatus = 0 | 1 | 2;

/**
 * 権限コード（正式仕様より）
 */
export type PermissionCode =
    | 'chat:send'        // チャット送信
    | 'chat:view_own'    // 自分の履歴閲覧
    | 'chat:view_all'    // 全履歴閲覧
    | 'user:read'        // ユーザー情報閲覧
    | 'user:write'       // ユーザー情報編集
    | 'admin:access'     // 管理画面アクセス
    | 'knowledge:manage'; // ナレッジストア管理

/**
 * 役割コード
 */
export type RoleCode = 'admin' | 'general' | 'viewer';

/**
 * テーマ設定の型定義
 */
export type ThemePreference = 'dark' | 'light' | 'system';

/**
 * AIスタイルの型定義
 */
export type AiStyle = 'efficient' | 'partner';

/**
 * RAGモードの型定義
 */
export type RagMode = 'hybrid' | 'search' | 'rag' | 'auto';

// ============================================
// 2. テーブル型定義（正式仕様準拠）
// ============================================

/**
 * 権限テーブル（permissions）
 */
export interface Permission {
    id: string;
    perm_code: PermissionCode;
    name: string;
}

/**
 * 役割テーブル（roles）
 */
export interface Role {
    id: string;
    role_code: RoleCode;
    name: string;
}

/**
 * 役割-権限マッピング（role_permissions）
 */
export interface RolePermission {
    role_id: string;
    permission_id: string;
    created_at?: string;
}

/**
 * 組織階層テーブル（departments）
 */
export interface Department {
    id: number;
    name: string;
    parent_id: number | null;
    org_path: string;
}

/**
 * ユーザー設定
 */
export interface UserPreferences {
    theme: ThemePreference;
    aiStyle: AiStyle;
    ragMode?: RagMode;
    userProfile?: {
        role: string;       // 職種（「営業担当」等）
        department: string; // 部署名表示用
    };
    customInstructions?: string;
}

/**
 * ユーザーテーブル（users）- 正式仕様準拠
 */
export interface MockUser {
    user_id: string;
    employee_code?: string;
    email: string;
    password_hash: string;  // Phase A: 平文保存（Phase Bでハッシュ化）
    name: string;           // フルネーム
    department_id?: number;
    account_status: AccountStatus;
    created_at: string;
    updated_at: string;
    // Phase A専用: 設定値（将来は別テーブル化も検討）
    preferences?: UserPreferences;
    // 後方互換用（Phase A移行期間中）
    displayName?: string;
    lastName?: string;
    firstName?: string;
    avatarUrl?: string | null;
    // セキュリティフィールド（Phase A）
    dateOfBirth?: string;
    securityQuestion?: string;
    securityAnswer?: string;
    failedLoginAttempts?: number;
    lockedUntil?: string | null;
}

/**
 * ユーザー-役割マッピング（user_roles）
 */
export interface UserRole {
    user_id: string;
    role_id: string;
    assigned_at: string;
}

/**
 * 解決済みユーザーロール（フロントエンド用）
 */
export interface ResolvedUserRole {
    roleId: string;
    roleCode: RoleCode;
    roleName: string;
    assignedAt: string;
}

/**
 * セキュリティ質問の型定義
 */
export interface SecurityQuestion {
    id: number;
    question: string;
}

/**
 * 認証ストレージキーの型定義
 */
export interface AuthStorageKeys {
    TOKEN: string;
    LOCAL_USERS: string;
    USER_PREFS_PREFIX: string;
}

// ============================================
// 3. モックデータ定義（正式仕様準拠 6テーブル）
// ============================================

/**
 * 権限定義テーブル (permissions)
 */
export const MOCK_PERMISSIONS: Permission[] = [
    { id: 'perm_001', perm_code: 'chat:send', name: 'チャット送信' },
    { id: 'perm_002', perm_code: 'chat:view_own', name: '自分の履歴閲覧' },
    { id: 'perm_003', perm_code: 'chat:view_all', name: '全履歴閲覧' },
    { id: 'perm_004', perm_code: 'user:read', name: 'ユーザー情報閲覧' },
    { id: 'perm_005', perm_code: 'user:write', name: 'ユーザー情報編集' },
    { id: 'perm_006', perm_code: 'admin:access', name: '管理画面アクセス' },
    { id: 'perm_007', perm_code: 'knowledge:manage', name: 'ナレッジストア管理' },
];

/**
 * 役割定義テーブル (roles)
 */
export const MOCK_ROLES: Role[] = [
    { id: 'role_admin', role_code: 'admin', name: '管理者' },
    { id: 'role_general', role_code: 'general', name: '一般ユーザー' },
    { id: 'role_viewer', role_code: 'viewer', name: '閲覧専用' },
];

/**
 * 役割-権限マッピング (role_permissions)
 * 
 * admin（管理者）: 全権限
 * general（一般ユーザー）: chat:send, chat:view_own, user:read
 * viewer（閲覧専用）: chat:view_own のみ
 */
export const MOCK_ROLE_PERMISSIONS: RolePermission[] = [
    // 管理者: 全権限
    { role_id: 'role_admin', permission_id: 'perm_001' },
    { role_id: 'role_admin', permission_id: 'perm_002' },
    { role_id: 'role_admin', permission_id: 'perm_003' },
    { role_id: 'role_admin', permission_id: 'perm_004' },
    { role_id: 'role_admin', permission_id: 'perm_005' },
    { role_id: 'role_admin', permission_id: 'perm_006' },
    { role_id: 'role_admin', permission_id: 'perm_007' },
    // 一般ユーザー: チャット + 自分の情報
    { role_id: 'role_general', permission_id: 'perm_001' },
    { role_id: 'role_general', permission_id: 'perm_002' },
    { role_id: 'role_general', permission_id: 'perm_004' },
    // 閲覧専用
    { role_id: 'role_viewer', permission_id: 'perm_002' },
];

/**
 * 組織階層テーブル (departments)
 */
export const MOCK_DEPARTMENTS: Department[] = [
    { id: 1, name: '本社', parent_id: null, org_path: '1' },
    { id: 2, name: '営業部', parent_id: 1, org_path: '1.2' },
    { id: 3, name: '開発部', parent_id: 1, org_path: '1.3' },
    { id: 4, name: '第一営業課', parent_id: 2, org_path: '1.2.4' },
    { id: 5, name: '第二営業課', parent_id: 2, org_path: '1.2.5' },
    { id: 6, name: '情報システム部', parent_id: 1, org_path: '1.6' },
];

/**
 * ユーザーテーブル (users) - 正式仕様準拠
 * パスワードは平文（Phase Aのみ、Phase Bでハッシュ化へ移行）
 */
export const MOCK_USERS: MockUser[] = [
    {
        user_id: 'usr_admin_001',
        employee_code: 'EMP001',
        email: 'admin@example.com',
        password_hash: 'password',  // Phase A: 平文
        name: '管理者 太郎',
        department_id: 6,  // 情報システム部
        account_status: 1,  // 有効
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        // 後方互換用
        displayName: 'Admin User',
        lastName: '管理',
        firstName: '太郎',
        avatarUrl: null,
        // セキュリティフィールド
        dateOfBirth: '1985-04-15',
        securityQuestion: '母親の旧姓は？',
        securityAnswer: '田中',
        failedLoginAttempts: 0,
        lockedUntil: null,
        // 設定
        preferences: {
            theme: 'dark',
            aiStyle: 'efficient',
            ragMode: 'rag',
            userProfile: {
                role: 'システム管理者',
                department: '情報システム部',
            },
            customInstructions: '',
        },
    },
    {
        user_id: 'usr_partner_001',
        employee_code: 'EMP002',
        email: 'user@example.com',
        password_hash: 'password',
        name: '一般 花子',
        department_id: 4,  // 第一営業課
        account_status: 1,  // 有効
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        // 後方互換用
        displayName: 'Standard User',
        lastName: '山田',
        firstName: '花子',
        avatarUrl: null,
        // セキュリティフィールド
        dateOfBirth: '1990-08-20',
        securityQuestion: '初めて飼ったペットの名前は？',
        securityAnswer: 'ポチ',
        failedLoginAttempts: 0,
        lockedUntil: null,
        // 設定
        preferences: {
            theme: 'system',
            aiStyle: 'partner',
            ragMode: 'hybrid',
            userProfile: {
                role: '営業担当',
                department: '営業部',
            },
            customInstructions: '',
        },
    },
    {
        user_id: 'usr_retired_001',
        employee_code: 'EMP099',
        email: 'retired@example.com',
        password_hash: 'password',
        name: '退職 三郎',
        department_id: 3,  // 開発部
        account_status: 2,  // 退職済み（ログイン不可テスト用）
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2026-01-15T00:00:00Z',
        // 後方互換用
        displayName: 'Retired User',
        lastName: '退職',
        firstName: '三郎',
        avatarUrl: null,
        // 設定なし
        preferences: {
            theme: 'system',
            aiStyle: 'partner',
        },
    },
    {
        user_id: 'usr_viewer_001',
        employee_code: 'EMP003',
        email: 'viewer@example.com',
        password_hash: 'password',
        name: '閲覧 専用',
        department_id: 2,  // 営業部
        account_status: 1,  // 有効
        created_at: '2026-01-15T00:00:00Z',
        updated_at: '2026-01-15T00:00:00Z',
        // 後方互換用
        displayName: 'Viewer User',
        lastName: '閲覧',
        firstName: '専用',
        avatarUrl: null,
        // 設定
        preferences: {
            theme: 'light',
            aiStyle: 'partner',
        },
    },
];

/**
 * ユーザー-役割マッピング (user_roles)
 */
export const MOCK_USER_ROLES: UserRole[] = [
    { user_id: 'usr_admin_001', role_id: 'role_admin', assigned_at: '2026-01-01T00:00:00Z' },
    { user_id: 'usr_partner_001', role_id: 'role_general', assigned_at: '2026-01-01T00:00:00Z' },
    { user_id: 'usr_retired_001', role_id: 'role_general', assigned_at: '2025-01-01T00:00:00Z' },
    { user_id: 'usr_viewer_001', role_id: 'role_viewer', assigned_at: '2026-01-15T00:00:00Z' },
];

// ============================================
// 4. ユーティリティ（後方互換用）
// ============================================

/**
 * 秘密の質問の選択肢
 */
export const SECURITY_QUESTIONS: SecurityQuestion[] = [
    { id: 1, question: '母親の旧姓は？' },
    { id: 2, question: '初めて飼ったペットの名前は？' },
    { id: 3, question: '出身の小学校名は？' },
    { id: 4, question: '初めて買った車の車種は？' },
    { id: 5, question: '子供の頃のあだ名は？' },
];

/**
 * LocalStorageキー定義
 * 一元管理でキー名の重複・変更漏れを防止
 */
export const AUTH_STORAGE_KEYS: AuthStorageKeys = {
    TOKEN: 'auth_token',
    LOCAL_USERS: 'app_mock_users',
    USER_PREFS_PREFIX: 'user_prefs_',
};

// ============================================
// 5. RBAC解決ヘルパー関数
// ============================================

/**
 * ユーザーIDからロールを取得
 * マスターデータとLocalStorageの両方を検索
 */
export function getUserRolesById(userId: string): ResolvedUserRole[] {
    // マスターデータからロールを取得
    let userRoles = MOCK_USER_ROLES.filter(ur => ur.user_id === userId);

    // LocalStorageからローカルユーザーのロールを取得
    if (userRoles.length === 0) {
        try {
            const stored = localStorage.getItem('app_mock_user_roles');
            if (stored) {
                const localUserRoles = JSON.parse(stored) as UserRole[];
                userRoles = localUserRoles.filter(ur => ur.user_id === userId);
            }
        } catch (e) {
            console.error('[mockUsers] Failed to load local user roles:', e);
        }
    }

    return userRoles
        .map(ur => {
            const role = MOCK_ROLES.find(r => r.id === ur.role_id);
            if (!role) return null;
            return {
                roleId: role.id,
                roleCode: role.role_code,
                roleName: role.name,
                assignedAt: ur.assigned_at,
            };
        })
        .filter((r): r is ResolvedUserRole => r !== null);
}

/**
 * ロールから権限コードリストを解決
 */
export function resolvePermissionsByRoles(roles: ResolvedUserRole[]): PermissionCode[] {
    const permissionIds = new Set<string>();
    roles.forEach(role => {
        MOCK_ROLE_PERMISSIONS
            .filter(rp => rp.role_id === role.roleId)
            .forEach(rp => permissionIds.add(rp.permission_id));
    });
    return MOCK_PERMISSIONS
        .filter(p => permissionIds.has(p.id))
        .map(p => p.perm_code);
}

/**
 * 部署IDから部署情報を取得
 */
export function getDepartmentById(departmentId: number | undefined): Department | undefined {
    if (departmentId === undefined) return undefined;
    return MOCK_DEPARTMENTS.find(d => d.id === departmentId);
}

/**
 * 旧ロール形式から新ロールコードへのマッピング（後方互換用）
 */
export function mapLegacyRole(legacyRole: string): RoleCode {
    switch (legacyRole) {
        case 'admin':
            return 'admin';
        case 'user':
            return 'general';
        case 'developer':
            return 'admin';  // DevMode で別途制御
        default:
            return 'general';
    }
}
