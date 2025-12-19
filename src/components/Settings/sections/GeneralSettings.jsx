// src/components/Settings/sections/GeneralSettings.jsx
import React, { useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import './SettingsComponents.css';

const GeneralSettings = ({ settings, onUpdateSettings }) => {
  const currentTheme = settings?.general?.theme || 'system';
  const currentFontSize = settings?.general?.fontSize || 'medium';

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
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                currentTheme === mode 
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
    </div>
  );
};

export default GeneralSettings;