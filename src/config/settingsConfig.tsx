// src/config/settingsConfig.tsx
// 設定画面のカテゴリ定義（RBAC対応）
import React from 'react';
import { User, Settings, FileText, Terminal, Sparkles, BarChart2 } from 'lucide-react';
import type { PermissionCode } from '../services/AuthService';

// 各コンポーネントをインポート
import ProfileSettings from '../components/Settings/sections/ProfileSettings';
import GeneralSettings from '../components/Settings/sections/GeneralSettings';
import PromptSettings from '../components/Settings/sections/PromptSettings';
import RagSettings from '../components/Settings/sections/RagSettings';
import DebugSettings from '../components/Settings/sections/DebugSettings';
import AdminSettings from '../components/Settings/sections/AdminSettings';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SettingsComponentProps = any;

/**
 * 設定カテゴリの型定義
 */
export interface SettingsCategory {
    id: string;
    label: string;
    icon: React.FC<{ size?: number | string }>;
    component: React.FC<SettingsComponentProps>;
    /** 必要な権限（なければ誰でもアクセス可能） */
    requiredPermission?: PermissionCode;
    /** DevModeでのみ表示（開発者向け機能） */
    devModeOnly?: boolean;
    /** レガシー: allowedRoles（後方互換、移行後削除予定） */
    allowedRoles?: string[];
}

/**
 * 設定カテゴリ一覧
 */
export const settingsCategories: SettingsCategory[] = [
    {
        id: 'profile',
        label: 'プロフィール',
        icon: User,
        component: ProfileSettings,
        // 誰でもアクセス可能
    },
    {
        id: 'general',
        label: '一般設定',
        icon: Settings,
        component: GeneralSettings,
        // 誰でもアクセス可能
    },
    {
        id: 'prompt',
        label: 'AIの振る舞い',
        icon: Sparkles,
        component: PromptSettings,
        // 誰でもアクセス可能
    },
    {
        id: 'rag',
        label: 'RAGデータ管理',
        icon: FileText,
        component: RagSettings,
        requiredPermission: 'knowledge:manage',
    },
    {
        id: 'admin_console',
        label: '管理コンソール',
        icon: BarChart2,
        component: AdminSettings,
        requiredPermission: 'admin:access',
    },
    {
        id: 'debug',
        label: '開発者オプション',
        icon: Terminal,
        component: DebugSettings,
        devModeOnly: true,  // DevModeでのみ表示
    },
];

/**
 * ユーザーがアクセス可能なカテゴリをフィルタリング
 */
export function getAccessibleCategories(
    categories: SettingsCategory[],
    hasPermission: (permCode: PermissionCode) => boolean,
    isDevMode: boolean
): SettingsCategory[] {
    return categories.filter(category => {
        // DevModeのみのカテゴリはDevMode時のみ表示
        if (category.devModeOnly && !isDevMode) {
            return false;
        }
        // 権限が必要なカテゴリは権限チェック
        if (category.requiredPermission && !hasPermission(category.requiredPermission)) {
            return false;
        }
        return true;
    });
}
