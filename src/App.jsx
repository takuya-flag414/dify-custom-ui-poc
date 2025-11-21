// src/App.jsx
import { useState, useEffect, useCallback } from 'react';
import './App.css';
import './index.css';

// コンポーネントのインポート
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

// モックデータのインポート
import { mockConversations, mockMessages } from './mockData';

// ユーティリティのインポート
import { parseLlmResponse } from './utils/responseParser';

// --- PoC API設定 ---
const DIFY_API_KEY = import.meta.env.VITE_DIFY_API_KEY;
const DIFY_API_URL = import.meta.env.VITE_DIFY_API_URL;
const USER_ID = 'poc-user-01';

// 元のコンソール関数を保持
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

function App() {
  // 新基本設計書 (5.1) に基づく状態定義
  const [messages, setMessages] = useState([]); // チャット履歴 (会話ログ)
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [mockMode, setMockMode] = useState('FE');

  // ★追加: Sticky File Context (現在アクティブな添付ファイル情報)
  const [activeContextFile, setActiveContextFile] = useState(null);

  // 会話リスト State
  const [conversations, setConversations] = useState([]);

  // FEモード用・動的メッセージ履歴 (メモリ保存)
  const [dynamicMockMessages, setDynamicMockMessages] = useState({});

  // デバッグログ機能
  const [systemLogs, setSystemLogs] = useState([]); 
  const [copyButtonText, setCopyButtonText] = useState('ログをコピー');

  // ログ追加関数
  const addLog = useCallback((message, level = 'log') => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'error':
        originalConsoleError(logEntry);
        break;
      case 'warn':
        originalConsoleWarn(logEntry);
        break;
      case 'info':
        originalConsoleInfo(logEntry);
        break;
      default:
        originalConsoleLog(logEntry);
    }

    setSystemLogs((prevLogs) => [...prevLogs, logEntry]);
  }, []);

  // グローバルコンソールの上書き
  useEffect(() => {
    addLog('--- PoC App Initialized ---', 'info');
    addLog('console.log, console.error, console.warn, console.info をオーバーライドしました。', 'info');

    console.log = (message, ...optionalParams) => {
      addLog(message + (optionalParams.length > 0 ? ` ${JSON.stringify(optionalParams)}` : ''), 'log');
    };
    console.error = (message, ...optionalParams) => {
      addLog(message + (optionalParams.length > 0 ? ` ${JSON.stringify(optionalParams)}` : ''), 'error');
    };
    console.warn = (message, ...optionalParams) => {
      addLog(message + (optionalParams.length > 0 ? ` ${JSON.stringify(optionalParams)}` : ''), 'warn');
    };
    console.info = (message, ...optionalParams) => {
      addLog(message + (optionalParams.length > 0 ? ` ${JSON.stringify(optionalParams)}` : ''), 'info');
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
    };
  }, [addLog]);

  // 会話リスト取得
  useEffect(() => {
    const fetchConversations = async () => {
      if (mockMode === 'FE') {
        addLog('[App] FE Mock mode. Loading rich dummy conversations.', 'info');
        setConversations(mockConversations);
        return;
      }

      addLog('[App] Fetching REAL conversations list...', 'info');
      if (!DIFY_API_KEY || !DIFY_API_URL) {
          addLog('[App Error] API KEY or URL not set. Cannot fetch conversations.', 'error');
          setConversations([]);
          return;
      }
      
      try {
        const response = await fetch(
          `${DIFY_API_URL}/conversations?user=${USER_ID}`,
          {
            headers: { Authorization: `Bearer ${DIFY_API_KEY}` },
          }
        );
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(`Failed to fetch conversations: ${errData.message || response.status}`);
        }
        const data = await response.json();
        setConversations(data.data || []);
        addLog(`[App] Fetched ${data.data?.length || 0} conversations.`, 'info');
      } catch (error) {
        addLog(`[App Error] ${error.message}`, 'error');
        setConversations([]);
      }
    };
    
    fetchConversations();
  }, [addLog, mockMode]);

  // ログコピー機能
  const handleCopyLogs = () => {
    addLog('[App] Copying logs to clipboard...', 'info');
    let logContent = '--- PoC Debug Logs ---\n\n';

    logContent += '--- System Logs ---\n';
    logContent += systemLogs.join('\n');
    logContent += '\n\n';

    logContent += '--- Conversation Logs (JSON) ---\n';
    try {
      logContent += JSON.stringify(messages, null, 2);
    } catch (error) {
      addLog(`[App] Failed to stringify messages: ${error.message}`, 'error');
      logContent += 'Failed to stringify conversation logs.';
    }
    logContent += '\n\n--- End of Logs ---';

    navigator.clipboard
      .writeText(logContent)
      .then(() => {
        addLog('[App] Logs copied successfully!', 'info');
        setCopyButtonText('コピーしました！');
        setTimeout(() => setCopyButtonText('ログをコピー'), 2000);
      })
      .catch((err) => {
        addLog(`[App] Failed to copy logs: ${err.message}`, 'error');
        setCopyButtonText('コピーに失敗');
        setTimeout(() => setCopyButtonText('ログをコピー'), 2000);
      });
  };

  // ヘルパー: Dify APIのretriever_resourcesをマッピング
  const mapCitationsFromApi = (resources) => {
    if (!resources || !Array.isArray(resources) || resources.length === 0) return [];
    
    return resources.map((res, index) => {
      const sourceName = res.document_name || res.dataset_name || '不明な出典';
      const url = res.document_url || null;
      
      let displayText = `[${index + 1}] ${sourceName}`;

      return {
        id: res.document_id || res.segment_id || `cite_${index}`,
        type: url ? 'web' : 'file',
        source: displayText,
        url: url,
      };
    });
  };

  // ヘルパー: LLM内JSONのcitationsをマッピング
  const mapCitationsFromLLM = (citations) => {
    if (!citations || !Array.isArray(citations)) return [];
    
    return citations.map((cite, index) => ({
      id: `cite_llm_hist_${index}`,
      type: cite.url ? 'web' : 'file',
      source: `[${index + 1}] ${cite.source || '不明な出典'}`,
      url: cite.url || null,
    }));
  };

  // 履歴選択処理
  const handleSetConversationId = async (id) => {
    addLog(`[App] Conversation changed to: ${id}`, 'info');

    // ★追加: 会話切り替え時にコンテキストをリセット（Phase 1仕様）
    // これにより、別のチャットに移動した際に古いファイルのコンテキストが混ざるのを防ぐ
    setActiveContextFile(null);

    if (id === null) {
      setMessages([]);
      setConversationId(null);
      addLog('[App] New chat selected. Messages cleared.', 'info');
      return;
    }

    if (mockMode === 'FE') {
      addLog(`[App] Loading rich dummy history for conv_id: ${id}`, 'info');
      setConversationId(id);
      
      if (dynamicMockMessages[id]) {
          addLog('[App] Found in dynamic memory.', 'info');
          setMessages(dynamicMockMessages[id]);
          return;
      }

      const targetMock = mockMessages[id];
      if (targetMock) {
        setMessages(targetMock);
      } else {
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
    addLog(`[App] Loading REAL history for conv_id: ${id}`, 'info');
    setIsLoading(true);
    setConversationId(id);
    setMessages([]); 

    try {
      const response = await fetch(
        `${DIFY_API_URL}/messages?conversation_id=${id}&user=${USER_ID}&limit=50`,
        {
          headers: { Authorization: `Bearer ${DIFY_API_KEY}` },
        }
      );
      if (!response.ok) {
          const errData = await response.json();
          throw new Error(`Failed to fetch messages: ${errData.message || response.status}`);
      }
      
      const historyData = await response.json();
      addLog(`[App] Fetched ${historyData.data?.length || 0} messages.`, 'info');

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
            // 履歴APIからはファイル情報が message_files として返る場合がある
            files: item.message_files ? item.message_files.map(f => ({ name: f.url ? '添付ファイル' : 'File', type: 'document' })) : []
          });
        }
        
        if (item.answer) {
            let aiText = item.answer;
            let aiCitations = mapCitationsFromApi(item.retriever_resources || []);

            const parsed = parseLlmResponse(aiText);
            
            // パース成功、もしくは出典情報が含まれている場合はそちらを優先
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
      addLog(`[App Error] Failed to load history: ${error.message}`, 'error');
      setMessages([{
        id: 'err_1', role: 'ai', text: `履歴の読み込みに失敗しました: ${error.message}`,
        citations: [], suggestions: [], isStreaming: false,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationCreated = (newId, newTitle) => {
    addLog(`[App] New conversation created: ${newId} "${newTitle}"`, 'info');
    const newConv = { id: newId, name: newTitle };
    setConversations((prev) => {
      if (prev.some(c => c.id === newId)) return prev;
      return [newConv, ...prev];
    });
    setConversationId(newId);
  };

  const handleUpdateMessageHistory = useCallback((id, newMessages) => {
    if (mockMode === 'FE' && id) {
      setDynamicMockMessages((prev) => ({
        ...prev,
        [id]: newMessages
      }));
    }
  }, [mockMode]);

  return (
    <div className="app">
      <Sidebar
        conversationId={conversationId}
        setConversationId={handleSetConversationId}
        conversations={conversations}
      />
      <ChatArea
        messages={messages}
        setMessages={setMessages}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        mockMode={mockMode}
        setMockMode={setMockMode}
        conversationId={conversationId}
        addLog={addLog}
        onConversationCreated={handleConversationCreated}
        onUpdateMessageHistory={handleUpdateMessageHistory}
        handleCopyLogs={handleCopyLogs}
        copyButtonText={copyButtonText}
        // ★追加: アクティブコンテキストのステートをChatAreaへ渡す
        activeContextFile={activeContextFile}
        setActiveContextFile={setActiveContextFile}
      />
    </div>
  );
}

export default App;