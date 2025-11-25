import { useState, useEffect, useCallback } from 'react';
import { fetchConversationsApi } from '../api/dify';
import { mockConversations } from '../mockData';

const DIFY_API_KEY = import.meta.env.VITE_DIFY_API_KEY;
const DIFY_API_URL = import.meta.env.VITE_DIFY_API_URL;
const USER_ID = 'poc-user-01';

export const useConversations = (mockMode, addLog) => {
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);

  // 会話リスト取得
  useEffect(() => {
    const fetchConversations = async () => {
      if (mockMode === 'FE') {
        addLog('[useConversations] FE Mock mode. Loading rich dummy conversations.', 'info');
        setConversations(mockConversations);
        return;
      }

      addLog('[useConversations] Fetching REAL conversations list...', 'info');
      if (!DIFY_API_KEY || !DIFY_API_URL) {
          addLog('[useConversations Error] API KEY or URL not set. Cannot fetch conversations.', 'error');
          setConversations([]);
          return;
      }
      
      try {
        const data = await fetchConversationsApi(USER_ID, DIFY_API_URL, DIFY_API_KEY);
        setConversations(data.data || []);
        addLog(`[useConversations] Fetched ${data.data?.length || 0} conversations.`, 'info');
      } catch (error) {
        addLog(`[useConversations Error] ${error.message}`, 'error');
        setConversations([]);
      }
    };
    
    fetchConversations();
  }, [addLog, mockMode]);

  // 会話作成時のハンドラ
  const handleConversationCreated = useCallback((newId, newTitle) => {
    addLog(`[useConversations] New conversation created: ${newId} "${newTitle}"`, 'info');
    const newConv = { id: newId, name: newTitle };
    setConversations((prev) => {
      if (prev.some(c => c.id === newId)) return prev;
      return [newConv, ...prev];
    });
    setConversationId(newId);
  }, [addLog]);

  return {
    conversations,
    conversationId,
    setConversationId,
    handleConversationCreated
  };
};
