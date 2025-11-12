import React, { useState } from 'react'; // 修正: useState を react からインポート
import './style.css'; // スタイルシートをインポートします

// コンポーネントのインポート (雛形)
import MockModeSelect from './components/MockModeSelect.jsx';
import ChatHistory from './components/ChatHistory.jsx';
import ChatInput from './components/ChatInput.jsx';

// --- PoC用の初期モックデータ ---
// 「F-UI-001: 会話履歴の取得・表示」の検証用
const INITIAL_MESSAGES = [
  {
    id: 'm1',
    type: 'user',
    text: 'Difyの標準UIの制約について教えてください。',
  },
  {
    id: 'm2',
    type: 'ai',
    text: 'Difyの標準UIでは、要件定義書(4.2)にある「脚注形式の出典」や「ボタン形式のプロアクティブ提案」の実現が困難である可能性が高いです。',
    // PoCの検証項目 (F-UI-003, F-UI-004) のためのデータ構造を定義
    citations: [
      { id: 'c1', source: '社内AIチャットボット_基本設計書_(Phase_1).pdf', page: 6 }
    ],
    suggestedQuestions: [
      'Phase 2でのカスタムフロントエンド開発は必須ですか？',
      'ストリーミング応答の制御は可能ですか？'
    ]
  },
  {
    id: 'm3',
    type: 'user',
    text: 'なるほど。このPoCでその課題を検証するのですね。',
  }
];
// ---

function App() {
  // 「カスタムフロントエンド PoC 基本設計書 (5. 画面設計)」 に基づく状態管理
  
  // F-UI-006, F-UI-007: モックモードの状態
  // 'OFF': 実API (Mode 3)
  // 'FE': フロントエンド・モック (Mode 1)
  // 'BE': バックエンド・モック (Mode 2)
  const [mockMode, setMockMode] = useState('OFF'); 
  
  // F-UI-001: 会話履歴の状態
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  
  // T-07: APIローディング状態
  const [isLoading, setIsLoading] = useState(false);

  // T-05:チャット送信処理 (PoCロードマップ Step 2で実装)
  const handleSend = (inputText) => {
    console.log('--- 送信処理 ---');
    console.log('Mock Mode:', mockMode);
    console.log('Input Text:', inputText);
    
    // T-06, T-08, T-10: Dify API (ストリーミング) 呼び出しロジック
    // ... (ここにfetchとReadableStreamの実装を追加) ...

    // (仮) ユーザーの質問を履歴に追加
    const userMessage = {
      id: `m${messages.length + 1}`,
      type: 'user',
      text: inputText,
    };
    setMessages([...messages, userMessage]);
    
    // (仮) ローディング開始
    setIsLoading(true);

    // (仮) AIの応答をシミュレート
    setTimeout(() => {
      const aiResponse = {
        id: `m${messages.length + 2}`,
        type: 'ai',
        text: `「${inputText}」に対するAIの応答です。\n(現在ローディング中: ${isLoading}, モックモード: ${mockMode})`,
        citations: [],
        suggestedQuestions: []
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  // F-UI-006, F-UI-007: モックモード変更処理
  const handleMockModeChange = (mode) => {
    setMockMode(mode);
    console.log('Mock Mode Changed:', mode);
  };

  return (
    // 'app-container' がウィンドウ全体の背景
    <div className="app-container">
      {/* 'chat-window' がMacのウィンドウ風UI */}
      <div className="chat-window">
        
        
        {/* PoC用デバッグUI (F-UI-006, F-UI-007) */}
        <MockModeSelect 
          currentMode={mockMode} 
          onChange={handleMockModeChange} 
        />
        
        {/* メインのチャット履歴 (F-UI-001) */}
        <ChatHistory 
          messages={messages} 
          isLoading={isLoading}
        />
        
        {/* T-03: チャット入力欄 */}
        <ChatInput 
          onSend={handleSend} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
}

export default App;