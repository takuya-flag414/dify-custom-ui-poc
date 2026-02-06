// src/hooks/useGeminiStores.ts
// Gemini File Searchストア一覧を取得・管理するカスタムフック

import { useState, useCallback } from 'react';
import { BackendBServiceAdapter, GeminiStore, BackendBConfig } from '../services/BackendBServiceAdapter';

/**
 * useGeminiStores の戻り値の型
 */
export interface UseGeminiStoresReturn {
    stores: GeminiStore[];
    isLoading: boolean;
    error: string | null;
    refetch: (options?: { force?: boolean }) => Promise<void>;
    isConfigured: boolean;
}

// --- Module Level Cache (Memory Cache) ---
// アプリケーションがリロードされるまで保持される
let cachedStores: GeminiStore[] | null = null;

/**
 * Gemini File Search ストア一覧を取得するカスタムフック
 * ※自動fetchは行わない。refetch()を手動で呼び出す必要あり。
 * @param mockMode 現在のモックモード
 * @param backendBApiKey Backend B のAPIキー
 * @param backendBApiUrl Backend B のAPI URL
 */
export const useGeminiStores = (
    mockMode: 'FE' | 'BE' | 'OFF',
    backendBApiKey: string,
    backendBApiUrl: string
): UseGeminiStoresReturn => {
    // キャッシュがあれば初期値として利用
    const [stores, setStores] = useState<GeminiStore[]>(cachedStores || []);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const isConfigured = mockMode === 'FE' || !!backendBApiKey.trim();

    const fetchStores = useCallback(async (options: { force?: boolean } = {}) => {
        const { force = false } = options;

        // === デバッグログ開始 ===
        console.log('[useGeminiStores] fetchStores called', { force });

        // キャッシュチェック (force=false かつ キャッシュが存在する場合)
        if (!force && cachedStores !== null) {
            console.log('[useGeminiStores] Returning cached stores:', cachedStores.length);
            setStores(cachedStores);
            // 念のためエラーはクリア
            setError(null);
            return;
        }

        console.log('[useGeminiStores] mockMode:', mockMode);
        console.log('[useGeminiStores] backendBApiKey:', backendBApiKey ? `設定済み(長さ:${backendBApiKey.length})` : '未設定(空)');
        console.log('[useGeminiStores] backendBApiUrl:', backendBApiUrl);
        console.log('[useGeminiStores] isConfigured:', isConfigured);

        // FEモード以外でAPIキーが未設定の場合はスキップ
        if (mockMode !== 'FE' && !backendBApiKey.trim()) {
            console.warn('[useGeminiStores] APIキー未設定のためスキップ');
            setError('Backend B のAPIキーが未設定です。設定画面で入力してください。');
            setStores([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        const config: BackendBConfig = {
            apiKey: backendBApiKey,
            apiUrl: backendBApiUrl,
            mockMode,
        };

        console.log('[useGeminiStores] Calling BackendBServiceAdapter.listStores via Network');

        try {
            const fetchedStores = await BackendBServiceAdapter.listStores(config);
            console.log('[useGeminiStores] Successfully fetched stores:', fetchedStores.length);

            // キャッシュとStateを更新
            cachedStores = fetchedStores;
            setStores(fetchedStores);
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'ストア一覧の取得に失敗しました';
            console.error('[useGeminiStores] Error fetching stores:', message, err);
            setError(message);
            // エラー時はストアを空にするか、キャッシュを残すかは要件次第だが、
            // ここでは安全のため空にはせず、既存のリストがあれば維持する挙動も考えられるが
            // 元のロジックに従い空にする（またはエラー表示のみにする）
            // 一旦空にはせず、エラーのみセットする形もUI的には優しいが、
            // ここでは明示的にクリアしない（前回値が残る）挙動にする
            if (!stores.length) {
                setStores([]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [mockMode, backendBApiKey, backendBApiUrl, isConfigured, stores.length]);

    // ★ 自動fetchは行わない。ContextSelectorで手動でrefetch()を呼ぶ

    return {
        stores,
        isLoading,
        error,
        refetch: fetchStores,
        isConfigured,
    };
};
