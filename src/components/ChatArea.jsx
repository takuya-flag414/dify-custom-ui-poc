// src/components/ChatArea.jsx
import React from 'react';
import '../App.css';
import './styles/ChatArea.css'; // ★CSSの変更を反映

import MockModeSelect from './MockModeSelect';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';

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
    // ★ App.jsxからログ機能を受け取る
    handleCopyLogs,
    copyButtonText,
  } = props;

  // --- (handleApiError, handleSendMessage, etc. ... 既存のロジックは変更なし) ---
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
            }
          : msg
      )
    );
    setIsLoading(false);
  };

  const handleSendMessage = async (text) => {
    addLog(`[ChatArea] Sending message: "${text}", Mode: ${mockMode}, ConvID: ${conversationId}`, 'info');

    // 1. ユーザーの質問を履歴に追加
    const userMessage = {
      id: `msg_${Date.now()}_user`,
      text: text,
      role: 'user',
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // 2. AIの空の回答欄をまず追加
    const aiMessageId = `msg_${Date.now()}_ai`;
    const aiMessage = {
      id: aiMessageId,
      text: '',
      role: 'ai',
      citations: [],
      suggestions: [],
    };
    setMessages((prev) => [...prev, aiMessage]);

    // --- FEモック ---
    if (mockMode === 'FE') {
      addLog('[ChatArea] FE Mock Mode started.', 'info');
      const mockResponse = `「${text}」に対するFEモックの応答です。\nこれは擬似的なストリーミング(T-06)のテストです。\n1文字ずつ表示されます。`;
      let index = 0;
      const streamInterval = setInterval(() => {
        if (index < mockResponse.length) {
          const char = mockResponse[index];
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId ? { ...msg, text: msg.text + char } : msg
            )
          );
          index++;
        } else {
          clearInterval(streamInterval);
          addLog('[ChatArea] FE Mock stream finished.', 'info');
          const mockCitations = [
            { id: 'fe-1', type: 'file', source: 'FEモック.pdf (P.1)' },
            { id: 'fe-2', type: 'web', source: 'https://mock.dify.ai/api', url: 'https://mock.dify.ai' },
          ];
          const mockSuggestions = [
            'FEモックの次の質問は?',
            'BEモックについても教えて',
          ];
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, citations: mockCitations, suggestions: mockSuggestions }
                : msg
            )
          );
          setIsLoading(false);
          addLog('[ChatArea] FE Mock completed.', 'info');
        }
      }, 20);

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
            "content": "2025年11月7日は「立冬」「鍋の日」「知恵の日」などの記念日があり、また新潟・佐渡空港の開港記念日でもあります。\n\n具体的には、  \n- **立冬**:二十四節気の一つで、冬の始まりを意味する日です。  \n- **鍋の日**:冬の訪れとともに鍋料理を楽しむ日として制定されています。  \n- **知恵の日**:知恵を大切にする日として認知されています。  \n- 1958年に**新潟・佐渡空港がオープンした日**でもあります[10][14]。\n\nまた、運勢的には「頼まれごとをきっかけに信頼関係が深まる日」とされ、金運は「大切なお金をしっかり守れる日」との占いもあります[3][17]。  \n\nさらに、2025年11月7日は地震が日向灘で発生した日でもありますが、特別な凶日とはされていません[11]。  \n\nこれらの情報から、11月7日は季節の節目として冬の始まりを感じる日であり、記念日も多い日といえます。",
            "role": "assistant",
            "citations": [
            "https://www.mwed.jp/articles/12629/",
            "https://note.com/zouplans/n/n06f668ef9b97",
            "https://sp.gettersiida.net/article/gettersiida/unsei/27188/",
            "https://kids.yahoo.co.jp/today/1008",
            "https://www.mwed.jp/articles/13239/",
            "https://zatsuneta.com/category/anniversary10.html",
            "https://netlab.click/todayis/1107",
            "https://kango.mynavi.jp/contents/nurseplus/news/20251107-2182253/"
            ]
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

      addLog(`[API] Request body: ${JSON.stringify(requestBody, null, 2)}`, 'info');

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
          throw new Error(`API request failed with status ${response.status}: ${errorData.message || 'Unknown error'}`);
        }
        if (!response.body) {
          throw new Error('ReadableStream not available');
        }

        // ... (既存のストリーミング処理ロジックは変更なし) ...
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = '';
        let contentBuffer = ''; // ストリーミング内容を一時保存
        let hasParsedCitations = false; // JSON由来のcitationsがあるかのフラグ
        let pendingSuggestions = []; // 保留中のsuggestions
        let isStreamingAnimation = false; // アニメーション中かどうか

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            addLog('[API Stream] Stream finished.', 'info');
            break;
          }

          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataLine = line.substring(6).trim();
              if (!dataLine) continue;

              try {
                const data = JSON.parse(dataLine);
                
                if (data.event === 'message') {
                  if (data.answer) {
                    contentBuffer += data.answer;
                    
                    // JSON形式かチェック
                    const trimmed = contentBuffer.trim();
                    const isJson = trimmed.startsWith('{');
                    
                    if (!isJson) {
                      // 通常のテキストの場合は1文字ずつ表示
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === aiMessageId
                            ? { ...msg, text: contentBuffer }
                            : msg
                        )
                      );
                    } else {
                      // JSON形式の場合はローディング表示
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === aiMessageId
                            ? { ...msg, text: '回答を生成中...' }
                            : msg
                        )
                      );
                    }
                  }
                } 
                
                else if (data.event === 'message_end') {
                  addLog('[API Stream] Received event: message_end', 'info');
                  const citations = data.metadata?.retriever_resources || [];
                  addLog(`[API Stream] Citations from retriever_resources: ${citations.length}`, 'info');

                  // retriever_resourcesがある場合、かつJSON由来のcitationsがない場合のみ上書き
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
                  addLog('[API Stream] Received event: workflow_finished', 'info');
                  
                  // JSON形式の回答をパースする
                  const currentMsg = messages.find(m => m.id === aiMessageId);
                  let finalText = contentBuffer;
                  let finalCitations = currentMsg?.citations || [];
                  let isJsonFormat = false;

                  // JSON形式の回答をパース試行
                  try {
                    const trimmedText = finalText.trim();
                    if (trimmedText.startsWith('{') && trimmedText.endsWith('}')) {
                      const parsed = JSON.parse(trimmedText);
                      if (parsed.answer) {
                        finalText = parsed.answer;
                        isJsonFormat = true;
                        if (parsed.citations && Array.isArray(parsed.citations)) {
                          finalCitations = mapCitationsFromLLM(parsed.citations);
                          addLog(`[API] Parsed ${finalCitations.length} citations from LLM response`, 'info');
                        }
                      }
                    }
                  } catch (e) {
                    addLog(`[API] Not JSON format or parse error: ${e.message}`, 'info');
                  }

                  // JSON形式の場合は、パース後に演出としてストリーミング表示
                  if (isJsonFormat && finalText) {
                    addLog('[API] Starting streaming animation for parsed JSON response', 'info');
                    hasParsedCitations = true; // フラグを立てる
                    isStreamingAnimation = true; // アニメーション開始
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
                        charIndex += 1; // 1文字ずつ表示
                      } else {
                        clearInterval(streamInterval);
                        isStreamingAnimation = false; // アニメーション終了
                        // アニメーション完了後に出典と関連質問を設定
                        setMessages((prev) =>
                          prev.map((msg) =>
                            msg.id === aiMessageId
                              ? { ...msg, citations: finalCitations, suggestions: pendingSuggestions }
                              : msg
                          )
                        );
                        addLog('[API] Streaming animation completed with citations and suggestions', 'info');
                        setIsLoading(false);
                      }
                    }, 20); // 20msごと
                  } else {
                    // JSON形式でない場合は即座に表示
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiMessageId
                          ? { ...msg, text: finalText, citations: finalCitations }
                          : msg
                      )
                    );
                    setIsLoading(false);
                  }
                }

                else if (data.event === 'error') {
                  throw new Error(`API Stream Error: ${JSON.stringify(data)}`);
                }
              } catch (e) {
                addLog(`[API Stream] JSON parse error: ${e}`, 'warn');
              }
            }
          }
        }
      } catch (error) {
        handleApiError(error.message, aiMessageId);
      }
    }
  };

  const fetchSuggestions = async (messageId, aiMessageId, isStreamingAnimationActive, pendingSuggestionsRef) => {
    addLog(`[API] Fetching suggestions for message_id: ${messageId}`, 'info');
    try {
      const response = await fetch(
        `${DIFY_API_URL}/messages/${messageId}/suggested?user=${USER_ID}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${DIFY_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Suggestions API failed with status ${response.status}: ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      if (result.result === 'success' && result.data) {
        addLog(`[API] Suggestions found: ${result.data.length}`, 'info');
        
        // アニメーション中の場合は保留
        if (isStreamingAnimationActive) {
          addLog('[API] Suggestions stored for later display (animation in progress)', 'info');
          pendingSuggestionsRef.length = 0; // 配列をクリア
          pendingSuggestionsRef.push(...result.data); // 新しいデータを追加
        } else {
          // アニメーション中でない場合は即座に表示
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, suggestions: result.data }
                : msg
            )
          );
        }
      }
    } catch (error) {
      addLog(`[API Error] Suggestions fetch failed: ${error.message}`, 'warn');
    }
  };

  const mapCitations = (resources) => {
    return resources.map((res, index) => {
      const sourceName = res.document_name || '不明な出典';
      const url = res.document_url || null;
      
      let displayText = `[${index + 1}] ${sourceName}`;

      return {
        id: res.document_id || `cite_${index}`,
        type: url ? 'web' : 'file',
        source: displayText,
        url: url,
      };
    });
  };

  // LLMが返すJSON形式のcitationsを変換
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
      {/* ★★★ ここからが変更点 ★★★ */}
      {/* 以前の <MockModeSelect ... /> は、
        <div className="mock-mode-select">...</div> というラッパーを持っていました。
        これを、左右分離のレイアウトに変更します。
      */}
      <div className="top-bar-container"> {/* ★ 以前の .mock-mode-select */}
        
        {/* 左側: モード選択 */}
        <div className="mock-mode-controls">
          <MockModeSelect mockMode={mockMode} setMockMode={setMockMode} />
        </div>

        {/* 右側: ログコピーボタン */}
        <div className="debug-controls">
          <button 
            className="debug-copy-button-topbar" 
            onClick={handleCopyLogs}
          >
            {copyButtonText}
          </button>
        </div>
      </div>
      {/* ★★★ 変更点ここまで ★★★ */}

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