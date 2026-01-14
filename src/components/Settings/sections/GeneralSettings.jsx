// src/components/Settings/sections/GeneralSettings.jsx
import React, { useState } from 'react';
import {
  Moon, Sun, Monitor,
  RotateCcw, Type, Keyboard,
  MousePointer2, Laptop
}
  from 'lucide-react';
import { MacSettingsSection, MacSettingsRow, MacSelect } from './MacSettingsComponents';
import './SettingsCommon.css';
import './GeneralSettings.css';

const GeneralSettings = ({ settings, onUpdateSettings, onResetOnboarding }) => {
  const currentTheme = settings?.general?.theme || 'system';
  const currentFontSize = settings?.general?.fontSize || 'medium';
  const sendKey = settings?.general?.sendKey || 'enter';
  const reduceMotion = settings?.general?.reduceMotion || false;

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

      {/* === Section: Appearance === */}
      <MacSettingsSection title="Appearance">
        {/* Theme Selector */}
        <MacSettingsRow
          icon={Laptop}
          label="外観モード"
        >
          <div className="mac-segmented">
            <button
              className={`mac-segmented-item ${currentTheme === 'light' ? 'active' : ''}`}
              onClick={() => onUpdateSettings('general', 'theme', 'light')}
            >
              <Sun size={12} /> Light
            </button>
            <button
              className={`mac-segmented-item ${currentTheme === 'dark' ? 'active' : ''}`}
              onClick={() => onUpdateSettings('general', 'theme', 'dark')}
            >
              <Moon size={12} /> Dark
            </button>
            <button
              className={`mac-segmented-item ${currentTheme === 'system' ? 'active' : ''}`}
              onClick={() => onUpdateSettings('general', 'theme', 'system')}
            >
              <Monitor size={12} /> Auto
            </button>
          </div>
        </MacSettingsRow>

        {/* Font Size */}
        <MacSettingsRow
          icon={Type}
          label="文字サイズ"
        >
          <MacSelect
            value={currentFontSize}
            onChange={(e) => onUpdateSettings('general', 'fontSize', e.target.value)}
            options={[
              { value: 'small', label: '小 (15px)' },
              { value: 'medium', label: '標準 (17px)' },
              { value: 'large', label: '大 (19px)' }
            ]}
          />
        </MacSettingsRow>

        {/* Reduce Motion - Last Item */}
        <MacSettingsRow
          icon={MousePointer2}
          label="視差効果を減らす"
          description="アニメーションを抑制し、パフォーマンスを優先します"
          isLast
        >
          <input
            type="checkbox"
            className="mac-toggle"
            checked={reduceMotion}
            onChange={() => onUpdateSettings('general', 'reduceMotion', !reduceMotion)}
          />
        </MacSettingsRow>
      </MacSettingsSection>



      {/* === Section: Input === */}
      <MacSettingsSection title="Input">
        <MacSettingsRow
          icon={Keyboard}
          label="メッセージ送信キー"
          isLast
        >
          <MacSelect
            value={sendKey}
            onChange={(e) => onUpdateSettings('general', 'sendKey', e.target.value)}
            options={[
              { value: 'enter', label: 'Enter' },
              { value: 'ctrl_enter', label: 'Ctrl + Enter' }
            ]}
            style={{ minWidth: '120px' }}
          />
        </MacSettingsRow>
      </MacSettingsSection>

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

export default GeneralSettings;