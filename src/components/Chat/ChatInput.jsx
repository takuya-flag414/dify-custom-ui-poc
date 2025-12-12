// src/components/Chat/ChatInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import '../Chat/ChatArea.css';
import AttachmentPopover from '../Chat/AttachmentPopover';
import ContextSelector from '../Shared/ContextSelector';

// --- Icons ---

const ContextControlIcon = ({ settings }) => {
  const isWebActive = settings.webMode !== 'off';
  const isRagActive = settings.ragEnabled;

  return (
    <div className="relative">
      <svg
        width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={`transition-colors duration-300 ${isWebActive ? 'text-blue-500' : 'text-gray-400'}`}
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
      {isRagActive && (
        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
      )}
    </div>
  );
};

const AttachmentIcon = () => (
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

// --- Main Component ---

const ChatInput = ({
  isLoading,
  isHistoryLoading,
  onSendMessage,
  isCentered,
  activeContextFiles = [], // ★変更: sessionFiles から activeContextFiles へ
  searchSettings,
  setSearchSettings
}) => {
  const [text, setText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // Popover State
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [showSearchOptions, setShowSearchOptions] = useState(false);
  
  const popoverRef = useRef(null);
  const searchOptionsRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // 外側クリック検知
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsPopoverOpen(false);
      }
      if (searchOptionsRef.current && !searchOptionsRef.current.contains(event.target)) {
        setShowSearchOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // テキストエリア自動リサイズ
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
    if ((!text.trim() && selectedFiles.length === 0) || isLoading) return;
    onSendMessage(text, selectedFiles);
    setText('');
    setSelectedFiles([]);
    setIsPopoverOpen(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      e.target.value = '';
      setIsPopoverOpen(true);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const totalFiles = activeContextFiles.length + selectedFiles.length;

  const getPlaceholder = () => {
    if (isHistoryLoading) return "履歴を読み込んでいます...";
    if (isLoading) return "AIが思考中です...";

    const parts = [];
    if (searchSettings?.webMode === 'force') parts.push("Web検索");
    if (searchSettings?.ragEnabled) parts.push("社内情報");

    if (parts.length > 0) {
      return `メッセージを入力 (${parts.join('と')}を参照)...`;
    }
    return "メッセージを入力...";
  };

  return (
    <div className={isCentered ? "chat-input-container-centered" : "chat-input-container"}>
      <div className="chat-input-form">
        
        {/* Input Row */}
        <div className="chat-input-row relative">
          
          {/* Attachment Button & Popover Wrapper */}
          <div className="relative" ref={popoverRef}>
            <button
              className={`chat-input-attach-btn ${isPopoverOpen ? 'bg-gray-100 text-blue-500' : ''}`}
              onClick={() => setIsPopoverOpen(!isPopoverOpen)}
              disabled={isLoading}
              title="参照ファイルを確認・追加"
            >
              <AttachmentIcon />
              {/* Badge Indicator */}
              {totalFiles > 0 && (
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5 pointer-events-none">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 border border-white"></span>
                </span>
              )}
            </button>

            {/* Popover Component */}
            {isPopoverOpen && (
              <AttachmentPopover
                activeContextFiles={activeContextFiles} // ★変更: Props名を統一
                selectedFiles={selectedFiles}
                onRemoveSelected={removeSelectedFile}
                onAddFileClick={() => fileInputRef.current?.click()}
                onClose={() => setIsPopoverOpen(false)}
                isLoading={isLoading}
              />
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt,.md,.csv,.xlsx"
            multiple
          />

          {/* Context Settings */}
          <div className="relative" ref={searchOptionsRef}>
            <button
              className={`chat-input-attach-btn ml-1 ${showSearchOptions ? 'bg-gray-100' : ''}`}
              onClick={() => setShowSearchOptions(!showSearchOptions)}
              disabled={isLoading}
              title="検索ソース設定"
            >
              <ContextControlIcon settings={searchSettings || {}} />
            </button>
            {showSearchOptions && (
              <div className="search-options-popover">
                <ContextSelector
                  settings={searchSettings}
                  onSettingsChange={setSearchSettings}
                />
              </div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            className="chat-input-textarea"
            placeholder={getPlaceholder()}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />

          <button
            className="chat-input-button"
            onClick={handleSend}
            disabled={isLoading || (!text.trim() && selectedFiles.length === 0)}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <SendIcon />
            )}
          </button>
        </div>
      </div>

      <p className="chat-input-disclaimer">
        AIは不正確な情報を表示することがあるため、生成された回答を再確認するようにしてください。
      </p>
    </div>
  );
};

export default ChatInput;