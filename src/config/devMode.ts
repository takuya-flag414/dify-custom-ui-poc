/**
 * 開発者モード設定
 * src/config/devMode.ts
 * 
 * 環境変数 VITE_DEV_MODE=true で開発者向け機能を有効化
 * 本番ビルドでは開発者UIは非表示
 */

/// <reference types="vite/client" />

/**
 * 開発者モードが有効かどうか
 */
export const IS_DEV_MODE: boolean =
    typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_DEV_MODE === 'true';

/**
 * 開発者向け機能を表示すべきかどうかを判定
 */
export const shouldShowDevFeatures = (): boolean => {
    return IS_DEV_MODE;
};

/**
 * 開発ビルドかどうか（DEVモードとは別）
 */
export const IS_DEVELOPMENT: boolean =
    typeof import.meta !== 'undefined' &&
    import.meta.env?.DEV === true;

/**
 * 本番ビルドかどうか
 */
export const IS_PRODUCTION: boolean =
    typeof import.meta !== 'undefined' &&
    import.meta.env?.PROD === true;
