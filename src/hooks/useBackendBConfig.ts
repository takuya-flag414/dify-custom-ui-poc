import { useState, useEffect, useCallback } from 'react';
import { USE_ENV_API_CONFIG, ENV_API_KEY_B, ENV_API_URL_B } from '../config/env';

const STORAGE_KEYS = {
    apiKey: 'dify_backend_b_api_key',
    apiUrl: 'dify_backend_b_api_url',
};

const DEFAULT_API_URL = 'https://api.dify.ai/v1';

/**
 * Backend B 設定フックの戻り値
 */
export interface UseBackendBConfigReturn {
    apiKey: string;
    apiUrl: string;
    isConfigured: boolean;
    isEnvConfig: boolean;
    saveConfig: (newKey: string, newUrl: string) => void;
    testConnection: () => Promise<boolean>;
}

/**
 * Backend B用の設定を管理するカスタムフック
 * LocalStorageに永続化し、接続テスト機能を提供
 */
export const useBackendBConfig = (): UseBackendBConfigReturn => {
    const [apiKey, setApiKey] = useState<string>(USE_ENV_API_CONFIG ? ENV_API_KEY_B : '');
    const [apiUrl, setApiUrl] = useState<string>(USE_ENV_API_CONFIG ? ENV_API_URL_B : DEFAULT_API_URL);

    // LocalStorageから設定を読み込み
    useEffect(() => {
        if (USE_ENV_API_CONFIG) {
            setApiKey(ENV_API_KEY_B);
            setApiUrl(ENV_API_URL_B);
            return;
        }

        const storedKey = localStorage.getItem(STORAGE_KEYS.apiKey);
        const storedUrl = localStorage.getItem(STORAGE_KEYS.apiUrl);
        if (storedKey) setApiKey(storedKey);
        if (storedUrl) setApiUrl(storedUrl);
    }, []);

    // 設定を保存
    const saveConfig = useCallback((newKey: string, newUrl: string): void => {
        if (USE_ENV_API_CONFIG) {
            console.warn('[Config] Backend B: Configuration is controlled by environment variables. Manual save ignored.');
            return;
        }
        const formattedUrl = newUrl.trim().replace(/\/$/, ''); // 末尾スラッシュ除去
        setApiKey(newKey);
        setApiUrl(formattedUrl);
        localStorage.setItem(STORAGE_KEYS.apiKey, newKey);
        localStorage.setItem(STORAGE_KEYS.apiUrl, formattedUrl);
    }, []);

    // 接続テスト (Backend B の /info エンドポイントを使用)
    const testConnection = useCallback(async (): Promise<boolean> => {
        if (!apiKey.trim()) {
            throw new Error('APIキーが設定されていません');
        }

        try {
            const response = await fetch(`${apiUrl}/info`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('認証に失敗しました。APIキーを確認してください');
                }
                throw new Error(`接続テストに失敗しました (${response.status})`);
            }

            return true;
        } catch (error) {
            if (error instanceof TypeError) {
                throw new Error('ネットワークエラー。URLを確認してください');
            }
            throw error;
        }
    }, [apiKey, apiUrl]);

    return {
        apiKey,
        apiUrl,
        isConfigured: !!apiKey.trim(),
        isEnvConfig: USE_ENV_API_CONFIG,
        saveConfig,
        testConnection,
    };
};
