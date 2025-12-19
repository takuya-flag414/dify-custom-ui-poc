// src/config/settingsConfig.jsx
import React from 'react';
import { User, Settings, FileText, Terminal, MessageSquare, BarChart2 } from 'lucide-react';

// 各コンポーネントをインポート
import ProfileSettings from '../components/Settings/sections/ProfileSettings';
import GeneralSettings from '../components/Settings/sections/GeneralSettings';
import PromptSettings from '../components/Settings/sections/PromptSettings';
import RagSettings from '../components/Settings/sections/RagSettings';
import DebugSettings from '../components/Settings/sections/DebugSettings';
// ★追加: 管理コンソール
import AdminSettings from '../components/Settings/sections/AdminSettings';

export const settingsCategories = [
  {
    id: 'profile',
    label: 'プロフィール',
    icon: User,
    component: (props) => <ProfileSettings {...props} />,
    allowedRoles: ['user', 'admin', 'developer'],
  },
  {
    id: 'general',
    label: '一般設定',
    icon: Settings,
    component: (props) => <GeneralSettings {...props} />,
    allowedRoles: ['user', 'admin', 'developer'],
  },
  {
    id: 'prompt',
    label: 'プロンプト管理',
    icon: MessageSquare,
    component: (props) => <PromptSettings {...props} />,
    allowedRoles: ['user', 'admin', 'developer'],
  },
  {
    id: 'rag',
    label: 'RAGデータ管理',
    icon: FileText,
    component: (props) => <RagSettings {...props} />,
    allowedRoles: ['admin', 'developer'],
  },
  // ★追加: 管理コンソール (Admin/Devのみ)
  {
    id: 'admin_console',
    label: '管理コンソール',
    icon: BarChart2,
    component: (props) => <AdminSettings {...props} />,
    allowedRoles: ['admin', 'developer'],
  },
  {
    id: 'debug',
    label: '開発者オプション',
    icon: Terminal,
    component: (props) => <DebugSettings {...props} />,
    allowedRoles: ['developer'], 
  },
];