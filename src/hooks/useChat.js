// src/hooks/useChat.js
import { useState, useEffect, useRef } from 'react';
import { mockMessages, mockStreamResponseWithFile, mockStreamResponseNoFile } from '../mockData';
import { uploadFile, fetchMessagesApi, sendChatMessageApi, fetchSuggestionsApi } from '../api/dify';
import { parseLlmResponse } from '../utils/responseParser';
import { mapCitationsFromApi, mapCitationsFromLLM } from '../utils/citationMapper';

const DIFY_API_KEY = import.meta.env.VITE_DIFY_API_KEY;
const DIFY_API_URL = import.meta.env.VITE_DIFY_API_URL;
const USER_ID = 'poc-user-01';

// バックエンドモックモード用のダミー検索結果
const MOCK_PERPLEXITY_JSON = JSON.stringify({
  "search_results": [
    {
      "url": "https://netlab.click/todayis/1118",
      "snippet": "2025年11月18日は「土木の日」「いい家の日」「森とふるさとの日」など、様々な記念日が制定されています。",
      "title": "今日は何の日？ 2025年11月18日の記念日まとめ｜ねとらぼ"
    }
  ],
  "answer": "2025年11月18日は、「土木の日」など様々な記念日があります。"
});

export const useChat = (mockMode, conversationId, addLog, onConversationCreated) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeContextFile, setActiveContextFile] = useState(null);
  const [dynamicMockMessages, setDynamicMockMessages] = useState({});

  // Domain Filters State
  const [domainFilters, setDomainFilters] = useState([]);
  const filtersMapRef = useRef({});

  // Force Search State
  const [forceSearch, setForceSearch] = useState(false);
  // 非同期処理内で最新のstateを参照するためのRef
  const forceSearchRef = useRef(forceSearch);

  useEffect(() => {
    forceSearchRef.current = forceSearch;
  }, [forceSearch]);

  const creatingConversationIdRef = useRef(null);

  // 会話ごとにフィルタ設定を記憶・復元するラッパー
  const updateDomainFilters = (newFilters) => {
    setDomainFilters(newFilters);
    if (conversationId) {
      filtersMapRef.current[conversationId] = newFilters;
    }
  };

  // --- FE Mock Memory Sync ---
  // フロントエンドモック時に、会話切り替えでチャット履歴が消えないようにメモリに保存
  useEffect(() => {
    if (mockMode === 'FE' && conversationId && messages.length > 0) {
      setDynamicMockMessages((prev) => ({ ...prev, [conversationId]: messages }));
    }
  }, [messages, mockMode, conversationId]);

  // --- Load History ---
  useEffect(() => {
    const loadHistory = async () => {
      // フィルタ設定の復元
      const savedFilters = filtersMapRef.current[conversationId] || [];
      setDomainFilters(savedFilters);

      // 新規作成直後のリロード回避
      if (conversationId && conversationId === creatingConversationIdRef.current) {
        addLog(`[useChat] Skip loading history for just-created conversation: ${conversationId}`, 'info');
        creatingConversationIdRef.current = null;
        return;
      }

      addLog(`[useChat] Conversation changed to: ${conversationId}`, 'info');
      setActiveContextFile(null);

      if (conversationId === null) {
        setMessages([]);
        return;
      }

      // FEモックモードの履歴ロード
      if (mockMode === 'FE') {
        if (dynamicMockMessages[conversationId]) {
          setMessages(dynamicMockMessages[conversationId]);
        } else {
          setMessages(mockMessages[conversationId] || []);
        }
        return;
      }

      // リアルAPIからの履歴ロード
      setIsLoading(true);
      setMessages([]);
      try {
        const historyData = await fetchMessagesApi(conversationId, USER_ID, DIFY_API_URL, DIFY_API_KEY);
        // APIは新しい順で返すが、UI表示用に古い順にソート
        const chronologicalMessages = (historyData.data || []).sort((a, b) => a.created_at - b.created_at);

        const newMessages = [];
        for (const item of chronologicalMessages) {
          const timestamp = item.created_at ? new Date(item.created_at * 1000).toISOString() : new Date().toISOString();

          // ユーザーメッセージ
          if (item.query) {
            newMessages.push({
              id: `${item.id}_user`,
              role: 'user',
              text: item.query,
              timestamp: timestamp,
              files: item.message_files ? item.message_files.map(f => ({ name: f.url ? '添付ファイル' : 'File' })) : []
            });
          }

          // AIメッセージ
          if (item.answer) {
            let aiText = item.answer;
            // Dify API標準の出典情報
            let aiCitations = mapCitationsFromApi(item.retriever_resources || []);
            let traceMode = aiCitations.length > 0 ? 'search' : 'knowledge';

            // LLMが生成したJSON内の出典情報をパース試行
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
              rawContent: item.answer, // 履歴ロード時は整形前テキストをそのままRawとする
              citations: aiCitations,
              suggestions: [],
              isStreaming: false,
              timestamp: timestamp,
              traceMode: traceMode,
              thoughtProcess: [], // 過去ログなので思考プロセスは完了済み（空）とする
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

  // --- Send Message ---
  const handleSendMessage = async (text, attachment = null) => {
    let uploadedFileId = null;
    let displayFiles = [];

    const currentFileName = attachment?.name || activeContextFile?.name;

    // 1. File Upload Processing
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
      // Mock upload
      if (attachment) {
        displayFiles = [{ name: attachment.name }];
        setActiveContextFile({ id: 'mock_id', name: attachment.name });
      }
    }

    // 2. Optimistic UI Updates
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
      text: '',           // 表示用テキスト（パース済み）
      rawContent: '',     // ★ New: 受信した生データ（デバッグ用）
      citations: [],
      suggestions: [],
      isStreaming: true,
      timestamp: new Date().toISOString(),
      traceMode: 'knowledge',
      thoughtProcess: [], // ★ New: 思考プロセスの配列初期化
      processStatus: null // Deprecated
    }]);

    // 3. API Request Execution
    if (mockMode === 'FE') {
      // --- FrontEnd Mock Logic ---
      const hasFile = attachment || activeContextFile;
      let mockRes = mockStreamResponseNoFile;
      let finalTraceMode = 'knowledge';

      if (hasFile) {
        mockRes = mockStreamResponseWithFile;
        finalTraceMode = 'document';
      } else if (mockRes.citations && mockRes.citations.length > 0) {
        finalTraceMode = 'search';
      }

      let finalText = mockRes.text;
      let finalCitations = mockRes.citations;

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
        if (onConversationCreated) {
          onConversationCreated(newMockId, text);
        }
      }

      // ★ FE Mock: 思考プロセスのアニメーションシミュレーション
      const simulateSteps = async () => {
        // Step 1: 意図解析
        setMessages(prev => prev.map(m => m.id === aiMessageId ? {
          ...m,
          thoughtProcess: [{ id: 'step1', title: 'ユーザーの意図を解析中...', status: 'processing' }]
        } : m));
        await new Promise(r => setTimeout(r, 600));

        // Step 2: ツール実行
        const toolTitle = hasFile ? `ドキュメント「${currentFileName}」を読込中...` : 'Webから最新情報を検索中...';
        setMessages(prev => prev.map(m => m.id === aiMessageId ? {
          ...m,
          thoughtProcess: [
            { id: 'step1', title: 'ユーザーの意図を解析中...', status: 'done' },
            { id: 'step2', title: toolTitle, status: 'processing' }
          ]
        } : m));
        await new Promise(r => setTimeout(r, 1200));

        // Step 3: 回答生成
        setMessages(prev => prev.map(m => m.id === aiMessageId ? {
          ...m,
          thoughtProcess: [
            { id: 'step1', title: 'ユーザーの意図を解析中...', status: 'done' },
            { id: 'step2', title: toolTitle, status: 'done' },
            { id: 'step3', title: '情報を整理して回答を生成中...', status: 'processing' }
          ]
        } : m));
        await new Promise(r => setTimeout(r, 800));

        // 完了
        setMessages(prev => prev.map(m => m.id === aiMessageId ? {
          ...m,
          traceMode: finalTraceMode,
          text: finalText,
          rawContent: mockRes.text, // モックも生データを入れる
          citations: finalCitations,
          suggestions: mockRes.suggestions,
          isStreaming: false,
          thoughtProcess: m.thoughtProcess.map(t => ({ ...t, status: 'done' }))
        } : m));
        setIsLoading(false);
      };

      simulateSteps();
      return;
    }

    // --- Real API Logic ---
    const domainFilterString = domainFilters.length > 0 ? domainFilters.join(', ') : '';
    const searchModeValue = forceSearchRef.current ? 'force' : 'auto';

    addLog(`[Search Mode] ${searchModeValue.toUpperCase()}`, 'info');

    const requestBody = {
      inputs: {
        isDebugMode: mockMode === 'BE',
        mock_perplexity_text: mockMode === 'BE' ? MOCK_PERPLEXITY_JSON : '',
        domain_filter: domainFilterString,
        search_mode: searchModeValue,
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

      let contentBuffer = ''; // これがRawデータそのもの
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

            // Conversation IDの同期
            if (data.conversation_id && !conversationId && !isConversationIdSynced) {
              isConversationIdSynced = true;
              creatingConversationIdRef.current = data.conversation_id;
              if (domainFilters.length > 0) {
                filtersMapRef.current[data.conversation_id] = domainFilters;
              }
              onConversationCreated(data.conversation_id, text);
            }

            // ★ Workflow Node Event Handling (Timeline Visualization)
            if (data.event === 'node_started') {
              const nodeType = data.data?.node_type;
              const title = data.data?.title;
              const nodeId = data.data?.node_id || `node_${Date.now()}`;

              // 重要なノード判定: すべてのLLMを含めることで最後の生成ステップも可視化
              const isSignificantNode =
                nodeType === 'tool' ||
                nodeType === 'document-extractor' ||
                nodeType === 'llm';

              if (isSignificantNode) {
                let displayTitle = title;

                // タイトルとモードの知能的振り分け
                if (title && (title.includes('Intent') || title.includes('Classif') || title.includes('意図'))) {
                  displayTitle = '質問の意図を解析中...';
                } else if ((title && title.includes('Perplexity')) || nodeType === 'tool') {
                  displayTitle = 'Webから最新情報を検索中...';
                  detectedTraceMode = 'search';
                } else if (nodeType === 'document-extractor') {
                  displayTitle = 'ドキュメントを読込中...';
                  detectedTraceMode = 'document';
                } else if (nodeType === 'llm') {
                  // 最後の回答生成LLM用タイトル
                  displayTitle = '情報を整理して回答を生成中...';
                }

                setMessages(prev => prev.map(m => m.id === aiMessageId ? {
                  ...m,
                  traceMode: detectedTraceMode,
                  thoughtProcess: [
                    ...m.thoughtProcess.map(t => ({ ...t, status: 'done' })), // 前のステップを完了
                    { id: nodeId, title: displayTitle, status: 'processing' } // 新しいステップを開始
                  ]
                } : m));
              }
            }
            else if (data.event === 'node_finished') {
              // 完了したノードをマーク
              const nodeId = data.data?.node_id;
              if (nodeId) {
                setMessages(prev => prev.map(m => m.id === aiMessageId ? {
                  ...m,
                  thoughtProcess: m.thoughtProcess.map(t =>
                    t.id === nodeId ? { ...t, status: 'done' } : t
                  )
                } : m));
              }
            }
            else if (data.event === 'message') {
              if (data.answer) {
                contentBuffer += data.answer;

                // ★ Streaming Parser: 部分抽出ロジックの適用
                const parsed = parseLlmResponse(contentBuffer);

                // JSON構造かどうかを判定
                const isJsonStructure = contentBuffer.trim().startsWith('{') || contentBuffer.trim().startsWith('```');

                // パース成功ならanswerを表示、失敗ならJSON以外はそのまま表示、JSON途中なら空（スケルトン）
                const textToDisplay = parsed.isParsed ? parsed.answer : (isJsonStructure ? '' : contentBuffer);

                setMessages(prev => prev.map(m => m.id === aiMessageId ? {
                  ...m,
                  text: textToDisplay,
                  rawContent: contentBuffer, // ★ New: 生データをリアルタイム更新
                  // ★処理中ステータス維持: テキストが流れても回答生成ステップは 'processing' のまま
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

              // 最終的なパース処理
              const parsed = parseLlmResponse(finalText);
              if (parsed.isParsed) {
                finalText = parsed.answer;
                if (parsed.citations.length > 0) {
                  finalCitations = mapCitationsFromLLM(parsed.citations).map(citation => {
                    // ファイル名とのマッチング処理
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
                rawContent: contentBuffer, // 最終Rawデータ
                citations: m.citations.length > 0 ? m.citations : finalCitations,
                isStreaming: false,
                traceMode: detectedTraceMode,
                // Workflow完了時は確実に全てdoneにする
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
    activeContextFile,
    setActiveContextFile,
    handleSendMessage,
    domainFilters,
    setDomainFilters: updateDomainFilters,
    forceSearch,
    setForceSearch
  };
};