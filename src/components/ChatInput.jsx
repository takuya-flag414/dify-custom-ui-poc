// src/components/ChatInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import './styles/ChatArea.css';
import FileIcon from './FileIcon';

// Integrated Lock Icon
const LockIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ChatInput = ({ isLoading, onSendMessage, isCentered, activeContextFile, setActiveContextFile }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleKeyDown = (e) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!text.trim() && !file) || isLoading) return;
    onSendMessage(text, file);
    setText('');
    setFile(null); // Clear temp file
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      e.target.value = ''; // Reset input
    }
  };

  // Sticky File Clear
  const handleClearContext = () => {
    setActiveContextFile(null);
  };

  return (
    <div className={isCentered ? "chat-input-container-centered" : "chat-input-container"}>
      <div className={`chat-input-form ${activeContextFile ? 'has-context' : ''}`}>

        {/* A. Sticky Context File (Conversation Scope) */}
        {activeContextFile && (
          <div className="flex items-center gap-2 p-2 mb-2 bg-blue-50 border border-blue-100 rounded-lg animate-fade-in mx-1">
            <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded text-blue-600">
              <FileIcon filename={activeContextFile.name} className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <span className="text-xs font-semibold text-blue-700 truncate">{activeContextFile.name}</span>
              <span className="text-[10px] text-blue-500 flex items-center gap-1">
                <LockIcon /> 会話のコンテキストとして保持中
              </span>
            </div>
            <button onClick={handleClearContext} className="p-1 hover:bg-blue-100 rounded-full text-blue-400 hover:text-red-500 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        )}

        {/* B. Temporary Attachment (One-time) */}
        {file && (
          <div className="file-preview-integrated">
            <FileIcon filename={file.name} className="w-6 h-6" />
            <span className="file-preview-name">{file.name}</span>
            <button className="file-preview-close" onClick={() => setFile(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        )}

        {/* Input Row */}
        <div className="chat-input-row">
          <button
            className="chat-input-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || !!activeContextFile} // Disable if sticky exists (Phase 1 limit)
            title="ファイルを添付"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt,.md,.csv,.xlsx"
          />

          <textarea
            ref={textareaRef}
            className="chat-input-textarea"
            placeholder={isLoading ? "AIが思考中です..." : (activeContextFile ? "このファイルについて質問..." : "メッセージを入力 (AIが検索を判断します)...")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />

          <button
            className="chat-input-button"
            onClick={handleSend}
            disabled={isLoading || (!text.trim() && !file)}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;