/* src/components/Chat/ChatHistory.jsx */
import React, { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import './ChatHistory.css';
import MessageBlock from '../Message/MessageBlock';
// ★追加
import SystemErrorBlock from '../Message/SystemErrorBlock';

// パフォーマンス制限: 50件を超えると最新メッセージのみアニメーション
const ANIMATION_LIMIT = 50;

const ChatHistory = ({ messages, onSuggestionClick, isLoading, onSendMessage, onOpenConfig, onOpenArtifact, userName }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // ★追加: リトライ機能
  // エラーの一つ前の「ユーザーメッセージ」を探して再送する
  const handleRetry = (errorMsgIndex) => {
    // 逆順に探索
    for (let i = errorMsgIndex - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'user') {
        // 見つかったテキストで再送 (ファイルは簡易的に空とする)
        onSendMessage(msg.text, []);
        return;
      }
    }
  };

  if (!messages || messages.length === 0) {
    return null;
  }

  // パフォーマンス制限判定
  const enableFullAnimation = messages.length <= ANIMATION_LIMIT;
  const isNewMessage = (index) => index === messages.length - 1;

  return (
    <div className="chat-history">
      <AnimatePresence mode="popLayout">
        {messages.map((msg, index) => {
          // ★追加: システムエラーの場合の表示
          if (msg.role === 'system' && msg.type === 'error') {
            return (
              <SystemErrorBlock
                key={msg.id}
                message={msg}
                onOpenConfig={onOpenConfig}
                onRetry={() => handleRetry(index)}
              />
            );
          }

          // 50件以下 OR 最新メッセージのみアニメーション有効
          const enableAnimation = enableFullAnimation || isNewMessage(index);

          return (
            <MessageBlock
              key={msg.id}
              message={msg}
              onSuggestionClick={onSuggestionClick}
              onOpenArtifact={onOpenArtifact}
              enableAnimation={enableAnimation}
              userName={userName}
            />
          );
        })}
      </AnimatePresence>

      {/* Loading Indicator */}
      {isLoading && messages[messages.length - 1]?.role === 'user' && (
        <div className="message-block message-animate-enter">
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
