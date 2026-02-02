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

/**
 * 思考プロセスをメッセージバブル内に統合して表示するかどうかを判定します。
 * VITE_MERGE_THINKING_PROCESS='true' の場合のみ true を返します。
 */
export const IS_THINKING_PROCESS_MERGED = import.meta.env.VITE_MERGE_THINKING_PROCESS === 'true';

export const DEFAULT_MOCK_MODE = getDefaultMockMode();
