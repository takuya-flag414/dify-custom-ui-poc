// src/components/Settings/sections/ProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import { Check, AtSign, CircleUser, LogOut, Mail, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // 初期値のロード
  useEffect(() => {
    const savedName = settings?.profile?.displayName;
    const authName = currentUser?.name;
    const finalName = (savedName && savedName !== 'User') ? savedName : (authName || savedName || 'User');
    setDisplayName(finalName);
  }, [settings, currentUser?.name]);

  // オートセーブ（フォーカスが外れた時）
  const handleBlur = () => {
    const savedName = settings?.profile?.displayName;
    if (displayName !== savedName && displayName.trim() !== '') {
      onUpdateSettings('profile', 'displayName', displayName);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
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

  return (
    <div className="settings-container">
      {/* Profile Card / Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-layer-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '32px', fontWeight: 'bold', color: 'var(--sys-color-primary, #0A84FF)',
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

      {/* 編集可能セクション */}
      <MacSettingsSection title="Profile">
        <MacSettingsRow
          icon={CircleUser}
          label="表示名"
          description="アプリ内で表示されるあなたの名前"
          isLast={true}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AnimatePresence>
              {isSaved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ color: '#30D158' }} // sys-color-success
                >
                  <Check size={16} />
                </motion.div>
              )}
            </AnimatePresence>
            <input
              type="text"
              className="settings-input"
              style={{ width: '200px', textAlign: 'right' }}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={handleBlur}
              placeholder="User Name"
            />
          </div>
        </MacSettingsRow>
      </MacSettingsSection>

      {/* 読み取り専用セクション */}
      <MacSettingsSection title="Account Details">
        <MacSettingsRow
          icon={AtSign}
          label="User ID"
          description="システム識別用の固有ID"
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

      {/* 危険な操作セクション */}
      {onLogout && (
        <MacSettingsSection title="Danger Zone">
          <MacSettingsRow
            icon={LogOut}
            label="ログアウト"
            description="現在のアカウントから安全にログアウトします"
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

    </div>
  );
};

export default ProfileSettings;