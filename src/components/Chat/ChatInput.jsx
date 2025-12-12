// src/components/chat/ChatInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import '../Chat/ChatArea.css';
import FileIcon from '../Shared/FileIcon';
import ContextSelector from '../Shared/ContextSelector';

// Context Control Icon (Globe + Status Dot)
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

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const DEFAULT_SETTINGS = { ragEnabled: true, webMode: 'auto', domainFilters: [] };

const ChatInput = ({
  isLoading,
  isHistoryLoading,
  onSendMessage,
  isCentered,
  activeContextFile,
  setActiveContextFile,
  searchSettings = DEFAULT_SETTINGS,
  setSearchSettings = () => { }
}) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);

  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const searchOptionsRef = useRef(null);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

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

  // ★ 削除: handleClearContext は不要になったため削除

  const getPlaceholder = () => {
    if (isHistoryLoading) return "履歴を読み込んでいます...";
    if (isLoading) return "AIが思考中です...";

    const parts = [];
    if (searchSettings.webMode === 'force') parts.push("Web検索");
    if (searchSettings.ragEnabled) parts.push("社内情報");

    if (parts.length > 0) {
      return `メッセージを入力 (${parts.join('と')}を参照)...`;
    }
    return "メッセージを入力...";
  };

  return (
    <div className={isCentered ? "chat-input-container-centered" : "chat-input-container"}>
      <div className={`chat-input-form ${activeContextFile ? 'has-context' : ''}`}>

        {/* Sticky Context File (ReadOnly Mode) */}
        {activeContextFile && (
          <div 
            className="context-file-sticky locked" 
            title="このファイルはこのチャットの前提情報として固定されています。変更するには新しいチャットを開始してください。"
          >
            <div className="context-file-icon-wrapper">
              <FileIcon filename={activeContextFile.name} />
            </div>
            <div className="context-file-info">
              <span className="context-file-name" title={activeContextFile.name}>
                {activeContextFile.name}
              </span>
              <span className="context-file-status">
                <LockIcon /> このチャットの参照ファイル
              </span>
            </div>
            {/* ★ 削除: 削除ボタン (context-file-close) を撤廃 */}
          </div>
        )}

        {/* Temporary Attachment (New Upload) */}
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
          {/* ★ 変更なし: activeContextFileがある場合は disabled になるロジックを維持 
             これにより「追加」も「削除」もできない状態（＝固定）になります。
          */}
          <button
            className="chat-input-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || !!activeContextFile}
            title={activeContextFile ? "このチャットではファイルを変更できません" : "ファイルを添付"}
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

          <button
            className={`chat-input-attach-btn ml-1 ${showSearchOptions ? 'bg-gray-100' : ''}`}
            onClick={() => setShowSearchOptions(!showSearchOptions)}
            disabled={isLoading}
            title="検索ソース設定を開く"
          >
            <ContextControlIcon settings={searchSettings} />
          </button>

          {showSearchOptions && (
            <div className="search-options-popover">
              <ContextSelector
                settings={searchSettings}
                onSettingsChange={setSearchSettings}
              />
            </div>
          )}

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

      <p className="chat-input-disclaimer">
        AIは不正確な情報を表示することがあるため、生成された回答を再確認するようにしてください。
      </p>
    </div>
  );
};

export default ChatInput;