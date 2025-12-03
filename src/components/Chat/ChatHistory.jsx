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
    scrollToBottom();
  }, [messages, isLoading]);

  if (!messages || messages.length === 0) {
    return null; // または空の状態の表示
  }

  return (
    <div className="chat-history">
      {messages.map((msg) => (
        <MessageBlock
          key={msg.id}
          message={msg}
          onSuggestionClick={onSuggestionClick}
        />
      ))}

      {/* Loading Indicator (AI思考中) */}
      {isLoading && messages[messages.length - 1]?.role === 'user' && (
        <div className="message-block">
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