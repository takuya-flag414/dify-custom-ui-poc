import { useState, useEffect, useRef, useCallback } from 'react';
import { buildStructuredMessage, parseStructuredMessage, restoreMessageState, extractPlainText } from '../utils/messageSerializer';
import { scenarioSuggestions } from '../mocks/scenarios';
// ★変更: Adapterをインポート
import { ChatServiceAdapter } from '../services/ChatServiceAdapter';
import { fetchSuggestionsApi } from '../api/dify';
import { mapCitationsFromApi } from '../utils/citationMapper';
// ★Phase 2: SecureVaultServiceをインポート
import SecureVaultService from '../services/SecureVaultService';

// ★リファクタリング: 分離したモジュールからインポート
import { DEFAULT_SEARCH_SETTINGS } from './chat/constants';
import { createPerfTracker } from './chat/perfTracker';
import { loadChatHistory } from './chat/historyLoader';
import {
    processNodeStarted,
    processQueryRewriteFinished,
    processIntentAnalysisFinished,
    processSearchStrategyFinished,
    processRagStrategyFinished,
    processLlmSynthesisFinished,
    logWorkflowOutput,
    processNodeError,
    processWorkflowError
} from './chat/nodeEventHandlers';
import {
    determineProtocolMode,
    extractMessageContent,
    processMessageEnd,
    processWorkflowFinished,
    buildFinalMessage
} from './chat/messageEventHandlers';
import {
    executeStopGeneration,
    prepareMessageEdit,
    prepareRegenerate
} from './chat/messageActions';

/**
 * APIキー/URL未設定エラーメッセージを生成
 */
