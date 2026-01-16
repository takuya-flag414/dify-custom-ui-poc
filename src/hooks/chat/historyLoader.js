// src/hooks/chat/historyLoader.js
// useChat.js から分離した履歴ロード処理

import { mockMessages } from '../../mocks/data';
import { fetchMessagesApi } from '../../api/dify';
import { parseLlmResponse } from '../../utils/responseParser';
import { mapCitationsFromApi, mapCitationsFromLLM } from '../../utils/citationMapper';
import { createConfigError } from '../../utils/errorHandler';
import { DEFAULT_SEARCH_SETTINGS } from './constants';

/**
 * FEモック用: メッセージからファイルを復元
 * @param {Array} messages - メッセージ配列
 * @returns {Array} 復元されたファイル配列
 */
const extractFilesFromMockMessages = (messages) => {
  const restoredFiles = [];
  const seenFileNames = new Set();

  messages.forEach(msg => {
    if (msg.role === 'user' && msg.files && msg.files.length > 0) {
      msg.files.forEach(f => {
        if (!seenFileNames.has(f.name)) {
          seenFileNames.add(f.name);
          restoredFiles.push({
            id: f.id || `mock_file_${Date.now()}_${Math.random()}`,
            name: f.name,
            type: 'document'
          });
        }
      });
    }
  });

  return restoredFiles;
};

/**
 * APIレスポンスからファイル名を抽出
 * @param {Object} fileObj - APIからのファイルオブジェクト
 * @returns {string} ファイル名
 */
const extractFileName = (fileObj) => {
  if (fileObj.name) {
    return fileObj.name;
  }
  if (fileObj.filename) {
    return fileObj.filename;
  }
  if (fileObj.url) {
    try {
      const decodedUrl = decodeURIComponent(fileObj.url);
      const urlFileName = decodedUrl.split('/').pop().split('?')[0];
      if (urlFileName === 'file-preview' || urlFileName.includes('image_preview')) {
        const ext = fileObj.mime_type ? `.${fileObj.mime_type.split('/')[1]}` : '';
        return `添付ファイル${ext}`;
      }
      return urlFileName;
    } catch (e) {
      return '添付ファイル';
    }
  }
  return 'Attached File';
};

/**
 * APIレスポンスからメッセージ配列を構築
 * @param {Array} chronologicalMessages - 時系列順のAPIメッセージ
 * @returns {Object} { messages, restoredFiles }
 */
const buildMessagesFromApi = (chronologicalMessages) => {
  const newMessages = [];
  const restoredFiles = [];
  const seenFileIds = new Set();

  for (const item of chronologicalMessages) {
    const timestamp = item.created_at ? new Date(item.created_at * 1000).toISOString() : new Date().toISOString();

    // ユーザーメッセージ
    if (item.query) {
      const msgFiles = item.message_files ? item.message_files.map(f => {
        const fileName = extractFileName(f);

        const fileData = {
          id: f.id,
          name: fileName,
          type: f.type || 'document'
        };

        if (f.id && !seenFileIds.has(f.id)) {
          seenFileIds.add(f.id);
          restoredFiles.push(fileData);
        }
        return { name: fileData.name };
      }) : [];

      newMessages.push({
        id: `${item.id}_user`,
        role: 'user',
        text: item.query,
        timestamp: timestamp,
        files: msgFiles
      });
    }

    // AIメッセージ
    if (item.answer) {
      let aiText = item.answer;
      let aiCitations = mapCitationsFromApi(item.retriever_resources || []);
      let traceMode = aiCitations.length > 0 ? 'search' : 'knowledge';

      const parsed = parseLlmResponse(aiText);

      if (parsed.isParsed) {
        aiText = parsed.answer;
        if (aiCitations.length === 0 && parsed.citations.length > 0) {
          aiCitations = mapCitationsFromLLM(parsed.citations);
          if (aiCitations.some(c => c.type === 'web')) traceMode = 'search';
          else if (aiCitations.some(c => c.type === 'rag')) traceMode = 'knowledge';
          else traceMode = 'document';
        } else if (parsed.citations.length > 0) {
          traceMode = 'search';
        }
      }

      newMessages.push({
        id: item.id,
        role: 'ai',
        text: aiText,
        rawContent: item.answer,
        citations: aiCitations,
        suggestions: [],
        isStreaming: false,
        timestamp: timestamp,
        traceMode: traceMode,
        thoughtProcess: [],
        processStatus: null
      });
    }
  }

  return { messages: newMessages, restoredFiles };
};

