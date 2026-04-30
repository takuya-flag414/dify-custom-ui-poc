/**
 * Environment Configuration
 * 環境変数に関連する設定を管理します。
 */

// モックモードの型定義（MockModeSelect.tsxと一致させる）
export type MockMode = 'OFF' | 'FE' | 'BE';

const VALID_MOCK_MODES: MockMode[] = ['OFF', 'FE', 'BE'];

/**
 * 環境変数からデフォルトのモックモードを取得します。
 * VITE_DEFAULT_MOCK_MODE が設定されていない、または無効な値の場合は 'OFF' を返します。
 */
const getDefaultMockMode = (): MockMode => {
    const envValue = import.meta.env.VITE_DEFAULT_MOCK_MODE as string | undefined;

    if (!envValue) {
        return 'OFF';
    }

    // 型ガード: 有効な値かどうかチェック
    if (VALID_MOCK_MODES.includes(envValue as MockMode)) {
        return envValue as MockMode;
    }

    console.warn(`[Config] Invalid VITE_DEFAULT_MOCK_MODE: ${envValue}. Falling back to 'OFF'.`);
    return 'OFF';
};

export const DEFAULT_MOCK_MODE = getDefaultMockMode();

// Strict FE Mode の判定フラグ
// これが true の場合、外部通信を一切行わない
export const isStrictFEMode = DEFAULT_MOCK_MODE === 'FE';

/**
 * API Configuration via Environment Variables
 * 環境変数によるAPI設定の制御
 */

// 環境変数設定を優先するかどうかのフラグ
export const USE_ENV_API_CONFIG = import.meta.env.VITE_USE_ENV_API_CONFIG === 'true';

// Backend A (Chat) 設定
export const ENV_API_KEY_A = (import.meta.env.VITE_API_KEY_A as string) || '';
export const ENV_API_URL_A = (import.meta.env.VITE_API_URL_A as string) || 'https://api.dify.ai/v1';

// Backend B (Store Management) 設定
export const ENV_API_KEY_B = (import.meta.env.VITE_API_KEY_B as string) || '';
export const ENV_API_URL_B = (import.meta.env.VITE_API_URL_B as string) || 'https://api.dify.ai/v1';

/**
 * UI Configuration
 * UIの表示制御に関する設定
 */
// ヘッダーを表示するかどうかのフラグ（デフォルトは false: 非表示）
export const SHOW_HEADER = import.meta.env.VITE_SHOW_HEADER === 'true';

// トークン使用量を表示するかどうかのフラグ（デフォルトは false: 非表示）
export const SHOW_TOKEN_USAGE = import.meta.env.VITE_SHOW_TOKEN_USAGE === 'true';

// Web検索（Deep）モードを表示するかどうか（デフォルトは true: 表示）
export const ENABLE_WEB_SEARCH = import.meta.env.VITE_ENABLE_WEB_SEARCH !== 'false';

// 社内データ（Enterprise/Hybrid）モードを表示するかどうか（デフォルトは true: 表示）
export const ENABLE_INTERNAL_DATA = import.meta.env.VITE_ENABLE_INTERNAL_DATA !== 'false';

// 「Webサイトを指定」を表示するかどうか（デフォルトは true: 表示）
export const ENABLE_SPECIFY_WEBSITE = import.meta.env.VITE_ENABLE_SPECIFY_WEBSITE !== 'false';

// 「Artifact を作成」を表示するかどうか（デフォルトは true: 表示）
export const ENABLE_CREATE_ARTIFACT = import.meta.env.VITE_ENABLE_CREATE_ARTIFACT !== 'false';

// メッセージ編集機能を有効にするかどうか（デフォルトは true: 表示）
export const ENABLE_MESSAGE_EDIT = import.meta.env.VITE_ENABLE_MESSAGE_EDIT !== 'false';

// 回答の再生成機能を有効にするかどうか（デフォルトは true: 表示）
export const ENABLE_MESSAGE_REGENERATE = import.meta.env.VITE_ENABLE_MESSAGE_REGENERATE !== 'false';
