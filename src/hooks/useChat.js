// src/hooks/useChat.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { mockMessages } from '../mocks/data';
import { scenarioSuggestions } from '../mocks/scenarios';
// ★変更: Adapterをインポート
import { ChatServiceAdapter } from '../services/ChatServiceAdapter';
import { fetchMessagesApi, fetchSuggestionsApi, stopGenerationApi } from '../api/dify';
import { parseLlmResponse } from '../utils/responseParser';
import { extractJsonFromLlmOutput } from '../utils/llmOutputParser';
import { mapCitationsFromApi, mapCitationsFromLLM } from '../utils/citationMapper';
import { createConfigError } from '../utils/errorHandler';

const DEFAULT_SEARCH_SETTINGS = {
  ragEnabled: 'auto',
  webMode: 'auto',
  domainFilters: []
};

// ★ノード名マッピングテーブル: YMLのノード名 → 表示テキスト・アイコン
const NODE_DISPLAY_MAP = {
  // LLM処理ノード - クエリ処理
  'LLM_Query_Rewrite': { title: '質問の要点を整理中...', icon: 'reasoning' },
  'LLM_Intent_Analysis': { title: '質問の意図を解析中...', icon: 'router' },

  // LLM処理ノード - 回答生成 (Efficient スタイル)
  'LLM_Hybrid_Efficient': { title: '情報を統合して回答を生成中...', icon: 'writing' },
  'LLM_Doc_Efficient': { title: 'ドキュメントを分析して回答を生成中...', icon: 'writing' },
  'LLM_Search_Efficient': { title: '検索結果から回答を生成中...', icon: 'writing' },
  'LLM_General_Efficient': { title: '回答を生成中...', icon: 'writing' },
  'LLM_Chat_Efficient': { title: '応答を準備中...', icon: 'writing' },
  'LLM_Fast_Doc_Efficient': { title: 'ドキュメントを高速分析中...', icon: 'writing' },
  'LLM_Fast_General_Efficient': { title: '高速回答を生成中...', icon: 'writing' },

  // LLM処理ノード - 回答生成 (Partner スタイル)
  'LLM_Hybrid_Partner': { title: '情報を統合して回答を生成中...', icon: 'writing' },
  'LLM_Doc_Partner': { title: 'ドキュメントを分析して回答を生成中...', icon: 'writing' },
  'LLM_Search_Partner': { title: '検索結果から回答を生成中...', icon: 'writing' },
  'LLM_General_Partner': { title: '回答を生成中...', icon: 'writing' },
  'LLM_Chat_Partner': { title: '応答を準備中...', icon: 'writing' },
  'LLM_Fast_Doc_Partner': { title: 'ドキュメントを高速分析中...', icon: 'writing' },
  'LLM_Fast_General_Partner': { title: '高速回答を生成中...', icon: 'writing' },

  // ツールノード (動的タイトル生成)
  'TOOL_Doc_Extractor': { title: 'ドキュメントを解析中...', icon: 'document', dynamic: 'document' },
  'TOOL_Perplexity_Search': { title: 'Web検索中...', icon: 'search', dynamic: 'search' },
};

// 表示対象外のノード接頭辞 (ゲート、変数操作、コード、出力など)
const HIDDEN_NODE_PREFIXES = ['GATE_', 'ROUTER_', 'STYLE_Check_', 'SET_', 'CLEAR_', 'CODE_', 'ANSWER_', 'Check '];

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
    // 開発者ツール向けログ
    const now = performance.now();
    const endTime = this.end || now;
    const totalTime = endTime - this.start;
    const ttfb = this.firstByte ? this.firstByte - this.start : 0;
    const ttft = this.firstToken ? this.firstToken - this.start : 0;
    const thinkingTotal = this.steps.reduce((sum, s) => sum + s.duration, 0);
    const displayDuration = this.firstToken ? (endTime - this.firstToken) : 0;
    const cps = displayDuration > 0 ? (this.charCount / (displayDuration / 1000)) : 0;

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

    // アプリ内ログ出力
    if (addLog) {
      const shortQuery = query.length > 15 ? query.substring(0, 15) + '...' : query;
      let logText = `[Perf] Cycle: "${shortQuery}" | Total: ${totalTime.toFixed(0)}ms | TTFB: ${ttfb.toFixed(0)}ms | TTFT: ${ttft.toFixed(0)}ms`;
      if (this.steps.length > 0) {
        logText += ` | Thinking: ${thinkingTotal.toFixed(0)}ms (${this.steps.length} steps)`;
      }
      addLog(logText, 'info');
    }
  }
});

