// src/hooks/useApiConfig.ts
import { useState, useEffect } from 'react';
import { ChatServiceAdapter, ServiceConfig } from '../services/ChatServiceAdapter';

/**
 * API設定フックの戻り値の型
 */
export interface UseApiConfigReturn {
    apiKey: string;
    apiUrl: string;
    saveConfig: (newKey: string, newUrl: string) => void;
    checkConnection: (testKey: string, testUrl: string, mockMode: ServiceConfig['mockMode']) => Promise<boolean>;
}

export const useApiConfig = (): UseApiConfigReturn => {
    const [apiKey, setApiKey] = useState<string>('');
    const [apiUrl, setApiUrl] = useState<string>('https://api.dify.ai/v1');

    useEffect(() => {
        const storedKey = localStorage.getItem('dify_api_key');
        const storedUrl = localStorage.getItem('dify_api_url');
        if (storedKey) setApiKey(storedKey);
        if (storedUrl) setApiUrl(storedUrl);
    }, []);

    const saveConfig = (newKey: string, newUrl: string): void => {
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
        saveConfig,
        checkConnection
    };
};
