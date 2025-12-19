// src/components/Settings/sections/GeneralSettings.jsx
import React, { useEffect, useState } from 'react';
import { Moon, Sun, Monitor, RefreshCw } from 'lucide-react';
import './SettingsComponents.css';

const GeneralSettings = ({ settings, onUpdateSettings, onResetOnboarding }) => {
  const currentTheme = settings?.general?.theme || 'system';
  const currentFontSize = settings?.general?.fontSize || 'medium';
  const [resetConfirm, setResetConfirm] = useState(false);

  // テーマ変更時の副作用 (実際にDOMクラスを切り替える)
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      currentTheme === 'dark' ||
      (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [currentTheme]);

  // フォントサイズ変更時の副作用 (CSS変数を書き換え)
  useEffect(() => {
    const root = window.document.documentElement;
    let baseSize = '16px'; // medium
    if (currentFontSize === 'small') baseSize = '14px';
    if (currentFontSize === 'large') baseSize = '18px';

    // index.css等で rem の基準となっている場合に有効
    // 今回は簡易的にHTMLのfont-sizeを変えるか、専用変数を定義するか
    // Phase 1ではまだ実装されていないため、コンソールログのみ
    // console.log(`[Theme] Font size changed to ${baseSize}`);
  }, [currentFontSize]);

  // オンボーディングリセットのハンドラー
  const handleResetOnboarding = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      // 3秒後に確認状態をリセット
      setTimeout(() => setResetConfirm(false), 3000);
      return;
    }

    if (onResetOnboarding) {
      onResetOnboarding();
      setResetConfirm(false);
    }
  };

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <h3 className="settings-card-title">表示設定</h3>
        <p className="settings-card-description">
          アプリケーションの見た目をカスタマイズします。
        </p>
      </div>

      <div className="settings-row">
        <label className="settings-label">テーマ</label>
        <div className="grid grid-cols-3 gap-3">
          {['light', 'dark', 'system'].map((mode) => (
            <button
              key={mode}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${currentTheme === mode
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)] text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] hover:bg-[var(--color-bg-body)] text-[var(--color-text-sub)]'
                }`}
              onClick={() => onUpdateSettings('general', 'theme', mode)}
            >
              {mode === 'light' && <Sun size={20} className="mb-2" />}
              {mode === 'dark' && <Moon size={20} className="mb-2" />}
              {mode === 'system' && <Monitor size={20} className="mb-2" />}
              <span className="text-xs font-medium capitalize">{mode}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-row mt-4">
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

      {/* オンボーディングリセット */}
      {onResetOnboarding && (
        <div className="settings-row mt-6" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <div style={{ flex: 1 }}>
            <label className="settings-label">初回セットアップ</label>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              オンボーディングウィザードを再度表示します。
            </p>
          </div>
          <button
            onClick={handleResetOnboarding}
            className="settings-reset-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '500',
              color: resetConfirm ? 'var(--color-error)' : 'var(--color-text-sub)',
              background: resetConfirm ? 'rgba(220, 38, 38, 0.1)' : 'var(--color-bg-sidebar)',
              border: `1px solid ${resetConfirm ? 'var(--color-error)' : 'var(--color-border-strong)'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={14} />
            {resetConfirm ? 'もう一度クリックで実行' : 'リセット'}
          </button>
        </div>
      )}
    </div>
  );
};

export default GeneralSettings;