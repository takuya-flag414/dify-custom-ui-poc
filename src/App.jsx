// src/App.jsx
import { useState, useEffect, useCallback } from 'react';
import './App.css';
import './index.css';

// コンポーネントのインポート
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

// モックデータのインポート
import { mockConversations, mockMessages } from './mockData';

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

  // --- ★ 追加: FEモード用・動的メッセージ履歴 (メモリ保存) ---
  const [dynamicMockMessages, setDynamicMockMessages] = useState({});

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
        addLog('[App] FE Mock mode. Loading rich dummy conversations.', 'info');
        // mockData.js の静的データを使用 (初期化)
        // ※ dynamicMockMessages にある新規会話は、handleConversationCreated で追加されるため
        //    ここでは初期リストのみをセットする方針でOK
        setConversations(mockConversations);
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
        // Dify APIマニュアル (p.17) [cite: 490-492]
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
  // Dify API(p.16) の retriever_resources をマッピング
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

  // LLMが返すJSON形式のcitationsを変換 (ChatArea.jsxから移植)
  const mapCitationsFromLLM = (citations) => {
    if (!citations || !Array.isArray(citations)) return [];
    
    return citations.map((cite, index) => ({
      id: `cite_llm_hist_${index}`, // 履歴用ID
      type: cite.url ? 'web' : 'file',
      // プレフィックス [1] をここで付与する
      source: `[${index + 1}] ${cite.source || '不明な出典'}`,
      url: cite.url || null,
    }));
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

    // FEモック時は mockData.js または dynamicMockMessages からデータをロード
    if (mockMode === 'FE') {
      addLog(`[App] Loading rich dummy history for conv_id: ${id}`, 'info');
      setConversationId(id);
      
      // 1. まず動的メモリ(新規作成・更新分)を確認
      if (dynamicMockMessages[id]) {
          addLog('[App] Found in dynamic memory.', 'info');
          setMessages(dynamicMockMessages[id]);
          return;
      }

      // 2. なければ静的ファイル(mockData.js)を確認
      const targetMock = mockMessages[id];
      if (targetMock) {
        setMessages(targetMock);
      } else {
        // どちらにもない場合
         setMessages([
            { 
                id: 'err', role: 'ai', text: '（モックデータ定義外の会話です）', 
                timestamp: new Date().toISOString()
            }
        ]);
      }
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

      // ★★★ 修正: タイムスタンプ昇順ソート ★★★
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
            // ★★★ 追加: JSONパース処理 ★★★
            let aiText = item.answer;
            let aiCitations = mapCitationsFromApi(item.retriever_resources || []);

            // 回答がJSON形式 (BEモック等) の場合、パースを試みる
            try {
                const trimmed = aiText.trim();
                if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                    const parsed = JSON.parse(trimmed);
                    if (parsed.answer) {
                        aiText = parsed.answer; // 本文のみ抽出
                        // JSON内のcitationsがあれば、そちらを優先してパース
                        if (parsed.citations && Array.isArray(parsed.citations)) {
                            aiCitations = mapCitationsFromLLM(parsed.citations);
                        }
                    }
                }
            } catch (e) {
                // ignore
            }

            newMessages.push({
                id: item.id, // AI回答のIDをメインIDとする
                role: 'ai',
                text: aiText, // ★ パース後のテキスト
                citations: aiCitations, // ★ パース後の出典
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

  // === ★★★ 追加: 新規会話作成時のハンドラ ★★★ ===
  const handleConversationCreated = (newId, newTitle) => {
    addLog(`[App] New conversation created: ${newId} "${newTitle}"`, 'info');
    
    // 1. 会話リストの先頭に追加
    const newConv = { id: newId, name: newTitle };
    
    setConversations((prev) => {
      if (prev.some(c => c.id === newId)) return prev;
      return [newConv, ...prev];
    });

    // 2. 現在の会話IDを更新
    setConversationId(newId);
  };

  // === ★★★ 追加: メッセージ履歴更新ハンドラ (FEモード用バックアップ) ★★★ ===
  const handleUpdateMessageHistory = useCallback((id, newMessages) => {
    // FEモードでIDが有効な場合のみメモリに保存
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
        
        // ★ 追加: ハンドラを渡す
        onConversationCreated={handleConversationCreated}
        onUpdateMessageHistory={handleUpdateMessageHistory}

        handleCopyLogs={handleCopyLogs}
        copyButtonText={copyButtonText}
      />
    </div>
  );
}

export default App;