/**
 * useChat - チャット機能のカスタムフック
 * 
 * ★ Phase A 認証統合:
 * - userId は App.jsx から渡され、AuthContext の authUser.userId が使用される
 * - Dify API の 'user' パラメータにこの userId が設定される
 * - これにより、ログインユーザーごとに会話履歴が分離される
 * 
 * @param {string} mockMode - モックモード ('OFF', 'FE', 'BE')
 * @param {string} userId - 認証済みユーザーID (AuthContext から取得)
 * @param {string} conversationId - 現在の会話ID
 * @param {function} addLog - ログ出力関数
 * @param {function} onConversationCreated - 会話作成時コールバック
 * @param {function} onConversationUpdated - 会話更新時コールバック
 * @param {string} apiKey - Dify API キー
 * @param {string} apiUrl - Dify API URL
 * @param {object} promptSettings - プロンプト設定 (aiStyle, userProfile, customInstructions)
 */
export const useChat = (mockMode, userId, conversationId, addLog, onConversationCreated, onConversationUpdated, apiKey, apiUrl, promptSettings) => {
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // ★追加: ストリーミング中のAIメッセージを別stateで管理（パフォーマンス最適化）
  // これにより、ストリーミング中のメッセージ更新がmessages配列全体の走査を回避
  const [streamingMessage, setStreamingMessage] = useState(null);
  // ★追加: streamingMessageの現在値を追跡するref（workflow_finishedで直接参照するため）
  const streamingMessageRef = useRef(null);

  const [sessionFiles, setSessionFiles] = useState([]);

  const [dynamicMockMessages, setDynamicMockMessages] = useState({});
  const [searchSettings, setSearchSettings] = useState(DEFAULT_SEARCH_SETTINGS);

  const searchSettingsRef = useRef(searchSettings);
  const creatingConversationIdRef = useRef(null);
  const settingsMapRef = useRef({});

  // ★追加: 停止機能用のRef
  const abortControllerRef = useRef(null);
  const currentTaskIdRef = useRef(null);
  // ★追加: 最後のユーザーメッセージを追跡（再送信用）
  const lastUserMessageRef = useRef(null);

  useEffect(() => {
    searchSettingsRef.current = searchSettings;
  }, [searchSettings]);

  // ★追加: streamingMessageが変更されたらrefも更新
  useEffect(() => {
    streamingMessageRef.current = streamingMessage;
  }, [streamingMessage]);

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
      // 新規作成された会話の場合は、設定のリセットと履歴ロードをスキップ
      // これにより、WelcomeScreenで変更した検索モードが維持される
      if (conversationId && conversationId === creatingConversationIdRef.current) {
        addLog(`[useChat] Skip loading/resetting history for just-created conversation: ${conversationId}`, 'info');
        creatingConversationIdRef.current = null;
        return;
      }

      // 既存の会話を選択した場合のみ、保存された設定を復元
      const savedSettings = settingsMapRef.current[conversationId] || DEFAULT_SEARCH_SETTINGS;
      setSearchSettings(savedSettings);

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
          // --- FE Mock Mode Logic (履歴はまだAdapter化せず維持) ---
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

            if (!apiKey || !apiUrl || !userId) {
              setMessages([createConfigError()]);
              setIsHistoryLoading(false);
              return;
            }

            const historyData = await fetchMessagesApi(conversationId, userId, apiUrl, apiKey);
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
  }, [conversationId, mockMode, addLog, apiKey, apiUrl, userId]);

  // --- メッセージ送信処理 (Adapter利用) ---
  const handleSendMessage = async (text, attachments = []) => {
    const tracker = createPerfTracker(addLog);
    tracker.markStart();

    // 1. Config Validation
    if ((mockMode === 'OFF' || mockMode === 'BE') && (!apiKey || !apiUrl || !userId)) {
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

    const currentSettings = searchSettingsRef.current;
    if (conversationId && onConversationUpdated) {
      onConversationUpdated(conversationId);
    }

    // 2. File Upload via Adapter
    let uploadedFileIds = [];
    let displayFiles = [];
    let uploadedFiles = [];

    if (attachments.length > 0) {
      setIsGenerating(true);
      try {
        const uploadPromises = attachments.map(file =>
          ChatServiceAdapter.uploadFile(file, { mockMode, userId, apiUrl, apiKey })
        );

        uploadedFiles = await Promise.all(uploadPromises);
        uploadedFileIds = uploadedFiles.map(f => f.id);
        displayFiles = uploadedFiles.map(f => ({ name: f.name }));

        setSessionFiles(prev => [...prev, ...uploadedFiles]);

      } catch (e) {
        addLog(`[Upload Error] ${e.message}`, 'error');
        setIsGenerating(false);
        return;
      }
    }

    // 3. Update UI (User Message)
    const userMessageId = `msg_${Date.now()}_user`;
    const userMessage = {
      id: userMessageId,
      role: 'user',
      text: text,
      timestamp: new Date().toISOString(),
      files: displayFiles
    };
    setMessages(prev => [...prev, userMessage]);

    // 4. Update UI (AI Placeholder)
    const aiMessageId = `msg_${Date.now()}_ai`;
    // ★変更: 全モードでリアルタイム表示を有効化
    // 以前は !ragEnabled && webMode === 'off' のときだけ 'fast' だったが、
    // parseLlmResponseが不完全JSONにも対応しているため、全モードで即時表示可能に
    const isFastMode = true; // 常にリアルタイム表示を使用

    setIsGenerating(true);

    // ★変更: ストリーミング中はstreamingMessage stateで管理（messages配列を更新しない）
    const initialAiMessage = {
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
      thinking: '',  // ★追加: Chain-of-Thought用
      mode: isFastMode ? 'fast' : 'normal'
    };
    setStreamingMessage(initialAiMessage);

    // ★ワークフローログ: リクエスト開始
    addLog(`[Workflow] === 新規リクエスト開始 ===`, 'info');
    const ragLabel = currentSettings.ragEnabled === 'auto' ? 'AUTO' : (currentSettings.ragEnabled ? 'ON' : 'OFF');
    addLog(`[Workflow] 検索モード: Web=${currentSettings.webMode}, RAG=${ragLabel}`, 'info');
    addLog(`[Workflow] ユーザー入力: ${text}`, 'info');
    if (displayFiles.length > 0) {
      addLog(`[Workflow] 添付ファイル: ${displayFiles.map(f => f.name).join(', ')}`, 'info');
    }

    // ★ v3.0: Intelligence Profile ログ出力（デバッグ用）
    const aiStyle = promptSettings?.aiStyle || 'partner';
    const systemPromptPayload = {
      user_context: {
        name: promptSettings?.displayName || '',
        role: promptSettings?.userProfile?.role || '',
        department: promptSettings?.userProfile?.department || ''
      },
      custom_directives: {
        free_text: promptSettings?.customInstructions || ''
      },
      meta: {
        client_version: '3.0.0',
        timestamp: new Date().toISOString()
      }
    };
    addLog(`[Intelligence Profile] ai_style: ${aiStyle}`, 'info');
    addLog(`[Intelligence Profile] system_prompt: ${JSON.stringify(systemPromptPayload, null, 2)}`, 'info');

    // 5. Send Request via Adapter
    let reader;
    try {
      // sessionFilesと新規アップロードファイルを合わせた配列を作成
      const allFilesToSend = [...sessionFiles, ...uploadedFiles];

      reader = await ChatServiceAdapter.sendMessage(
        {
          text,
          conversationId,
          files: allFilesToSend.map(f => ({ id: f.id, name: f.name })),
          searchSettings: currentSettings,
          promptSettings: promptSettings,
          displayName: promptSettings?.displayName || ''
        },
        { mockMode, userId, apiUrl, apiKey }
      );

      // --- Stream Handling (Common Logic) ---
      let contentBuffer = '';
      let detectedTraceMode = 'knowledge';
      let isConversationIdSynced = false;
      let capturedOptimizedQuery = null;
      let protocolMode = 'PENDING';

      // 表示遅延タイマー（ちらつき防止）
      // messageイベント受信時にタイマーを開始する（思考プロセス完了後）
      let messageStartTime = null;
      const DISPLAY_DELAY_MS = 500; // 0.2秒間は表示を抑制

      // ★追加: SSEチャンク分割対策用バッファ
      // ネットワーク転送時に行の途中で分割される場合があるため、
      // 不完全な行を次のチャンクと結合してからパースする
      let lineBuffer = '';

      while (true) {
        const { value, done } = await reader.read();
        tracker.markFirstByte();
        if (done) {
          // ★追加: 終了時にバッファに残ったデータも処理
          if (lineBuffer.trim() && lineBuffer.startsWith('data: ')) {
            try {
              const data = JSON.parse(lineBuffer.substring(6));
              // 残りのデータの簡易処理（message_endなど）
              if (data.event === 'message_end' && data.message_id) {
                fetchSuggestions(data.message_id, aiMessageId);
              }
            } catch (e) {
              // 最後のチャンクがパースできない場合は無視
              console.warn('[Stream] Final buffer parse failed:', e.message);
            }
          }
          break;
        }

        // ★変更: 前回の不完全行と結合
        lineBuffer += value;

        // ★変更: 完全な行（\n\nで区切られた）のみ処理
        // SSEは各イベントを \n\n で区切る仕様
        const chunks = lineBuffer.split('\n\n');
        // 最後の要素は不完全な可能性があるため、バッファに残す
        lineBuffer = chunks.pop() || '';

        for (const chunk of chunks) {
          // 各チャンク内の行を処理（複数行のdata:がある場合も対応）
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
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
                } else {
                  // FEモードのID同期
                  if (onConversationCreated && !conversationId) {
                    onConversationCreated(data.conversation_id, text);
                    creatingConversationIdRef.current = data.conversation_id;
                  }
                }
              }

              // ★追加: task_idをキャプチャ（停止機能用）
              if (data.task_id && !currentTaskIdRef.current) {
                currentTaskIdRef.current = data.task_id;
              }

              // Node Events
              if (data.event === 'node_started') {
                const nodeType = data.data?.node_type;
                const title = data.data?.title;
                const nodeId = data.data?.node_id || `node_${Date.now()}`;
                const inputs = data.data?.inputs || {};

                // 1. 非表示ノードのスキップ
                const isHiddenNode = HIDDEN_NODE_PREFIXES.some(prefix => title?.startsWith(prefix));
                if (isHiddenNode) {
                  // 非表示ノードはスキップ (思考プロセスに表示しない)
                  continue;
                }

                // 2. マッピングテーブルから表示情報を取得
                const mapping = title ? NODE_DISPLAY_MAP[title] : null;

                let displayTitle = null;
                let iconType = 'default';

                if (mapping) {
                  // マッピングテーブルにマッチした場合
                  displayTitle = mapping.title;
                  iconType = mapping.icon;

                  // 動的タイトル生成
                  if (mapping.dynamic === 'document') {
                    // ドキュメント抽出器: ファイル名を動的に取得
                    let fileNameToDisplay = '添付ファイル';
                    if (inputs.target_file) {
                      fileNameToDisplay = inputs.target_file;
                    } else {
                      const allActiveFiles = [...sessionFiles, ...displayFiles];
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
                  } else if (mapping.dynamic === 'search') {
                    // Web検索: クエリを動的に取得
                    const query = inputs.query || capturedOptimizedQuery || text;
                    displayTitle = `Web検索: "${query}"`;
                    detectedTraceMode = 'search';
                  }
                } else if (nodeType === 'document-extractor') {
                  // マッピングにないが document-extractor タイプの場合
                  let fileNameToDisplay = '添付ファイル';
                  if (inputs.target_file) {
                    fileNameToDisplay = inputs.target_file;
                  } else {
                    const allActiveFiles = [...sessionFiles, ...displayFiles];
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
                } else if (nodeType === 'tool' && title?.includes('Perplexity')) {
                  // Perplexity検索のフォールバック
                  const query = inputs.query || capturedOptimizedQuery || text;
                  displayTitle = `Web検索: "${query}"`;
                  detectedTraceMode = 'search';
                  iconType = 'search';
                } else if (nodeType === 'knowledge-retrieval' || (title && title.includes('ナレッジ'))) {
                  // ナレッジ検索
                  const query = inputs.query || capturedOptimizedQuery;
                  displayTitle = query ? `社内知識を検索: "${query}"` : '社内ナレッジベースを検索中...';
                  detectedTraceMode = 'knowledge';
                  iconType = 'retrieval';
                } else if (nodeType === 'llm') {
                  // LLMノード (マッピングにない場合のフォールバック)
                  displayTitle = '情報を整理して回答を生成中...';
                  iconType = 'writing';
                }

                // 3. 表示対象のノードのみ思考プロセスに追加
                if (displayTitle) {
                  tracker.markNodeStart(nodeId, displayTitle);

                  // ★変更: streamingMessage stateを直接更新（messages配列を走査しない）
                  setStreamingMessage(prev => prev ? {
                    ...prev,
                    traceMode: detectedTraceMode,
                    thoughtProcess: [
                      ...prev.thoughtProcess.map(t => ({ ...t, status: 'done' })),
                      { id: nodeId, title: displayTitle, status: 'processing', iconType: iconType }
                    ]
                  } : prev);
                }
              }
              else if (data.event === 'node_finished') {
                const nodeId = data.data?.node_id;
                const title = data.data?.title;
                const outputs = data.data?.outputs;

                if (nodeId) tracker.markNodeEnd(nodeId);

                // ★改善: LLM_Query_Rewrite のJSON出力をパースしてログ記録 + UIに反映
                if (title === 'LLM_Query_Rewrite') {
                  const rawText = outputs?.text;
                  const parsedJson = extractJsonFromLlmOutput(rawText);
                  if (parsedJson) {
                    capturedOptimizedQuery = parsedJson.optimized_query || '';
                    addLog(`[LLM_Query_Rewrite] thinking: ${parsedJson.thinking || 'N/A'}`, 'info');
                    addLog(`[LLM_Query_Rewrite] optimized_query: ${parsedJson.optimized_query || 'N/A'}`, 'info');

                    // ★追加: thoughtProcessにthinkingと結果を追加
                    setStreamingMessage(prev => prev ? {
                      ...prev,
                      thoughtProcess: prev.thoughtProcess.map(t =>
                        t.id === nodeId ? {
                          ...t,
                          status: 'done',
                          thinking: parsedJson.thinking || '',
                          resultLabel: '最適化クエリ',
                          resultValue: parsedJson.optimized_query || ''
                        } : t
                      )
                    } : prev);
                  } else if (rawText) {
                    // パース失敗時はRAW出力をログ
                    capturedOptimizedQuery = rawText.trim();
                    addLog(`[LLM_Query_Rewrite] RAW出力: ${rawText}`, 'warn');
                    // ステータスのみ更新
                    setStreamingMessage(prev => prev ? {
                      ...prev,
                      thoughtProcess: prev.thoughtProcess.map(t =>
                        t.id === nodeId ? { ...t, status: 'done' } : t
                      )
                    } : prev);
                  }
                }

                // ★改善: LLM_Intent_Analysis のJSON出力をパースしてログ記録 + UIに反映
                if (title === 'LLM_Intent_Analysis') {
                  const rawText = outputs?.text;
                  const parsedJson = extractJsonFromLlmOutput(rawText);
                  if (parsedJson) {
                    addLog(`[LLM_Intent_Analysis] thinking: ${parsedJson.thinking || 'N/A'}`, 'info');
                    addLog(`[LLM_Intent_Analysis] category: ${parsedJson.category || 'N/A'}`, 'info');
                    addLog(`[LLM_Intent_Analysis] confidence: ${parsedJson.confidence || 'N/A'}`, 'info');

                    // ★追加: カテゴリーを日本語に変換
                    let categoryLabel = parsedJson.category || '';
                    const categoryMap = {
                      'SEARCH': 'Web検索モード',
                      'CHAT': '雑談モード',
                      'LOGICAL': '論理回答モード',
                      'ANSWER': '内部知識モード',
                      'HYBRID': 'ハイブリッド検索モード'
                    };
                    const displayCategory = categoryMap[categoryLabel] || categoryLabel;
                    const confidenceText = parsedJson.confidence ? ` (信頼度: ${parsedJson.confidence})` : '';

                    // ★追加: thoughtProcessにthinkingと結果を追加
                    setStreamingMessage(prev => prev ? {
                      ...prev,
                      thoughtProcess: prev.thoughtProcess.map(t =>
                        t.id === nodeId ? {
                          ...t,
                          title: `判定: ${displayCategory}`,
                          status: 'done',
                          thinking: parsedJson.thinking || '',
                          resultLabel: '分類',
                          resultValue: `${displayCategory}${confidenceText}`
                        } : t
                      )
                    } : prev);
                  } else if (rawText) {
                    addLog(`[LLM_Intent_Analysis] RAW出力: ${rawText}`, 'warn');
                    // 旧フォーマットのフォールバック
                    const decision = rawText.trim();
                    let resultText = '';
                    if (decision.includes('SEARCH')) resultText = '判定: Web検索モード';
                    else if (decision.includes('CHAT')) resultText = '判定: 雑談モード';
                    else if (decision.includes('LOGICAL')) resultText = '判定: 論理回答モード';
                    else if (decision.includes('ANSWER')) resultText = '判定: 内部知識モード';
                    else if (decision.includes('HYBRID')) resultText = '判定: ハイブリッド検索モード';
                    setStreamingMessage(prev => prev ? {
                      ...prev,
                      thoughtProcess: prev.thoughtProcess.map(t =>
                        t.id === nodeId ? { ...t, title: resultText || t.title, status: 'done' } : t
                      )
                    } : prev);
                  }
                }

                // ★ワークフローログ: 中間結果の記録
                const outputText = outputs?.text;
                if (outputText && title) {
                  // Perplexity検索結果
                  if (title === 'TOOL_Perplexity_Search') {
                    addLog(`[Workflow] Perplexity結果:\n${outputText}`, 'info');
                  }
                  // 回答生成LLMの結果
                  else if (title.startsWith('LLM_') && (
                    title.includes('Hybrid') || title.includes('Doc') ||
                    title.includes('Search') || title.includes('General') ||
                    title.includes('Chat') || title.includes('Fast')
                  )) {
                    addLog(`[Workflow] ${title} 出力:\n${outputText}`, 'info');
                  }
                }

                // その他のノードは完了ステータスに更新（LLM_Query_Rewrite, LLM_Intent_Analysis以外）
                if (nodeId && title !== 'LLM_Query_Rewrite' && title !== 'LLM_Intent_Analysis') {
                  setStreamingMessage(prev => prev ? {
                    ...prev,
                    thoughtProcess: prev.thoughtProcess.map(t => t.id === nodeId ? { ...t, status: 'done' } : t)
                  } : prev);
                }
              }

              else if (data.event === 'message') {
                if (data.answer) {
                  // ★追加: 最初のmessageイベント受信時にタイマー開始
                  if (messageStartTime === null) {
                    messageStartTime = Date.now();
                  }

                  contentBuffer += data.answer;
                  tracker.markFirstToken();
                  tracker.incrementChars(data.answer);

                  if (protocolMode === 'PENDING') {
                    const trimmed = contentBuffer.trimStart();
                    if (trimmed.length > 0) {
                      // ★改善: JSONモード判定
                      // 1. 構造的特徴: { で始まる OR ```json で始まる
                      const structuralJson = trimmed.startsWith('{') ||
                        trimmed.startsWith('```json') ||
                        trimmed.startsWith('```\n{');

                      // 2. フィールド検知: thinking/answerフィールドの有無
                      const hasThinkingField = trimmed.includes('"thinking"');
                      const hasAnswerField = trimmed.includes('"answer"');

                      if (structuralJson || hasThinkingField || hasAnswerField) {
                        protocolMode = 'JSON';
                      } else {
                        // JSON構造でもフィールドもない場合はRAWモード
                        protocolMode = 'RAW';
                      }
                    }
                  }

                  let textToDisplay = '';
                  let thinkingToDisplay = '';  // ★追加: thinking用

                  // ★変更: message受信開始から1秒間は表示を抑制（ちらつき防止）
                  const elapsedMs = Date.now() - messageStartTime;
                  const isDelayPeriod = elapsedMs < DISPLAY_DELAY_MS;

                  if (isDelayPeriod) {
                    // ★改善: 待機時間中は表示しない（JSONフィールド検知を待つ）
                    // ただし、既にthinking/answerが検知されていれば表示開始可能
                    const parsed = parseLlmResponse(contentBuffer);
                    if (parsed.isParsed && (parsed.answer || parsed.thinking)) {
                      // フィールドが検知されたので待機時間を短縮して表示開始
                      textToDisplay = parsed.answer;
                      thinkingToDisplay = parsed.thinking || '';
                      protocolMode = 'JSON';
                    } else {
                      textToDisplay = '';
                    }
                  } else if (protocolMode === 'PENDING') {
                    // 待機時間経過後でもPENDINGの場合はRAWモードへ移行
                    protocolMode = 'RAW';
                    textToDisplay = contentBuffer;
                  } else if (protocolMode === 'JSON') {
                    const parsed = parseLlmResponse(contentBuffer);
                    // ★改善: isParsedであればanswerが空でもOK（thinkingだけの場合もある）
                    textToDisplay = parsed.isParsed ? parsed.answer : '';
                    thinkingToDisplay = parsed.thinking || '';
                  } else {
                    // RAWモードでも、JSON構造が検出されたらパースを試みる（誤判定対策）
                    const trimmed = contentBuffer.trim();
                    // ★改善: thinkingフィールドも検知対象に追加
                    if ((trimmed.includes('"answer"') || trimmed.includes('"thinking"')) && (trimmed.startsWith('{') || trimmed.startsWith('```'))) {
                      const parsed = parseLlmResponse(contentBuffer);
                      if (parsed.isParsed) {
                        textToDisplay = parsed.answer;
                        thinkingToDisplay = parsed.thinking || '';
                        // モードを修正（以降のストリーミングでも正しく処理）
                        protocolMode = 'JSON';
                      } else {
                        // パース失敗時も表示しない（ちらつき防止）
                        textToDisplay = '';
                      }
                    } else {
                      textToDisplay = contentBuffer;
                    }
                  }

                  // ★変更: streamingMessage stateを直接更新（messages配列を走査しない）
                  setStreamingMessage(prev => prev ? {
                    ...prev,
                    text: textToDisplay,
                    rawContent: contentBuffer,
                    thinking: thinkingToDisplay  // ★追加
                  } : prev);
                }
              }
              else if (data.event === 'message_end') {
                const citations = data.metadata?.retriever_resources || [];
                if (citations.length > 0) {
                  // ★変更: streamingMessage stateを直接更新
                  setStreamingMessage(prev => prev ? {
                    ...prev,
                    citations: mapCitationsFromApi(citations),
                    traceMode: detectedTraceMode
                  } : prev);
                }
                if (data.message_id) {
                  fetchSuggestions(data.message_id, aiMessageId);
                }
              }
              else if (data.event === 'workflow_finished') {
                let finalText = contentBuffer;
                let finalCitations = [];
                let smartActions = [];
                let finalThinking = '';  // ★追加

                // ★改善: protocolModeに関係なく、コンテンツがJSON形式かチェック
                // ストリーミング中の初期判定が誤っている場合にも対応
                const trimmedBuffer = contentBuffer.trim();
                const looksLikeJsonContent =
                  trimmedBuffer.startsWith('{') ||
                  trimmedBuffer.startsWith('```json') ||
                  trimmedBuffer.startsWith('```\n{') ||
                  (trimmedBuffer.includes('"answer"') && trimmedBuffer.includes('"citations"'));

                if (protocolMode === 'JSON' || looksLikeJsonContent) {
                  const parsed = parseLlmResponse(contentBuffer);
                  if (parsed.isParsed) {
                    finalText = parsed.answer;
                    finalThinking = parsed.thinking || '';  // ★追加
                    if (parsed.citations.length > 0) {
                      finalCitations = mapCitationsFromLLM(parsed.citations);
                    }
                    // ★変更: parseLlmResponseから直接smartActionsを取得
                    if (parsed.smartActions && parsed.smartActions.length > 0) {
                      smartActions = parsed.smartActions;
                      addLog(`[Workflow] Smart Actions detected: ${smartActions.length} actions`, 'info');
                    }
                  }
                }

                // ★変更: streamingMessageRefから現在値を取得して、setMessagesとsetStreamingMessageを別々に呼び出す
                // これによりsetState内からsetStateを呼び出す問題を根本的に解決
                const currentStreamingMsg = streamingMessageRef.current;
                if (currentStreamingMsg) {
                  const finalMessage = {
                    ...currentStreamingMsg,
                    text: finalText,
                    rawContent: contentBuffer,
                    citations: currentStreamingMsg.citations.length > 0 ? currentStreamingMsg.citations : finalCitations,
                    smartActions: smartActions,
                    thinking: finalThinking || currentStreamingMsg.thinking || '',  // ★追加
                    isStreaming: false,
                    traceMode: detectedTraceMode,
                    thoughtProcess: currentStreamingMsg.thoughtProcess.map(t => {
                      if (t.title === '情報を整理して回答を生成中...') {
                        return { ...t, title: '回答の生成が完了しました', status: 'done', iconType: 'check' };
                      }
                      return { ...t, status: 'done' };
                    })
                  };
                  // messages配列に確定メッセージを追加
                  setMessages(prevMsgs => [...prevMsgs, finalMessage]);
                  // streamingMessageをクリア
                  setStreamingMessage(null);
                }
              }
            } catch (e) {
              console.error('Stream Parse Error:', e);
            }
          }
        }
      }
      setIsGenerating(false);
      tracker.markEnd();
      tracker.logReport(text);

    } catch (error) {
      addLog(`[Stream Error] ${error.message}`, 'error');
      // ★変更: エラー時もstreamingMessageRefから現在値を取得して処理
      const currentStreamingMsg = streamingMessageRef.current;
      if (currentStreamingMsg) {
        const errorMessage = {
          ...currentStreamingMsg,
          role: 'system',
          type: 'error',
          text: '',
          rawError: error.message,
          isStreaming: false,
          thoughtProcess: []
        };
        setMessages(prevMsgs => [...prevMsgs, errorMessage]);
        setStreamingMessage(null);
      }
      setIsGenerating(false);
    }
  };

  const fetchSuggestions = async (msgId, aiMsgId) => {
    try {
      if (mockMode === 'FE') {
        const mockData = scenarioSuggestions['pure'] || [];
        await new Promise(resolve => setTimeout(resolve, 500));
        // ★変更: 停止されたメッセージにはsuggestionsを設定しない
        setMessages(prev => prev.map(m => {
          if (m.id === aiMsgId && !m.wasStopped) {
            return { ...m, suggestions: mockData };
          }
          return m;
        }));
        return;
      }

      const res = await fetchSuggestionsApi(msgId, userId, apiUrl, apiKey);
      if (res.result === 'success') {
        // ★変更: 停止されたメッセージにはsuggestionsを設定しない
        setMessages(prev => prev.map(m => {
          if (m.id === aiMsgId && !m.wasStopped) {
            return { ...m, suggestions: res.data };
          }
          return m;
        }));
      }
    } catch (e) {
      addLog(`[Suggestions Error] ${e.message}`, 'error');
      console.error('[Suggestions Error]', e);
    }
  };

  // ★新規: 生成停止関数
  const stopGeneration = useCallback(async () => {
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

    // 3. UIステートの更新
    // ストリーミング中のメッセージがあれば、途中までのテキストを確定メッセージとして保存
    const currentStreaming = streamingMessageRef.current;
    if (currentStreaming) {
      const stoppedMessage = {
        ...currentStreaming,
        isStreaming: false,
        wasStopped: true, // ★追加: 停止フラグ（suggestions等の取得をスキップ）
        text: currentStreaming.text || '',
        thoughtProcess: currentStreaming.thoughtProcess?.map(t => ({ ...t, status: 'done' })) || [],
        // ★追加: 停止されたメッセージには関連する質問を表示しない
        suggestions: [],
        smartActions: []
      };
      setMessages(prev => [...prev, stoppedMessage]);
      setStreamingMessage(null);
    }

    setIsGenerating(false);
  }, [mockMode, apiKey, apiUrl, userId, addLog]);

  // ★新規: メッセージ編集関数
  const handleEdit = useCallback(async (messageId, newText) => {
    addLog(`[Edit] メッセージを編集: ${messageId}`, 'info');

    // 1. 対象メッセージのインデックスを探す
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      addLog('[Edit] 対象メッセージが見つかりません', 'error');
      return;
    }

    // 2. 履歴の切り詰め（対象メッセージより前のメッセージのみ残す）
    const previousMessages = messages.slice(0, messageIndex);
    setMessages(previousMessages);

    // 3. 新規メッセージとして送信
    await handleSendMessage(newText, []);
  }, [messages, handleSendMessage, addLog]);

  // ★新規: 再送信（再生成）関数
  const handleRegenerate = useCallback(async () => {
    addLog('[Regenerate] 再送信を実行', 'info');

    if (messages.length === 0) {
      addLog('[Regenerate] メッセージがありません', 'warn');
      return;
    }

    const lastMessage = messages[messages.length - 1];
    let targetUserMessage;
    let truncateCount;

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
      return;
    }

    // 履歴を切り詰め
    setMessages(prev => prev.slice(0, prev.length - truncateCount));

    // 再送信
    await handleSendMessage(targetUserMessage.text, targetUserMessage.files || []);
  }, [messages, handleSendMessage, addLog]);

  return {
    messages,
    setMessages,
    // ★追加: ストリーミング中のメッセージを別途提供（パフォーマンス最適化）
    streamingMessage,
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
    setForceSearch: (force) => updateSearchSettings({ ...searchSettings, webMode: force ? 'force' : 'auto' }),
    // ★新規: 停止・編集・再送信機能
    stopGeneration,
    handleEdit,
    handleRegenerate,
  };
};