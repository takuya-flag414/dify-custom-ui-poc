// src/App.jsx
import { useState, useEffect, useCallback } from 'react';
import './App.css';
import './index.css';

// コンポーネントのインポート
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

// --- PoC API設定 (ChatArea.jsx [cite: 31-33] からコピー) ---
const DIFY_API_KEY = import.meta.env.VITE_DIFY_API_KEY;
const DIFY_API_URL = import.meta.env.VITE_DIFY_API_URL;
// PoC基本設計書 (6.3) および Dify API (p.15) 準拠
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

  // --- ★ 追加: 会話リスト State ---
  const [conversations, setConversations] = useState([]);

  // --- 🔽 デバッグログ機能 (Sidebarから昇格) 🔽 ---
  const [systemLogs, setSystemLogs] = useState([]); // システムログ
  const [copyButtonText, setCopyButtonText] = useState('ログをコピー'); // ★ボタンテキスト用のstate

  // ログ追加関数 (useCallbackでメモ化)
  const addLog = useCallback((message, level = 'log') => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    // 元のコンソールにも出力
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

    // stateにも追加
    setSystemLogs((prevLogs) => [...prevLogs, logEntry]);
  }, []); // 依存配列は空

  // グローバルコンソールの上書き (マウント時に1回だけ実行)
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

    // クリーンアップ関数 (アンマウント時に元のコンソールに戻す)
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
    };
  }, [addLog]); // addLogが変更された時のみ再実行 (初回実行)

  // --- ★ 追加: 会話リスト取得 (T-04) ---
  useEffect(() => {
    const fetchConversations = async () => {
      // FEモック時は履歴も固定のダミーデータ
      if (mockMode === 'FE') {
        addLog('[App] FE Mock mode. Loading dummy conversations.', 'info');
        // Sidebar.jsx [cite: 11-15] からダミーデータを移植
        setConversations([
          { id: 'conv_1', name: 'Dify API連携について (Mock)' },
          { id: 'conv_2', name: 'PoCロードマップの進捗 (Mock)' },
          { id: 'conv_3', name: 'UIデザインの検討 (Mock)' },
        ]);
        return;
      }

      // --- API 実履歴リストロード ---
      addLog('[App] Fetching REAL conversations list...', 'info');
      if (!DIFY_API_KEY || !DIFY_API_URL) {
          addLog('[App Error] API KEY or URL not set. Cannot fetch conversations.', 'error');
          setConversations([]);
          return;
      }
      
      try {
        // Dify APIマニュアル (p.17) [cite: 786-787]
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
        // Dify API (p.18) の "data" 配列をセット
        setConversations(data.data || []);
        addLog(`[App] Fetched ${data.data?.length || 0} conversations.`, 'info');
      } catch (error) {
        addLog(`[App Error] ${error.message}`, 'error');
        setConversations([]);
      }
    };
    
    fetchConversations();
    // mockMode が変更された時 (例: FE -> BE) にも会話リストを再取得する
  }, [addLog, mockMode]);


  // ★ログコピー機能 (Sidebarから昇格)
  const handleCopyLogs = () => {
    addLog('[App] Copying logs to clipboard...', 'info');
    let logContent = '--- PoC Debug Logs ---\n\n';

    // 1. システムログ
    logContent += '--- System Logs ---\n';
    logContent += systemLogs.join('\n');
    logContent += '\n\n';

    // 2. 会話ログ (messages)
    logContent += '--- Conversation Logs (JSON) ---\n';
    try {
      logContent += JSON.stringify(messages, null, 2); // ★ messagesLog -> messages
    } catch (error) {
      addLog(`[App] Failed to stringify messages: ${error.message}`, 'error');
      logContent += 'Failed to stringify conversation logs.';
    }
    logContent += '\n\n--- End of Logs ---';

    // 3. クリップボードにコピー
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
  // --- 🔼 デバッグログ機能 🔼 ---


  // --- ★ 修正: 履歴選択処理 (T-04 / P-4) ---

  // ChatArea.jsx [cite: 312-325] のロジックをコピー
  // Dify API(p.16) [cite: 746-750] の retriever_resources をマッピング
  const mapCitationsFromApi = (resources) => {
    if (!resources || !Array.isArray(resources) || resources.length === 0) return [];
    
    return resources.map((res, index) => {
      const sourceName = res.document_name || res.dataset_name || '不明な出典';
      const url = res.document_url || null; // ChatArea.jsxの実装 に倣う
      
      let displayText = `[${index + 1}] ${sourceName}`;

      return {
        id: res.document_id || res.segment_id || `cite_${index}`, //
        type: url ? 'web' : 'file',
        source: displayText,
        url: url,
      };
    });
  };

  // T-04 (履歴選択) のための処理
  const handleSetConversationId = async (id) => {
    addLog(`[App] Conversation changed to: ${id}`, 'info');

    if (id === null) {
      // 新規チャット [cite: 76-77]
      setMessages([]);
      setConversationId(null);
      addLog('[App] New chat selected. Messages cleared.', 'info');
      return;
    }

    // FEモック時はダミーデータをロード (元のロジック [cite: 80-92] を流用)
    if (mockMode === 'FE') {
      const now = new Date().toISOString();
      addLog(`[App] Loading dummy history for conv_id: ${id}`, 'info');
      setConversationId(id);
      setMessages([
        {
          id: '1', role: 'user', text: `履歴(${id})の過去の質問 (Mock)`,
          timestamp: now // ★ 時刻追加
        },
        {
          id: '2', role: 'ai', text: `履歴(${id})の過去の回答 (Mock)`, 
          citations: [], suggestions: [], isStreaming: false,
          timestamp: now // ★ 時刻追加
        },
      ]);
      return;
    }

    // --- API 実履歴ロード (P-4) ---
    addLog(`[App] Loading REAL history for conv_id: ${id}`, 'info');
    setIsLoading(true);
    setConversationId(id);
    setMessages([]); // 画面をクリア

    try {
      // PoC基本設計書 (6.3) [cite: 1490-1491] & Dify API (p.15) [cite: 723-724]
      const response = await fetch(
        `${DIFY_API_URL}/messages?conversation_id=${id}&user=${USER_ID}&limit=50`, // 念のためlimit=50
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

      // ★★★ 修正: APIの返却順に関わらず、created_at (タイムスタンプ) で確実に昇順ソートする ★★★
      // .reverse() は削除し、.sort() に変更します。
      // APIのcreated_atはint(Unix Time)なので、引き算で正しく比較できます。
      const chronologicalMessages = (historyData.data || []).sort((a, b) => a.created_at - b.created_at);

      // API形式 (query, answer) から 
      // React State形式 (role:user, role:ai) [cite: 83-91] に変換
      const newMessages = [];
      // ★ 修正: chronologicalMessages をループ
      for (const item of chronologicalMessages) {
        
        // ★ 修正: APIのUnixタイムスタンプ (created_at) をISO文字列に変換
        const timestamp = item.created_at ? new Date(item.created_at * 1000).toISOString() : new Date().toISOString();
        
        // 1. ユーザーの質問
        if (item.query) {
          newMessages.push({
            id: `${item.id}_user`,
            role: 'user',
            text: item.query,
            timestamp: timestamp, // ★ 時刻追加
          });
        }
        // 2. AIの回答
        if (item.answer) {
          newMessages.push({
            id: item.id, // AI回答のIDをメインIDとする
            role: 'ai',
            text: item.answer,
            citations: mapCitationsFromApi(item.retriever_resources || []), // 履歴の出典もマッピング
            suggestions: [], // 履歴ロード時は提案ボタンなし
            isStreaming: false,
            timestamp: timestamp, // ★ 時刻追加
          });
        }
      }
      
      setMessages(newMessages); // ★ 変換した実履歴をセット

    } catch (error) {
      addLog(`[App Error] Failed to load history: ${error.message}`, 'error');
      setMessages([{
        id: 'err_1', role: 'ai', text: `履歴の読み込みに失敗しました: ${error.message}`,
        citations: [], suggestions: [], isStreaming: false,
        timestamp: new Date().toISOString() // ★ 時刻追加
      }]);
    } finally {
      setIsLoading(false); // ★ ローディング解除
    }
  };

  return (
    <div className="app">
      <Sidebar
        conversationId={conversationId}
        setConversationId={handleSetConversationId}
        conversations={conversations} // ★ 修正: StateをPropsで渡す
        // ★デバッグログ機能用のpropsを削除 (Sidebar.jsx [cite: 1-10] が受け取らないため)
      />
      <ChatArea
        messages={messages}
        setMessages={setMessages}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        mockMode={mockMode}
        setMockMode={setMockMode}
        conversationId={conversationId}
        addLog={addLog} // ★addLogは引き続き渡す
        
        // ★デバッグログ機能用のpropsを ChatArea に追加
        handleCopyLogs={handleCopyLogs}
        copyButtonText={copyButtonText}
        // ★ 冗長な messagesLog, systemLogs は削除
      />
    </div>
  );
}

export default App;