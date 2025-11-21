// src/components/ChatInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import './styles/ChatArea.css'; 
// ★修正: 既存のFileIconを直接インポート
import FileIcon from './FileIcon';

const ChatInput = ({ isLoading, onSendMessage, isCentered }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // テキストエリアの高さ自動調整
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
    setFile(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={isCentered ? "chat-input-container-centered" : "chat-input-container"}>
      <div className="chat-input-form">
        
        {/* 添付ファイルのプレビュー (Input内に表示) */}
        {file && (
          <div className="file-preview-integrated">
            {/* ★修正: FileIconを使用 */}
            <FileIcon filename={file.name} className="w-6 h-6" />
            
            <span className="file-preview-name">{file.name}</span>
            
            <button className="file-preview-close" onClick={() => setFile(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

        <div className="chat-input-row">
          <button 
            className="chat-input-attach-btn" 
            onClick={triggerFileSelect}
            disabled={isLoading}
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
            placeholder={isLoading ? "AIが思考中です..." : "メッセージを入力..."}
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;