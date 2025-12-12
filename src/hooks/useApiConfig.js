import { useState, useEffect } from 'react';

const STORAGE_KEY_API_KEY = 'dify_api_key';
const STORAGE_KEY_API_URL = 'dify_api_url';

export const useApiConfig = () => {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_API_KEY) || import.meta.env.VITE_DIFY_API_KEY || '';
  });
  
  const [apiUrl, setApiUrl] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_API_URL) || import.meta.env.VITE_DIFY_API_URL || '';
  });

  const saveConfig = (newKey, newUrl) => {
    setApiKey(newKey);
    setApiUrl(newUrl);
    localStorage.setItem(STORAGE_KEY_API_KEY, newKey);
    localStorage.setItem(STORAGE_KEY_API_URL, newUrl);
  };

  return {
    apiKey,
    apiUrl,
    saveConfig
  };
};
