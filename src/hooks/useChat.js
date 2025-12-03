// src/hooks/useChat.js
import { useState, useEffect, useRef } from 'react';
// ★ New: 8パターンのモックをインポート
import {
  mockMessages,
  mockResPure, mockResWebOnly, mockResRagOnly, mockResHybrid,
  mockResFileOnly, mockResFileWeb, mockResFileRag, mockResFull
} from '../mockData';
import { uploadFile, fetchMessagesApi, sendChatMessageApi, fetchSuggestionsApi } from '../api/dify';
import { parseLlmResponse } from '../utils/responseParser';
import { mapCitationsFromApi, mapCitationsFromLLM } from '../utils/citationMapper';

const DIFY_API_KEY = import.meta.env.VITE_DIFY_API_KEY;
const DIFY_API_URL = import.meta.env.VITE_DIFY_API_URL;
const USER_ID = 'poc-user-01';
const MOCK_PERPLEXITY_JSON = JSON.stringify({ "search_results": [], "answer": "Mock Answer" }); // 簡略化

const DEFAULT_SEARCH_SETTINGS = {
  ragEnabled: true,
  webMode: 'auto',
  domainFilters: []
};

export const useChat = (mockMode, conversationId, addLog, onConversationCreated) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeContextFile, setActiveContextFile] = useState(null);
  const [dynamicMockMessages, setDynamicMockMessages] = useState({});

  const [searchSettings, setSearchSettings] = useState(DEFAULT_SEARCH_SETTINGS);
  const searchSettingsRef = useRef(searchSettings);

  useEffect(() => {
    searchSettingsRef.current = searchSettings;
  }, [searchSettings]);

  const creatingConversationIdRef = useRef(null);
  const settingsMapRef = useRef({});

  const updateSearchSettings = (newSettings) => {
    setSearchSettings(newSettings);
    const filterCount = newSettings.domainFilters.length;
    addLog(`[Search Settings Updated] RAG: ${newSettings.ragEnabled}, Web: ${newSettings.webMode.toUpperCase()}, Filters: ${filterCount}`, 'info');
    if (conversationId) {
      settingsMapRef.current[conversationId] = newSettings;
    }
  };

  useEffect(() => {
    if (mockMode === 'FE' && conversationId && messages.length > 0) {
      setDynamicMockMessages((prev) => ({ ...prev, [conversationId]: messages }));
    }
  }, [messages, mockMode, conversationId]);

  useEffect(() => {
    const loadHistory = async () => {
      const savedSettings = settingsMapRef.current[conversationId] || DEFAULT_SEARCH_SETTINGS;
      setSearchSettings(savedSettings);

      if (conversationId && conversationId === creatingConversationIdRef.current) {
        addLog(`[useChat] Skip loading history for just-created conversation: ${conversationId}`, 'info');
        creatingConversationIdRef.current = null;
        return;
      }

      addLog(`[useChat] Conversation changed to: ${conversationId}`, 'info');
      addLog(`[Search Settings Loaded] RAG: ${savedSettings.ragEnabled}, Web: ${savedSettings.webMode.toUpperCase()}`, 'info');

      setActiveContextFile(null);

      if (conversationId === null) {
        setMessages([]);
        return;
      }

      if (mockMode === 'FE') {
        if (dynamicMockMessages[conversationId]) {
          setMessages(dynamicMockMessages[conversationId]);
        } else {
          setMessages(mockMessages[conversationId] || []);
        }
        return;
      }

      setIsLoading(true);
      setMessages([]);
      try {
        const historyData = await fetchMessagesApi(conversationId, USER_ID, DIFY_API_URL, DIFY_API_KEY);
        const chronologicalMessages = (historyData.data || []).sort((a, b) => a.created_at - b.created_at);

        const newMessages = [];
        for (const item of chronologicalMessages) {
          const timestamp = item.created_at ? new Date(item.created_at * 1000).toISOString() : new Date().toISOString();
          if (item.query) {
            newMessages.push({
              id: `${item.id}_user`,
              role: 'user',
              text: item.query,
              timestamp: timestamp,
              files: item.message_files ? item.message_files.map(f => ({ name: f.url ? '添付ファイル' : 'File' })) : []
            });
          }
          if (item.answer) {
            let aiText = item.answer;
            let aiCitations = mapCitationsFromApi(item.retriever_resources || []);
            let traceMode = aiCitations.length > 0 ? 'search' : 'knowledge';
            const parsed = parseLlmResponse(aiText);
            if (parsed.isParsed) {
              aiText = parsed.answer;
              if (aiCitations.length === 0 && parsed.citations.length > 0) {
                aiCitations = mapCitationsFromLLM(parsed.citations);
                traceMode = 'document';
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
        setMessages(newMessages);
      } catch (error) {
        addLog(`[History Error] ${error.message}`, 'error');
        setMessages([{ id: 'err', role: 'ai', text: '履歴の読み込みに失敗しました。', timestamp: new Date().toISOString() }]);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [conversationId, mockMode, addLog]);

  const handleSendMessage = async (text, attachment = null) => {
    let uploadedFileId = null;
    let displayFiles = [];

    const currentFileName = attachment?.name || activeContextFile?.name;
    const currentSettings = searchSettingsRef.current;

    if (mockMode === 'OFF') {
      if (attachment) {
        setIsLoading(true);
        try {
          const uploadRes = await uploadFile(attachment, USER_ID, DIFY_API_URL, DIFY_API_KEY);
          uploadedFileId = uploadRes.id;
          const newContextFile = { id: uploadedFileId, name: attachment.name, type: 'document' };
          displayFiles = [{ name: attachment.name }];
          setActiveContextFile(newContextFile);
        } catch (e) {
          addLog(`[Upload Error] ${e.message}`, 'error');
          setIsLoading(false);
          return;
        }
      } else if (activeContextFile) {
        uploadedFileId = activeContextFile.id;
        displayFiles = [{ name: activeContextFile.name }];
      }
    } else {
      if (attachment) {
        displayFiles = [{ name: attachment.name }];
        setActiveContextFile({ id: 'mock_id', name: attachment.name });
      }
    }

    const userMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      text: text,
      timestamp: new Date().toISOString(),
      files: displayFiles
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const aiMessageId = `msg_${Date.now()}_ai`;
    setMessages(prev => [...prev, {
      id: aiMessageId,
      role: 'ai',
      text: '',
      rawContent: '',
      citations: [],
      suggestions: [],
      isStreaming: true,
      timestamp: new Date().toISOString(),
      traceMode: 'knowledge',
      thoughtProcess: [],
      processStatus: null
    }]);

    // ------------------------------------------------------------------
    // FE Mock Logic (Refined 8 Patterns)
    // ------------------------------------------------------------------
    if (mockMode === 'FE') {
      const hasFile = !!(attachment || activeContextFile);
      const useRag = currentSettings.ragEnabled;
      const useWeb = currentSettings.webMode !== 'off';

      let mockRes;
      let finalTraceMode = 'knowledge';

      // ★ 8パターン判定ロジック
      if (!hasFile && !useRag && !useWeb) {
        // P1: Pure
        mockRes = mockResPure;
        finalTraceMode = 'knowledge';
      }
      else if (!hasFile && !useRag && useWeb) {
        // P2: Web Only
        mockRes = mockResWebOnly;
        finalTraceMode = 'search';
      }
      else if (!hasFile && useRag && !useWeb) {
        // P3: RAG Only
        mockRes = mockResRagOnly;
        finalTraceMode = 'document';
      }
      else if (!hasFile && useRag && useWeb) {
        // P4: Hybrid (RAG + Web)
        mockRes = mockResHybrid;
        finalTraceMode = 'search';
      }
      else if (hasFile && !useRag && !useWeb) {
        // P5: File Only
        mockRes = mockResFileOnly;
        finalTraceMode = 'document';
      }
      else if (hasFile && !useRag && useWeb) {
        // P6: File + Web
        mockRes = mockResFileWeb;
        finalTraceMode = 'document';
      }
      else if (hasFile && useRag && !useWeb) {
        // P7: File + RAG
        mockRes = mockResFileRag;
        finalTraceMode = 'document';
      }
      else if (hasFile && useRag && useWeb) {
        // P8: Full (File + RAG + Web)
        mockRes = mockResFull;
        finalTraceMode = 'document';
      }

      let finalText = mockRes.text;
      let finalCitations = [...(mockRes.citations || [])];

      // File名の置換
      if (hasFile && currentFileName) {
        finalText = finalText.replace(/{filename}/g, currentFileName);
        finalCitations = finalCitations.map(c => ({
          ...c,
          source: c.source.replace(/{filename}/g, currentFileName)
        }));
      }

      if (!conversationId) {
        const newMockId = `mock_gen_${Date.now()}`;
        creatingConversationIdRef.current = newMockId;
        settingsMapRef.current[newMockId] = currentSettings;
        if (onConversationCreated) {
          onConversationCreated(newMockId, text);
        }
      }

      // 4. 思考プロセスのアニメーション (改修: ステップ分離版)
      const simulateSteps = async () => {
        let steps = [];
        const updateSteps = (newSteps) => {
          setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, thoughtProcess: newSteps } : m));
        };

        // Helper: 全ステップをdoneにする
        const markAllDone = (currentSteps) => currentSteps.map(s => ({ ...s, status: 'done' }));

        // --- Step 1: 意図解析 ---
        steps.push({ id: 'step1', title: 'ユーザーの意図を解析中...', status: 'processing' });
        updateSteps(steps);
        await new Promise(r => setTimeout(r, 600));
        steps = markAllDone(steps);

        // --- Step 2: ファイル読込 (あれば) ---
        if (hasFile) {
          steps.push({
            id: 'step_file',
            title: `ドキュメント「${currentFileName}」を読込中...`,
            status: 'processing'
          });
          updateSteps(steps);
          await new Promise(r => setTimeout(r, 800)); // ファイル解析の時間
          steps = markAllDone(steps);
        }

        // --- Step 3: 社内ナレッジ検索 (あれば) ---
        if (useRag) {
          steps.push({
            id: 'step_rag',
            title: '📚 社内ナレッジベースを検索中...',
            status: 'processing'
          });
          updateSteps(steps);
          await new Promise(r => setTimeout(r, 800)); // 検索の時間
          steps = markAllDone(steps);
        }

        // --- Step 4: Web検索 (あれば) ---
        if (useWeb) {
          const webTitle = currentSettings.webMode === 'force'
            ? '🌐 ユーザーの指示によりWebを強制検索中...'
            : '🌐 Webから最新情報を検索中...';

          steps.push({
            id: 'step_web',
            title: webTitle,
            status: 'processing'
          });
          updateSteps(steps);
          await new Promise(r => setTimeout(r, 1200)); // Web検索は少し長めに
          steps = markAllDone(steps);
        }

        // --- Step 5: 純粋知識参照 (何も外部ソースがない場合) ---
        if (!hasFile && !useRag && !useWeb) {
          steps.push({
            id: 'step_pure',
            title: '学習済み知識を参照中...',
            status: 'processing'
          });
          updateSteps(steps);
          await new Promise(r => setTimeout(r, 600));
          steps = markAllDone(steps);
        }

        // --- Step 6: 回答生成 (共通) ---
        steps.push({ id: 'step_gen', title: '情報を整理して回答を生成中...', status: 'processing' });
        updateSteps(steps);
        await new Promise(r => setTimeout(r, 800));
        steps = markAllDone(steps);

        // 完了処理
        setMessages(prev => prev.map(m => m.id === aiMessageId ? {
          ...m,
          traceMode: finalTraceMode,
          text: finalText,
          rawContent: mockRes.text,
          citations: finalCitations,
          suggestions: mockRes.suggestions,
          isStreaming: false,
          thoughtProcess: steps
        } : m));
        setIsLoading(false);
      };

      simulateSteps();
      return;
    }

    // --- Real API Logic (Backend Mode) ---
    const domainFilterString = currentSettings.domainFilters.length > 0 ? currentSettings.domainFilters.join(', ') : '';
    const searchModeValue = currentSettings.webMode;

    addLog(`[API Request] Sending message with Settings -> RAG: ${currentSettings.ragEnabled}, Web: ${searchModeValue}, Domain: ${domainFilterString || '(none)'}`, 'info');

    const requestBody = {
      inputs: {
        isDebugMode: mockMode === 'BE',
        mock_perplexity_text: mockMode === 'BE' ? MOCK_PERPLEXITY_JSON : '',
        rag_enabled: currentSettings.ragEnabled,
        web_search_mode: searchModeValue,
        search_mode: searchModeValue === 'force' ? 'force' : 'auto',
        domain_filter: domainFilterString,
      },
      query: text,
      user: USER_ID,
      conversation_id: conversationId || '',
      response_mode: 'streaming',
      files: uploadedFileId ? [{ type: 'document', transfer_method: 'local_file', upload_file_id: uploadedFileId }] : []
    };

    try {
      const response = await sendChatMessageApi(requestBody, DIFY_API_URL, DIFY_API_KEY);
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

      let contentBuffer = '';
      let detectedTraceMode = 'knowledge';
      let isConversationIdSynced = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const lines = value.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.substring(6));

            if (data.conversation_id && !conversationId && !isConversationIdSynced) {
              isConversationIdSynced = true;
              creatingConversationIdRef.current = data.conversation_id;
              settingsMapRef.current[data.conversation_id] = currentSettings;
              addLog(`[Search Settings Synced] Settings saved for new conversation: ${data.conversation_id}`, 'info');
              onConversationCreated(data.conversation_id, text);
            }

            if (data.event === 'node_started') {
              const nodeType = data.data?.node_type;
              const title = data.data?.title;
              const nodeId = data.data?.node_id || `node_${Date.now()}`;

              const isSignificantNode =
                nodeType === 'tool' ||
                nodeType === 'document-extractor' ||
                nodeType === 'llm' ||
                (title && title.includes('Knowledge'));

              if (isSignificantNode) {
                let displayTitle = title;
                if (title && (title.includes('Intent') || title.includes('Classif'))) {
                  displayTitle = '質問の意図を解析中...';
                } else if ((title && title.includes('Perplexity')) || nodeType === 'tool') {
                  displayTitle = 'Webから最新情報を検索中...';
                  detectedTraceMode = 'search';
                } else if (nodeType === 'document-extractor') {
                  displayTitle = 'ドキュメントを読込中...';
                  detectedTraceMode = 'document';
                } else if (title && title.includes('Knowledge')) {
                  displayTitle = '社内ナレッジベースを検索中...';
                  detectedTraceMode = 'document';
                } else if (nodeType === 'llm') {
                  displayTitle = '情報を整理して回答を生成中...';
                }

                setMessages(prev => prev.map(m => m.id === aiMessageId ? {
                  ...m,
                  traceMode: detectedTraceMode,
                  thoughtProcess: [
                    ...m.thoughtProcess.map(t => ({ ...t, status: 'done' })),
                    { id: nodeId, title: displayTitle, status: 'processing' }
                  ]
                } : m));
              }
            }
            else if (data.event === 'node_finished') {
              const nodeId = data.data?.node_id;
              if (nodeId) {
                setMessages(prev => prev.map(m => m.id === aiMessageId ? {
                  ...m,
                  thoughtProcess: m.thoughtProcess.map(t => t.id === nodeId ? { ...t, status: 'done' } : t)
                } : m));
              }
            }
            else if (data.event === 'message') {
              if (data.answer) {
                contentBuffer += data.answer;
                const parsed = parseLlmResponse(contentBuffer);
                const isJsonStructure = contentBuffer.trim().startsWith('{') || contentBuffer.trim().startsWith('```');
                const textToDisplay = parsed.isParsed ? parsed.answer : (isJsonStructure ? '' : contentBuffer);
                setMessages(prev => prev.map(m => m.id === aiMessageId ? {
                  ...m,
                  text: textToDisplay,
                  rawContent: contentBuffer,
                  thoughtProcess: m.thoughtProcess
                } : m));
              }
            }
            else if (data.event === 'message_end') {
              const citations = data.metadata?.retriever_resources || [];
              if (citations.length > 0) {
                if (detectedTraceMode === 'knowledge') detectedTraceMode = 'search';
                setMessages(prev => prev.map(m => m.id === aiMessageId ? {
                  ...m,
                  citations: mapCitationsFromApi(citations),
                  traceMode: detectedTraceMode
                } : m));
              }
              if (data.message_id) {
                fetchSuggestions(data.message_id, aiMessageId);
              }
            }
            else if (data.event === 'workflow_finished') {
              let finalText = contentBuffer;
              let finalCitations = [];
              const parsed = parseLlmResponse(finalText);
              if (parsed.isParsed) {
                finalText = parsed.answer;
                if (parsed.citations.length > 0) {
                  finalCitations = mapCitationsFromLLM(parsed.citations).map(citation => {
                    if (currentFileName && !citation.url) {
                      const lowerSource = citation.source.toLowerCase();
                      const lowerCurrent = currentFileName.toLowerCase();
                      const currentBase = lowerCurrent.substring(0, lowerCurrent.lastIndexOf('.'));
                      if (lowerCurrent.includes(lowerSource) || lowerSource.includes(currentBase)) {
                        return { ...citation, source: `[1] ${currentFileName}` };
                      }
                    }
                    return citation;
                  });
                  detectedTraceMode = 'document';
                }
              }
              setMessages(prev => prev.map(m => m.id === aiMessageId ? {
                ...m,
                text: finalText,
                rawContent: contentBuffer,
                citations: m.citations.length > 0 ? m.citations : finalCitations,
                isStreaming: false,
                traceMode: detectedTraceMode,
                thoughtProcess: m.thoughtProcess.map(t => ({ ...t, status: 'done' }))
              } : m));
            }
          } catch (e) { console.warn('JSON Parse Error', e); }
        }
      }
      setIsLoading(false);
    } catch (error) {
      addLog(`[API Error] ${error.message}`, 'error');
      setMessages(prev => prev.map(m => m.id === aiMessageId ? {
        ...m,
        text: `エラー: ${error.message}`,
        isStreaming: false,
        thoughtProcess: m.thoughtProcess.map(t => ({ ...t, status: 'error' }))
      } : m));
      setIsLoading(false);
    }
  };

  const fetchSuggestions = async (msgId, aiMsgId) => {
    try {
      const res = await fetchSuggestionsApi(msgId, USER_ID, DIFY_API_URL, DIFY_API_KEY);
      if (res.result === 'success') {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, suggestions: res.data } : m));
      }
    } catch (e) { /* ignore */ }
  };

  return {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    activeContextFile,
    setActiveContextFile,
    handleSendMessage,
    searchSettings,
    setSearchSettings: updateSearchSettings,
    domainFilters: searchSettings.domainFilters,
    setDomainFilters: (filters) => updateSearchSettings({ ...searchSettings, domainFilters: filters }),
    forceSearch: searchSettings.webMode === 'force',
    setForceSearch: (force) => updateSearchSettings({ ...searchSettings, webMode: force ? 'force' : 'auto' })
  };
};