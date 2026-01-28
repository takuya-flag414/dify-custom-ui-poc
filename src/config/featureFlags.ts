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
}

export const FEATURE_FLAGS: FeatureFlags = {
    // true: 設定画面をモーダル表示
    // false: 設定画面を全画面表示（従来）
    USE_SETTINGS_MODAL: true,
    // サイドバー項目の表示制御
    SHOW_SIDEBAR_STUDIOS: false,
    SHOW_SIDEBAR_INTELLIGENCE: false,
};
