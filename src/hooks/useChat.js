// src/hooks/useChat.js
import { useState, useEffect, useRef } from 'react';
import { mockMessages } from '../mocks/data';
import { MockStreamGenerator } from '../mocks/MockStreamGenerator';
import { scenarios, scenarioSuggestions } from '../mocks/scenarios';
import { uploadFile, fetchMessagesApi, sendChatMessageApi, fetchSuggestionsApi } from '../api/dify';
import { parseLlmResponse } from '../utils/responseParser';
import { mapCitationsFromApi, mapCitationsFromLLM } from '../utils/citationMapper';
import { createConfigError } from '../utils/errorHandler';

const USER_ID = 'poc-user-01';

const DEFAULT_SEARCH_SETTINGS = {
  ragEnabled: false,
  webMode: 'auto',
  domainFilters: []
};

// パフォーマンス計測用トラッカー
const createPerfTracker = (addLog) => ({
  start: 0,
  firstByte: 0,
  firstToken: 0,
  end: 0,
  charCount: 0,
  steps: [],
  activeNodes: {},

  markStart() { this.start = performance.now(); },
  markFirstByte() { if (!this.firstByte) this.firstByte = performance.now(); },
  markNodeStart(nodeId, title) { this.activeNodes[nodeId] = { title, start: performance.now() }; },
  markNodeEnd(nodeId) {
    const node = this.activeNodes[nodeId];
    if (node) {
      this.steps.push({ name: node.title, duration: performance.now() - node.start });
      delete this.activeNodes[nodeId];
    }
  },
  markFirstToken() { if (!this.firstToken) this.firstToken = performance.now(); },
  incrementChars(text) { this.charCount += (text ? text.length : 0); },
  markEnd() { this.end = performance.now(); },

  logReport(query) {
    const now = performance.now();
    const endTime = this.end || now;
    const totalTime = endTime - this.start;
    const ttfb = this.firstByte ? this.firstByte - this.start : 0;
    const ttft = this.firstToken ? this.firstToken - this.start : 0;
    const thinkingTotal = this.steps.reduce((sum, s) => sum + s.duration, 0);
    const displayDuration = this.firstToken ? (endTime - this.firstToken) : 0;
    const cps = displayDuration > 0 ? (this.charCount / (displayDuration / 1000)) : 0;

    // 1. 開発者ツール向けのリッチなログ（既存）
    console.groupCollapsed(`🚀 [Perf] Message Cycle: "${query.length > 20 ? query.substring(0, 20) + '...' : query}"`);
    console.log(`⏱️ Total Cycle: ${totalTime.toFixed(2)}ms`);
    console.log(`📡 TTFB (Network+Upload): ${ttfb.toFixed(2)}ms`);
    console.log(`👀 TTFT (Wait for Text): ${ttft.toFixed(2)}ms`);
    if (this.steps.length > 0) {
      console.log(`🧠 Thinking Process (Total: ${thinkingTotal.toFixed(2)}ms)`);
      console.table(this.steps.map(s => ({ Step: s.name, Time: `${s.duration.toFixed(2)}ms` })));
    }
    if (this.firstToken) {
       console.log(`📺 Display Duration: ${displayDuration.toFixed(2)}ms`);
       console.log(`⚡ Throughput: ${cps.toFixed(1)} chars/sec (Total: ${this.charCount} chars)`);
    }
    console.groupEnd();

    // 2. ★追加: 「ログをコピー」ボタン用のテキストログ保存
    if (addLog) {
      const shortQuery = query.length > 15 ? query.substring(0, 15) + '...' : query;
      let logText = `[Perf] Cycle: "${shortQuery}" | Total: ${totalTime.toFixed(0)}ms | TTFB: ${ttfb.toFixed(0)}ms | TTFT: ${ttft.toFixed(0)}ms`;
      
      if (this.steps.length > 0) {
        logText += ` | Thinking: ${thinkingTotal.toFixed(0)}ms (${this.steps.length} steps)`;
      }
      if (this.firstToken) {
        logText += ` | Speed: ${cps.toFixed(1)} chars/s`;
      }
      
      addLog(logText, 'info');
      
      // 思考プロセスの詳細も別行で記録（必要であれば）
      if (this.steps.length > 0) {
        const stepsLog = this.steps.map(s => `  - ${s.name}: ${s.duration.toFixed(0)}ms`).join('\n');
        addLog(`[Perf Details]\n${stepsLog}`, 'debug');
      }
    }
  }
});

