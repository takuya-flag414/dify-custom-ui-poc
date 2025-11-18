// src/App.jsx
import { useState, useEffect, useCallback } from 'react'; // useEffect, useCallback を追加
import './App.css';
import './index.css';

// コンポーネントのインポート
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

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


  // T-04 (履歴選択) のための処理
  const handleSetConversationId = (id) => {
    setConversationId(id);
    addLog(`[App] Conversation changed to: ${id}`, 'info'); // ★ console.log -> addLog

    if (id === null) {
      // 新規チャット
      setMessages([]);
      addLog('[App] New chat selected. Messages cleared.', 'info');
    } else {
      // ダミーの履歴をロード
      addLog(`[App] Loading dummy history for conv_id: ${id}`, 'info');
      setMessages([
        {
          id: '1',
          role: 'user',
          text: `履歴(${id})の過去の質問`,
        },
        {
          id: '2',
          role: 'ai',
          text: `履歴(${id})の過去の回答`,
          citations: [],
          suggestions: [],
        },
      ]);
    }
  };

  return (
    <div className="app">
      <Sidebar
        conversationId={conversationId}
        setConversationId={handleSetConversationId}
        // ★デバッグログ機能用のpropsを削除
        // messagesLog={messages}
        // systemLogs={systemLogs}
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
        messagesLog={messages}
        systemLogs={systemLogs}
        handleCopyLogs={handleCopyLogs}
        copyButtonText={copyButtonText}
      />
    </div>
  );
}

export default App;