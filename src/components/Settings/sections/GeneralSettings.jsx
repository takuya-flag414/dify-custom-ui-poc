// src/components/Settings/sections/GeneralSettings.jsx
import React, { useEffect, useState } from 'react';
import { Moon, Sun, Monitor, RotateCcw } from 'lucide-react';
import './SettingsComponents.css';

const GeneralSettings = ({ settings, onUpdateSettings, onResetOnboarding }) => {
  const currentTheme = settings?.general?.theme || 'system';
  const currentFontSize = settings?.general?.fontSize || 'medium';
  const [resetConfirm, setResetConfirm] = useState(false);

  // テーマ変更は useTheme フック (App.jsx で呼び出し) で処理されるため、
  // ここでは設定更新のみを行う

  // フォントサイズ変更時の副作用
  useEffect(() => {
    // Phase 1ではまだ実装されていないため省略
  }, [currentFontSize]);

  // オンボーディングリセットのハンドラー
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

  const THEME_OPTIONS = [
    { id: 'light', label: 'ライト', icon: Sun },
    { id: 'dark', label: 'ダーク', icon: Moon },
    { id: 'system', label: '自動', icon: Monitor }
  ];

  return (
    <>
      {/* 表示設定カード */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h3 className="settings-card-title">表示設定</h3>
          <p className="settings-card-description">
            アプリケーションの見た目をカスタマイズします。
          </p>
        </div>

        <div className="settings-row">
          <label className="settings-label">テーマ</label>
          <div className="theme-card-grid">
            {THEME_OPTIONS.map((theme) => {
              const IconComponent = theme.icon;
              const isActive = currentTheme === theme.id;

              return (
                <button
                  key={theme.id}
                  className={`theme-card ${isActive ? 'active' : ''}`}
                  onClick={() => onUpdateSettings('general', 'theme', theme.id)}
                >
                  <IconComponent size={22} className="theme-card-icon" />
                  <span className="theme-card-label">{theme.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="settings-row">
          <label className="settings-label">フォントサイズ</label>
          <select
            className="settings-select"
            value={currentFontSize}
            onChange={(e) => onUpdateSettings('general', 'fontSize', e.target.value)}
          >
            <option value="small">小 (Small)</option>
            <option value="medium">中 (Medium)</option>
            <option value="large">大 (Large)</option>
          </select>
        </div>
      </div>

      {/* アプリ設定カード */}
      {onResetOnboarding && (
        <div className="settings-card">
          <div className="settings-card-header">
            <h3 className="settings-card-title">アプリ設定</h3>
            <p className="settings-card-description">
              アプリケーションの動作に関する設定です。
            </p>
          </div>

          <div className="settings-row" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <label className="settings-label">初回セットアップ</label>
              <p style={{ fontSize: '13px', color: 'var(--color-text-sub)', marginTop: '4px', lineHeight: 1.5 }}>
                オンボーディングウィザードを再度表示して、名前やAIスタイルを設定し直せます。
              </p>
            </div>
            <button
              onClick={handleResetOnboarding}
              className="settings-btn secondary"
              style={{
                color: resetConfirm ? 'var(--color-error)' : undefined,
                borderColor: resetConfirm ? 'var(--color-error)' : undefined,
                background: resetConfirm ? 'rgba(220, 38, 38, 0.05)' : undefined,
              }}
            >
              <RotateCcw size={16} />
              <span>{resetConfirm ? '確認: もう一度クリック' : 'リセット'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GeneralSettings;