// src/hooks/useChat.js
import { useState, useEffect, useRef } from 'react';
import {
  mockMessages,
  mockResPure, mockResWebOnly, mockResRagOnly, mockResHybrid,
  mockResFileOnly, mockResFileWeb, mockResFileRag, mockResFull
} from '../mockData';
import { uploadFile, fetchMessagesApi, sendChatMessageApi, fetchSuggestionsApi } from '../api/dify';
import { parseLlmResponse } from '../utils/responseParser';
import { mapCitationsFromApi, mapCitationsFromLLM } from '../utils/citationMapper';
import { formatConversationHistory } from '../utils/historyFormatter';

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

  // ★ ステータス分離
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

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
      setActiveContextFile(null);

      if (conversationId === null) {
        setMessages([]);
        setIsHistoryLoading(false);
        return;
      }

      // ★ 履歴ロード開始
      setIsHistoryLoading(true);
      setMessages([]);

      try {
        if (mockMode === 'FE') {
          // 演出のため少し長めの遅延 (0.8s) を入れる
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

  const handleSendMessage = async (text, attachment = null) => {
    // ... (既存の送信ロジック、変更なし) ...
    // 長くなるため省略しますが、前回のコードと同じ内容です
    // isGenerating を使用します
    let uploadedFileId = null;
    let displayFiles = [];
    const currentFileName = attachment?.name || activeContextFile?.name;
    const currentSettings = searchSettingsRef.current;
    if (conversationId && onConversationUpdated) { onConversationUpdated(conversationId); }
    if (mockMode === 'OFF') {
      if (attachment) {
        setIsGenerating(true);
        try {
          const uploadRes = await uploadFile(attachment, USER_ID, DIFY_API_URL, DIFY_API_KEY);
          uploadedFileId = uploadRes.id;
          const newContextFile = { id: uploadedFileId, name: attachment.name, type: 'document' };
          displayFiles = [{ name: attachment.name }];
          setActiveContextFile(newContextFile);
        } catch (e) { addLog(`[Upload Error] ${e.message}`, 'error'); setIsGenerating(false); return; }
      } else if (activeContextFile) { uploadedFileId = activeContextFile.id; displayFiles = [{ name: activeContextFile.name }]; }
    } else {
      if (attachment) { displayFiles = [{ name: attachment.name }]; setActiveContextFile({ id: 'mock_id', name: attachment.name }); }
    }
    const userMessage = { id: `msg_${Date.now()}_user`, role: 'user', text: text, timestamp: new Date().toISOString(), files: displayFiles };
    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    const aiMessageId = `msg_${Date.now()}_ai`;
    setMessages(prev => [...prev, { id: aiMessageId, role: 'ai', text: '', rawContent: '', citations: [], suggestions: [], isStreaming: true, timestamp: new Date().toISOString(), traceMode: 'knowledge', thoughtProcess: [], processStatus: null }]);

    // Mock Mode
    if (mockMode === 'FE') {
      const hasFile = !!(attachment || activeContextFile);
      const useRag = currentSettings.ragEnabled;
      const useWeb = currentSettings.webMode !== 'off';
      let mockRes;
      let finalTraceMode = 'knowledge';
      if (!hasFile && !useRag && !useWeb) { mockRes = mockResPure; finalTraceMode = 'knowledge'; }
      else if (!hasFile && !useRag && useWeb) { mockRes = mockResWebOnly; finalTraceMode = 'search'; }
      else if (!hasFile && useRag && !useWeb) { mockRes = mockResRagOnly; finalTraceMode = 'document'; }
      else if (!hasFile && useRag && useWeb) { mockRes = mockResHybrid; finalTraceMode = 'search'; }
      else if (hasFile && !useRag && !useWeb) { mockRes = mockResFileOnly; finalTraceMode = 'document'; }
      else if (hasFile && !useRag && useWeb) { mockRes = mockResFileWeb; finalTraceMode = 'document'; }
      else if (hasFile && useRag && !useWeb) { mockRes = mockResFileRag; finalTraceMode = 'document'; }
      else if (hasFile && useRag && useWeb) { mockRes = mockResFull; finalTraceMode = 'document'; }
      let finalText = mockRes.text;
      let finalCitations = [...(mockRes.citations || [])];
      if (hasFile && currentFileName) { finalText = finalText.replace(/{filename}/g, currentFileName); finalCitations = finalCitations.map(c => ({ ...c, source: c.source.replace(/{filename}/g, currentFileName) })); }
      if (!conversationId) {
        const newMockId = `mock_gen_${Date.now()}`;
        creatingConversationIdRef.current = newMockId;
        settingsMapRef.current[newMockId] = currentSettings;
        if (onConversationCreated) { onConversationCreated(newMockId, text); }
      }
      const simulateSteps = async () => {
        let steps = [];
        const updateSteps = (newSteps) => { setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, thoughtProcess: newSteps } : m)); };
        const markAllDone = (currentSteps) => currentSteps.map(s => ({ ...s, status: 'done' }));
        steps.push({ id: 'step1', title: 'ユーザーの意図を解析中...', status: 'processing' }); updateSteps(steps); await new Promise(r => setTimeout(r, 600)); steps = markAllDone(steps);
        if (hasFile) { steps.push({ id: 'step_file', title: `ドキュメント「${currentFileName}」を読込中...`, status: 'processing' }); updateSteps(steps); await new Promise(r => setTimeout(r, 800)); steps = markAllDone(steps); }
        if (useRag) { steps.push({ id: 'step_rag', title: '📚 社内ナレッジベースを検索中...', status: 'processing' }); updateSteps(steps); await new Promise(r => setTimeout(r, 800)); steps = markAllDone(steps); }
        if (useWeb) { const webTitle = currentSettings.webMode === 'force' ? '🌐 ユーザーの指示によりWebを強制検索中...' : '🌐 Webから最新情報を検索中...'; steps.push({ id: 'step_web', title: webTitle, status: 'processing' }); updateSteps(steps); await new Promise(r => setTimeout(r, 1200)); steps = markAllDone(steps); }
        if (!hasFile && !useRag && !useWeb) { steps.push({ id: 'step_pure', title: '学習済み知識を参照中...', status: 'processing' }); updateSteps(steps); await new Promise(r => setTimeout(r, 600)); steps = markAllDone(steps); }
        steps.push({ id: 'step_gen', title: '情報を整理して回答を生成中...', status: 'processing' }); updateSteps(steps); await new Promise(r => setTimeout(r, 800)); steps = markAllDone(steps);
        setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, traceMode: finalTraceMode, text: finalText, rawContent: mockRes.text, citations: finalCitations, suggestions: mockRes.suggestions, isStreaming: false, thoughtProcess: steps } : m));
        setIsGenerating(false);
      };
      simulateSteps();
      return;
    }
    // Real API Mode
    const domainFilterString = currentSettings.domainFilters.length > 0 ? currentSettings.domainFilters.join(', ') : '';
    const searchModeValue = currentSettings.webMode;

    // ★ 現在時刻をフォーマット (例: 2025年12月9日 火曜日 15:30)
    const now = new Date();
    const currentTimeStr = now.toLocaleString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric',
      weekday: 'long', hour: '2-digit', minute: '2-digit'
    });

    // 現在の messages (State) は今回の発言を含まない「過去ログ」として機能します
    const previousConversations = formatConversationHistory(messages);

    // ログ出力: BEモード または OFFモード(本番) の場合、送信内容を出力
    if (mockMode === 'BE' || mockMode === 'OFF') {
      addLog(
        `[Context Injection] Sending History (${previousConversations.length} chars):\n---\n${previousConversations}\n---`,
        'info' // 目立つように info レベルで出力
      );
    }

    const requestBody = {
      inputs: {
        isDebugMode: mockMode === 'BE',
        rag_enabled: currentSettings.ragEnabled ? 'true' : 'false',
        web_search_mode: searchModeValue,
        search_mode: searchModeValue === 'force' ? 'force' : 'auto',
        domain_filter: domainFilterString,
        current_time: currentTimeStr, // ★ ここで時間を注入
        // Difyの「開始」ノードに追加した変数名と一致させること
        previous_conversations: previousConversations
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
      let capturedOptimizedQuery = null;

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
              onConversationCreated(data.conversation_id, text);
            }

            // ★ 思考プロセスの可視化ロジック (node_started)
            if (data.event === 'node_started') {
              const nodeType = data.data?.node_type;
              const title = data.data?.title;
              const nodeId = data.data?.node_id || `node_${Date.now()}`;
              const inputs = data.data?.inputs || {};

              const isWebSearchNode = (nodeType === 'tool') && (title && (title.includes('Web') || title.includes('Search') || title.includes('Perplexity')));

              // 表示対象ノードを厳選 (Assigner等は除外)
              const isSignificantNode =
                nodeType === 'document-extractor' ||
                (title && (title.includes('Intent') || title.includes('Classifier'))) ||
                (title && (title.includes('Rewriter') || title.includes('Query') || title.includes('最適化'))) ||
                isWebSearchNode ||
                nodeType === 'knowledge-retrieval' || (title && title.includes('ナレッジ')) ||
                nodeType === 'llm';

              // Assigner（変数代入）は強制的に除外
              const isAssigner = nodeType === 'assigner' || (title && (title.includes('変数') || title.includes('Variable') || title.includes('Set Opt')));

              if (isSignificantNode && !isAssigner) {
                let displayTitle = title;
                let iconType = 'default'; // ★ 追加: アイコン種別

                // 1. ファイル解析
                if (nodeType === 'document-extractor') {
                  // もし currentFileName が未定義なら attachment.name を参照、それもなければフォールバック
                  const fileNameToDisplay = currentFileName || attachment?.name || '添付ファイル';
                  displayTitle = `ドキュメント「${fileNameToDisplay}」を解析中...`;
                  detectedTraceMode = 'document';
                  iconType = 'document';
                }
                // 2. 意図分類
                else if (title && (title.includes('Intent') || title.includes('Classifier'))) {
                  displayTitle = '質問の意図を解析中...';
                  iconType = 'router';
                }
                // 3. クエリ最適化 (Query Rewriter)
                else if (title && (title.includes('Rewriter') || title.includes('Query') || title.includes('最適化'))) {
                  displayTitle = '質問の要点を整理中...';
                  iconType = 'reasoning'; // AIの思考系
                }
                // 4. Web検索
                else if (isWebSearchNode) {
                  const query = inputs.query || capturedOptimizedQuery || text;
                  displayTitle = `Web検索: "${query}"`;
                  detectedTraceMode = 'search';
                  iconType = 'search';
                }
                // 5. RAG検索
                else if (nodeType === 'knowledge-retrieval' || (title && title.includes('ナレッジ'))) {
                  const query = inputs.query || capturedOptimizedQuery;
                  if (query) {
                    displayTitle = `社内知識を検索: "${query}"`;
                  } else {
                    displayTitle = '社内ナレッジベースを検索中...';
                  }
                  detectedTraceMode = 'knowledge';
                  iconType = 'retrieval';
                }
                // 6. LLM (回答生成)
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
                    // ★ iconType を保存
                    { id: nodeId, title: displayTitle, status: 'processing', iconType: iconType }
                  ]
                } : m));
              }
            }
            // ★ 判定結果・出力のキャプチャ (node_finished)
            else if (data.event === 'node_finished') {
              const nodeId = data.data?.node_id;
              const title = data.data?.title;
              const outputs = data.data?.outputs;

              // ▼▼▼ 追加開始: 特定ノードの生出力をデバッグログに記録 ▼▼▼
              if (title === 'Perplexity Search' || title === 'LOGICAL LLM') {
                addLog(
                  `[API Raw] Node: ${title}\n${JSON.stringify(outputs, null, 2)}`,
                  'debug' // ログレベルは debug または info
                );
              }
              // ▲▲▲ 追加終了 ▲▲▲

              // A. Query Rewriter の出力をキャプチャ
              if (title && (title.includes('Rewriter') || title.includes('Query') || title.includes('最適化'))) {
                // ★ 修正: outputs.text だけでなく outputs.answer もチェックする
                if (outputs) {
                  const generatedText = outputs.text || outputs.answer;
                  if (generatedText) {
                    capturedOptimizedQuery = generatedText.trim();
                  }
                }
              }

              // B. 意図分類の結果表示
              if (title && (title.includes('Intent') || title.includes('Classifier')) && outputs?.text) {
                const decision = outputs.text.trim();
                let resultText = '';
                if (decision.includes('SEARCH')) resultText = '判定: Web検索モード';
                else if (decision.includes('CHAT')) resultText = '判定: 雑談モード';
                else if (decision.includes('LOGICAL')) resultText = '判定: 論理回答モード';
                else if (decision.includes('ANSWER')) resultText = '判定: 内部知識モード';

                if (resultText) {
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
            // メッセージ本文のストリーミング
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
            // 完了処理 (message_end)
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
            // ★ ワークフロー完了 (workflow_finished)
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
                  // もし最後のステップが「生成中」なら「完了」に書き換え
                  if (t.title === '情報を整理して回答を生成中...') {
                    return { ...t, title: '回答の生成が完了しました', status: 'done', iconType: 'check' };
                  }
                  return { ...t, status: 'done' };
                })
              } : m));
            }
          } catch (e) {
            // ignore
          }
        }
      }
      setIsGenerating(false);

    } catch (error) {
      addLog(`[API Error] ${error.message}`, 'error');
      setMessages(prev => prev.map(m => m.id === aiMessageId ? {
        ...m,
        text: `エラー: ${error.message}`,
        isStreaming: false,
        thoughtProcess: m.thoughtProcess.map(t => ({ ...t, status: 'error' }))
      } : m));
      setIsGenerating(false);
    }
  };

  const fetchSuggestions = async (msgId, aiMsgId) => { try { const res = await fetchSuggestionsApi(msgId, USER_ID, DIFY_API_URL, DIFY_API_KEY); if (res.result === 'success') { setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, suggestions: res.data } : m)); } } catch (e) { /* ignore */ } };

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