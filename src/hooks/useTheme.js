// src/hooks/useTheme.js
import { useEffect } from 'react';

/**
 * テーマ設定に基づいてDOMにdata-theme属性を適用するカスタムフック
 * @param {string} themeSetting - 'light' | 'dark' | 'system'
 */
export const useTheme = (themeSetting) => {
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (isDark) => {
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    };

    // 'system' の場合: OSのテーマ設定に追従
    if (themeSetting === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      // OSのテーマ変更を監視
      const handler = (e) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);

      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // 'light' / 'dark' の場合: 強制適用
      applyTheme(themeSetting === 'dark');
    }
  }, [themeSetting]);
};
