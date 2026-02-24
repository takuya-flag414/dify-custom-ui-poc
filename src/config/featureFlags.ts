// src/config/featureFlags.ts

/**
 * フィーチャーフラグの型定義
 */
export interface FeatureFlags {
    /** true: 設定画面をモーダル表示, false: 設定画面を全画面表示（従来） */
    USE_SETTINGS_MODAL: boolean;
    /** true: サイドバーにStudiosボタンを表示, false: 非表示 */
    SHOW_SIDEBAR_STUDIOS: boolean;
    /** true: サイドバーにIntelligenceボタンを表示, false: 非表示 */
    SHOW_SIDEBAR_INTELLIGENCE: boolean;
    /**
     * true:  SmartActions（AIからの提案）を表示し、「関連する質問」を非表示
     * false: SmartActionsを非表示にし、「関連する質問」を表示
     */
    ENABLE_SMART_ACTIONS: boolean;
}

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
    const value = import.meta.env[key];
    if (value === undefined) {
        return defaultValue;
    }
    return value === 'true';
};

export const FEATURE_FLAGS: FeatureFlags = {
    // true: 設定画面をモーダル表示
    // false: 設定画面を全画面表示（従来）
    USE_SETTINGS_MODAL: getEnvBoolean('VITE_FEATURE_USE_SETTINGS_MODAL', true),
    // サイドバー項目の表示制御
    SHOW_SIDEBAR_STUDIOS: getEnvBoolean('VITE_FEATURE_SHOW_SIDEBAR_STUDIOS', false),
    SHOW_SIDEBAR_INTELLIGENCE: getEnvBoolean('VITE_FEATURE_SHOW_SIDEBAR_INTELLIGENCE', false),
    // SmartActions と「関連する質問」の排他制御
    // true  → SmartActions表示 / 「関連する質問」非表示
    // false → SmartActions非表示 / 「関連する質問」表示
    ENABLE_SMART_ACTIONS: getEnvBoolean('VITE_FEATURE_ENABLE_SMART_ACTIONS', true),
};
