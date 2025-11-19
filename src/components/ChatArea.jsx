// src/components/ChatArea.jsx
import React, { useEffect } from 'react';
import '../App.css';
import './styles/ChatArea.css';

import MockModeSelect from './MockModeSelect';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';

// ストリーミング用モックデータのインポート
import { mockStreamResponse } from '../mockData';
// APIクライアントのインポート
import { uploadFile } from '../api/dify';
// ユーティリティのインポート
import { parseLlmResponse } from '../utils/responseParser';

// --- PoC API設定 ---
const DIFY_API_KEY = import.meta.env.VITE_DIFY_API_KEY;
const DIFY_API_URL = import.meta.env.VITE_DIFY_API_URL;
const USER_ID = 'poc-user-01';

// BEモック用の注入データ
const MOCK_PERPLEXITY_JSON = JSON.stringify({
  "search_results": [
    {
      "url": "https://netlab.click/todayis/1118",
      "snippet": "2025年11月18日は「土木の日」「いい家の日」「森とふるさとの日」など、様々な記念日が制定されています。",
      "title": "今日は何の日？ 2025年11月18日の記念日まとめ｜ねとらぼ"
    },
    {
      "url": "https://note.com/zouplans/n/n11c613763e21",
      "snippet": "2025年11月18日は何の日か。運勢占いでは「解放の日」「ブレーキの日」とされ、努力が実る日です。",
      "title": "2025年11月18日の運勢と記念日｜占いと暦"
    }
  ],
  "answer": "2025年11月18日は、「土木の日」「いい家の日」「森とふるさとの日」など様々な記念日があります。また、運勢的には「解放の日」とされ、努力が実る日と言われています。"
});