/**
 * チャット履歴をロードする
 * @param {Object} params - パラメータオブジェクト
 * @returns {Promise<Object>} { messages, sessionFiles, searchSettings, error, shouldSkip }
 */
export const loadChatHistory = async ({
  conversationId,
  mockMode,
  addLog,
  apiKey,
  apiUrl,
  userId,
  dynamicMockMessages,
  // creatingConversationIdRef は useChat.js 側でチェック済みなので使用しない
  settingsMapRef,
}) => {
  // 既存の会話を選択した場合のみ、保存された設定を復元
  const savedSettings = settingsMapRef.current[conversationId] || DEFAULT_SEARCH_SETTINGS;

  addLog(`[useChat] Conversation changed to: ${conversationId}`, 'info');

  // 会話IDがない場合
  if (!conversationId) {
    return {
      messages: [],
      sessionFiles: [],
      searchSettings: savedSettings,
      error: null,
      shouldSkip: false
    };
  }

  try {
    if (mockMode === 'FE') {
      // --- FE Mock Mode Logic ---
      await new Promise(r => setTimeout(r, 800));

      let loadedMessages = [];
      if (dynamicMockMessages[conversationId]) {
        loadedMessages = dynamicMockMessages[conversationId];
      } else {
        loadedMessages = mockMessages[conversationId] || [];
      }

      const restoredFiles = extractFilesFromMockMessages(loadedMessages);

      if (restoredFiles.length > 0) {
        addLog(`[History (FE)] Restored ${restoredFiles.length} files from mock history.`, 'info');
      }

      return {
        messages: loadedMessages,
        sessionFiles: restoredFiles,
        searchSettings: savedSettings,
        error: null,
        shouldSkip: false
      };
    } else {
      // --- Real API Logic ---
      if (typeof conversationId === 'string' && conversationId.startsWith('mock_')) {
        addLog(`[useChat] Skipping API call for mock ID in Real mode: ${conversationId}`, 'warn');
        return {
          messages: [],
          sessionFiles: [],
          searchSettings: savedSettings,
          error: null,
          shouldSkip: false
        };
      }

      if (!apiKey || !apiUrl || !userId) {
        return {
          messages: [createConfigError()],
          sessionFiles: [],
          searchSettings: savedSettings,
          error: null,
          shouldSkip: false
        };
      }

      const historyData = await fetchMessagesApi(conversationId, userId, apiUrl, apiKey);
      const chronologicalMessages = (historyData.data || []).sort((a, b) => a.created_at - b.created_at);

      const { messages: newMessages, restoredFiles } = buildMessagesFromApi(chronologicalMessages);

      if (restoredFiles.length > 0) {
        addLog(`[History] Restored ${restoredFiles.length} files from history.`, 'info');
      }

      return {
        messages: newMessages,
        sessionFiles: restoredFiles,
        searchSettings: savedSettings,
        error: null,
        shouldSkip: false
      };
    }
  } catch (error) {
    addLog(`[History Error] ${error.message}`, 'error');
    return {
      messages: [{
        id: 'err_history_load',
        role: 'system',
        type: 'error',
        rawError: error.message,
        timestamp: new Date().toISOString()
      }],
      sessionFiles: [],
      searchSettings: savedSettings,
      error: error,
      shouldSkip: false
    };
  }
};
