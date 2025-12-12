import { useState, useEffect, useCallback } from 'react';
import { fetchConversationsApi, deleteConversationApi, renameConversationApi } from '../api/dify';
import { mockConversations } from '../mockData';

const USER_ID = 'poc-user-01';
const PINNED_STORAGE_KEY = 'dify_pinned_conversations';

export const useConversations = (mockMode, addLog, apiKey, apiUrl) => {
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);

  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(PINNED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (mockMode === 'FE') {
        addLog('[useConversations] FE Mock mode. Loading rich dummy conversations.', 'info');

        const now = new Date();
        const enrichedMock = mockConversations.map((conv, index) => {
          const fakeDate = new Date(now);
          if (index === 1) fakeDate.setDate(now.getDate() - 1);
          if (index === 2) fakeDate.setDate(now.getDate() - 3);
          if (index === 3) fakeDate.setDate(now.getDate() - 10);
          if (index >= 4) fakeDate.setDate(now.getDate() - 60);

          return {
            ...conv,
            created_at: Math.floor(fakeDate.getTime() / 1000)
          };
        });

        setConversations(enrichedMock);
        return;
      }

      addLog('[useConversations] Fetching REAL conversations list...', 'info');
      if (!apiKey || !apiUrl) {
        addLog('[useConversations Error] API KEY or URL not set.', 'error');
        setConversations([]);
        return;
      }

      try {
        const data = await fetchConversationsApi(USER_ID, apiUrl, apiKey);
        setConversations(data.data || []);
        addLog(`[useConversations] Fetched ${data.data?.length || 0} conversations.`, 'info');
      } catch (error) {
        addLog(`[useConversations Error] ${error.message}`, 'error');
        setConversations([]);
      }
    };

    fetchConversations();
  }, [addLog, mockMode]);

  const handleConversationCreated = useCallback((newId, newTitle) => {
    addLog(`[useConversations] New conversation created: ${newId}`, 'info');
    const newConv = {
      id: newId,
      name: newTitle,
      created_at: Math.floor(Date.now() / 1000)
    };

    setConversations((prev) => {
      if (prev.some(c => c.id === newId)) return prev;
      return [newConv, ...prev];
    });
    setConversationId(newId);
  }, [addLog]);

  const handleDeleteConversation = useCallback(async (targetId) => {
    addLog(`[useConversations] Deleting conversation: ${targetId}`, 'info');

    if (mockMode === 'FE') {
      setConversations((prev) => prev.filter((c) => c.id !== targetId));
      if (conversationId === targetId) setConversationId(null);
      setPinnedIds(prev => prev.filter(id => id !== targetId));
      addLog(`[useConversations] Deleted (Mock): ${targetId}`, 'success');
      return;
    }

    try {
      await deleteConversationApi(targetId, USER_ID, apiUrl, apiKey);
      setConversations((prev) => prev.filter((c) => c.id !== targetId));
      setPinnedIds(prev => prev.filter(id => id !== targetId));

      if (conversationId === targetId) {
        setConversationId(null);
        addLog(`[useConversations] Active conversation deleted. Resetting view.`, 'info');
      }
      addLog(`[useConversations] Successfully deleted: ${targetId}`, 'success');
    } catch (error) {
      addLog(`[useConversations Error] Failed to delete: ${error.message}`, 'error');
      throw error;
    }
  }, [mockMode, conversationId, addLog]);

  const handleRenameConversation = useCallback(async (targetId, newName) => {
    addLog(`[useConversations] Renaming conversation: ${targetId} -> ${newName}`, 'info');

    if (mockMode === 'FE') {
      setConversations(prev => prev.map(c =>
        c.id === targetId ? { ...c, name: newName } : c
      ));
      addLog(`[useConversations] Renamed (Mock): ${newName}`, 'success');
      return;
    }

    try {
      await renameConversationApi(targetId, newName, USER_ID, apiUrl, apiKey);
      setConversations(prev => prev.map(c =>
        c.id === targetId ? { ...c, name: newName } : c
      ));
      addLog(`[useConversations] Successfully renamed.`, 'success');
    } catch (error) {
      addLog(`[useConversations Error] Failed to rename: ${error.message}`, 'error');
      throw error;
    }
  }, [mockMode, addLog]);

  const handlePinConversation = useCallback((targetId) => {
    setPinnedIds(prev => {
      const isPinned = prev.includes(targetId);
      const newPinned = isPinned
        ? prev.filter(id => id !== targetId)
        : [...prev, targetId];

      addLog(`[useConversations] Toggled pin for ${targetId}. Pinned: ${!isPinned}`, 'info');
      return newPinned;
    });
  }, [addLog]);

  // [New] 会話リストの順序更新（楽観的UI用）
  const handleConversationUpdated = useCallback((targetId) => {
    setConversations((prev) => {
      const targetIndex = prev.findIndex(c => c.id === targetId);
      if (targetIndex === -1) return prev;

      const targetConv = { ...prev[targetIndex] };
      // タイムスタンプを現在時刻に更新して先頭へ移動
      const nowSec = Math.floor(Date.now() / 1000);
      targetConv.created_at = nowSec;
      targetConv.updated_at = nowSec;

      const others = prev.filter(c => c.id !== targetId);
      return [targetConv, ...others];
    });
  }, []);

  return {
    conversations,
    conversationId,
    setConversationId,
    pinnedIds,
    handleConversationCreated,
    handleDeleteConversation,
    handleRenameConversation,
    handlePinConversation,
    handleConversationUpdated, // [New] エクスポート
  };
};