import { useState, useEffect } from 'react';
import { ChatServiceAdapter, ServiceConfig } from '../services/ChatServiceAdapter';
import { USE_ENV_API_CONFIG, ENV_API_KEY_A, ENV_API_URL_A } from '../config/env';

/**
 * API設定フックの戻り値の型
 */
export interface UseApiConfigReturn {
    apiKey: string;
    apiUrl: string;
    isEnvConfig: boolean;
    saveConfig: (newKey: string, newUrl: string) => void;
    checkConnection: (testKey: string, testUrl: string, mockMode: ServiceConfig['mockMode']) => Promise<boolean>;
}

export const useApiConfig = (): UseApiConfigReturn => {
    const [apiKey, setApiKey] = useState<string>(USE_ENV_API_CONFIG ? ENV_API_KEY_A : '');
    const [apiUrl, setApiUrl] = useState<string>(USE_ENV_API_CONFIG ? ENV_API_URL_A : 'https://api.dify.ai/v1');

    useEffect(() => {
        if (USE_ENV_API_CONFIG) {
            // 環境変数モードの場合はLocalStorageを無視し、最新の環境変数を反映
            setApiKey(ENV_API_KEY_A);
            setApiUrl(ENV_API_URL_A);
            return;
        }

        const storedKey = localStorage.getItem('dify_api_key');
        const storedUrl = localStorage.getItem('dify_api_url');
        if (storedKey) setApiKey(storedKey);
        if (storedUrl) setApiUrl(storedUrl);
    }, []);

    const saveConfig = (newKey: string, newUrl: string): void => {
        if (USE_ENV_API_CONFIG) {
            console.warn('[Config] Configuration is controlled by environment variables. Manual save ignored.');
            return;
        }
        setApiKey(newKey);
        setApiUrl(newUrl);
        localStorage.setItem('dify_api_key', newKey);
        localStorage.setItem('dify_api_url', newUrl);
    };

    // 接続テスト処理
    const checkConnection = async (
        testKey: string,
        testUrl: string,
        mockMode: ServiceConfig['mockMode']
    ): Promise<boolean> => {
        return await ChatServiceAdapter.testConnection({
            apiKey: testKey,
            apiUrl: testUrl,
            mockMode: mockMode,
            userId: '', // Adapter内で一時IDを生成
        });
    };

    return {
        apiKey,
        apiUrl,
        isEnvConfig: USE_ENV_API_CONFIG,
        saveConfig,
        checkConnection
    };
};
