// src/components/Settings/sections/ProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import { Save, Check, User, AtSign, CircleUser, LogOut, Mail, Calendar } from 'lucide-react';
import { MacSettingsSection, MacSettingsRow } from './MacSettingsComponents';
import './SettingsCommon.css';
import './ProfileSettings.css';

// 日付フォーマット関数
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

const ProfileSettings = ({ settings, onUpdateSettings, currentUser, onLogout }) => {
  const [displayName, setDisplayName] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  // settingsから初期値をロード（authUserのdisplayNameをフォールバック）
  useEffect(() => {
    const savedName = settings?.profile?.displayName;
    const authName = currentUser?.name;

    // 優先順位:
    // 1. savedNameがあり、デフォルト値「User」でなければそれを使用（ユーザーが変更した場合）
    // 2. authUserのdisplayName
    // 3. savedName（デフォルト値でも）
    // 4. 'User'（最終フォールバック）
    const isCustomSavedName = savedName && savedName !== 'User';
    const finalName = isCustomSavedName ? savedName : (authName || savedName || 'User');

    console.log('[ProfileSettings] savedName:', savedName, 'authName:', authName, 'finalName:', finalName);
    setDisplayName(finalName);
  }, [settings, currentUser?.name]);

  const handleSave = () => {
    onUpdateSettings('profile', 'displayName', displayName);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleLogout = () => {
    if (!logoutConfirm) {
      setLogoutConfirm(true);
      setTimeout(() => setLogoutConfirm(false), 3000);
      return;
    }
    if (onLogout) {
      onLogout();
    }
  };

  const hasChanges = displayName !== (settings?.profile?.displayName || 'User');

  return (
    <div className="settings-container">
      {/* Profile Card / Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-layer-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '32px', fontWeight: 'bold', color: 'var(--color-primary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid var(--color-border)',
          marginBottom: '12px'
        }}>
          {displayName.charAt(0).toUpperCase()}
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text-main)' }}>
          {displayName}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-sub)' }}>
          {currentUser?.role || 'user'}
        </p>
      </div>

      <MacSettingsSection title="Basic Information">
        <MacSettingsRow
          icon={CircleUser}
          label="表示名"
          description="アプリ内で表示されるあなたの名前"
        >
          <input
            type="text"
            className="settings-input"
            style={{ width: '200px', textAlign: 'right' }}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="User Name"
          />
        </MacSettingsRow>

        <MacSettingsRow
          icon={AtSign}
          label="User ID"
          description="システム識別用の固有ID（変更不可）"
        >
          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-sub)' }}>
            {currentUser?.id || 'N/A'}
          </span>
        </MacSettingsRow>

        <MacSettingsRow
          icon={Mail}
          label="メールアドレス"
          description="ログインに使用するメールアドレス"
        >
          <span style={{ fontSize: '13px', color: 'var(--color-text-sub)' }}>
            {currentUser?.email || 'N/A'}
          </span>
        </MacSettingsRow>

        <MacSettingsRow
          icon={Calendar}
          label="登録日"
          description="アカウントが作成された日付"
          isLast={true}
        >
          <span style={{ fontSize: '13px', color: 'var(--color-text-sub)' }}>
            {formatDate(currentUser?.createdAt)}
          </span>
        </MacSettingsRow>
      </MacSettingsSection>

      {/* ★追加: Account セクション（ログアウト） */}
      {onLogout && (
        <MacSettingsSection title="Account">
          <MacSettingsRow
            icon={LogOut}
            label="ログアウト"
            description="現在のアカウントからログアウトします"
            isLast={true}
            danger
          >
            <button
              onClick={handleLogout}
              className="btn-danger-ghost"
            >
              {logoutConfirm ? '本当にログアウト？' : 'ログアウト'}
            </button>
          </MacSettingsRow>
        </MacSettingsSection>
      )}

      <div className="settings-actions">
        <button
          className="settings-btn primary"
          onClick={handleSave}
          disabled={!hasChanges}
          style={!hasChanges ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          {isSaved ? (
            <>
              <Check size={14} />
              <span>保存しました</span>
            </>
          ) : (
            <>
              <Save size={14} />
              <span>保存</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;