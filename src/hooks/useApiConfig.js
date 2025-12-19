// src/hooks/useApiConfig.js
import { useState, useEffect } from 'react';
import { ChatServiceAdapter } from '../services/ChatServiceAdapter'; // ★追加

export const useApiConfig = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('https://api.dify.ai/v1');

  useEffect(() => {
    const storedKey = localStorage.getItem('dify_api_key');
    const storedUrl = localStorage.getItem('dify_api_url');
    if (storedKey) setApiKey(storedKey);
    if (storedUrl) setApiUrl(storedUrl);
  }, []);

  const saveConfig = (newKey, newUrl) => {
    setApiKey(newKey);
    setApiUrl(newUrl);
    localStorage.setItem('dify_api_key', newKey);
    localStorage.setItem('dify_api_url', newUrl);
  };

  // ★追加: 接続テスト処理
  const checkConnection = async (testKey, testUrl, mockMode) => {
    return await ChatServiceAdapter.testConnection({
      apiKey: testKey,
      apiUrl: testUrl,
      mockMode: mockMode,
      // userIdは必須ではないが、もしあれば渡せるように拡張可能
      // 現状はAdapter内で一時IDを生成するので省略可
    });
  };

  return {
    apiKey,
    apiUrl,
    saveConfig,
    checkConnection // ★エクスポート
  };
};