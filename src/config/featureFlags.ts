// src/config/featureFlags.ts

/**
 * フィーチャーフラグの型定義
 */
export interface FeatureFlags {
    /** true: 設定画面をモーダル表示, false: 設定画面を全画面表示（従来） */
    USE_SETTINGS_MODAL: boolean;
}

export const FEATURE_FLAGS: FeatureFlags = {
    // true: 設定画面をモーダル表示
    // false: 設定画面を全画面表示（従来）
    USE_SETTINGS_MODAL: true,
};
