// src/hooks/useConversations.js
import { useState, useEffect, useCallback } from 'react';
import { fetchConversationsApi, deleteConversationApi } from '../api/dify'; // deleteConversationApiを追加
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

  /**
   * [追加] 会話を削除する
   * @param {string} targetId - 削除する会話ID
   */
  const handleDeleteConversation = useCallback(async (targetId) => {
    addLog(`[useConversations] Deleting conversation: ${targetId}`, 'info');

    // 1. Mockモードの場合の処理
    if (mockMode === 'FE') {
      setConversations((prev) => prev.filter((c) => c.id !== targetId));
      if (conversationId === targetId) {
        setConversationId(null); // 開いていた会話なら閉じる
      }
      addLog(`[useConversations] Deleted (Mock) conversation: ${targetId}`, 'success');
      return;
    }

    // 2. Real APIモードの場合の処理
    try {
      await deleteConversationApi(targetId, USER_ID, DIFY_API_URL, DIFY_API_KEY);

      // UIの状態を更新
      setConversations((prev) => prev.filter((c) => c.id !== targetId));

      // もし削除した会話を開いていた場合、新規チャット画面へ戻す
      if (conversationId === targetId) {
        setConversationId(null);
        addLog(`[useConversations] Active conversation deleted. Resetting view.`, 'info');
      }

      addLog(`[useConversations] Successfully deleted conversation: ${targetId}`, 'success');
    } catch (error) {
      addLog(`[useConversations Error] Failed to delete: ${error.message}`, 'error');
      // ここでユーザーへのAlert表示などをトリガーしても良いが、
      // 今回はログ出力に留め、エラー状態はUI側(Sidebar)でcatchさせる設計も可
      throw error; // UI側でエラーハンドリングできるように再スロー
    }
  }, [mockMode, conversationId, addLog]);

  return {
    conversations,
    conversationId,
    setConversationId,
    handleConversationCreated,
    handleDeleteConversation, // [追加] エクスポート
  };
};