export const useChat = (mockMode, conversationId, addLog, onConversationCreated, onConversationUpdated, apiKey, apiUrl) => {
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

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

      // 既存セッションファイルのクリア
      setSessionFiles([]);

      if (!conversationId) {
        setMessages([]);
        setIsHistoryLoading(false);
        return;
      }

      setIsHistoryLoading(true);
      setMessages([]);

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
          // --- Real API Logic ---
          if (typeof conversationId === 'string' && conversationId.startsWith('mock_')) {
            addLog(`[useChat] Skipping API call for mock ID in Real mode: ${conversationId}`, 'warn');
          } else {

            if (!apiKey || !apiUrl) {
              setMessages([createConfigError()]);
              setIsHistoryLoading(false);
              return;
            }

            const historyData = await fetchMessagesApi(conversationId, USER_ID, apiUrl, apiKey);
            const chronologicalMessages = (historyData.data || []).sort((a, b) => a.created_at - b.created_at);

            const newMessages = [];
            const restoredFiles = [];
            const seenFileIds = new Set();

            for (const item of chronologicalMessages) {
              const timestamp = item.created_at ? new Date(item.created_at * 1000).toISOString() : new Date().toISOString();

              if (item.query) {
                const msgFiles = item.message_files ? item.message_files.map(f => {
                  let fileName = 'Attached File';

                  if (f.name) {
                    fileName = f.name;
                  } else if (f.filename) {
                    fileName = f.filename;
                  } else if (f.url) {
                    try {
                      const decodedUrl = decodeURIComponent(f.url);
                      const urlFileName = decodedUrl.split('/').pop().split('?')[0];

                      if (urlFileName === 'file-preview' || urlFileName.includes('image_preview')) {
                        const ext = f.mime_type ? `.${f.mime_type.split('/')[1]}` : '';
                        fileName = `添付ファイル${ext}`;
                      } else {
                        fileName = urlFileName;
                      }
                    } catch (e) {
                      fileName = '添付ファイル';
                    }
                  }

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
        setMessages([{ 
          id: 'err_history_load', 
          role: 'system', 
          type: 'error', 
          rawError: error.message,
          timestamp: new Date().toISOString() 
        }]);
      } finally {
        setIsHistoryLoading(false);
      }
    };
    loadHistory();
  }, [conversationId, mockMode, addLog, apiKey, apiUrl]);

  // --- メッセージ送信処理 ---
  const handleSendMessage = async (text, attachments = []) => {
    // ★計測開始
    const tracker = createPerfTracker(addLog);
    tracker.markStart();

    if ((mockMode === 'OFF' || mockMode === 'BE') && (!apiKey || !apiUrl)) {
      const userMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        text: text,
        timestamp: new Date().toISOString(),
        files: attachments.map(f => ({ name: f.name }))
      };
      setMessages(prev => [...prev, userMessage]);

      setTimeout(() => {
        setMessages(prev => [...prev, createConfigError()]);
      }, 200);

      return;
    }

    let uploadedFileIds = [];
    let displayFiles = [];
    const currentSettings = searchSettingsRef.current;

    if (conversationId && onConversationUpdated) {
      onConversationUpdated(conversationId);
    }

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

          setSessionFiles(prev => [...prev, ...uploadedFiles]);

        } catch (e) {
          addLog(`[Upload Error] ${e.message}`, 'error');
          setIsGenerating(false);
          return;
        }
      }
    } else {
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

    const userMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      text: text,
      timestamp: new Date().toISOString(),
      files: displayFiles
    };
    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);

    const aiMessageId = `msg_${Date.now()}_ai`;
    const isFastMode = !currentSettings.ragEnabled && currentSettings.webMode === 'off';

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
      processStatus: null,
      mode: isFastMode ? 'fast' : 'normal'
    }]);

    const allActiveFiles = [...sessionFiles, ...attachments.map(f => ({ name: f.name }))];

    let reader;
    try {
      if (mockMode === 'FE') {
        // --- FE Mock Mode Logic ---
        const useRag = currentSettings.ragEnabled;
        const useWeb = currentSettings.webMode !== 'off';
        const hasFile = allActiveFiles.length > 0;

        let scenarioKey = 'pure';
        if (!useRag && !useWeb) {
          scenarioKey = hasFile ? 'fast_file' : 'fast_pure';
        } else if (hasFile) {
          if (!useRag && !useWeb) scenarioKey = 'file_only';
          else if (!useRag && useWeb) scenarioKey = 'file_web';
          else if (useRag && !useWeb) scenarioKey = 'file_rag';
          else scenarioKey = 'full';
        } else {
          if (useRag && !useWeb) scenarioKey = 'rag_only';
          else if (!useRag && useWeb) scenarioKey = 'web_only';
          else if (useRag && useWeb) scenarioKey = 'hybrid';
        }

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
        let baseScenario = scenarios[scenarioKey] || scenarios['pure'];
        let targetScenario = [];

        if (hasFile && allActiveFiles.length > 0) {
          baseScenario.forEach(step => {
            if (step.data?.node_type === 'document-extractor') {
              if (step.event === 'node_started') {
                allActiveFiles.forEach((file, idx) => {
                  targetScenario.push({
                    ...step,
                    data: {
                      ...step.data,
                      title: 'ドキュメント抽出',
                      node_id: `mock_node_doc_${Date.now()}_${idx}`, 
                      inputs: { target_file: file.name }
                    }
                  });
                });
              } else if (step.event === 'node_finished') {
                allActiveFiles.forEach((file, idx) => {
                  targetScenario.push({
                    ...step,
                    data: {
                      ...step.data,
                      title: 'ドキュメント抽出',
                      node_id: `mock_node_doc_${Date.now()}_${idx}`,
                      status: 'succeeded'
                    }
                  });
                });
              }
            } else {
              targetScenario.push(step);
            }
          });
        } else {
          targetScenario = baseScenario;
        }

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
          files: uploadedFileIds.map(id => ({
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
      let protocolMode = 'PENDING';

      while (true) {
        const { value, done } = await reader.read();
        
        // ★計測: 最初のバイト受信
        tracker.markFirstByte();

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

            // Node Events
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
                  let fileNameToDisplay = '添付ファイル';
                  if (inputs.target_file) {
                    fileNameToDisplay = inputs.target_file;
                  } else {
                    const inputValues = JSON.stringify(inputs);
                    const matchedFile = allActiveFiles.find(f => inputValues.includes(f.name) || inputValues.includes(f.id));
                    if (matchedFile) {
                      fileNameToDisplay = matchedFile.name;
                    } else if (allActiveFiles.length === 1) {
                      fileNameToDisplay = allActiveFiles[0].name;
                    } else if (allActiveFiles.length > 1) {
                      fileNameToDisplay = `${allActiveFiles.length}件のファイル`;
                    }
                  }

                  displayTitle = `ドキュメント「${fileNameToDisplay}」を解析中...`;
                  detectedTraceMode = 'document';
                  iconType = 'document';
                } else if (title && (title.includes('Intent') || title.includes('Classifier'))) {
                  displayTitle = '質問の意図を解析中...';
                  iconType = 'router';
                } else if (title && (title.includes('Rewriter') || title.includes('Query') || title.includes('最適化'))) {
                  displayTitle = '質問の要点を整理中...';
                  iconType = 'reasoning';
                } else if (isWebSearchNode) {
                  const query = inputs.query || capturedOptimizedQuery || text;
                  displayTitle = `Web検索: "${query}"`;
                  detectedTraceMode = 'search';
                  iconType = 'search';
                } else if (nodeType === 'knowledge-retrieval' || (title && title.includes('ナレッジ'))) {
                  const query = inputs.query || capturedOptimizedQuery;
                  displayTitle = query ? `社内知識を検索: "${query}"` : '社内ナレッジベースを検索中...';
                  detectedTraceMode = 'knowledge';
                  iconType = 'retrieval';
                } else if (nodeType === 'llm') {
                  if (!title.includes('Intent') && !title.includes('Classifier') && !title.includes('Rewriter')) {
                    displayTitle = '情報を整理して回答を生成中...';
                    iconType = 'writing';
                  }
                }
                
                // ★計測: ノード開始
                tracker.markNodeStart(nodeId, displayTitle);

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

              // ★計測: ノード終了
              if (nodeId) tracker.markNodeEnd(nodeId);

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

                // ★計測: テキスト受信
                tracker.markFirstToken();
                tracker.incrementChars(data.answer);

                if (protocolMode === 'PENDING') {
                  const trimmed = contentBuffer.trimStart();
                  if (trimmed.length > 0) {
                    protocolMode = trimmed.startsWith('{') ? 'JSON' : 'RAW';
                  }
                }

                let textToDisplay = '';

                if (protocolMode === 'JSON') {
                  const parsed = parseLlmResponse(contentBuffer);
                  textToDisplay = parsed.isParsed ? parsed.answer : ''; 
                } else {
                  textToDisplay = contentBuffer;
                }

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
                fetchSuggestions(data.message_id, aiMessageId);
              }
            }
            else if (data.event === 'workflow_finished') {
              let finalText = contentBuffer;
              let finalCitations = [];
              
              if (protocolMode === 'JSON') {
                const parsed = parseLlmResponse(finalText);
                if (parsed.isParsed) {
                  finalText = parsed.answer;
                  if (parsed.citations.length > 0) {
                    finalCitations = mapCitationsFromLLM(parsed.citations);
                  }
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

      // ★計測完了・レポート出力
      tracker.markEnd();
      tracker.logReport(text);

    } catch (error) {
      addLog(`[Stream Error] ${error.message}`, 'error');
      setMessages(prev => prev.map(m => {
        if (m.id === aiMessageId) {
          return {
            ...m,
            role: 'system',
            type: 'error',
            text: '',
            rawError: error.message,
            isStreaming: false,
            thoughtProcess: []
          };
        }
        return m;
      }));
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

      const res = await fetchSuggestionsApi(msgId, USER_ID, apiUrl, apiKey);

      if (res.result === 'success') {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, suggestions: res.data } : m));
      }
    } catch (e) {
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