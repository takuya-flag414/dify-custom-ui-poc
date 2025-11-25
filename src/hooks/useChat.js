import { useState, useCallback, useEffect } from 'react';
import { mockMessages, mockStreamResponse, mockStreamResponseWithFile, mockStreamResponseNoFile } from '../mockData';
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
    },
    {
      "url": "https://note.com/zouplans/n/n11c613763e21",
      "snippet": "2025年11月18日は何の日か。運勢占いでは「解放の日」「ブレーキの日」とされ、努力が実る日です。",
      "title": "2025年11月18日の運勢と記念日｜占いと暦"
    }
  ],
  "answer": "2025年11月18日は、「土木の日」「いい家の日」「森とふるさとの日」など様々な記念日があります。また、運勢的には「解放の日」とされ、努力が実る日と言われています。"
});

export const useChat = (mockMode, conversationId, addLog, onConversationCreated) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeContextFile, setActiveContextFile] = useState(null);
  const [dynamicMockMessages, setDynamicMockMessages] = useState({});

  // メッセージ履歴の更新（FE Mock用） - messages変更時に自動更新
  useEffect(() => {
    if (mockMode === 'FE' && conversationId && messages.length > 0) {
      setDynamicMockMessages((prev) => ({
        ...prev,
        [conversationId]: messages
      }));
    }
  }, [messages, mockMode, conversationId]);

  // 会話ID変更時の処理
  useEffect(() => {
    const loadHistory = async () => {
      addLog(`[useChat] Conversation changed to: ${conversationId}`, 'info');
      setActiveContextFile(null);

      if (conversationId === null) {
        setMessages([]);
        addLog('[useChat] New chat selected. Messages cleared.', 'info');
        return;
      }

      if (mockMode === 'FE') {
        addLog(`[useChat] Loading rich dummy history for conv_id: ${conversationId}`, 'info');
        
        if (dynamicMockMessages[conversationId]) {
            addLog('[useChat] Found in dynamic memory.', 'info');
            setMessages(dynamicMockMessages[conversationId]);
            return;
        }

        const targetMock = mockMessages[conversationId];
        if (targetMock) {
          setMessages(targetMock);
        } else {
           // 新規作成されたばかりのチャットで、まだdynamicMockMessagesに反映されていない場合の対策
           if (conversationId.startsWith('mock_conv_')) {
               addLog('[useChat] New mock conversation detected. Keeping current messages or initializing empty.', 'info');
               return; 
           }

           setMessages([
              { 
                  id: 'err', role: 'ai', text: '（モックデータ定義外の会話です）', 
                  timestamp: new Date().toISOString()
              }
          ]);
        }
        return;
      }

      // --- API 実履歴ロード ---
      addLog(`[useChat] Loading REAL history for conv_id: ${conversationId}`, 'info');
      setIsLoading(true);
      setMessages([]); 

      try {
        const historyData = await fetchMessagesApi(conversationId, USER_ID, DIFY_API_URL, DIFY_API_KEY);
        addLog(`[useChat] Fetched ${historyData.data?.length || 0} messages.`, 'info');

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
              files: item.message_files ? item.message_files.map(f => ({ name: f.url ? '添付ファイル' : 'File', type: 'document' })) : []
            });
          }
          
          if (item.answer) {
              let aiText = item.answer;
              let aiCitations = mapCitationsFromApi(item.retriever_resources || []);

              const parsed = parseLlmResponse(aiText);
              
              if (parsed.isParsed || parsed.citations.length > 0) {
                  aiText = parsed.answer;
                  if (parsed.citations && Array.isArray(parsed.citations) && parsed.citations.length > 0) {
                      aiCitations = mapCitationsFromLLM(parsed.citations);
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
              });
          }
        }
        
        setMessages(newMessages);

      } catch (error) {
        addLog(`[useChat Error] Failed to load history: ${error.message}`, 'error');
        setMessages([{
          id: 'err_1', role: 'ai', text: `履歴の読み込みに失敗しました: ${error.message}`,
          citations: [], suggestions: [], isStreaming: false,
          timestamp: new Date().toISOString()
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [conversationId, mockMode, addLog]);

  // メッセージ送信時のエラーハンドリング
  const handleApiError = useCallback((errorText, aiMessageId) => {
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
  }, [addLog]);

  // メッセージ送信処理
  const handleSendMessage = async (text, attachment = null) => {
    addLog(`[useChat] Sending: "${text}", Mode: ${mockMode}, NewFile: ${attachment ? attachment.name : 'None'}, ActiveContext: ${activeContextFile ? activeContextFile.name : 'None'}`, 'info');

    let uploadedFileId = null;
    let displayFiles = [];

    // --- ファイル処理ロジック ---
    if (mockMode === 'BE') {
        if (attachment) {
            displayFiles = [{ name: `(Mock) ${attachment.name}`, type: 'document' }];
            setActiveContextFile({ id: 'mock_id', name: attachment.name, type: 'document' });
        } else if (activeContextFile) {
             // Keep context
        }
    }
    else if (mockMode === 'OFF') {
        if (attachment) {
            setIsLoading(true); 
            try {
                addLog('[useChat] Uploading file to Dify...', 'info');
                const uploadRes = await uploadFile(attachment, USER_ID, DIFY_API_URL, DIFY_API_KEY);
                uploadedFileId = uploadRes.id;
                const newContextFile = { id: uploadedFileId, name: attachment.name, type: 'document' };
                displayFiles = [{ name: attachment.name, type: 'document' }];
                addLog(`[useChat] Upload success. ID: ${uploadedFileId}. Setting Sticky Context.`, 'info');
                setActiveContextFile(newContextFile);
            } catch (e) {
                handleApiError(`ファイルアップロード失敗: ${e.message}`, `err_${Date.now()}`);
                setIsLoading(false); 
                return;
            }
        } else if (activeContextFile) {
            uploadedFileId = activeContextFile.id;
            addLog(`[useChat] Using Sticky Context File ID: ${uploadedFileId}`, 'info');
        }
    }
    else {
        if (attachment) {
            displayFiles = [{ name: attachment.name, type: 'document' }];
            setActiveContextFile({ id: 'fe_mock_id', name: attachment.name, type: 'document' });
        }
    }

    // ユーザーメッセージ
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
    setMessages((prev) => [...prev, {
      id: aiMessageId,
      text: '',
      role: 'ai',
      citations: [],
      suggestions: [],
      isStreaming: true,
      timestamp: new Date().toISOString(),
      processStatus: uploadedFileId ? 'ドキュメントを解析しています...' : 'AIが思考を開始しました...', 
    }]);

    // --- FE Mock Logic ---
    if (mockMode === 'FE') {
      if (!conversationId) {
        const mockNewId = `mock_conv_${Date.now()}`;
        onConversationCreated(mockNewId, text || attachment?.name || '新規チャット');
      }
      
      // ファイルアップロードの有無で分岐
      const hasFile = attachment || activeContextFile;
      let mockResponse;
      
      if (hasFile) {
        const fileName = attachment?.name || activeContextFile?.name || 'ファイル';
        // テンプレート内の{filename}を実際のファイル名に置換
        mockResponse = {
          text: mockStreamResponseWithFile.text.replace(/{filename}/g, fileName),
          citations: mockStreamResponseWithFile.citations.map(c => 
            c.source === '{filename}' ? { ...c, source: fileName } : c
          ),
          suggestions: mockStreamResponseWithFile.suggestions
        };
      } else {
        mockResponse = mockStreamResponseNoFile;
      }
      
      const mockResponseText = mockResponse.text;
      
      setTimeout(() => {
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, processStatus: '回答を生成しています...' } : msg));
      }, 1500);
      setTimeout(() => {
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, processStatus: null } : msg));
        let index = 0;
        const streamInterval = setInterval(() => {
          if (index < mockResponseText.length) {
            const step = 3;
            const chunk = mockResponseText.substring(index, index + step);
            setMessages((prev) => {
              const msgIndex = prev.findIndex(msg => msg.id === aiMessageId);
              if (msgIndex === -1) return prev;
              
              const newMessages = [...prev];
              newMessages[msgIndex] = { 
                ...newMessages[msgIndex], 
                text: newMessages[msgIndex].text + chunk 
              };
              return newMessages;
            });
            index += step;
          } else {
            clearInterval(streamInterval);
            setMessages((prev) => prev.map((msg) => msg.id === aiMessageId ? { ...msg, text: mockResponseText, citations: mockResponse.citations, suggestions: mockResponse.suggestions, isStreaming: false, processStatus: null } : msg));
            setIsLoading(false);
          }
        }, 10);
      }, 2000);
      return;
    }

    // --- API Request ---
    if (!DIFY_API_KEY || !DIFY_API_URL) {
      handleApiError('API KEY or URL missing.', aiMessageId);
      return;
    }

    const filesPayload = uploadedFileId ? [{ type: 'document', transfer_method: 'local_file', upload_file_id: uploadedFileId }] : [];

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
        const response = await sendChatMessageApi(requestBody, DIFY_API_URL, DIFY_API_KEY);
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
                        const isJsonPattern = trimmedBuffer.startsWith('{') || trimmedBuffer.startsWith('```');
                        setMessages((prev) => {
                            const msgIndex = prev.findIndex(msg => msg.id === aiMessageId);
                            if (msgIndex === -1) return prev;
                            
                            const newMessages = [...prev];
                            if (isJsonPattern) {
                                newMessages[msgIndex] = { 
                                    ...newMessages[msgIndex], 
                                    text: '', 
                                    processStatus: '回答を生成・整形しています...' 
                                };
                            } else {
                                newMessages[msgIndex] = { 
                                    ...newMessages[msgIndex], 
                                    text: contentBuffer, 
                                    processStatus: null 
                                };
                            }
                            return newMessages;
                        });
                    }
                } else if (data.event === 'message_end') {
                    const citations = data.metadata?.retriever_resources || [];
                    if (citations.length > 0) {
                         setMessages((prev) => prev.map(msg => msg.id === aiMessageId ? { ...msg, citations: mapCitationsFromApi(citations) } : msg));
                    }
                    if (data.message_id) {
                         setTimeout(() => { fetchSuggestions(data.message_id, aiMessageId); }, 3000); 
                    }
                } else if (data.event === 'workflow_finished') {
                    updateStatus(null);
                    const currentMsg = messages.find(m => m.id === aiMessageId);
                    let finalText = contentBuffer;
                    let finalCitations = currentMsg?.citations || [];
                    const parsed = parseLlmResponse(finalText);
                    if (parsed.isParsed) {
                        finalText = parsed.answer;
                        if (parsed.citations && parsed.citations.length > 0) finalCitations = mapCitationsFromLLM(parsed.citations);
                        let charIndex = 0;
                        const streamInterval = setInterval(() => {
                          if (charIndex <= finalText.length) {
                            const displayText = finalText.substring(0, charIndex);
                            setMessages((prev) => {
                              const msgIndex = prev.findIndex(msg => msg.id === aiMessageId);
                              if (msgIndex === -1) return prev;
                              
                              const newMessages = [...prev];
                              newMessages[msgIndex] = { 
                                ...newMessages[msgIndex], 
                                text: displayText, 
                                processStatus: null 
                              };
                              return newMessages;
                            });
                            charIndex += 5; 
                          } else {
                            clearInterval(streamInterval);
                            setMessages((prev) => prev.map((msg) => msg.id === aiMessageId ? { ...msg, text: finalText, citations: finalCitations, isStreaming: false, processStatus: null } : msg));
                            setIsLoading(false);
                          }
                        }, 5); 
                    } else {
                        setMessages((prev) => prev.map((msg) => msg.id === aiMessageId ? { ...msg, text: finalText, citations: finalCitations, isStreaming: false, processStatus: null } : msg));
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

  const fetchSuggestions = async (messageId, aiMessageId) => {
      try {
        const result = await fetchSuggestionsApi(messageId, USER_ID, DIFY_API_URL, DIFY_API_KEY);
        if (result.result === 'success' && result.data && result.data.length > 0) {
            setMessages((prev) => prev.map((msg) => msg.id === aiMessageId ? { ...msg, suggestions: result.data } : msg));
        }
      } catch (error) { console.warn('[Suggestions] Fetch failed:', error); }
  };

  return {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    activeContextFile,
    setActiveContextFile,
    handleSendMessage,
    // updateMessageHistory // 削除
  };
};