const createConfigError = () => ({
    id: `msg_${Date.now()}_error`,
    role: 'system',
    type: 'error',
    text: '',
    rawError: 'API設定が不完全です。設定画面でAPIキーとAPIエンドポイントを設定してください。',
    isStreaming: false,
    timestamp: new Date().toISOString(),
    thoughtProcess: []
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

    // ★追加: IntelligenceErrorHandler連携用
    // エラー発生時にエラー情報をstateに保持し、App.jsxのuseErrorIntelligenceが検知する
    const [lastError, setLastError] = useState(null);

    // ★Phase 2: サニタイズ通知用state
    const [sanitizeNotification, setSanitizeNotification] = useState({ visible: false, count: 0 });

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

    // --- 履歴ロード処理 (分離モジュール使用) ---
    useEffect(() => {
        const loadHistory = async () => {
            // ★重要: 新規作成された会話の場合は、メッセージクリア前にスキップ
            // これにより、handleSendMessageで追加されたメッセージが消えることを防ぐ
            if (conversationId && conversationId === creatingConversationIdRef.current) {
                addLog(`[useChat] Skip loading/resetting history for just-created conversation: ${conversationId}`, 'info');
                creatingConversationIdRef.current = null;
                return;
            }

            // 既存セッションファイルのクリア
            setSessionFiles([]);

            if (!conversationId) {
                setMessages([]);
                setIsHistoryLoading(false);
                return;
            }

            setIsHistoryLoading(true);
            setMessages([]);

            const result = await loadChatHistory({
                conversationId,
                mockMode,
                addLog,
                apiKey,
                apiUrl,
                userId,
                dynamicMockMessages,
                settingsMapRef,
            });

            // shouldSkip は historyLoader側で既に処理済み（creatingConversationIdRef以外のケース）
            if (result.shouldSkip) {
                setIsHistoryLoading(false);
                return;
            }

            // 結果を反映
            setSearchSettings(result.searchSettings);
            setMessages(result.messages);
            if (result.sessionFiles.length > 0) {
                setSessionFiles(result.sessionFiles);
            }
            setIsHistoryLoading(false);
        };
        loadHistory();
    }, [conversationId, mockMode, addLog, apiKey, apiUrl, userId]);

    // --- メッセージ送信処理 (Adapter利用) ---
    const handleSendMessage = async (text, attachments = [], options = {}) => {
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
        let restoredFiles = []; // ★追加: 復元されたファイル（アップロード不要）

        if (attachments.length > 0) {
            setIsGenerating(true);
            try {
                // ★変更: Fileオブジェクト（新規）とAttachmentMeta（復元）を分別
                const filesToUpload = attachments.filter(a => a instanceof File);
                // Fileインスタンスでないものを既存ファイルとみなす（簡易判定）
                restoredFiles = attachments.filter(a => !(a instanceof File));

                if (filesToUpload.length > 0) {
                    const uploadPromises = filesToUpload.map(file =>
                        ChatServiceAdapter.uploadFile(file, { mockMode, userId, apiUrl, apiKey })
                    );
                    uploadedFiles = await Promise.all(uploadPromises);
                }

                // 表示用ファイルリスト構築
                displayFiles = [
                    ...restoredFiles.map(f => ({ name: f.name })),
                    ...uploadedFiles.map(f => ({ name: f.name }))
                ];

                setSessionFiles(prev => [...prev, ...uploadedFiles]); // 新規のみ追加

            } catch (e) {
                addLog(`[Upload Error] ${e.message}`, 'error');
                setIsGenerating(false);
                return;
            }
        }

        // ★変更: ユーザーメッセージの作成はstructuredQuery構築後（try内）に移動
        // 以前はここでプレーンテキストをセットしていたが、
        // ContextChips用に構造化JSONを保存する必要があるため移動

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
        const ragLabel = currentSettings.ragEnabled ? 'ON' : 'OFF';
        addLog(`[Workflow] 検索モード: Web=${currentSettings.webEnabled ? 'ON' : 'OFF'}, RAG=${ragLabel}`, 'info');
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
            // sessionFilesと新規アップロードファイル、さらに復元ファイルを合わせた配列を作成
            const allFilesToSend = [...sessionFiles, ...uploadedFiles, ...restoredFiles];

            // ★構造化メッセージの構築 (Protocol v1.0)
            const intelligenceMode = currentSettings.reasoningMode === 'deep' ? 'deep' : 'speed';
            const intelligence = {
                mode: intelligenceMode,
                model: promptSettings?.aiStyle === 'efficient' ? 'gpt-4o-mini' : 'gpt-4o' // 簡易的な推定
            };

            const knowledgeContext = {
                selected_store_ids: currentSettings.selectedStoreId ? [currentSettings.selectedStoreId] : [],
                selected_store_names: currentSettings.selectedStoreName ? [currentSettings.selectedStoreName] : [],
                web_search_enabled: currentSettings.webEnabled,
                domain_context: currentSettings.ragEnabled ? 'knowledge' : 'general',
                domain_filter: currentSettings.domainFilters || [] // ★追加: ドメインフィルタ
            };

            // 添付ファイルをメタデータ形式に変換
            const attachmentMeta = allFilesToSend.map(f => ({
                id: f.id,
                name: f.name,
                type: f.type,
                // サイズ等は取得できれば設定
            }));

            // ★追加: Dify送信変数のスナップショットを構築（トレーサビリティ用）
            const domainFilterString = (currentSettings.domainFilters || []).join(', ');
            const now = new Date();
            const currentTimeStr = now.toLocaleString('ja-JP', {
                year: 'numeric', month: 'long', day: 'numeric',
                weekday: 'long', hour: '2-digit', minute: '2-digit'
            });
            const difyInputs = {
                rag_enabled: currentSettings.ragEnabled ? 'true' : 'false',
                web_enabled: currentSettings.webEnabled ? 'true' : 'false',
                domain_filter: domainFilterString,
                current_time: currentTimeStr,
                ai_style: promptSettings?.aiStyle || 'partner',
                system_prompt: JSON.stringify(systemPromptPayload),
                reasoning_mode: currentSettings.reasoningMode || 'fast',
                gemini_store_id: currentSettings.selectedStoreId || '',
            };

            const structuredQuery = buildStructuredMessage(
                text,
                attachmentMeta,
                intelligence,
                knowledgeContext
            );

            // ★追加: dify_inputs をペイロードにマージ
            const parsedPayload = JSON.parse(structuredQuery);
            parsedPayload.dify_inputs = difyInputs;

            // ★Phase 2: サニタイズ処理 (全モード共通)
            // setMessages の前に実行し、UI・ログ・ペイロードすべてから平文を排除する
            const sanitizeResult = SecureVaultService.sanitize(text, {
                excludeTypes: options.sanitizeExcludeTypes || [],
            });
            if (sanitizeResult.appliedTokens.length > 0) {
                // 構造化JSONのtextフィールドをサニタイズ済みテキストに置換
                parsedPayload.content.text = sanitizeResult.sanitizedText;

                addLog(`[Privacy Tunnel] ${sanitizeResult.appliedTokens.length}件の機密情報をトークン化`, 'info');
                sanitizeResult.appliedTokens.forEach(t => {
                    addLog(`[Privacy Tunnel]   ${t.label}: ${t.token}`, 'info');
                });

                // トースト通知
                setSanitizeNotification({ visible: true, count: sanitizeResult.appliedTokens.length });
            }

            const finalStructuredQuery = JSON.stringify(parsedPayload);

            // ★変更: ユーザーメッセージにサニタイズ済み構造化JSONを保存
            // Vault が生きている間は MarkdownRenderer の renderWithRestoredTokens が復元表示し、
            // リロード後は伏字チップ（RestoredToken）で表示される
            const userMessageId = `msg_${Date.now()}_user`;
            const userMessage = {
                id: userMessageId,
                role: 'user',
                text: finalStructuredQuery, // サニタイズ済みJSON（平文を含まない）
                timestamp: new Date().toISOString(),
                files: displayFiles
            };
            setMessages(prev => [...prev, userMessage]);

            // ★デバッグ用: 送信ペイロードの確認（サニタイズ済みのみ出力）
            console.group('🔷 Structured Message Payload');
            console.log('Structured JSON:', finalStructuredQuery);
            console.log('Parsed Object:', JSON.parse(finalStructuredQuery));
            console.groupEnd();

            // ★ログ保存: クリップボードコピー用（サニタイズ済み）
            addLog(`[StructuredPayload] ${finalStructuredQuery}`, 'info');


            reader = await ChatServiceAdapter.sendMessage(
                {
                    text: finalStructuredQuery, // サニタイズ済みJSON
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

                            // Node Events - ★リファクタリング: 分離したヘルパー関数を使用
                            if (data.event === 'node_started') {
                                const result = processNodeStarted(data, {
                                    sessionFiles,
                                    displayFiles,
                                    capturedOptimizedQuery,
                                    userText: text
                                });

                                if (!result) {
                                    // 非表示ノードまたは表示対象外
                                    continue;
                                }

                                const { nodeId, displayTitle, iconType, detectedTraceMode: newTraceMode, renderMode, thinkingText } = result;
                                if (newTraceMode) {
                                    detectedTraceMode = newTraceMode;
                                }

                                tracker.markNodeStart(nodeId, displayTitle);

                                // ★追加: HTTP_LLM_Searchノードかどうかを判定
                                const nodeTitle = data.data?.title;
                                const isHttpLlmSearch = nodeTitle === 'HTTP_LLM_Search';

                                setStreamingMessage(prev => prev ? {
                                    ...prev,
                                    traceMode: detectedTraceMode,
                                    // ★追加: HTTP_LLM_Search通過フラグ
                                    usedHttpLlmSearch: prev.usedHttpLlmSearch || isHttpLlmSearch,
                                    thoughtProcess: [
                                        ...prev.thoughtProcess.map(t => ({ ...t, status: 'done' })),
                                        { id: nodeId, title: displayTitle, status: 'processing', iconType: iconType, renderMode: renderMode, thinkingText: thinkingText } // ★thinkingTextを追加
                                    ]
                                } : prev);
                            }
                            else if (data.event === 'node_finished') {
                                const nodeId = data.data?.node_id;
                                const title = data.data?.title;
                                const outputs = data.data?.outputs;

                                if (nodeId) tracker.markNodeEnd(nodeId);

                                // ★追加: ノードエラー処理（status === 'failed' の場合）
                                const nodeError = processNodeError(data, addLog);
                                if (nodeError) {
                                    setStreamingMessage(prev => prev ? {
                                        ...prev,
                                        thoughtProcess: prev.thoughtProcess.map(nodeError.thoughtProcessUpdate),
                                        hasWorkflowError: true,
                                        workflowError: { nodeTitle: nodeError.nodeTitle, message: nodeError.errorMessage }
                                    } : prev);
                                    // エラーが発生しても処理は継続（部分的な結果を表示するため）
                                }

                                // ★リファクタリング: LLM_Query_Rewrite処理
                                if (title === 'LLM_Query_Rewrite') {
                                    const result = processQueryRewriteFinished(outputs, nodeId, addLog);
                                    if (result) {
                                        capturedOptimizedQuery = result.optimizedQuery;
                                        setStreamingMessage(prev => prev ? {
                                            ...prev,
                                            thoughtProcess: prev.thoughtProcess.map(result.thoughtProcessUpdate)
                                        } : prev);
                                    }
                                }

                                // ★リファクタリング: LLM_Intent_Analysis処理
                                if (title === 'LLM_Intent_Analysis' || title === 'LLM_Intent_Analysis_RAG' || title === 'LLM_Intent_Analysis_Web' || title === 'LLM_Intent_Analysis_Hybrid') {
                                    const result = processIntentAnalysisFinished(outputs, nodeId, addLog);
                                    if (result) {
                                        setStreamingMessage(prev => prev ? {
                                            ...prev,
                                            thoughtProcess: prev.thoughtProcess.map(result.thoughtProcessUpdate)
                                        } : prev);
                                    }
                                }

                                // ★追加: LLM_Search_Strategy処理 (Devルート)
                                if (title === 'LLM_Search_Strategy') {
                                    const result = processSearchStrategyFinished(outputs, nodeId, addLog);
                                    if (result) {
                                        setStreamingMessage(prev => prev ? {
                                            ...prev,
                                            thoughtProcess: prev.thoughtProcess.map(result.thoughtProcessUpdate)
                                        } : prev);
                                    }
                                }

                                // ★追加: LLM_RAG_Strategy处理
                                if (title === 'LLM_RAG_Strategy') {
                                    const result = processRagStrategyFinished(outputs, nodeId, addLog);
                                    if (result) {
                                        setStreamingMessage(prev => prev ? {
                                            ...prev,
                                            thoughtProcess: prev.thoughtProcess.map(result.thoughtProcessUpdate)
                                        } : prev);
                                    }
                                }

                                // ★追加: LLM_Synthesis処理 (Devルート)
                                if (title === 'LLM_Synthesis') {
                                    const result = processLlmSynthesisFinished(outputs, nodeId, addLog);
                                    if (result) {
                                        setStreamingMessage(prev => prev ? {
                                            ...prev,
                                            thoughtProcess: prev.thoughtProcess.map(result.thoughtProcessUpdate)
                                        } : prev);
                                    }
                                }

                                // ★リファクタリング: ワークフローログ出力
                                logWorkflowOutput(outputs, title, addLog);

                                // その他のノードは完了ステータスに更新（エラーでない場合のみ）
                                if (nodeId && title !== 'LLM_Query_Rewrite' && title !== 'LLM_Intent_Analysis' && title !== 'LLM_Intent_Analysis_RAG' && title !== 'LLM_Intent_Analysis_Web' && title !== 'LLM_Intent_Analysis_Hybrid' && title !== 'LLM_RAG_Strategy' && title !== 'LLM_Synthesis' && !nodeError) {
                                    setStreamingMessage(prev => prev ? {
                                        ...prev,
                                        thoughtProcess: prev.thoughtProcess.map(t => t.id === nodeId ? { ...t, status: 'done' } : t)
                                    } : prev);
                                }
                            }

                            else if (data.event === 'message') {
                                if (data.answer) {
                                    // 最初のmessageイベント受信時にタイマー開始
                                    if (messageStartTime === null) {
                                        messageStartTime = Date.now();
                                    }

                                    contentBuffer += data.answer;
                                    tracker.markFirstToken();
                                    tracker.incrementChars(data.answer);

                                    // ★リファクタリング: プロトコルモード判定
                                    if (protocolMode === 'PENDING') {
                                        protocolMode = determineProtocolMode(contentBuffer);
                                    }

                                    // ★リファクタリング: メッセージコンテンツ抽出
                                    const { textToDisplay, thinkingToDisplay, newProtocolMode } = extractMessageContent(
                                        contentBuffer,
                                        protocolMode,
                                        messageStartTime,
                                        DISPLAY_DELAY_MS
                                    );
                                    protocolMode = newProtocolMode;

                                    setStreamingMessage(prev => prev ? {
                                        ...prev,
                                        text: textToDisplay,
                                        rawContent: contentBuffer,
                                        thinking: thinkingToDisplay
                                    } : prev);
                                }
                            }
                            else if (data.event === 'message_end') {
                                // ★リファクタリング: message_end処理
                                const messageEndResult = processMessageEnd(data, detectedTraceMode);
                                if (messageEndResult) {
                                    setStreamingMessage(prev => prev ? {
                                        ...prev,
                                        citations: messageEndResult.citations,
                                        traceMode: messageEndResult.traceMode
                                    } : prev);
                                }
                                if (data.message_id) {
                                    fetchSuggestions(data.message_id, aiMessageId);
                                }
                            }
                            else if (data.event === 'workflow_finished') {
                                // ★追加: ワークフローエラー処理
                                const wfError = processWorkflowError(data, addLog);

                                // ★リファクタリング: workflow_finished処理
                                const workflowResult = processWorkflowFinished(contentBuffer, protocolMode, addLog);

                                const currentStreamingMsg = streamingMessageRef.current;
                                if (currentStreamingMsg) {
                                    const finalMessage = buildFinalMessage(
                                        currentStreamingMsg,
                                        workflowResult,
                                        contentBuffer,
                                        detectedTraceMode
                                    );

                                    // ★追加: ワークフローエラー情報を最終メッセージに含める
                                    if (wfError || currentStreamingMsg.hasWorkflowError) {
                                        finalMessage.hasWorkflowError = true;
                                        finalMessage.workflowError = wfError
                                            ? { nodeTitle: 'ワークフロー', message: wfError.errorMessage }
                                            : currentStreamingMsg.workflowError;
                                    }

                                    setMessages(prevMsgs => [...prevMsgs, finalMessage]);
                                    setStreamingMessage(null);
                                }
                            }
                            // ★変更: SSE error イベント → IntelligenceErrorHandler に委譲
                            else if (data.event === 'error') {
                                const errorCode = data.code || 'UNKNOWN';
                                const errorMessage = data.message || '不明なエラーが発生しました';
                                const fullErrorMsg = `${errorCode}: ${errorMessage}`;
                                addLog(`[SSE Error] ${fullErrorMsg}`, 'error');

                                // ストリーミング中のメッセージをクリーンアップ
                                setStreamingMessage(null);
                                // IntelligenceErrorHandler にエラーを報告
                                setLastError({ raw: fullErrorMsg, timestamp: Date.now() });
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
            // ★変更: IntelligenceErrorHandler にエラーを委譲
            setStreamingMessage(null);
            setLastError({ raw: error.message, timestamp: Date.now() });
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

    // ★リファクタリング: 生成停止関数
    const stopGeneration = useCallback(async () => {
        const result = await executeStopGeneration({
            abortControllerRef,
            currentTaskIdRef,
            streamingMessageRef,
            mockMode,
            apiKey,
            apiUrl,
            userId,
            addLog,
        });

        if (result.stoppedMessage) {
            setMessages(prev => [...prev, result.stoppedMessage]);
            setStreamingMessage(null);
        }

        setIsGenerating(false);
    }, [mockMode, apiKey, apiUrl, userId, addLog]);

    // ★リファクタリング: メッセージ編集関数
    const handleEdit = useCallback(async (messageId, newText) => {
        const result = prepareMessageEdit({ messageId, messages, addLog });

        if (!result.shouldSend) {
            return;
        }

        setMessages(result.previousMessages);

        // ★修正: 元のメッセージから状態を復元 (attachments等)
        const targetMessage = result.targetMessage;
        let attachments = [];
        if (targetMessage) {
            const restored = restoreMessageState(targetMessage.text);
            attachments = restored.attachments || [];
            // ここでcontextやintelligenceを復元するか？
            // 仕様としては「現在の設定」で再送信するのが自然かもしれないが、
            // Dify APIに送る際はattachmentsが必要。
            // context (stores) は現在のUI状態 (searchSettings) が優先されるべきか？
            // attachmentsだけは確実に引き継ぐ必要がある。
        }

        // handleSendMessageはFile|AttachmentMeta[]を受け付けるように修正済み
        await handleSendMessage(newText, attachments);
    }, [messages, handleSendMessage, addLog]);

    // ★リファクタリング: 再送信（再生成）関数
    const handleRegenerate = useCallback(async () => {
        const result = prepareRegenerate({ messages, addLog });

        if (!result.shouldSend) {
            return;
        }

        setMessages(result.truncatedMessages);

        // ★修正: extractPlainText で構造化JSONからプレーンテキストを抽出し、二重ラップを防止
        const textToSend = extractPlainText(result.targetUserMessage.text || '');

        await handleSendMessage(textToSend, result.targetUserMessage.files || []);
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
        forceSearch: searchSettings.webEnabled,
        setForceSearch: (force) => updateSearchSettings({ ...searchSettings, webEnabled: !!force }),
        // ★新規: 停止・編集・再送信機能
        stopGeneration,
        handleEdit,
        handleRegenerate,
        // ★Phase 2: サニタイズ通知
        sanitizeNotification,
        setSanitizeNotification,
        // ★追加: IntelligenceErrorHandler連携
        lastError,
        setLastError,
    };
};