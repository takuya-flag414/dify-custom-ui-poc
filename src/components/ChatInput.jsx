// src/components/ChatInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import './styles/ChatArea.css';
import FileIcon from './FileIcon';
import DomainTagger from './DomainTagger';

// Globe Icon
const GlobeIcon = ({ active }) => (
  <svg
    width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`transition-colors duration-300 ${active ? 'text-blue-500' : 'text-gray-400'}`}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

const LockIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ChatInput = ({
  isLoading,
  onSendMessage,
  isCentered,
  activeContextFile,
  setActiveContextFile,
  domainFilters,
  setDomainFilters,
  forceSearch,
  setForceSearch
}) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);

  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const searchOptionsRef = useRef(null);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchOptionsRef.current && !searchOptionsRef.current.contains(event.target)) {
        setShowSearchOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setShowSearchOptions(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleClearContext = () => {
    setActiveContextFile(null);
  };

  return (
    <div className={isCentered ? "chat-input-container-centered" : "chat-input-container"}>
      <div className={`chat-input-form ${activeContextFile ? 'has-context' : ''}`}>

        {/* Sticky Context File */}
        {activeContextFile && (
          <div className="context-file-sticky">
            <div className="context-file-icon-wrapper">
              <FileIcon filename={activeContextFile.name} />
            </div>
            <div className="context-file-info">
              <span className="context-file-name" title={activeContextFile.name}>
                {activeContextFile.name}
              </span>
              <span className="context-file-status">
                <LockIcon /> 会話のコンテキストとして保持中
              </span>
            </div>
            <button
              onClick={handleClearContext}
              className="context-file-close"
              title="コンテキストを解除"
              aria-label="コンテキストを解除"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Temporary Attachment */}
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
        <div className="chat-input-row relative" ref={searchOptionsRef}>
          <button
            className="chat-input-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || !!activeContextFile}
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

          {/* Search Settings Trigger (開閉のみ) */}
          <button
            className={`chat-input-attach-btn ml-1 ${forceSearch ? 'bg-blue-50' : ''}`}
            onClick={() => setShowSearchOptions(!showSearchOptions)}
            disabled={isLoading}
            title="検索設定を開く"
          >
            <GlobeIcon active={forceSearch} />
          </button>

          {/* Search Options Popover */}
          {showSearchOptions && (
            <div className="search-options-popover">
              <DomainTagger
                filters={domainFilters}
                setFilters={setDomainFilters}
                forceSearch={forceSearch}       // ★ 追加
                setForceSearch={setForceSearch} // ★ 追加
              />
            </div>
          )}

          <textarea
            ref={textareaRef}
            className="chat-input-textarea"
            placeholder={
              isLoading
                ? "AIが思考中です..."
                : (forceSearch ? "Web検索したい内容を入力..." : "メッセージを入力 (AIが検索を判断します)...")
            }
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