const ChatArea = (props) => {
  const {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    mockMode,
    setMockMode,
    conversationId,
    addLog,
    handleCopyLogs,
    copyButtonText,
    onConversationCreated,
    onUpdateMessageHistory,
  } = props;

  useEffect(() => {
    if (mockMode === 'FE' && conversationId && messages.length > 0) {
      onUpdateMessageHistory(conversationId, messages);
    }
  }, [messages, mockMode, conversationId, onUpdateMessageHistory]);

  const handleApiError = (errorText, aiMessageId) => {
    addLog(`[API Error] ${errorText}`, 'error');
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === aiMessageId
          ? {
              ...msg,
              text: `**エラーが発生しました:**\n\n${errorText}\n\nAPI設定またはファイル形式を確認してください。`,
              citations: [],
              suggestions: [],
              isStreaming: false,
              timestamp: new Date().toISOString(),
              processStatus: null,
            }
          : msg
      )
    );
    setIsLoading(false);
  };

  const handleSendMessage = async (text, attachment = null) => {
    addLog(`[ChatArea] Sending: "${text}", Mode: ${mockMode}, File: ${attachment ? attachment.name : 'None'}`, 'info');

    let uploadedFileId = null;
    let displayFiles = [];

    // Case 1: BE Mockモード
    if (mockMode === 'BE') {
        if (attachment) {
            addLog('[ChatArea] BE Mode active. SKIPPING file upload (Mocking).', 'warn');
            displayFiles = [{ name: `(Mock) ${attachment.name}`, type: 'document' }];
        }
    }
    // Case 2: 本番 (OFF) モード
    else if (mockMode === 'OFF') {
        if (attachment) {
            setIsLoading(true); 
            try {
                addLog('[ChatArea] Uploading file to Dify...', 'info');
                const uploadRes = await uploadFile(attachment, USER_ID, DIFY_API_URL, DIFY_API_KEY);
                uploadedFileId = uploadRes.id;
                displayFiles = [{ name: attachment.name, type: 'document' }];
                addLog(`[ChatArea] Upload success. ID: ${uploadedFileId}`, 'info');
            } catch (e) {
                handleApiError(`ファイルアップロード失敗: ${e.message}`, `err_${Date.now()}`);
                setIsLoading(false); 
                return;
            }
        }
    }
    // Case 3: FE Mockモード
    else {
        if (attachment) {
            displayFiles = [{ name: attachment.name, type: 'document' }];
        }
    }

    // ユーザーメッセージ表示
    const userMessage = {
      id: `msg_${Date.now()}_user`,
      text: text,
      role: 'user',
      timestamp: new Date().toISOString(),
      files: displayFiles 
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // AIメッセージ枠
    const aiMessageId = `msg_${Date.now()}_ai`;
    const aiMessage = {
      id: aiMessageId,
      text: '',
      role: 'ai',
      citations: [],
      suggestions: [],
      isStreaming: true,
      timestamp: new Date().toISOString(),
      processStatus: uploadedFileId ? 'ドキュメントを解析しています...' : 'AIが思考を開始しました...', 
    };
    setMessages((prev) => [...prev, aiMessage]);

    // --- FE Mock Logic ---
    if (mockMode === 'FE') {
      addLog('[ChatArea] FE Mock Mode started.', 'info');
      
      if (!conversationId) {
        const mockNewId = `mock_conv_${Date.now()}`;
        onConversationCreated(mockNewId, text || attachment?.name || '新規チャット');
      }
      const mockResponseText = mockStreamResponse.text;
      
      setTimeout(() => {
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, processStatus: '外部情報を検索しています...' } : msg));
      }, 500);
      setTimeout(() => {
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, processStatus: '回答を生成しています...' } : msg));
      }, 1500);
      setTimeout(() => {
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, processStatus: null } : msg));
        let index = 0;
        const streamInterval = setInterval(() => {
          if (index < mockResponseText.length) {
            const char = mockResponseText[index];
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId ? { ...msg, text: msg.text + char } : msg
              )
            );
            index++;
          } else {
            clearInterval(streamInterval);
            addLog('[ChatArea] FE Mock stream finished.', 'info');
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { 
                      ...msg, 
                      citations: mockStreamResponse.citations, 
                      suggestions: mockStreamResponse.suggestions, 
                      isStreaming: false,
                      processStatus: null 
                    }
                  : msg
              )
            );
            setIsLoading(false);
          }
        }, 20);
      }, 3000);
      return;
    }

    // --- API Request ---
    if (!DIFY_API_KEY || !DIFY_API_URL) {
      handleApiError('API KEY or URL missing.', aiMessageId);
      return;
    }

    const filesPayload = uploadedFileId ? [
        {
            type: 'document',
            transfer_method: 'local_file',
            upload_file_id: uploadedFileId
        }
    ] : [];

    const requestBody = {
      inputs: {
         isDebugMode: mockMode === 'BE',
         mock_perplexity_text: mockMode === 'BE' ? MOCK_PERPLEXITY_JSON : '',
      },
      query: text, 
      user: USER_ID,
      conversation_id: conversationId || '',
      response_mode: 'streaming',
      files: filesPayload, 
    };

    try {
        const response = await fetch(`${DIFY_API_URL}/chat-messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${DIFY_API_KEY}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.code || 'API Error');
        }
        if (!response.body) throw new Error('ReadableStream not available');

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = '';
        let contentBuffer = '';
        let isConversationCreatedLocally = false;
        
        const updateStatus = (status) => {
             setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, processStatus: status } : msg));
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataLine = line.substring(6).trim();
              if (!dataLine) continue;

              try {
                const data = JSON.parse(dataLine);

                if (data.conversation_id && !conversationId && !isConversationCreatedLocally) {
                     isConversationCreatedLocally = true;
                     const title = text || (attachment ? attachment.name : '新規チャット');
                     onConversationCreated(data.conversation_id, title);
                }

                if (data.event === 'node_started') {
                    const nodeType = data.data?.node_type;
                    if (nodeType === 'llm') updateStatus('AIが思考しています...');
                    else if (nodeType === 'tool') updateStatus('外部ツールを実行中...');
                }
                else if (data.event === 'message') {
                    if (data.answer) {
                        contentBuffer += data.answer;
                        
                        const trimmedBuffer = contentBuffer.trim();
                        // JSONパターンの検出と非表示制御
                        const isJsonPattern = trimmedBuffer.startsWith('{') || trimmedBuffer.startsWith('```');

                        setMessages((prev) =>
                            prev.map((msg) => {
                                if (msg.id !== aiMessageId) return msg;
                                if (isJsonPattern) {
                                    return { ...msg, text: '', processStatus: '回答を生成・整形しています...' };
                                } else {
                                    return { ...msg, text: contentBuffer, processStatus: null };
                                }
                            })
                        );
                    }
                } else if (data.event === 'message_end') {
                    const citations = data.metadata?.retriever_resources || [];
                    if (citations.length > 0) {
                         setMessages((prev) => prev.map(msg => msg.id === aiMessageId ? { ...msg, citations: mapCitations(citations) } : msg));
                    }
                    if (data.message_id) {
                         // ★★★ 修正: 3秒後に1回だけ取得する (リトライなし) ★★★
                         setTimeout(() => {
                            fetchSuggestions(data.message_id, aiMessageId);
                         }, 3000); 
                    }
                } else if (data.event === 'workflow_finished') {
                    updateStatus(null);
                    
                    // 最終的な回答テキストのパース処理
                    const currentMsg = messages.find(m => m.id === aiMessageId);
                    let finalText = contentBuffer;
                    let finalCitations = currentMsg?.citations || [];

                    const parsed = parseLlmResponse(finalText);

                    if (parsed.isParsed) {
                        finalText = parsed.answer;
                        if (parsed.citations && parsed.citations.length > 0) {
                            finalCitations = mapCitationsFromLLM(parsed.citations);
                        }

                        let charIndex = 0;
                        const streamInterval = setInterval(() => {
                          if (charIndex <= finalText.length) {
                            const displayText = finalText.substring(0, charIndex);
                            setMessages((prev) =>
                              prev.map((msg) =>
                                msg.id === aiMessageId
                                  ? { 
                                      ...msg, 
                                      text: displayText,
                                      processStatus: null 
                                    }
                                  : msg
                              )
                            );
                            charIndex += 1; 
                          } else {
                            clearInterval(streamInterval);
                            setMessages((prev) =>
                              prev.map((msg) =>
                                msg.id === aiMessageId
                                  ? { 
                                      ...msg, 
                                      citations: finalCitations, 
                                      isStreaming: false,
                                      processStatus: null 
                                    }
                                  : msg
                              )
                            );
                            setIsLoading(false);
                          }
                        }, 10); 
                    } else {
                        setMessages((prev) =>
                          prev.map((msg) =>
                            msg.id === aiMessageId
                              ? { 
                                  ...msg, 
                                  text: finalText, 
                                  citations: finalCitations, 
                                  isStreaming: false,
                                  processStatus: null
                                }
                              : msg
                          )
                        );
                        setIsLoading(false);
                    }
                }
              } catch (e) { /* ignore */ }
            }
          }
        }
        if (isLoading) {
            setIsLoading(false);
            setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, isStreaming: false, processStatus: null } : msg));
        }

    } catch (error) {
        handleApiError(error.message, aiMessageId);
    }
  };

  // --- ヘルパー関数 ---

  // ★★★ 修正: ループを削除し、1回だけfetchする単純な関数に戻す ★★★
  const fetchSuggestions = async (messageId, aiMessageId) => {
      try {
        const response = await fetch(
          `${DIFY_API_URL}/messages/${messageId}/suggested?user=${USER_ID}`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${DIFY_API_KEY}` },
          }
        );
        
        if (response.ok) {
            const result = await response.json();
            if (result.result === 'success' && result.data && result.data.length > 0) {
                setMessages((prev) => prev.map((msg) => msg.id === aiMessageId ? { ...msg, suggestions: result.data } : msg));
            } else {
                // データがない場合のログ（デバッグ用）
                console.log('[Suggestions] Empty data received (Delayed Fetch).');
            }
        }
      } catch (error) {
          console.warn('[Suggestions] Fetch failed:', error);
      }
  };

  const mapCitations = (resources) => {
      return resources.map((res, index) => ({
        id: res.document_id || `cite_${index}`,
        type: res.document_url ? 'web' : 'file',
        source: `[${index + 1}] ${res.document_name || '不明な出典'}`,
        url: res.document_url || null,
      }));
  };

  const mapCitationsFromLLM = (citations) => {
      if (!citations || !Array.isArray(citations)) return [];
      return citations.map((cite, index) => ({
        id: `cite_llm_${index}`,
        type: cite.url ? 'web' : 'file',
        source: `[${index + 1}] ${cite.source || '不明な出典'}`,
        url: cite.url || null,
      }));
  };
  
  return (
    <div className="chat-area">
      <div className="top-bar-container">
        <div className="mock-mode-controls">
          <MockModeSelect mockMode={mockMode} setMockMode={setMockMode} />
        </div>
        <div className="debug-controls">
          <button className="debug-copy-button-topbar" onClick={handleCopyLogs}>
            {copyButtonText}
          </button>
        </div>
      </div>

      <ChatHistory
        messages={messages}
        onSuggestionClick={(q) => handleSendMessage(q, null)}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
      />
      
      {(messages.length > 0 || isLoading) && (
        <ChatInput 
          isLoading={isLoading} 
          onSendMessage={handleSendMessage} 
          isCentered={false}
        />
      )}
    </div>
  );
};

export default ChatArea;