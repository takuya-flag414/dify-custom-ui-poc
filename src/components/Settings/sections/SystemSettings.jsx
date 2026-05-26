// src/components/Settings/sections/SystemSettings.jsx
import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { MacSettingsSection, MacSettingsRow } from './MacSettingsComponents';
import './SettingsCommon.css';
import './GeneralSettings.css';

const SystemSettings = ({ onResetOnboarding }) => {
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleResetOnboarding = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
      return;
    }
    if (onResetOnboarding) {
      onResetOnboarding();
      setResetConfirm(false);
    }
  };

  return (
    <div className="settings-container">
      {/* === Section: Reset (Danger) === */}
      {onResetOnboarding && (
        <MacSettingsSection title="Advanced">
          <MacSettingsRow
            icon={RotateCcw}
            label="設定の初期化"
            description="オンボーディング（初回ガイド）を再度表示します"
            isLast
            danger
          >
            <button
              onClick={handleResetOnboarding}
              className="btn-danger-ghost"
            >
              {resetConfirm ? '本当に実行しますか？' : 'リセット'}
            </button>
          </MacSettingsRow>
        </MacSettingsSection>
      )}
    </div>
  );
};

export default SystemSettings;
