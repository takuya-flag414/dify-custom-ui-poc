// src/hooks/chat/messageActions.js
// useChat.js から分離した停止・編集・再生成アクション

import { stopGenerationApi } from '../../api/dify';

/**
 * 生成停止処理を実行する
 * @param {Object} params - パラメータオブジェクト
 * @returns {Object} 停止結果 { stoppedMessage: Object|null }
 */
export const executeStopGeneration = async ({
  abortControllerRef,
  currentTaskIdRef,
  streamingMessageRef,
  mockMode,
  apiKey,
  apiUrl,
  userId,
  addLog,
}) => {
  addLog('[Stop] ユーザーによる生成停止を実行', 'info');

  // 1. クライアント側のストリーム中断
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }

  // 2. サーバー側の生成停止（Real APIモードの場合のみ）
  if (currentTaskIdRef.current && mockMode !== 'FE' && apiKey && apiUrl && userId) {
    try {
      await stopGenerationApi(currentTaskIdRef.current, userId, apiUrl, apiKey);
      addLog('[Stop] サーバー側の生成を停止しました', 'info');
    } catch (e) {
      addLog(`[Stop] サーバー停止API失敗: ${e.message}`, 'warn');
      // クライアント側は既に停止しているので、エラーでも続行
    }
  }

  currentTaskIdRef.current = null;

  // 3. ストリーミング中のメッセージがあれば、途中までのテキストを確定メッセージとして返す
  const currentStreaming = streamingMessageRef.current;
  if (currentStreaming) {
    return {
      stoppedMessage: {
        ...currentStreaming,
        isStreaming: false,
        wasStopped: true,
        text: currentStreaming.text || '',
        thoughtProcess: currentStreaming.thoughtProcess?.map(t => ({ ...t, status: 'done' })) || [],
        suggestions: [],
        smartActions: []
      }
    };
  }

  return { stoppedMessage: null };
};

/**
 * メッセージ編集のための準備処理を実行する
 * @param {Object} params - パラメータオブジェクト
 * @returns {Object} { previousMessages, shouldSend, error }
 */
export const prepareMessageEdit = ({
  messageId,
  messages,
  addLog,
}) => {
  addLog(`[Edit] メッセージを編集: ${messageId}`, 'info');

  // 対象メッセージのインデックスを探す
  const messageIndex = messages.findIndex(m => m.id === messageId);
  if (messageIndex === -1) {
    addLog('[Edit] 対象メッセージが見つかりません', 'error');
    return { previousMessages: null, shouldSend: false, error: 'Message not found' };
  }

  // 履歴の切り詰め（対象メッセージより前のメッセージのみ残す）
  const previousMessages = messages.slice(0, messageIndex);
  return { previousMessages, shouldSend: true, error: null };
};

/**
 * 再生成のための準備処理を実行する
 * @param {Object} params - パラメータオブジェクト
 * @returns {Object} { targetUserMessage, truncatedMessages, shouldSend, error }
 */
export const prepareRegenerate = ({
  messages,
  addLog,
}) => {
  addLog('[Regenerate] 再送信を実行', 'info');

  if (messages.length === 0) {
    addLog('[Regenerate] メッセージがありません', 'warn');
    return { targetUserMessage: null, truncatedMessages: null, shouldSend: false, error: 'No messages' };
  }

  const lastMessage = messages[messages.length - 1];
  let targetUserMessage = null;
  let truncateCount = 0;

  if (lastMessage.role === 'ai' || lastMessage.role === 'system') {
    // 最後のメッセージがAI/システムの場合、その一つ前のユーザーメッセージを取得
    const userMsgIndex = messages.length - 2;
    if (userMsgIndex >= 0 && messages[userMsgIndex].role === 'user') {
      targetUserMessage = messages[userMsgIndex];
      truncateCount = 2; // AI回答とユーザー質問を削除
    }
  } else if (lastMessage.role === 'user') {
    // 最後がユーザーで終わっている（エラー等）場合
    targetUserMessage = lastMessage;
    truncateCount = 1;
  }

  if (!targetUserMessage) {
    addLog('[Regenerate] 再送信対象のユーザーメッセージが見つかりません', 'warn');
    return { targetUserMessage: null, truncatedMessages: null, shouldSend: false, error: 'No target message' };
  }

  // 履歴を切り詰め
  const truncatedMessages = messages.slice(0, messages.length - truncateCount);
  return { targetUserMessage, truncatedMessages, shouldSend: true, error: null };
};
