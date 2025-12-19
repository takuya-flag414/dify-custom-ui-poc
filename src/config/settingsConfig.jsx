// src/config/settingsConfig.jsx
import React from 'react';
import { User, Settings, FileText, Terminal, MessageSquare } from 'lucide-react';

// ★追加: 各コンポーネントをインポート
import ProfileSettings from '../components/Settings/sections/ProfileSettings';
import GeneralSettings from '../components/Settings/sections/GeneralSettings';
import PromptSettings from '../components/Settings/sections/PromptSettings';
import RagSettings from '../components/Settings/sections/RagSettings';
import DebugSettings from '../components/Settings/sections/DebugSettings';

export const settingsCategories = [
  {
    id: 'profile',
    label: 'プロフィール',
    icon: User,
    // ★変更
    component: (props) => <ProfileSettings {...props} />,
    allowedRoles: ['user', 'admin', 'developer'],
  },
  {
    id: 'general',
    label: '一般設定',
    icon: Settings,
    // ★変更
    component: (props) => <GeneralSettings {...props} />,
    allowedRoles: ['user', 'admin', 'developer'],
  },
  {
    id: 'prompt',
    label: 'プロンプト管理',
    icon: MessageSquare,
    // ★変更
    component: (props) => <PromptSettings {...props} />,
    allowedRoles: ['user', 'admin', 'developer'],
  },
  {
    id: 'rag',
    label: 'RAGデータ管理',
    icon: FileText,
    // ★変更
    component: (props) => <RagSettings {...props} />,
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