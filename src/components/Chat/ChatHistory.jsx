// src/components/Chat/ChatHistory.jsx
import React, { useEffect, useRef } from 'react';
import './ChatHistory.css';
import MessageBlock from '../Message/MessageBlock';

const ChatHistory = ({ messages, onSuggestionClick, isLoading }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // メッセージが更新されたらスクロール
    // アニメーション中でも、コンテナの高さは確保されるためスクロール位置は正しく機能します
    scrollToBottom();
  }, [messages, isLoading]);

  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <div className="chat-history">
      {messages.map((msg, index) => {
        // ★ 演出ロジック:
        // 最初の2つ（ユーザー質問 + AI回答）はアニメーションなしで即時表示（スケルトンとの入れ替え）
        // それ以降はスタッガードアニメーションを適用
        const isInstantSwap = index < 2;
        
        // 2つ目以降に対して、0.1秒ずつ遅延させる
        // (index - 2) * 0.1s => 0s, 0.1s, 0.2s ...
        const delayStyle = isInstantSwap 
          ? {} 
          : { animationDelay: `${(index - 2) * 0.08}s` }; // 少し早めの0.08s間隔

        const animationClass = isInstantSwap ? '' : 'message-animate-enter';

        return (
          <MessageBlock
            key={msg.id}
            message={msg}
            onSuggestionClick={onSuggestionClick}
            className={animationClass}
            style={delayStyle}
          />
        );
      })}

      {/* Loading Indicator (新規生成時用: AI思考中) */}
      {isLoading && messages[messages.length - 1]?.role === 'user' && (
        <div className="message-block message-animate-enter">
           {/* 生成開始時のThinkingもアニメーション付きで表示 */}
          <div className="message-container">
            <div className="avatar-ai">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
              </svg>
            </div>
            <div className="message-content message-content-ai">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatHistory;