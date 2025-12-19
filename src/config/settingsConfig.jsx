// src/config/settingsConfig.jsx
import React from 'react';
import { User, Settings, FileText, Terminal, MessageSquare } from 'lucide-react';
// ★追加: DebugSettingsをインポート
import DebugSettings from '../components/Settings/sections/DebugSettings';

// Temporary placeholder components for Phase 1
const PlaceholderComponent = ({ title, settings, currentUser }) => (
  <div className="p-8 text-center text-gray-500">
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    <p className="mb-4">この設定項目は現在開発中です。</p>
    {(settings || currentUser) && (
      <div className="text-left bg-gray-100 p-4 rounded text-xs font-mono overflow-auto max-h-40">
        <p className="font-bold text-gray-700">DEBUG: Received Props</p>
        <p>User ID: {currentUser?.id}</p>
        <pre>{JSON.stringify(settings, null, 2)}</pre>
      </div>
    )}
  </div>
);

export const settingsCategories = [
  {
    id: 'profile',
    label: 'プロフィール',
    icon: User,
    component: (props) => <PlaceholderComponent title="プロフィール設定" {...props} />,
    allowedRoles: ['user', 'admin', 'developer'],
  },
  {
    id: 'general',
    label: '一般設定',
    icon: Settings,
    component: (props) => <PlaceholderComponent title="一般設定" {...props} />,
    allowedRoles: ['user', 'admin', 'developer'],
  },
  {
    id: 'prompt',
    label: 'プロンプト管理',
    icon: MessageSquare,
    component: (props) => <PlaceholderComponent title="プロンプト管理 (Mock)" {...props} />,
    allowedRoles: ['user', 'admin', 'developer'],
  },
  {
    id: 'rag',
    label: 'RAGデータ管理',
    icon: FileText,
    component: (props) => <PlaceholderComponent title="RAGデータ管理" {...props} />,
    allowedRoles: ['admin', 'developer'],
  },
  {
    id: 'debug',
    label: '開発者オプション',
    icon: Terminal,
    // ★変更: DebugSettings コンポーネントを使用
    component: (props) => <DebugSettings {...props} />,
    allowedRoles: ['developer'],
  },
];