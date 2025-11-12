import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

// T-03: チャット入力UI
// App.jsx から呼び出され、style.css の .chat-input-area スタイルが適用されます
function ChatInput({ onSend, isLoading }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const inputText = text.trim();
    if (inputText && !isLoading) {
      onSend(inputText);
      setText(''); // 送信後に入力欄をクリア
    }
  };

  // Shift + Enter で改行、Enterのみで送信
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-input-area">
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <textarea
          className="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを送信..."
          rows={1} // まずは1行で
          // (オプション) 入力内容に応じて高さを自動調整するロジック
          style={{ height: 'auto', maxHeight: '150px' }} // 高さをリセット
          onInput={(e) => {
            e.target.style.height = 'auto'; // 一旦リセット
            e.target.style.height = `${e.target.scrollHeight}px`; // スクロールハイトに設定
          }}
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="send-button" 
          disabled={!text.trim() || isLoading}
        >
          {/* (仮) T-07 ローディング中は表示を変更 */}
          {isLoading ? (
            <Loader2 size={20} className="loading-icon" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>
    </div>
  );
}

export default ChatInput;