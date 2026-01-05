// src/components/Settings/sections/ProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import { Save, Check, User, AtSign, CircleUser } from 'lucide-react';
import { MacSettingsSection, MacSettingsRow } from './MacSettingsComponents';
import './SettingsCommon.css';
import './ProfileSettings.css';

const ProfileSettings = ({ settings, onUpdateSettings, currentUser }) => {
  const [displayName, setDisplayName] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // settingsから初期値をロード
  useEffect(() => {
    if (settings?.profile) {
      setDisplayName(settings.profile.displayName || 'User');
    }
  }, [settings]);

  const handleSave = () => {
    onUpdateSettings('profile', 'displayName', displayName);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
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
          isLast={false}
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
          isLast={true}
        >
          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-sub)' }}>
            {localStorage.getItem('app_user_id') || 'N/A'}
          </span>
        </MacSettingsRow>
      </MacSettingsSection>

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