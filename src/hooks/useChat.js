// src/hooks/useChat.js
import { useState, useEffect, useRef } from 'react';
import { mockMessages } from '../mockData';
import { MockStreamGenerator } from '../mocks/MockStreamGenerator';
import { scenarios, scenarioSuggestions } from '../mocks/scenarios';
import { uploadFile, fetchMessagesApi, sendChatMessageApi, fetchSuggestionsApi } from '../api/dify';
import { parseLlmResponse } from '../utils/responseParser';
import { mapCitationsFromApi, mapCitationsFromLLM } from '../utils/citationMapper';

const USER_ID = 'poc-user-01';

const DEFAULT_SEARCH_SETTINGS = {
  ragEnabled: false,
  webMode: 'auto',
  domainFilters: []
};

export const useChat = (mockMode, conversationId, addLog, onConversationCreated, onConversationUpdated, apiKey, apiUrl) => {
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // 内部的には sessionFiles として管理するが、外部へは activeContextFiles として公開する
  const [sessionFiles, setSessionFiles] = useState([]);

  const [dynamicMockMessages, setDynamicMockMessages] = useState({});
  const [searchSettings, setSearchSettings] = useState(DEFAULT_SEARCH_SETTINGS);

  const searchSettingsRef = useRef(searchSettings);
  const currentMockScenarioRef = useRef('pure');
  const creatingConversationIdRef = useRef(null);
  const settingsMapRef = useRef({});

  useEffect(() => {
    searchSettingsRef.current = searchSettings;
  }, [searchSettings]);

  const updateSearchSettings = (newSettings) => {
    setSearchSettings(newSettings);
    if (conversationId) {
      settingsMapRef.current[conversationId] = newSettings;
    }
  };

  useEffect(() => {
    if (mockMode === 'FE' && conversationId && messages.length > 0) {
      setDynamicMockMessages((prev) => ({ ...prev, [conversationId]: messages }));
    }
  }, [messages, mockMode, conversationId]);

  // --- 履歴ロード処理 ---
  useEffect(() => {
    const loadHistory = async () => {
      const savedSettings = settingsMapRef.current[conversationId] || DEFAULT_SEARCH_SETTINGS;
      setSearchSettings(savedSettings);

      if (conversationId && conversationId === creatingConversationIdRef.current) {
        addLog(`[useChat] Skip loading/resetting history for just-created conversation: ${conversationId}`, 'info');
        creatingConversationIdRef.current = null;
        return;
      }

      addLog(`[useChat] Conversation changed to: ${conversationId}`, 'info');

      setSessionFiles([]);

      if (conversationId === null) {
        setMessages([]);
        setIsHistoryLoading(false);
        return;
      }

      setIsHistoryLoading(true);
      setMessages([]);

      try {
        if (mockMode === 'FE') {
          await new Promise(r => setTimeout(r, 800));

          let loadedMessages = [];
          if (dynamicMockMessages[conversationId]) {
            loadedMessages = dynamicMockMessages[conversationId];
          } else {
            loadedMessages = mockMessages[conversationId] || [];
          }

          setMessages(loadedMessages);

          const restoredFiles = [];
          const seenFileNames = new Set();

          loadedMessages.forEach(msg => {
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

          if (restoredFiles.length > 0) {
            setSessionFiles(restoredFiles);
            addLog(`[History (FE)] Restored ${restoredFiles.length} files from mock history.`, 'info');
          }

        } else {
          // Real API Logic
          if (typeof conversationId === 'string' && conversationId.startsWith('mock_')) {
            addLog(`[useChat] Skipping API call for mock ID in Real mode: ${conversationId}`, 'warn');
          } else {
            const historyData = await fetchMessagesApi(conversationId, USER_ID, apiUrl, apiKey);
            const chronologicalMessages = (historyData.data || []).sort((a, b) => a.created_at - b.created_at);

            const newMessages = [];
            const restoredFiles = [];
            const seenFileIds = new Set();

            for (const item of chronologicalMessages) {
              const timestamp = item.created_at ? new Date(item.created_at * 1000).toISOString() : new Date().toISOString();

              if (item.query) {
                const msgFiles = item.message_files ? item.message_files.map(f => {
                  const fileData = {
                    id: f.id,
                    name: f.url ? decodeURIComponent(f.url.split('/').pop().split('?')[0]) : 'Attached File',
                    type: f.type
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

            setMessages(newMessages);

            if (restoredFiles.length > 0) {
              setSessionFiles(restoredFiles);
              addLog(`[History] Restored ${restoredFiles.length} files from history.`, 'info');
            }
          }
        }
      } catch (error) {
        addLog(`[History Error] ${error.message}`, 'error');
        setMessages([{ id: 'err', role: 'ai', text: '履歴の読み込みに失敗しました。', timestamp: new Date().toISOString() }]);
      } finally {
        setIsHistoryLoading(false);
      }
    };
    loadHistory();
  }, [conversationId, mockMode, addLog]);

  // --- メッセージ送信処理 ---
  const handleSendMessage = async (text, attachments = []) => {
    let uploadedFileIds = [];
    let displayFiles = [];
    const currentSettings = searchSettingsRef.current;

    if (conversationId && onConversationUpdated) {
      onConversationUpdated(conversationId);
    }

    // 1. ファイルアップロード処理
    if (mockMode === 'OFF') {
      if (attachments.length > 0) {
        setIsGenerating(true);
        try {
          const uploadPromises = attachments.map(file =>
            uploadFile(file, USER_ID, apiUrl, apiKey)
              .then(res => ({ id: res.id, name: file.name, type: 'document' }))
          );

          const uploadedFiles = await Promise.all(uploadPromises);
          uploadedFileIds = uploadedFiles.map(f => f.id);
          displayFiles = uploadedFiles.map(f => ({ name: f.name }));

          // セッションファイルリストを更新（既存 + 新規）
          setSessionFiles(prev => [...prev, ...uploadedFiles]);

        } catch (e) {
          addLog(`[Upload Error] ${e.message}`, 'error');
          setIsGenerating(false);
          return;
        }
      }
    } else {
      // Mock Mode
      if (attachments.length > 0) {
        displayFiles = attachments.map(f => ({ name: f.name }));
        const mockFiles = attachments.map((f, i) => ({
          id: `mock_file_${Date.now()}_${i}`,
          name: f.name
        }));
        setSessionFiles(prev => [...prev, ...mockFiles]);
        uploadedFileIds = mockFiles.map(f => f.id);
      }
    }

    // 2. ユーザーメッセージをUIに追加
    const userMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      text: text,
      timestamp: new Date().toISOString(),
      files: displayFiles
    };
    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);

    // 3. AIメッセージのプレースホルダー生成
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

    let reader;
    try {
      if (mockMode === 'FE') {
        // --- FE Mock Mode Logic ---
        const useRag = currentSettings.ragEnabled;
        const useWeb = currentSettings.webMode !== 'off';
        const hasFile = (attachments.length > 0 || sessionFiles.length > 0);

        let scenarioKey = 'pure';
        if (!hasFile && !useRag && useWeb) scenarioKey = 'web_only';
        else if (!hasFile && useRag && !useWeb) scenarioKey = 'rag_only';
        else if (!hasFile && useRag && useWeb) scenarioKey = 'hybrid';
        else if (hasFile && !useRag && !useWeb) scenarioKey = 'file_only';
        else if (hasFile && !useRag && useWeb) scenarioKey = 'file_web';
        else if (hasFile && useRag && !useWeb) scenarioKey = 'file_rag';
        else if (hasFile && useRag && useWeb) scenarioKey = 'full';

        currentMockScenarioRef.current = scenarioKey;

        let targetConvId = conversationId;
        if (!targetConvId) {
          const newMockId = `mock_gen_${Date.now()}`;
          targetConvId = newMockId;
          creatingConversationIdRef.current = newMockId;
          settingsMapRef.current[newMockId] = currentSettings;
          if (onConversationCreated) {
            onConversationCreated(newMockId, text);
          }
        }

        const generator = new MockStreamGenerator();
        const targetScenario = scenarios[scenarioKey] || scenarios['pure'];
        const stream = generator.getStream(targetScenario, targetConvId);
        reader = stream.pipeThrough(new TextDecoderStream()).getReader();

      } else {
        // --- Real API / BE Mock Logic ---
        const domainFilterString = currentSettings.domainFilters.length > 0 ? currentSettings.domainFilters.join(', ') : '';
        const searchModeValue = currentSettings.webMode;
        const now = new Date();
        const currentTimeStr = now.toLocaleString('ja-JP', {
          year: 'numeric', month: 'long', day: 'numeric',
          weekday: 'long', hour: '2-digit', minute: '2-digit'
        });

        // ★Fix: 既存のセッションファイルIDと、今回アップロードしたファイルIDをマージ
        // setSessionFilesは非同期のため、ここでは直接計算して最新の状態を作る
        const existingFileIds = sessionFiles.map(f => f.id);
        const allActiveFileIds = Array.from(new Set([...existingFileIds, ...uploadedFileIds]));

        const requestBody = {
          inputs: {
            isDebugMode: mockMode === 'BE',
            rag_enabled: currentSettings.ragEnabled ? 'true' : 'false',
            web_search_mode: searchModeValue,
            search_mode: searchModeValue === 'force' ? 'force' : 'auto',
            domain_filter: domainFilterString,
            current_time: currentTimeStr,
          },
          query: text,
          user: USER_ID,
          conversation_id: conversationId || '',
          response_mode: 'streaming',
          // ★Fix: 結合された全てのファイルIDを送信
          files: allActiveFileIds.map(id => ({
            type: 'document',
            transfer_method: 'local_file',
            upload_file_id: id
          }))
        };

        const response = await sendChatMessageApi(requestBody, apiUrl, apiKey);
        reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      }

      // --- Stream Handling ---
      let contentBuffer = '';
      let detectedTraceMode = 'knowledge';
      let isConversationIdSynced = false;
      let capturedOptimizedQuery = null;

      // 思考プロセス表示用：今回添付があればそれを、なければ既存の最後のファイル名を表示
      const currentDisplayFileName = attachments.length > 0
        ? attachments[0].name
        : (sessionFiles.length > 0 ? sessionFiles[sessionFiles.length - 1].name : null);

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
              if (mockMode !== 'FE') {
                creatingConversationIdRef.current = data.conversation_id;
                settingsMapRef.current[data.conversation_id] = currentSettings;
                onConversationCreated(data.conversation_id, text);
              }
            }

            if (data.event === 'node_started') {
              const nodeType = data.data?.node_type;
              const title = data.data?.title;
              const nodeId = data.data?.node_id || `node_${Date.now()}`;
              const inputs = data.data?.inputs || {};
              const isWebSearchNode = (nodeType === 'tool') && (title && (title.includes('Web') || title.includes('Search') || title.includes('Perplexity')));
              const isSignificantNode = nodeType === 'document-extractor' || (title && (title.includes('Intent') || title.includes('Classifier'))) || (title && (title.includes('Rewriter') || title.includes('Query') || title.includes('最適化'))) || isWebSearchNode || nodeType === 'knowledge-retrieval' || (title && title.includes('ナレッジ')) || nodeType === 'llm';
              const isAssigner = nodeType === 'assigner' || (title && (title.includes('変数') || title.includes('Variable') || title.includes('Set Opt')));

              if (isSignificantNode && !isAssigner) {
                let displayTitle = title;
                let iconType = 'default';
                if (nodeType === 'document-extractor') {
                  const fileNameToDisplay = currentDisplayFileName || '添付ファイル';
                  displayTitle = `ドキュメント「${fileNameToDisplay}」を解析中...`;
                  detectedTraceMode = 'document';
                  iconType = 'document';
                }
                else if (title && (title.includes('Intent') || title.includes('Classifier'))) {
                  displayTitle = '質問の意図を解析中...';
                  iconType = 'router';
                }
                else if (title && (title.includes('Rewriter') || title.includes('Query') || title.includes('最適化'))) {
                  displayTitle = '質問の要点を整理中...';
                  iconType = 'reasoning';
                }
                else if (isWebSearchNode) {
                  const query = inputs.query || capturedOptimizedQuery || text;
                  displayTitle = `Web検索: "${query}"`;
                  detectedTraceMode = 'search';
                  iconType = 'search';
                }
                else if (nodeType === 'knowledge-retrieval' || (title && title.includes('ナレッジ'))) {
                  const query = inputs.query || capturedOptimizedQuery;
                  displayTitle = query ? `社内知識を検索: "${query}"` : '社内ナレッジベースを検索中...';
                  detectedTraceMode = 'knowledge';
                  iconType = 'retrieval';
                }
                else if (nodeType === 'llm') {
                  if (!title.includes('Intent') && !title.includes('Classifier') && !title.includes('Rewriter')) {
                    displayTitle = '情報を整理して回答を生成中...';
                    iconType = 'writing';
                  }
                }
                setMessages(prev => prev.map(m => m.id === aiMessageId ? {
                  ...m,
                  traceMode: detectedTraceMode,
                  thoughtProcess: [
                    ...m.thoughtProcess.map(t => ({ ...t, status: 'done' })),
                    { id: nodeId, title: displayTitle, status: 'processing', iconType: iconType }
                  ]
                } : m));
              }
            }
            else if (data.event === 'node_finished') {
              const nodeId = data.data?.node_id;
              const title = data.data?.title;
              const outputs = data.data?.outputs;
              if (title && (title.includes('Rewriter') || title.includes('Query') || title.includes('最適化'))) {
                const generatedText = outputs?.text || outputs?.answer;
                if (generatedText) capturedOptimizedQuery = generatedText.trim();
              }
              if (title && (title.includes('Intent') || title.includes('Classifier')) && outputs?.text) {
                const decision = outputs.text.trim();
                let resultText = '';
                if (decision.includes('SEARCH')) resultText = '判定: Web検索モード';
                else if (decision.includes('CHAT')) resultText = '判定: 雑談モード';
                else if (decision.includes('LOGICAL')) resultText = '判定: 論理回答モード';
                else if (decision.includes('ANSWER')) resultText = '判定: 内部知識モード';
                else if (decision.includes('HYBRID')) resultText = '判定: ハイブリッド検索モード';
                if (resultText && nodeId) {
                  setMessages(prev => prev.map(m => m.id === aiMessageId ? {
                    ...m,
                    thoughtProcess: m.thoughtProcess.map(t =>
                      t.id === nodeId ? { ...t, title: resultText, status: 'done' } : t
                    )
                  } : m));
                }
              } else if (nodeId) {
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
                setMessages(prev => prev.map(m => m.id === aiMessageId ? {
                  ...m,
                  citations: mapCitationsFromApi(citations),
                  traceMode: detectedTraceMode
                } : m));
              }
              if (data.message_id) {
                // message_id が確定したタイミングでサジェストを取得
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
                  finalCitations = mapCitationsFromLLM(parsed.citations);
                }
              }
              setMessages(prev => prev.map(m => m.id === aiMessageId ? {
                ...m,
                text: finalText,
                rawContent: contentBuffer,
                citations: m.citations.length > 0 ? m.citations : finalCitations,
                isStreaming: false,
                traceMode: detectedTraceMode,
                thoughtProcess: m.thoughtProcess.map(t => {
                  if (t.title === '情報を整理して回答を生成中...') {
                    return { ...t, title: '回答の生成が完了しました', status: 'done', iconType: 'check' };
                  }
                  return { ...t, status: 'done' };
                })
              } : m));
            }
          } catch (e) {
            console.error('Stream Parse Error:', e);
          }
        }
      }
      setIsGenerating(false);

    } catch (error) {
      addLog(`[Stream Error] ${error.message}`, 'error');
      setMessages(prev => prev.map(m => m.id === aiMessageId ? {
        ...m,
        text: `エラー: ${error.message}`,
        isStreaming: false,
        thoughtProcess: m.thoughtProcess.map(t => ({ ...t, status: 'error' }))
      } : m));
      setIsGenerating(false);
    }
  };

  const fetchSuggestions = async (msgId, aiMsgId) => {
    try {
      if (mockMode === 'FE') {
        const key = currentMockScenarioRef.current;
        const mockData = scenarioSuggestions[key] || [];
        await new Promise(resolve => setTimeout(resolve, 500));
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, suggestions: mockData } : m));
        return;
      }

      // ★Fix: DIFY_API_URL/KEY ではなく、スコープ内の変数(apiUrl, apiKey)を使用
      const res = await fetchSuggestionsApi(msgId, USER_ID, apiUrl, apiKey);

      if (res.result === 'success') {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, suggestions: res.data } : m));
      }
    } catch (e) {
      // ★Fix: エラーを握りつぶさずログに出力（デバッグ用）
      addLog(`[Suggestions Error] ${e.message}`, 'error');
      console.error('[Suggestions Error]', e);
    }
  };

  return {
    messages,
    setMessages,
    isGenerating,
    isHistoryLoading,
    setIsLoading: setIsGenerating,
    // ★重要変更: 内部名 sessionFiles を外部向けに activeContextFiles として公開
    activeContextFiles: sessionFiles,
    setActiveContextFiles: setSessionFiles,
    handleSendMessage,
    searchSettings,
    setSearchSettings: updateSearchSettings,
    domainFilters: searchSettings.domainFilters,
    setDomainFilters: (filters) => updateSearchSettings({ ...searchSettings, domainFilters: filters }),
    forceSearch: searchSettings.webMode === 'force',
    setForceSearch: (force) => updateSearchSettings({ ...searchSettings, webMode: force ? 'force' : 'auto' })
  };
};