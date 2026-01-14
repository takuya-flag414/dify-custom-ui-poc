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
  prompt: {
    aiStyle: 'partner', // 'efficient' | 'partner' - オンボーディング/プロンプト設定で変更
    // ★ Intelligence Profile (v3.0)
    userProfile: {
      role: '',       // 役職・職種
      department: '', // 所属部署 (Optional)
    },
    customInstructions: '', // AIへのカスタム指示（自由記述）
  },
  // 今後 rag, debug 等のカテゴリが増えます
};

/**
 * authUser.preferences から useSettings 形式に変換するヘルパー
 * @param {object} authPrefs - authUser.preferences
 * @returns {object} DEFAULT_SETTINGS 形式にマッピングされた設定
 */
const mapAuthPreferencesToSettings = (authPrefs) => {
  if (!authPrefs) return null;

  return {
    profile: {
      ...DEFAULT_SETTINGS.profile,
      // displayNameはauthUser本体から取得するため、ここでは設定しない
    },
    general: {
      ...DEFAULT_SETTINGS.general,
      theme: authPrefs.theme || DEFAULT_SETTINGS.general.theme,
    },
    prompt: {
      ...DEFAULT_SETTINGS.prompt,
      aiStyle: authPrefs.aiStyle || DEFAULT_SETTINGS.prompt.aiStyle,
      userProfile: {
        ...DEFAULT_SETTINGS.prompt.userProfile,
        role: authPrefs.userProfile?.role || '',
        department: authPrefs.userProfile?.department || '',
      },
      customInstructions: authPrefs.customInstructions || '',
    },
  };
};

/**
 * ユーザー設定管理Hook
 * 
 * ★ Phase A 認証対応:
 * - authPreferences: authUser.preferences（アカウントのデフォルト設定）
 * - LocalStorageの設定が存在しない場合、authPreferencesを初期値として使用
 * - LocalStorageの設定が存在する場合は、ユーザーのカスタマイズを尊重
 * 
 * @param {string} userId - ユーザーID
 * @param {object} authPreferences - authUser.preferences（アカウントのデフォルト設定）
 */
export const useSettings = (userId, authPreferences = null) => {
  // 【修正】初期化関数内で同期的にLocalStorageを読み込む
  const [settings, setSettings] = useState(() => {
    // userIdがまだ無い場合（App側で生成中の場合など）はデフォルトを返す
    if (!userId) return DEFAULT_SETTINGS;

    const key = `app_preferences_${userId}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 後方互換: profile.aiStyle があれば prompt.aiStyle にマイグレーション
        const migratedAiStyle = parsed.profile?.aiStyle || parsed.prompt?.aiStyle || DEFAULT_SETTINGS.prompt.aiStyle;

        // ★ v3.0 マイグレーション: systemPrompt → customInstructions
        const migratedCustomInstructions = parsed.prompt?.customInstructions || parsed.prompt?.systemPrompt || '';

        // デフォルト値とマージして返す（構造変更への対応）
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          profile: {
            ...DEFAULT_SETTINGS.profile,
            ...(parsed.profile || {}),
            // 古い aiStyle は削除（prompt側で管理）
          },
          general: { ...DEFAULT_SETTINGS.general, ...(parsed.general || {}) },
          prompt: {
            ...DEFAULT_SETTINGS.prompt,
            ...(parsed.prompt || {}),
            aiStyle: migratedAiStyle, // マイグレーション結果を反映
            userProfile: {
              ...DEFAULT_SETTINGS.prompt.userProfile,
              ...(parsed.prompt?.userProfile || {}),
            },
            customInstructions: migratedCustomInstructions, // 旧 systemPrompt からマイグレーション
          },
        };
      } else if (authPreferences) {
        // ★ Phase A: LocalStorageにデータがない場合、authPreferencesを初期値として使用
        console.log('[useSettings] Using authPreferences as initial settings');
        const mappedSettings = mapAuthPreferencesToSettings(authPreferences);
        // 初回なのでLocalStorageにも保存
        localStorage.setItem(key, JSON.stringify(mappedSettings));
        return mappedSettings;
      }
    } catch (e) {
      console.error('[useSettings] Failed to parse settings during init:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings when userId changes (初期ロード後の変更検知用)
  useEffect(() => {
    if (!userId) return;

    const key = `app_preferences_${userId}`;
    const stored = localStorage.getItem(key);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // 後方互換: profile.aiStyle があれば prompt.aiStyle にマイグレーション
        const migratedAiStyle = parsed.profile?.aiStyle || parsed.prompt?.aiStyle || DEFAULT_SETTINGS.prompt.aiStyle;

        // ★ v3.0 マイグレーション: systemPrompt → customInstructions
        const migratedCustomInstructions = parsed.prompt?.customInstructions || parsed.prompt?.systemPrompt || '';

        setSettings((prev) => ({
          ...DEFAULT_SETTINGS,
          ...parsed,
          profile: { ...DEFAULT_SETTINGS.profile, ...(parsed.profile || {}) },
          general: { ...DEFAULT_SETTINGS.general, ...(parsed.general || {}) },
          prompt: {
            ...DEFAULT_SETTINGS.prompt,
            ...(parsed.prompt || {}),
            aiStyle: migratedAiStyle,
            userProfile: {
              ...DEFAULT_SETTINGS.prompt.userProfile,
              ...(parsed.prompt?.userProfile || {}),
            },
            customInstructions: migratedCustomInstructions,
          },
        }));
      } catch (e) {
        console.error('[useSettings] Failed to parse settings:', e);
      }
    } else if (authPreferences) {
      // ★ Phase A: LocalStorageにデータがない場合、authPreferencesを使用
      console.log('[useSettings] Applying authPreferences on userId change');
      const mappedSettings = mapAuthPreferencesToSettings(authPreferences);
      setSettings(mappedSettings);
      localStorage.setItem(key, JSON.stringify(mappedSettings));
    }

    setIsLoaded(true);
  }, [userId, authPreferences]);

  // Save settings helper: カテゴリとキーを指定して更新
  const updateSettings = useCallback((category, key, value) => {
    if (!userId) return;

    setSettings((prev) => {
      const newCategoryState = { ...prev[category], [key]: value };
      const newSettings = { ...prev, [category]: newCategoryState };

      // Persist to LocalStorage
      localStorage.setItem(`app_preferences_${userId}`, JSON.stringify(newSettings));

      // Global Theme Persistence (for loading screen)
      if (category === 'general' && key === 'theme') {
        localStorage.setItem('app_last_theme', value);
      }

      return newSettings;
    });
  }, [userId]);

  // 一括更新（インポート機能などで使用予定）
  const setAllSettings = useCallback((newSettings) => {
    if (!userId) return;
    setSettings(newSettings);
    setSettings(newSettings);
    localStorage.setItem(`app_preferences_${userId}`, JSON.stringify(newSettings));
    
    // Global Theme Persistence
    if (newSettings.general?.theme) {
      localStorage.setItem('app_last_theme', newSettings.general.theme);
    }
  }, [userId]);

  return { settings, updateSettings, isLoaded, setAllSettings };
};