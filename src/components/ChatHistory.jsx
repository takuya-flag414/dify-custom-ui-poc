// src/components/ChatHistory.jsx
import React, { useEffect, useRef } from 'react';
import './styles/ChatArea.css';
import MessageBlock from './MessageBlock'; // 本物をインポート

/**
 * チャット履歴表示エリア (T-06)
 * @param {Array} messages - App.jsxから渡される
 */
const ChatHistory = ({ messages }) => {
  const endOfMessagesRef = useRef(null);

  // メッセージが更新されるたびに一番下にスクロールする (T-06)
  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // messages が変わるたびに実行

  return (
    <div className="chat-history">
      {messages.length === 0 ? (
        // 初期表示状態 (新基本設計書 5.2.1)
        <div className="chat-history-empty">
          お困りのことはありますか？
        </div>
      ) : (
        // 履歴表示状態 (新基本設計書 5.2.2)
        messages.map((msg) => (
          <MessageBlock key={msg.id} message={msg} />
        ))
      )}
      {/* スクロール用の空要素 */}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ChatHistory;