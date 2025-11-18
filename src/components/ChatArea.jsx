// src/components/ChatArea.jsx
import React, { useEffect } from 'react'; // ★ useEffectを追加
import '../App.css';
import './styles/ChatArea.css';

import MockModeSelect from './MockModeSelect';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';

// ストリーミング用モックデータのインポート
import { mockStreamResponse } from '../mockData';

// --- PoC API設定 ---
const DIFY_API_KEY = import.meta.env.VITE_DIFY_API_KEY;
const DIFY_API_URL = import.meta.env.VITE_DIFY_API_URL;
const USER_ID = 'poc-user-01';

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
    // ★ 追加: ハンドラ
    onConversationCreated,
    onUpdateMessageHistory,
  } = props;

  // ★★★ 追加: メッセージ履歴の同期 (FEモード用) ★★★
  useEffect(() => {
    // FEモードかつ会話IDが確定している場合、履歴を親にバックアップ
    if (mockMode === 'FE' && conversationId && messages.length > 0) {
      onUpdateMessageHistory(conversationId, messages);
    }
  }, [messages, mockMode, conversationId, onUpdateMessageHistory]);


  // --- ヘルパー関数 (変更なし) ---
  const handleApiError = (errorText, aiMessageId) => {
    addLog(`[API Error] ${errorText}`, 'error');
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === aiMessageId
          ? {
              ...msg,
              text: `**エラーが発生しました:**\n\n${errorText}\n\nAPIキーまたはURLの設定、リクエストの形式を確認してください。`,
              citations: [],
              suggestions: [],
              isStreaming: false,
              timestamp: new Date().toISOString(),
              processStatus: null, // エラー時はステータス消去
            }
          : msg
      )
    );
    setIsLoading(false);
  };

  const handleSendMessage = async (text) => {
    addLog(`[ChatArea] Sending message: "${text}", Mode: ${mockMode}, ConvID: ${conversationId}`, 'info');

    // ★ フラグ: この送信処理内で会話作成を通知済みかどうか
    let isConversationCreatedLocally = false;

    // 1. ユーザーの質問
    const userMessage = {
      id: `msg_${Date.now()}_user`,
      text: text,
      role: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // 2. AIの回答欄 (初期状態)
    const aiMessageId = `msg_${Date.now()}_ai`;
    const aiMessage = {
      id: aiMessageId,
      text: '',
      role: 'ai',
      citations: [],
      suggestions: [],
      isStreaming: true,
      timestamp: new Date().toISOString(),
      // ★ 修正: 絵文字削除
      processStatus: 'AIが思考を開始しました...', 
    };
    setMessages((prev) => [...prev, aiMessage]);

    // --- FEモック (UX確認用) ---
    if (mockMode === 'FE') {
      addLog('[ChatArea] FE Mock Mode started.', 'info');
      
      // ★ 追加: 新規チャットなら即座にサイドバー追加 (ダミーID)
      if (!conversationId) {
        const mockNewId = `mock_conv_${Date.now()}`;
        addLog(`[ChatArea] FE Mock: Generating new conversation ID: ${mockNewId}`, 'info');
        // 親コンポーネントに通知 (タイトルは質問文)
        onConversationCreated(mockNewId, text);
        // 注意: setConversationIdは親で行われるが、props経由での反映にはラグがあるため
        // 以下のuseEffectによる同期は、IDが降りてきてから機能する
      }

      const mockResponseText = mockStreamResponse.text;
      
      // ★ FEモック: ステータス遷移をシミュレート (絵文字削除)
      setTimeout(() => {
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, processStatus: '外部情報を検索しています...' } : msg));
      }, 500);

      setTimeout(() => {
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, processStatus: '回答を生成しています...' } : msg));
      }, 1500);

      // ストリーミング開始 (3秒後)
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
                      processStatus: null // 念のため消去
                    }
                  : msg
              )
            );
            setIsLoading(false);
            addLog('[ChatArea] FE Mock completed.', 'info');
          }
        }, 20);
      }, 3000);

    } else {
      // --- API実効 / BEモック ---
      addLog(`[API] ${mockMode} Mode selected. Calling Dify API...`, 'info');

      if (!DIFY_API_KEY || !DIFY_API_URL) {
        handleApiError(
          'VITE_DIFY_API_KEY または VITE_DIFY_API_URL が設定されていません。',
          aiMessageId
        );
        return;
      }

      const inputs = {
        mock_perplexity_text: mockMode === 'BE' ? JSON.stringify({
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
        }) : '',
        // isDebugMode は mockMode に応じて設定
        isDebugMode: mockMode === 'BE',
      };

      const requestBody = {
        inputs: inputs,
        query: text,
        user: USER_ID,
        conversation_id: conversationId || '',
        response_mode: 'streaming',
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
          throw new Error(`API request failed: ${errorData.message}`);
        }
        if (!response.body) throw new Error('ReadableStream not available');

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = '';
        let contentBuffer = ''; 
        let hasParsedCitations = false; 
        let pendingSuggestions = []; 
        let isStreamingAnimation = false; 

        // ★ ステータス更新用ヘルパー
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
                
                // === ★ 追加: 新規会話IDの検知と登録 ===
                if (data.conversation_id && !conversationId && !isConversationCreatedLocally) {
                     isConversationCreatedLocally = true;
                     addLog(`[API] New conversation detected: ${data.conversation_id}`, 'info');
                     // 親コンポーネントに通知 (タイトルは質問文)
                     onConversationCreated(data.conversation_id, text);
                }
                // ========================================

                // --- 1. ワークフローイベントの解析 ---
                if (data.event === 'node_started') {
                    const nodeType = data.data?.node_type;
                    const nodeTitle = data.data?.title;
                    
                    if (nodeType === 'tool') {
                         updateStatus(`外部ツールを実行中: ${nodeTitle || 'Tool'}...`);
                    } else if (nodeType === 'retriever') { 
                         updateStatus('社内ドキュメントを参照しています...');
                    } else if (nodeType === 'llm') {
                         updateStatus('AIが思考しています...');
                    }
                }

                // --- 2. メッセージ (本文) イベントの解析 ---
                else if (data.event === 'message') {
                  if (data.answer) {
                    contentBuffer += data.answer;

                    // JSON形式かどうかの簡易チェックと、キーの出現監視
                    const trimmed = contentBuffer.trim();
                    if (trimmed.startsWith('{')) {
                        // ★ 修正: 絵文字削除
                        if (/"answer"\s*:/.test(contentBuffer)) {
                            updateStatus('回答を生成しています...');
                        }
                        if (/"citations"\s*:/.test(contentBuffer)) {
                             updateStatus('情報源を整理しています...');
                        }
                        
                        setMessages((prev) =>
                            prev.map((msg) =>
                              msg.id === aiMessageId
                                ? { ...msg, text: '' } // 本文はまだ見せない
                                : msg
                            )
                        );

                    } else {
                      updateStatus(null); 
                      
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === aiMessageId
                            ? { ...msg, text: contentBuffer }
                            : msg
                        )
                      );
                    }
                  }
                } 
                
                else if (data.event === 'message_end') {
                  const citations = data.metadata?.retriever_resources || [];
                  if (citations.length > 0 && !hasParsedCitations) {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiMessageId
                          ? { ...msg, citations: mapCitations(citations) }
                          : msg
                      )
                    );
                  }
                  if (data.message_id) {
                    fetchSuggestions(data.message_id, aiMessageId, isStreamingAnimation, pendingSuggestions);
                  }
                }
                
                else if (data.event === 'workflow_finished') {
                  updateStatus(null); // ステータス消去

                  const currentMsg = messages.find(m => m.id === aiMessageId);
                  let finalText = contentBuffer;
                  let finalCitations = currentMsg?.citations || [];
                  let isJsonFormat = false;

                  try {
                    const trimmedText = finalText.trim();
                    if (trimmedText.startsWith('{') && trimmedText.endsWith('}')) {
                      const parsed = JSON.parse(trimmedText);
                      if (parsed.answer) {
                        finalText = parsed.answer;
                        isJsonFormat = true;
                        if (parsed.citations && Array.isArray(parsed.citations)) {
                          finalCitations = mapCitationsFromLLM(parsed.citations);
                        }
                      }
                    }
                  } catch (e) { /* ignore */ }

                  if (isJsonFormat && finalText) {
                    hasParsedCitations = true;
                    isStreamingAnimation = true;
                    let charIndex = 0;
                    const streamInterval = setInterval(() => {
                      if (charIndex <= finalText.length) {
                        const displayText = finalText.substring(0, charIndex);
                        setMessages((prev) =>
                          prev.map((msg) =>
                            msg.id === aiMessageId
                              ? { ...msg, text: displayText }
                              : msg
                          )
                        );
                        charIndex += 1;
                      } else {
                        clearInterval(streamInterval);
                        isStreamingAnimation = false;
                        setMessages((prev) =>
                          prev.map((msg) =>
                            msg.id === aiMessageId
                              ? { 
                                  ...msg, 
                                  citations: finalCitations, 
                                  suggestions: pendingSuggestions, 
                                  isStreaming: false,
                                  processStatus: null // 念のため
                                }
                              : msg
                          )
                        );
                        setIsLoading(false);
                      }
                    }, 20);
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
                // ... error handlings ...
              } catch (e) {
                 // ignore parse error
              }
            }
          }
        }
      } catch (error) {
        handleApiError(error.message, aiMessageId);
      }
    }
  };

  // --- 以下のヘルパー関数は変更なし ---
  const fetchSuggestions = async (messageId, aiMessageId, isStreamingAnimationActive, pendingSuggestionsRef) => {
      addLog(`[API] Fetching suggestions for message_id: ${messageId}`, 'info');
      try {
        const response = await fetch(
          `${DIFY_API_URL}/messages/${messageId}/suggested?user=${USER_ID}`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${DIFY_API_KEY}` },
          }
        );
        if (!response.ok) {
             return;
        }
        const result = await response.json();
        if (result.result === 'success' && result.data) {
            if (isStreamingAnimationActive) {
                pendingSuggestionsRef.length = 0;
                pendingSuggestionsRef.push(...result.data);
            } else {
                setMessages((prev) =>
                    prev.map((msg) =>
                    msg.id === aiMessageId
                        ? { ...msg, suggestions: result.data }
                        : msg
                    )
                );
            }
        }
      } catch (error) { /*...*/ }
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
          <button 
            className="debug-copy-button-topbar" 
            onClick={handleCopyLogs}
          >
            {copyButtonText}
          </button>
        </div>
      </div>

      <ChatHistory
        messages={messages}
        onSuggestionClick={handleSendMessage}
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