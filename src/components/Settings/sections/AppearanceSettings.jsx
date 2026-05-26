// src/components/Settings/sections/AppearanceSettings.jsx
import React from 'react';
import { Moon, Sun, Monitor, Keyboard, Laptop } from 'lucide-react';
import { MacSettingsSection, MacSettingsRow, MacSelect } from './MacSettingsComponents';
import './SettingsCommon.css';
import './GeneralSettings.css';

const AppearanceSettings = ({ settings, onUpdateSettings }) => {
  const currentTheme = settings?.general?.theme || 'system';
  const sendKey = settings?.general?.sendKey || 'enter';

  return (
    <div className="settings-container">
      {/* === Section: Appearance === */}
      <MacSettingsSection title="Appearance">
        {/* Theme Selector */}
        <MacSettingsRow
          icon={Laptop}
          label="外観モード"
          isLast
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
    </div>
  );
};

export default AppearanceSettings;
