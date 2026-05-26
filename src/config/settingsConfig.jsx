// src/config/settingsConfig.jsx
import React from 'react';
import { User, Settings, FileText, Terminal, BarChart2, Sparkles, Sliders } from 'lucide-react';

// 各コンポーネントをインポート
import ProfileSettings from '../components/Settings/sections/ProfileSettings';
import AppearanceSettings from '../components/Settings/sections/AppearanceSettings';
import PromptSettings from '../components/Settings/sections/PromptSettings';
import RagSettings from '../components/Settings/sections/RagSettings';
import SystemSettings from '../components/Settings/sections/SystemSettings';
import AdminSettings from '../components/Settings/sections/AdminSettings';
import DebugSettings from '../components/Settings/sections/DebugSettings';

export const settingsCategories = [
  // === 👤 アカウントとアプリ（Account & App） ===
  {
    id: 'profile',
    label: 'マイアカウント',
    icon: User,
    component: (props) => <ProfileSettings {...props} />,
    allowedRoles: ['user', 'admin', 'developer'],
    group: 'Account & App',
  },
  {
    id: 'appearance',
    label: '外観と操作',
    icon: Settings,
    component: (props) => <AppearanceSettings {...props} />,
    allowedRoles: ['user', 'admin', 'developer'],
    group: 'Account & App',
  },

  // === 🤖 AIカスタマイズ（AI Personalization） ===
  {
    id: 'prompt',
    label: 'AIの振る舞い',
    icon: Sparkles,
    component: (props) => <PromptSettings {...props} />,
    allowedRoles: ['user', 'admin', 'developer'],
    group: 'AI Personalization',
  },
  {
    id: 'rag',
    label: 'データ連携 (RAG)',
    icon: FileText,
    component: (props) => <RagSettings {...props} />,
    allowedRoles: ['admin', 'developer'],
    group: 'AI Personalization',
  },

  // === ⚙️ システム・管理者（System & Admin） ===
  {
    id: 'system',
    label: 'システム設定',
    icon: Sliders,
    component: (props) => <SystemSettings {...props} />,
    allowedRoles: ['user', 'admin', 'developer'],
    group: 'System & Admin',
  },
  {
    id: 'admin_console',
    label: '管理コンソール',
    icon: BarChart2,
    component: (props) => <AdminSettings {...props} />,
    allowedRoles: ['admin', 'developer'],
    group: 'System & Admin',
  },
  {
    id: 'debug',
    label: '開発者オプション',
    icon: Terminal,
    component: (props) => <DebugSettings {...props} />,
    allowedRoles: ['developer'],
    group: 'System & Admin',
  },
];