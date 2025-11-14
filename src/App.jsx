// src/App.jsx
import { useState } from 'react';
import './App.css';
import './index.css';

// コンポーネントのインポート
import Sidebar from './components/Sidebar'; // 本物をインポート
import ChatArea from './components/ChatArea';

function App() {
  // 新基本設計書 (5.1) に基づく状態定義
  const [messages, setMessages] = useState([]); // チャット履歴
  const [isLoading, setIsLoading] = useState(false); // 回答生成中か
  const [conversationId, setConversationId] = useState(null); // 現在の会話ID

  // F-UI-006, F-UI-007 のためのモード
  // PoC基本設計書 (4.) に従い、初期値は 'FE' (フロントエンドモック) が安全です
  const [mockMode, setMockMode] = useState('FE');

  // T-04 (履歴選択) のための処理
  const handleSetConversationId = (id) => {
    setConversationId(id);
    // TODO: T-04 で履歴API (GET /messages) を呼び出し、
    // setMessages(...) で履歴をセットする

    // (T-03時点のダミー動作)
    if (id === null) {
      // 新規チャット (新基本設計書 5.2.1)
      setMessages([]);
    } else {
      // ダミーの履歴をロード (新基本設計書 5.2.2)
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
          citations: [], // T-09用
          suggestions: [], // T-11用
        },
      ]);
    }
  };

  return (
    <div className="app">
      {/* T-04 (履歴) のため、conversationId の管理と
        履歴リスト(conversations)を渡す必要があります
      */}
      <Sidebar
        conversationId={conversationId}
        setConversationId={handleSetConversationId}
        // conversations={conversations} // T-04で実装
      />

      {/* メインのチャットエリア。
        状態と更新用関数(setter)をpropsとして渡します。
      */}
      <ChatArea
        messages={messages}
        setMessages={setMessages}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        mockMode={mockMode}
        setMockMode={setMockMode}
        conversationId={conversationId}
      />
    </div>
  );
}

export default App;