// src/hooks/useSettings.ts
import { useState, useEffect, useCallback } from 'react';

/**
 * プロファイル設定の型
 */
export interface ProfileSettings {
    displayName: string;
    avatar: string;
}

/**
 * 一般設定の型
 */
export interface GeneralSettings {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
}

/**
 * ユーザープロファイル（Intelligence Profile）
 */
export interface UserProfile {
    role: string;
    department: string;
}

/**
 * プロンプト設定の型
 */
export interface PromptSettings {
    aiStyle: 'efficient' | 'partner';
    userProfile: UserProfile;
    customInstructions: string;
}

/**
 * 全設定の型
 */
export interface Settings {
    profile: ProfileSettings;
    general: GeneralSettings;
    prompt: PromptSettings;
}

/**
 * 認証ユーザーの設定（AuthService から取得）
 */
export interface AuthPreferences {
    theme?: string;
    aiStyle?: string;
    userProfile?: Partial<UserProfile>;
    customInstructions?: string;
}

/**
 * useSettings の戻り値の型
 */
export interface UseSettingsReturn {
    settings: Settings;
    updateSettings: (category: keyof Settings, key: string, value: unknown) => void;
    isLoaded: boolean;
    setAllSettings: (newSettings: Settings) => void;
}

// デフォルト設定値
const DEFAULT_SETTINGS: Settings = {
    profile: {
        displayName: 'User',
        avatar: '',
    },
    general: {
        theme: 'system',
        fontSize: 'medium',
    },
    prompt: {
        aiStyle: 'partner',
        userProfile: {
            role: '',
            department: '',
        },
        customInstructions: '',
    },
};

/**
 * authUser.preferences から useSettings 形式に変換するヘルパー
 */
const mapAuthPreferencesToSettings = (authPrefs: AuthPreferences | null): Settings | null => {
    if (!authPrefs) return null;

    return {
        profile: {
            ...DEFAULT_SETTINGS.profile,
        },
        general: {
            ...DEFAULT_SETTINGS.general,
            theme: (authPrefs.theme as Settings['general']['theme']) || DEFAULT_SETTINGS.general.theme,
        },
        prompt: {
            ...DEFAULT_SETTINGS.prompt,
            aiStyle: (authPrefs.aiStyle as Settings['prompt']['aiStyle']) || DEFAULT_SETTINGS.prompt.aiStyle,
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
 */
export const useSettings = (
    userId: string | null,
    authPreferences: AuthPreferences | null = null
): UseSettingsReturn => {
    const [settings, setSettings] = useState<Settings>(() => {
        if (!userId) return DEFAULT_SETTINGS;

        const key = `app_preferences_${userId}`;
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                const parsed = JSON.parse(stored);
                const migratedAiStyle = parsed.profile?.aiStyle || parsed.prompt?.aiStyle || DEFAULT_SETTINGS.prompt.aiStyle;
                const migratedCustomInstructions = parsed.prompt?.customInstructions || parsed.prompt?.systemPrompt || '';

                return {
                    ...DEFAULT_SETTINGS,
                    ...parsed,
                    profile: {
                        ...DEFAULT_SETTINGS.profile,
                        ...(parsed.profile || {}),
                    },
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
                };
            } else if (authPreferences) {
                console.log('[useSettings] Using authPreferences as initial settings');
                const mappedSettings = mapAuthPreferencesToSettings(authPreferences);
                if (mappedSettings) {
                    localStorage.setItem(key, JSON.stringify(mappedSettings));
                    return mappedSettings;
                }
            }
        } catch (e) {
            console.error('[useSettings] Failed to parse settings during init:', e);
        }
        return DEFAULT_SETTINGS;
    });

    const [isLoaded, setIsLoaded] = useState<boolean>(false);

    useEffect(() => {
        if (!userId) return;

        const key = `app_preferences_${userId}`;
        const stored = localStorage.getItem(key);

        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const migratedAiStyle = parsed.profile?.aiStyle || parsed.prompt?.aiStyle || DEFAULT_SETTINGS.prompt.aiStyle;
                const migratedCustomInstructions = parsed.prompt?.customInstructions || parsed.prompt?.systemPrompt || '';

                setSettings(() => ({
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
            console.log('[useSettings] Applying authPreferences on userId change');
            const mappedSettings = mapAuthPreferencesToSettings(authPreferences);
            if (mappedSettings) {
                setSettings(mappedSettings);
                localStorage.setItem(key, JSON.stringify(mappedSettings));
            }
        }

        setIsLoaded(true);
    }, [userId, authPreferences]);

    const updateSettings = useCallback((category: keyof Settings, key: string, value: unknown): void => {
        if (!userId) return;

        setSettings((prev) => {
            const newCategoryState = { ...prev[category], [key]: value };
            const newSettings = { ...prev, [category]: newCategoryState } as Settings;

            localStorage.setItem(`app_preferences_${userId}`, JSON.stringify(newSettings));

            if (category === 'general' && key === 'theme') {
                localStorage.setItem('app_last_theme', value as string);
            }

            return newSettings;
        });
    }, [userId]);

    const setAllSettings = useCallback((newSettings: Settings): void => {
        if (!userId) return;
        setSettings(newSettings);
        localStorage.setItem(`app_preferences_${userId}`, JSON.stringify(newSettings));

        if (newSettings.general?.theme) {
            localStorage.setItem('app_last_theme', newSettings.general.theme);
        }
    }, [userId]);

    return { settings, updateSettings, isLoaded, setAllSettings };
};
