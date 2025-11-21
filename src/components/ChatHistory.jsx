// src/components/ChatHistory.jsx
import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './styles/ChatHistory.css';
import './styles/MessageBlock.css';
import CitationList from './CitationList';
// ★追加: FileIconをインポート
import FileIcon from './FileIcon';

const ChatHistory = ({ messages, onSuggestionClick, isLoading, onSendMessage }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (!messages || messages.length === 0) {
    return null; 
  }

  return (
    <div className="chat-history">
      {messages.map((msg) => (
        <div key={msg.id} className="chat-row-wrapper">
          <div className={`chat-row ${msg.role === 'user' ? 'chat-row-user' : 'chat-row-ai'}`}>
            
            {/* AI Avatar */}
            {msg.role === 'ai' && (
              <div className="avatar-ai">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"></path>
                </svg>
              </div>
            )}

            {/* Message Content */}
            {msg.role === 'user' ? (
              <div className="message-bubble user-bubble">
                <div className="message-text">{msg.text}</div>
                {msg.files && msg.files.length > 0 && (
                  <div className="message-files">
                    {msg.files.map((f, idx) => (
                      <div key={idx} className="attached-file-chip">
                        {/* ★修正: FileIconを使用 */}
                        <FileIcon filename={f.name} className="w-4 h-4" />
                        <span className="file-name">{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="message-bubble ai-bubble">
                <div className="message-markdown">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
                {msg.processStatus && (
                  <div className="process-status">
                    <span className="loading-dots">●</span> {msg.processStatus}
                  </div>
                )}
                <CitationList citations={msg.citations} />
                {msg.suggestions && msg.suggestions.length > 0 && !msg.isStreaming && (
                  <div className="suggestion-container">
                    <div className="suggestion-label">関連する質問</div>
                    <div className="suggestion-list">
                      {msg.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          className="suggestion-chip"
                          onClick={() => onSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Avatar */}
            {msg.role === 'user' && (
              <div className="avatar-user">
                <span>You</span>
              </div>
            )}
          </div>
          
          {/* Timestamp */}
          <div className={`user-timestamp ${msg.role === 'ai' ? 'ai-timestamp' : ''}`}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ))}
      
      {/* Loading Indicator */}
      {isLoading && messages[messages.length - 1]?.role === 'user' && (
        <div className="chat-row-wrapper">
          <div className="chat-row chat-row-ai">
            <div className="avatar-ai">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"></path>
               </svg>
            </div>
            <div className="message-bubble ai-bubble">
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