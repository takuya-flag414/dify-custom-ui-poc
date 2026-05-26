// src/components/Settings/sections/PromptSettings.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, User, Briefcase, Building2 } from 'lucide-react';
import { MacSettingsSection, MacSettingsRow } from './MacSettingsComponents';
import './SettingsCommon.css';
import './PromptSettings.css';

const PromptSettings = ({ settings, onUpdateSettings }) => {
  const [userProfile, setUserProfile] = useState({ role: '', department: '' });
  const [customInstructions, setCustomInstructions] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (settings?.prompt) {
      setUserProfile(settings.prompt.userProfile || { role: '', department: '' });
      setCustomInstructions(settings.prompt.customInstructions || '');
    }
  }, [settings]);

  const handleProfileChange = (field, value) => {
    const newProfile = { ...userProfile, [field]: value };
    setUserProfile(newProfile);
  };

  // プロフィールの自動保存 (onBlur)
  const handleBlurProfile = () => {
    const saved = settings?.prompt?.userProfile || { role: '', department: '' };
    if (JSON.stringify(userProfile) !== JSON.stringify(saved)) {
      onUpdateSettings('prompt', 'userProfile', userProfile);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 1500);
    }
  };

  // カスタム指示の自動保存 (onBlur)
  const handleBlurInstructions = () => {
    const saved = settings?.prompt?.customInstructions || '';
    if (customInstructions !== saved) {
      onUpdateSettings('prompt', 'customInstructions', customInstructions);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 1500);
    }
  };

  return (
    <div className="settings-container">
      {/* === Section: Intelligence Profile === */}
      <MacSettingsSection title="AI Context & Knowledge">
        {/* User Identity Form */}
        <MacSettingsRow
          icon={User}
          label="AIに教える前提知識"
          description="あなたの役職や背景を理解させ、回答の専門性やトーンを最適化させます"
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
                onBlur={handleBlurProfile}
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
                onBlur={handleBlurProfile}
              />
            </div>
          </div>

          {/* Custom Instructions Editor */}
          <div className="custom-instructions-wrapper">
            <label className="custom-instructions-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>カスタム指示</span>
              <AnimatePresence>
                {isSaved && (
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ color: '#30D158', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                  >
                    <Check size={12} /> 保存済み
                  </motion.span>
                )}
              </AnimatePresence>
            </label>
            <textarea
              className="custom-instructions-editor"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              onBlur={handleBlurInstructions}
              placeholder={`AIへの追加指示を自由に記述できます。

例:
・結論から述べてください
・専門用語は噛み砕いて説明してください
・回答は箇条書きでお願いします`}
            />
          </div>
        </div>
      </MacSettingsSection>
    </div>
  );
};

export default PromptSettings;