import React, { useState } from 'react';
import { ShieldCheck, Activity, Users } from 'lucide-react';
import UserManagementScreen from './UserManagementScreen';
import SystemLogsScreen from './SystemLogsScreen';
import './UserManagementScreen.css'; // タブのスタイル等を再利用

const AdminDashboard = () => {
  const [viewTab, setViewTab] = useState('logs'); // 'users' or 'logs'

  return (
    <div style={{ padding: '32px 48px', height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
      <div className="admin-header">
        <h1>
          <ShieldCheck size={28} style={{ color: 'var(--accent-primary)' }} />
          管理設定
        </h1>
        <p>社内システムのアカウント管理機能と、システム稼働ログ（監査）の閲覧を行います。</p>
      </div>

      <div className="admin-tabs" style={{ maxWidth: '600px' }}>
        <button
          className={`admin-tab ${viewTab === 'users' ? 'active' : ''}`}
          onClick={() => setViewTab('users')}
        >
          <Users size={16} /> ユーザー管理
        </button>
        <button
          className={`admin-tab ${viewTab === 'logs' ? 'active' : ''}`}
          onClick={() => setViewTab('logs')}
        >
          <Activity size={16} /> システムログ
        </button>
      </div>

      <div style={{ maxWidth: viewTab === 'logs' ? '1200px' : '900px', transition: 'max-width 0.3s' }}>
        {viewTab === 'users' && <UserManagementScreen />}
        {viewTab === 'logs' && <SystemLogsScreen />}
      </div>
    </div>
  );
};

export default AdminDashboard;
