// src/components/Settings/sections/ProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import { Save, Check, Sparkles, Zap } from 'lucide-react';
import './SettingsComponents.css';

const AI_STYLE_LABELS = {
  efficient: { label: '効率重視', icon: Zap, desc: '簡潔に結論から' },
  partner: { label: '思考パートナー', icon: Sparkles, desc: '丁寧に対話' }
};

const ProfileSettings = ({ settings, onUpdateSettings }) => {
  const [displayName, setDisplayName] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const aiStyle = settings?.profile?.aiStyle || 'partner';
  const StyleIcon = AI_STYLE_LABELS[aiStyle]?.icon || Sparkles;

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
    <>
      {/* Profile Hero Area */}
      <div className="profile-hero">
        <div className="profile-avatar-large">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{displayName}</h2>
          <p className="profile-style">
            <StyleIcon size={16} />
            <span>{AI_STYLE_LABELS[aiStyle]?.label || 'パートナー'}</span>
            <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>
              — {AI_STYLE_LABELS[aiStyle]?.desc}
            </span>
          </p>
          <p className="profile-user-id">
            ID: {localStorage.getItem('app_user_id') || 'N/A'}
          </p>
        </div>
      </div>

      {/* Settings Card */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h3 className="settings-card-title">プロフィール編集</h3>
          <p className="settings-card-description">
            アプリ内で表示されるあなたの情報を変更できます。
          </p>
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

        <div className="settings-actions">
          <button
            className="settings-btn primary"
            onClick={handleSave}
            disabled={!hasChanges}
            style={!hasChanges ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {isSaved ? (
              <>
                <Check size={16} />
                <span>保存しました</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>保存する</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default ProfileSettings;