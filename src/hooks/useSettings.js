// src/hooks/useSettings.js
import { useState, useEffect, useCallback } from 'react';

// デフォルト設定値
const DEFAULT_SETTINGS = {
  profile: {
    displayName: 'User',
    avatar: '',
  },
  general: {
    theme: 'system', // 'light', 'dark', 'system'
    fontSize: 'medium', // 'small', 'medium', 'large'
  },
  // 今後 prompt, rag, debug 等のカテゴリが増えます
};

export const useSettings = (userId) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings when userId changes
  useEffect(() => {
    if (!userId) return;

    const key = `app_preferences_${userId}`;
    const stored = localStorage.getItem(key);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // 新しい設定項目が増えた場合に備え、デフォルト値とマージする
        setSettings((prev) => ({
          ...DEFAULT_SETTINGS,
          ...parsed,
          // 深い階層のマージ（簡易版: カテゴリ単位）
          profile: { ...DEFAULT_SETTINGS.profile, ...(parsed.profile || {}) },
          general: { ...DEFAULT_SETTINGS.general, ...(parsed.general || {}) },
        }));
      } catch (e) {
        console.error('[useSettings] Failed to parse settings:', e);
      }
    } else {
      // 新規ユーザーの場合はデフォルト値を保存しておく（オプション）
      // localStorage.setItem(key, JSON.stringify(DEFAULT_SETTINGS));
    }
    setIsLoaded(true);
  }, [userId]);

  // Save settings helper: カテゴリとキーを指定して更新
  const updateSettings = useCallback((category, key, value) => {
    if (!userId) return;

    setSettings((prev) => {
      const newCategoryState = { ...prev[category], [key]: value };
      const newSettings = { ...prev, [category]: newCategoryState };
      
      // Persist to LocalStorage
      localStorage.setItem(`app_preferences_${userId}`, JSON.stringify(newSettings));
      
      return newSettings;
    });
  }, [userId]);

  // 一括更新（インポート機能などで使用予定）
  const setAllSettings = useCallback((newSettings) => {
      if (!userId) return;
      setSettings(newSettings);
      localStorage.setItem(`app_preferences_${userId}`, JSON.stringify(newSettings));
  }, [userId]);

  return { settings, updateSettings, isLoaded, setAllSettings };
};