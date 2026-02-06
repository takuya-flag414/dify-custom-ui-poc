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
    refetch: () => Promise<void>;
    isConfigured: boolean;
}

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
    const [stores, setStores] = useState<GeminiStore[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const isConfigured = mockMode === 'FE' || !!backendBApiKey.trim();

    const fetchStores = useCallback(async () => {
        // === デバッグログ開始 ===
        console.log('[useGeminiStores] fetchStores called');
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

        console.log('[useGeminiStores] Calling BackendBServiceAdapter.listStores with config:', {
            apiUrl: config.apiUrl,
            mockMode: config.mockMode,
            apiKeyLength: config.apiKey?.length || 0,
        });

        try {
            const fetchedStores = await BackendBServiceAdapter.listStores(config);
            console.log('[useGeminiStores] Successfully fetched stores:', fetchedStores.length);
            setStores(fetchedStores);
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'ストア一覧の取得に失敗しました';
            console.error('[useGeminiStores] Error fetching stores:', message, err);
            setError(message);
            setStores([]);
        } finally {
            setIsLoading(false);
        }
    }, [mockMode, backendBApiKey, backendBApiUrl, isConfigured]);

    // ★ 自動fetchは行わない。ContextSelectorで手動でrefetch()を呼ぶ

    return {
        stores,
        isLoading,
        error,
        refetch: fetchStores,
        isConfigured,
    };
};
