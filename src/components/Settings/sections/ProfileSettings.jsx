// src/components/Settings/sections/ProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import { User, Save } from 'lucide-react';
import './SettingsComponents.css';

const ProfileSettings = ({ settings, onUpdateSettings }) => {
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');

  // settingsから初期値をロード
  useEffect(() => {
    if (settings?.profile) {
      setDisplayName(settings.profile.displayName || 'User');
      setAvatar(settings.profile.avatar || '');
    }
  }, [settings]);

  const handleSave = () => {
    onUpdateSettings('profile', 'displayName', displayName);
    onUpdateSettings('profile', 'avatar', avatar);
    // 保存完了のフィードバックが必要ならここに実装（今回は簡易化）
  };

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <h3 className="settings-card-title">プロフィール情報</h3>
        <p className="settings-card-description">
          アプリ内で表示されるあなたの情報を設定します。
        </p>
      </div>

      <div className="avatar-preview-container">
        <div className="avatar-preview">
          {avatar ? (
             <img src={avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
             displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-text-main)]">
            {displayName}
          </p>
          <p className="text-xs text-[var(--color-text-sub)]">
            User ID: {localStorage.getItem('app_user_id') || 'N/A'}
          </p>
        </div>
      </div>

      <div className="settings-row">
        <label className="settings-label">表示名</label>
        <input 
          type="text" 
          className="settings-input" 
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="あなたの名前"
        />
      </div>

      <div className="settings-row">
        <label className="settings-label">アバター画像URL (任意)</label>
        <input 
          type="text" 
          className="settings-input"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="https://example.com/avatar.png" 
        />
        <p className="settings-sublabel">
          ※ Phase 1では外部URLのみサポートしています。
        </p>
      </div>

      <div className="settings-actions">
        <button className="settings-btn primary" onClick={handleSave}>
          <Save size={16} />
          <span>保存する</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;