// src/components/ChatHistory.jsx
import React, { useEffect, useRef } from 'react';
import './styles/ChatArea.css'; // 既存のインポート
import MessageBlock from './MessageBlock'; // 本物をインポート

/**
 * チャット履歴表示エリア (T-06)
 * @param {Array} messages - App.jsxから渡される
 * @param {function} onSuggestionClick - ChatAreaから渡される
 */
const ChatHistory = ({ messages, onSuggestionClick }) => {
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
          // ★ 役割に応じて左右に振り分けるラッパーを追加
          <div
            key={msg.id}
            className={`chat-row ${
              msg.role === 'user' ? 'chat-row-user' : 'chat-row-ai'
            }`}
          >
            <MessageBlock
              message={msg}
              onSuggestionClick={onSuggestionClick} // ★ T-11対応: propsを渡す
            />
          </div>
        ))
      )}
      {/* スクロール用の空要素 */}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ChatHistory;