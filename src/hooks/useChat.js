// src/hooks/useChat.js
import { useState, useEffect, useRef } from 'react';
import { mockMessages, mockStreamResponseWithFile, mockStreamResponseNoFile } from '../mockData';
import { uploadFile, fetchMessagesApi, sendChatMessageApi, fetchSuggestionsApi } from '../api/dify';
import { parseLlmResponse } from '../utils/responseParser';
import { mapCitationsFromApi, mapCitationsFromLLM } from '../utils/citationMapper';

const DIFY_API_KEY = import.meta.env.VITE_DIFY_API_KEY;
const DIFY_API_URL = import.meta.env.VITE_DIFY_API_URL;
const USER_ID = 'poc-user-01';

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

  // ★ New: Force Search State
  const [forceSearch, setForceSearch] = useState(false);
  
  // ★ Fix: Use ref to track latest forceSearch state for async access
  const forceSearchRef = useRef(forceSearch);
  
  useEffect(() => {
    forceSearchRef.current = forceSearch;
  }, [forceSearch]);

  const creatingConversationIdRef = useRef(null);

  // Wrapper to update filters and persist map
  const updateDomainFilters = (newFilters) => {
    setDomainFilters(newFilters);
    if (conversationId) {
      filtersMapRef.current[conversationId] = newFilters;
    }
  };

  // --- FE Mock Memory Sync ---
  useEffect(() => {
    if (mockMode === 'FE' && conversationId && messages.length > 0) {
      setDynamicMockMessages((prev) => ({ ...prev, [conversationId]: messages }));
    }
  }, [messages, mockMode, conversationId]);

  // --- Load History ---
  useEffect(() => {
    const loadHistory = async () => {
      // Restore Filters
      const savedFilters = filtersMapRef.current[conversationId] || [];
      setDomainFilters(savedFilters);

      // Note: Force Searchの設定は会話ごとに維持するか、グローバルにするか？
      // ここでは「会話を切り替えても設定をリセットしない（ユーザーの今の意思を尊重）」設計とします。
      // もしリセットしたい場合はここで setForceSearch(false); してください。

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
              citations: aiCitations,
              suggestions: [],
              isStreaming: false,
              timestamp: timestamp,
              traceMode: traceMode,
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

    // 1. File Upload
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

    // 2. Optimistic UI
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
      citations: [],
      suggestions: [],
      isStreaming: true,
      timestamp: new Date().toISOString(),
      processStatus: uploadedFileId ? 'ドキュメントを解析しています...' : (forceSearchRef.current ? 'Web検索を開始します(強制)...' : 'AIが思考を開始しました...'),
      traceMode: 'knowledge',
    }]);

    // 3. API Request
    if (mockMode === 'FE') {
      const hasFile = attachment || activeContextFile;
      let mockRes = mockStreamResponseNoFile;
      let finalTraceMode = 'knowledge';
      if (hasFile) { mockRes = mockStreamResponseWithFile; finalTraceMode = 'document'; }
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, traceMode: finalTraceMode, text: mockRes.text, citations: mockRes.citations, suggestions: mockRes.suggestions, isStreaming: false, processStatus: null } : m));
        setIsLoading(false);
      }, 2000);
      return;
    }

    // ★ Force Search Logic
    const domainFilterString = domainFilters.length > 0 ? domainFilters.join(', ') : '';
    const searchModeValue = forceSearchRef.current ? 'force' : 'auto';

    addLog(`[Search Mode] ${searchModeValue.toUpperCase()}`, 'info');
    if (domainFilters.length > 0) {
      addLog(`[Domain Filter] Applying: ${domainFilterString}`, 'info');
    }

    const requestBody = {
      inputs: {
        isDebugMode: mockMode === 'BE',
        mock_perplexity_text: mockMode === 'BE' ? MOCK_PERPLEXITY_JSON : '',
        domain_filter: domainFilterString,
        search_mode: searchModeValue, // ★ Inject Variable
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

              if (domainFilters.length > 0) {
                filtersMapRef.current[data.conversation_id] = domainFilters;
              }
              onConversationCreated(data.conversation_id, text);
            }

            if (data.event === 'node_started') {
              const nodeType = data.data?.node_type;
              const title = data.data?.title;
              if (nodeType === 'tool' || (title && title.includes('Perplexity'))) {
                detectedTraceMode = 'search';
                setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, processStatus: 'Webから最新情報を探しています...', traceMode: 'search' } : m));
              } else if (nodeType === 'document-extractor') {
                detectedTraceMode = 'document';
                setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, processStatus: '資料を読み込んでいます...', traceMode: 'document' } : m));
              } else if (nodeType === 'llm' && detectedTraceMode === 'knowledge') {
                setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, processStatus: '回答を生成しています...' } : m));
              }
            } else if (data.event === 'message') {
              if (data.answer) {
                contentBuffer += data.answer;
                const trimmed = contentBuffer.trim();
                const isJsonLikely = trimmed.startsWith('{') || trimmed.startsWith('```json') || trimmed.startsWith('```');
                setMessages(prev => prev.map(m => m.id === aiMessageId ? {
                  ...m,
                  text: isJsonLikely ? '' : contentBuffer,
                  processStatus: isJsonLikely ? '回答を生成・整形しています...' : m.processStatus
                } : m));
              }
            } else if (data.event === 'message_end') {
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
            } else if (data.event === 'workflow_finished') {
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
                citations: m.citations.length > 0 ? m.citations : finalCitations,
                isStreaming: false,
                processStatus: null,
                traceMode: detectedTraceMode
              } : m));
            }
          } catch (e) { console.warn('JSON Parse Error', e); }
        }
      }
      setIsLoading(false);
    } catch (error) {
      addLog(`[API Error] ${error.message}`, 'error');
      setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: `エラー: ${error.message}`, isStreaming: false, processStatus: null } : m));
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
    forceSearch,    // ★ Exposed
    setForceSearch  // ★ Exposed
  };
};