// src/components/Settings/sections/PromptSettings.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Check, User, Briefcase, Building2 } from 'lucide-react';
import { MacSettingsSection, MacSettingsRow } from './MacSettingsComponents';
import './SettingsCommon.css';
import './PromptSettings.css';

const PromptSettings = ({ settings, onUpdateSettings }) => {
  // ★ v3.0: Intelligence Profile
  const [userProfile, setUserProfile] = useState({ role: '', department: '' });
  const [customInstructions, setCustomInstructions] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (settings?.prompt) {
      // ★ v3.0: 新しいステート構造に対応
      setUserProfile(settings.prompt.userProfile || { role: '', department: '' });
      setCustomInstructions(settings.prompt.customInstructions || '');
    }
  }, [settings]);

  // ★ v3.0: User Profile の更新
  const handleProfileChange = (field, value) => {
    const newProfile = { ...userProfile, [field]: value };
    setUserProfile(newProfile);
  };

  // ★ v3.0: Intelligence Profile 全体を保存
  const handleSaveProfile = () => {
    onUpdateSettings('prompt', 'userProfile', userProfile);
    onUpdateSettings('prompt', 'customInstructions', customInstructions);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  // 変更検知
  const hasProfileChanges =
    JSON.stringify(userProfile) !== JSON.stringify(settings?.prompt?.userProfile || { role: '', department: '' }) ||
    customInstructions !== (settings?.prompt?.customInstructions || '');

  return (
    <div className="settings-container">
      {/* === Section: Intelligence Profile === */}
      <MacSettingsSection title="Intelligence Profile">
        {/* User Identity Form */}
        <MacSettingsRow
          icon={User}
          label="あなたの情報"
          description="AIがあなたの背景を理解し、より適切な回答を提供できます"
        />

        <div className="intelligence-profile-form">
          <div className="ghost-input-group">
            <div className="ghost-input-row">
              <Briefcase size={14} className="ghost-input-icon" />
              <input
                type="text"
                className="ghost-input"
                placeholder="役職（例: 営業マネージャー）"
                value={userProfile.role}
                onChange={(e) => handleProfileChange('role', e.target.value)}
              />
            </div>
            <div className="ghost-input-row">
              <Building2 size={14} className="ghost-input-icon" />
              <input
                type="text"
                className="ghost-input"
                placeholder="部署 - 任意（例: 営業部）"
                value={userProfile.department}
                onChange={(e) => handleProfileChange('department', e.target.value)}
              />
            </div>
          </div>

          {/* Custom Instructions Editor */}
          <div className="custom-instructions-wrapper">
            <label className="custom-instructions-label">
              カスタム指示
            </label>
            <textarea
              className="custom-instructions-editor"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder={`AIへの追加指示を自由に記述できます。

例:
・結論から述べてください
・専門用語は噛み砕いて説明してください
・回答は箇条書きでお願いします`}
            />
          </div>

          <div className="intelligence-profile-actions">
            <AnimatePresence>
              {isSaved && (
                <motion.span
                  className="save-indicator"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Check size={12} /> 保存しました
                </motion.span>
              )}
            </AnimatePresence>
            <button
              className="settings-btn primary"
              onClick={handleSaveProfile}
              disabled={!hasProfileChanges}
              style={!hasProfileChanges ? { opacity: 0.5 } : {}}
            >
              <Save size={14} /> 保存
            </button>
          </div>
        </div>
      </MacSettingsSection>
    </div>
  );
};

export default PromptSettings;