import React, { useEffect, useRef } from 'react';
import MessageBlock from './MessageBlock.jsx'; // 個別のメッセージブロック
// --- (オプション) 新規コンポーネントをインポート ---
// import TypingIndicator from './TypingIndicator.jsx';

// F-UI-001: 会話履歴のリスト表示
// App.jsx から呼び出され、style.css の .chat-history スタイルが適用されます
function ChatHistory({ messages, isLoading }) {
  const historyEndRef = useRef(null);

  // 新しいメッセージが追加されたら、一番下までスクロールする
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="chat-history">
      {messages.map((msg, index) => (
        <MessageBlock 
          key={msg.id || `msg-${index}`} 
          message={msg} 
        />
      ))}
      
      {/* (仮) T-07: ローディング中の表示 */}
      {isLoading && (
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}

      {/* スクロール用の終端マーカー */}
      <div ref={historyEndRef} />
    </div>
  );
}

export default ChatHistory;