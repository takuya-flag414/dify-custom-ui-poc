// src/hooks/useChat.js
import { useState, useEffect, useRef } from 'react';
// 既存の mockMessages は履歴ロード用に残し、新しいモックシステムをインポート
import { mockMessages } from '../mockData';
import { MockStreamGenerator } from '../mocks/MockStreamGenerator';
import { scenarios, scenarioSuggestions } from '../mocks/scenarios';
import { uploadFile, fetchMessagesApi, sendChatMessageApi, fetchSuggestionsApi } from '../api/dify';
import { parseLlmResponse } from '../utils/responseParser';
import { mapCitationsFromApi, mapCitationsFromLLM } from '../utils/citationMapper';

const DIFY_API_KEY = import.meta.env.VITE_DIFY_API_KEY;
const DIFY_API_URL = import.meta.env.VITE_DIFY_API_URL;
const USER_ID = 'poc-user-01';

const DEFAULT_SEARCH_SETTINGS = {
  ragEnabled: false,
  webMode: 'auto',
  domainFilters: []
};

export const useChat = (mockMode, conversationId, addLog, onConversationCreated, onConversationUpdated) => {
  const [messages, setMessages] = useState([]);

  // ステータス管理
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const [activeContextFile, setActiveContextFile] = useState(null);
  const [dynamicMockMessages, setDynamicMockMessages] = useState({});

  const [searchSettings, setSearchSettings] = useState(DEFAULT_SEARCH_SETTINGS);
  const searchSettingsRef = useRef(searchSettings);
  
  // 現在実行中のFEシナリオキーを保持 (fetchSuggestionsで使用)
  const currentMockScenarioRef = useRef('pure');

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

  // FEモード時: メッセージ履歴を一時保存して、会話切り替え時に復元できるようにする
  useEffect(() => {
    if (mockMode === 'FE' && conversationId && messages.length > 0) {
      setDynamicMockMessages((prev) => ({ ...prev, [conversationId]: messages }));
    }
  }, [messages, mockMode, conversationId]);

  // 履歴ロード処理
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
      setActiveContextFile(null);

      if (conversationId === null) {
        setMessages([]);
        setIsHistoryLoading(false);
        return;
      }

      setIsHistoryLoading(true);
      setMessages([]);

      try {
        if (mockMode === 'FE') {
          // 演出のため少し遅延
          await new Promise(r => setTimeout(r, 800));

          if (dynamicMockMessages[conversationId]) {
            setMessages(dynamicMockMessages[conversationId]);
          } else {
            setMessages(mockMessages[conversationId] || []);
          }
        }
        else {
          if (typeof conversationId === 'string' && conversationId.startsWith('mock_')) {
            addLog(`[useChat] Skipping API call for mock ID in Real mode: ${conversationId}`, 'warn');
          } else {
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

  // メッセージ送信処理
  const handleSendMessage = async (text, attachment = null) => {
    let uploadedFileId = null;
    let displayFiles = [];
    const currentFileName = attachment?.name || activeContextFile?.name;
    const currentSettings = searchSettingsRef.current;

    // 1. 会話ID更新通知
    if (conversationId && onConversationUpdated) {
      onConversationUpdated(conversationId);
    }

    // 2. ファイルアップロード処理 (Mock/Real共通化)
    if (mockMode === 'OFF') {
      if (attachment) {
        setIsGenerating(true);
        try {
          const uploadRes = await uploadFile(attachment, USER_ID, DIFY_API_URL, DIFY_API_KEY);
          uploadedFileId = uploadRes.id;
          const newContextFile = { id: uploadedFileId, name: attachment.name, type: 'document' };
          displayFiles = [{ name: attachment.name }];
          setActiveContextFile(newContextFile);
        } catch (e) {
          addLog(`[Upload Error] ${e.message}`, 'error');
          setIsGenerating(false);
          return;
        }
      } else if (activeContextFile) {
        uploadedFileId = activeContextFile.id;
        displayFiles = [{ name: activeContextFile.name }];
      }
    } else {
      // FE/BE Mock
      if (attachment) {
        displayFiles = [{ name: attachment.name }];
        // モック用にダミーIDを設定
        uploadedFileId = 'mock_file_id'; 
        setActiveContextFile({ id: uploadedFileId, name: attachment.name });
      } else if (activeContextFile) {
        uploadedFileId = activeContextFile.id;
        displayFiles = [{ name: activeContextFile.name }];
      }
    }

    // 3. ユーザーメッセージをUIに追加
    const userMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      text: text,
      timestamp: new Date().toISOString(),
      files: displayFiles
    };
    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);

    // 4. AIメッセージのプレースホルダー追加
    const aiMessageId = `msg_${Date.now()}_ai`;
    setMessages(prev => [...prev, {
      id: aiMessageId,
      role: 'ai',
      text: '',
      rawContent: '',
      citations: [],
      suggestions: [],
      isStreaming: true, // ★ストリーミング開始
      timestamp: new Date().toISOString(),
      traceMode: 'knowledge',
      thoughtProcess: [],
      processStatus: null
    }]);

    // =================================================================
    // ★ Unified Stream Logic: モックと本番でReaderの取得元だけを変える
    // =================================================================
    let reader;

    try {
      if (mockMode === 'FE') {
        // --- [A] FEモード: MockStreamGeneratorを使用 ---
        
        // 1. 設定値の取得
        const useRag = currentSettings.ragEnabled;
        const useWeb = currentSettings.webMode !== 'off'; // 'auto' or 'force'
        const hasFile = !!(attachment || activeContextFile);

        // 2. 8パターンに対応するシナリオキーの決定
        let scenarioKey = 'pure'; // Default

        if (!hasFile && !useRag && useWeb) scenarioKey = 'web_only';
        else if (!hasFile && useRag && !useWeb) scenarioKey = 'rag_only';
        else if (!hasFile && useRag && useWeb) scenarioKey = 'hybrid';
        else if (hasFile && !useRag && !useWeb) scenarioKey = 'file_only';
        else if (hasFile && !useRag && useWeb) scenarioKey = 'file_web';
        else if (hasFile && useRag && !useWeb) scenarioKey = 'file_rag';
        else if (hasFile && useRag && useWeb) scenarioKey = 'full';

        // ★ Refに保存 (fetchSuggestionsで使用)
        currentMockScenarioRef.current = scenarioKey;

        // 3. 会話IDの擬似生成 (新規の場合)
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

        addLog(`[Mock] Generating stream from scenario: ${scenarioKey}`, 'info');
        
        const generator = new MockStreamGenerator();
        
        // ★ 安全策: 指定したキーがない場合は 'pure' にフォールバックする
        const targetScenario = scenarios[scenarioKey] || scenarios['pure'];
        
        if (!targetScenario) {
          throw new Error(`Scenario not found: ${scenarioKey}`);
        }

        // シナリオを取得し、ストリームを生成
        const stream = generator.getStream(targetScenario, targetConvId);
        
        // TextDecoderStreamを通してReaderを取得 (本番と同じ形にする)
        reader = stream.pipeThrough(new TextDecoderStream()).getReader();

      } else {
        // --- [B] 本番/BE Mockモード: 実際のAPIコール ---

        const domainFilterString = currentSettings.domainFilters.length > 0 ? currentSettings.domainFilters.join(', ') : '';
        const searchModeValue = currentSettings.webMode;
        
        const now = new Date();
        const currentTimeStr = now.toLocaleString('ja-JP', {
          year: 'numeric', month: 'long', day: 'numeric',
          weekday: 'long', hour: '2-digit', minute: '2-digit'
        });

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
          files: uploadedFileId ? [{ type: 'document', transfer_method: 'local_file', upload_file_id: uploadedFileId }] : []
        };

        const response = await sendChatMessageApi(requestBody, DIFY_API_URL, DIFY_API_KEY);
        reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      }

      // =================================================================
      // ★ 共通ストリーム処理ループ (本番・モックで完全に同じロジック)
      // =================================================================
      
      let contentBuffer = '';
      let detectedTraceMode = 'knowledge';
      let isConversationIdSynced = false;
      let capturedOptimizedQuery = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const lines = value.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.substring(6));

            // 会話ID同期 (初回のみ)
            if (data.conversation_id && !conversationId && !isConversationIdSynced) {
              isConversationIdSynced = true;
              if (mockMode !== 'FE') { // FEモードは上で処理済み
                creatingConversationIdRef.current = data.conversation_id;
                settingsMapRef.current[data.conversation_id] = currentSettings;
                onConversationCreated(data.conversation_id, text);
              }
            }

            // --- イベント処理 ---
            
            // 1. node_started (思考プロセスの可視化)
            if (data.event === 'node_started') {
              const nodeType = data.data?.node_type;
              const title = data.data?.title;
              const nodeId = data.data?.node_id || `node_${Date.now()}`;
              const inputs = data.data?.inputs || {};

              const isWebSearchNode = (nodeType === 'tool') && (title && (title.includes('Web') || title.includes('Search') || title.includes('Perplexity')));

              // 表示対象ノードを厳選
              const isSignificantNode =
                nodeType === 'document-extractor' ||
                (title && (title.includes('Intent') || title.includes('Classifier'))) ||
                (title && (title.includes('Rewriter') || title.includes('Query') || title.includes('最適化'))) ||
                isWebSearchNode ||
                nodeType === 'knowledge-retrieval' || (title && title.includes('ナレッジ')) ||
                nodeType === 'llm';

              // Assigner除外
              const isAssigner = nodeType === 'assigner' || (title && (title.includes('変数') || title.includes('Variable') || title.includes('Set Opt')));

              if (isSignificantNode && !isAssigner) {
                let displayTitle = title;
                let iconType = 'default';

                if (nodeType === 'document-extractor') {
                  const fileNameToDisplay = currentFileName || attachment?.name || '添付ファイル';
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
            
            // 2. node_finished (完了・出力キャプチャ)
            else if (data.event === 'node_finished') {
              const nodeId = data.data?.node_id;
              const title = data.data?.title;
              const outputs = data.data?.outputs;

              if (title === 'Perplexity Search' || title === 'LOGICAL LLM') {
                addLog(`[API Raw] Node: ${title}\n${JSON.stringify(outputs, null, 2)}`, 'debug');
              }

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
              }
              else if (nodeId) {
                setMessages(prev => prev.map(m => m.id === aiMessageId ? {
                  ...m,
                  thoughtProcess: m.thoughtProcess.map(t => t.id === nodeId ? { ...t, status: 'done' } : t)
                } : m));
              }
            }
            
            // 3. message (回答ストリーミング)
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
            
            // 4. message_end (完了メタデータ・出典)
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
                fetchSuggestions(data.message_id, aiMessageId);
              }
            }
            
            // 5. workflow_finished (最終仕上げ)
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

  // 推奨質問取得
  const fetchSuggestions = async (msgId, aiMsgId) => {
    try {
      // FEモードの場合: Refに保存したシナリオキーに基づいてモックデータを返す
      if (mockMode === 'FE') {
        const key = currentMockScenarioRef.current;
        const mockData = scenarioSuggestions[key] || [];
        
        // 少し遅延させてリアリティを出す
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, suggestions: mockData } : m));
        return;
      }

      // 本番モード: APIコール
      const res = await fetchSuggestionsApi(msgId, USER_ID, DIFY_API_URL, DIFY_API_KEY);
      if (res.result === 'success') {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, suggestions: res.data } : m));
      }
    } catch (e) {
      // ignore
    }
  };

  return {
    messages,
    setMessages,
    isGenerating,
    isHistoryLoading,
    setIsLoading: setIsGenerating,
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