// src/services/BackendBServiceAdapter.ts
// Backend B (Gemini File Search PoC / Workflow App) 呼び出しアダプター

import { MOCK_STORES } from '../mocks/storeData';

/**
 * Backend B 設定
 */
export interface BackendBConfig {
    apiKey: string;
    apiUrl: string;
    mockMode: 'FE' | 'BE' | 'OFF';
}

/**
 * Gemini File Search ストア情報
 */
export interface GeminiStore {
    id: string;           // fileSearchStores/xxx 形式
    display_name: string;
    description?: string;
    category?: string;
    create_time?: string;
}

/**
 * Backend B Workflow API レスポンス
 */
interface WorkflowRunResponse {
    workflow_run_id: string;
    task_id: string;
    data: {
        id: string;
        workflow_id: string;
        status: 'running' | 'succeeded' | 'failed' | 'stopped';
        outputs?: {
            result?: string;  // JSON文字列
        };
        error?: string;
        elapsed_time?: number;
        total_tokens?: number;
    };
}

/**
 * list_stores の出力形式
 * フォーマット: storeName, displayName, createdAt
 */
interface ListStoresOutput {
    stores?: Array<{
        // 新フォーマット (Backend B実際のレスポンス)
        storeName?: string;      // fileSearchStores/xxx
        displayName?: string;
        createdAt?: string;
        // 旧フォーマット (互換性のため)
        name?: string;
        createTime?: string;
        updateTime?: string;
    }>;
    total_count?: number;
    error?: string;
}

/**
 * Backend B サービスアダプター
 */
export const BackendBServiceAdapter = {
    /**
     * ストア一覧を取得
     * @param config Backend B設定
     * @returns ストア一覧
     */
    async listStores(config: BackendBConfig): Promise<GeminiStore[]> {
        // FEモードではモックデータを返す
        if (config.mockMode === 'FE') {
            console.log('[BackendBServiceAdapter] FE Mock mode - returning mock stores');
            return MOCK_STORES.map(store => ({
                id: store.id,
                display_name: store.display_name,
                description: store.description,
                category: store.category,
                create_time: store.create_time,
            }));
        }

        // APIキーチェック
        if (!config.apiKey?.trim()) {
            throw new Error('Backend BのAPIキーが設定されていません。設定画面で入力してください。');
        }

        console.log('[BackendBServiceAdapter] Calling Backend B list_stores API');

        try {
            const response = await fetch(`${config.apiUrl}/workflows/run`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: {
                        action: 'list_stores',
                        payload: '{}',
                    },
                    response_mode: 'blocking',
                    user: 'frontend-user',
                }),
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Backend Bの認証に失敗しました。APIキーを確認してください。');
                }
                throw new Error(`Backend B API エラー (${response.status})`);
            }

            const result: WorkflowRunResponse = await response.json();

            if (result.data.status === 'failed') {
                throw new Error(result.data.error || 'Backend Bワークフロー実行に失敗しました');
            }

            if (result.data.status !== 'succeeded') {
                throw new Error(`予期しないワークフロー状態: ${result.data.status}`);
            }

            // outputs.result をパース
            const outputJson = result.data.outputs?.result;
            console.log('[BackendBServiceAdapter] Raw outputs:', result.data.outputs);
            console.log('[BackendBServiceAdapter] Raw result:', outputJson);

            if (!outputJson) {
                console.warn('[BackendBServiceAdapter] No result in outputs, returning empty array');
                return [];
            }

            const parsed: ListStoresOutput = typeof outputJson === 'string'
                ? JSON.parse(outputJson)
                : outputJson;

            console.log('[BackendBServiceAdapter] Parsed result:', parsed);

            if (parsed.error) {
                throw new Error(parsed.error);
            }

            // ストア配列を取得 (直接配列 or { stores: [...] } 両対応)
            let rawStores: Array<{
                storeName?: string;
                name?: string;
                displayName?: string;
                createdAt?: string;
                createTime?: string;
            }> = [];

            if (Array.isArray(parsed)) {
                // 直接配列が返ってくるケース
                console.log('[BackendBServiceAdapter] Response is direct array');
                rawStores = parsed;
            } else if (parsed.stores && Array.isArray(parsed.stores)) {
                // { stores: [...] } 形式
                console.log('[BackendBServiceAdapter] Response has stores property');
                rawStores = parsed.stores;
            }

            console.log('[BackendBServiceAdapter] Raw stores array:', rawStores);

            const stores: GeminiStore[] = rawStores.map(store => {
                // storeName または name を使用
                const storeId = store.storeName || store.name || '';
                // createdAt または createTime を使用
                const createTime = store.createdAt || store.createTime;

                return {
                    id: storeId,
                    display_name: store.displayName || storeId.split('/').pop() || 'Unknown',
                    create_time: createTime,
                };
            });

            console.log('[BackendBServiceAdapter] Transformed stores:', stores);
            console.log(`[BackendBServiceAdapter] Successfully fetched ${stores.length} stores`);
            return stores;

        } catch (error) {
            if (error instanceof TypeError) {
                throw new Error('ネットワークエラー。Backend BのURLを確認してください。');
            }
            throw error;
        }
    },

    /**
     * Backend B への接続テスト
     * @param config Backend B設定
     * @returns 成功時true
     */
    async testConnection(config: BackendBConfig): Promise<boolean> {
        // FEモードでは常に成功
        if (config.mockMode === 'FE') {
            return true;
        }

        if (!config.apiKey?.trim()) {
            throw new Error('APIキーが設定されていません');
        }

        try {
            const response = await fetch(`${config.apiUrl}/info`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('認証に失敗しました');
                }
                throw new Error(`接続テストに失敗しました (${response.status})`);
            }

            return true;
        } catch (error) {
            if (error instanceof TypeError) {
                throw new Error('ネットワークエラー');
            }
            throw error;
        }
    },
};
