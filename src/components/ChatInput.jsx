// src/components/ChatInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import './styles/ChatArea.css';
import FileIcon from './FileIcon';

// --- Icons ---
const PaperclipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const ChatInput = ({ isLoading, onSendMessage, isCentered = false }) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [inputText]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if ((text || selectedFile) && !isLoading) {
      onSendMessage(text, selectedFile);
      setInputText('');
      handleRemoveFile();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={isCentered ? 'chat-input-container-centered' : 'chat-input-container'}>
      <form className="chat-input-form" onSubmit={handleSubmit}>
        
        {/* --- Section 1: File Preview (Integrated) --- */}
        {/* ファイルがある時だけ表示される上段エリア */}
        {selectedFile && (
          <div className="file-preview-integrated">
            <FileIcon filename={selectedFile.name} />
            <span className="file-preview-name">{selectedFile.name}</span>
            <button type="button" onClick={handleRemoveFile} className="file-preview-close" title="削除">
              ✕
            </button>
          </div>
        )}

        {/* --- Section 2: Input Controls Row --- */}
        {/* アイコン、テキストエリア、送信ボタンの並び */}
        <div className="chat-input-row">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            accept=".pdf,.docx,.txt,.md,.pptx,.xlsx,.csv"
          />
          
          <button
            type="button"
            className="chat-input-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="ファイルを添付"
          >
            <PaperclipIcon />
          </button>

          <textarea
            ref={textareaRef}
            className="chat-input-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedFile ? "ファイルについて質問..." : "メッセージを入力..."}
            rows={1}
            disabled={isLoading}
          />
          
          <button
            type="submit"
            className="chat-input-button"
            disabled={isLoading || (!inputText.trim() && !selectedFile)}
          >
            <SendIcon />
          </button>
        </div>

      </form>
    </div>
  );
};

export default ChatInput;