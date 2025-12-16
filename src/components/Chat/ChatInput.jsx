// src/components/Chat/ChatInput.jsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ContextSelector from '../Shared/ContextSelector';
import FileIcon from '../Shared/FileIcon';
import './ChatInput.css';

// --- Icons (SVG Definitions) ---

const iconProps = {
  width: "14",
  height: "14",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// --- Mode Icons ---

const ZapIcon = () => (
  <svg {...iconProps}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);

const SparklesIcon = () => (
  <svg {...iconProps}>
    <path d="M12 2L14.4 7.2L20 9.6L14.4 12L12 17.2L9.6 12L4 9.6L9.6 7.2L12 2Z" />
  </svg>
);

const GlobeIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

const DatabaseIcon = () => (
  <svg {...iconProps}>
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);

// 📚+🌐 Layers (Hybrid)
const LayersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
    <polyline points="2 17 12 22 22 17"></polyline>
    <polyline points="2 12 12 17 22 12"></polyline>
  </svg>
);

// --- Helper: Get Mode Info ---
const getModeInfo = (settings) => {
  const { ragEnabled, webMode, domainFilters } = settings;

  // ドメイン指定がある場合、件数をラベルに付記する (例: "Deep (2)")
  // ただしWeb検索が無効なモードでは表示しない
  const filterCount = domainFilters?.length || 0;
  const suffix = filterCount > 0 ? ` (${filterCount})` : '';

  // 1. Hybrid (RAG + Web)
  if (ragEnabled && webMode !== 'off') {
    return { label: `Hybrid${suffix}`, class: 'mode-hybrid', icon: <LayersIcon /> };
  }
  // 2. Enterprise (RAG Only)
  if (ragEnabled) {
    return { label: 'Enterprise', class: 'mode-enterprise', icon: <DatabaseIcon /> };
  }
  // 3. Research (Web Force)
  if (webMode === 'force') {
    return { label: `Research${suffix}`, class: 'mode-deep', icon: <GlobeIcon /> };
  }
  // 4. Standard (Web Auto)
  if (webMode === 'auto') {
    return { label: `Standard${suffix}`, class: 'mode-standard', icon: <SparklesIcon /> };
  }

  // 5. Fast (Offline)
  return { label: 'Fast', class: 'mode-fast', icon: <ZapIcon /> };
};

// --- Main Component ---
const ChatInput = ({
  isLoading,
  isHistoryLoading,
  onSendMessage,
  isCentered,
  activeContextFiles = [],
  searchSettings,
  setSearchSettings
}) => {
  const [text, setText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showContextSelector, setShowContextSelector] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const contextSelectorRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextSelectorRef.current && !contextSelectorRef.current.contains(event.target)) {
        setShowContextSelector(false);
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

  const handleSend = () => {
    if ((!text.trim() && selectedFiles.length === 0) || isLoading) return;
    onSendMessage(text, selectedFiles);
    setText('');
    setSelectedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addFiles = useCallback((newFiles) => {
    if (newFiles && newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragging(true);
  }, [isLoading]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isLoading) return;
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      addFiles(Array.from(droppedFiles));
    }
  }, [isLoading, addFiles]);

  const modeInfo = useMemo(() => getModeInfo(searchSettings || { webMode: 'auto', ragEnabled: false }), [searchSettings]);
  const hasFiles = activeContextFiles.length > 0 || selectedFiles.length > 0;
  const canSend = (text.trim().length > 0 || selectedFiles.length > 0) && !isLoading;
  const placeholder = isHistoryLoading ? "履歴を読み込んでいます..." :
    isLoading ? "思考中..." : "AIに相談";

  return (
    <div className={isCentered ? "chat-input-container-centered" : "chat-input-container"}>
      <div
        className={`input-capsule-container ${isDragging ? 'dragging' : ''}`}
        data-tutorial="input-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 1. File Preview Tray */}
        {hasFiles && (
          <div className="file-tray">
            {activeContextFiles.map((file, idx) => (
              <div key={`hist-${idx}`} className="file-card" title="会話履歴に含まれるファイル">
                <FileIcon filename={file.name} className="file-tray-icon" />
                <span className="file-card-name">{file.name}</span>
              </div>
            ))}
            {selectedFiles.map((file, idx) => (
              <div key={`pend-${idx}`} className="file-card pending">
                <FileIcon filename={file.name} className="file-tray-icon" />
                <span className="file-card-name">{file.name}</span>
                <button className="file-remove-btn" onClick={() => removeSelectedFile(idx)} title="削除">
                  <CloseIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 2. Input Row */}
        <div className="input-row">
          <button
            className="action-btn-circle"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="ファイルを追加"
            data-tutorial="attachment-btn"
          >
            <PlusIcon />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt,.md,.csv,.xlsx"
            multiple
          />

          <textarea
            ref={textareaRef}
            className="input-textarea"
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
            autoFocus={!isHistoryLoading}
          />

          <div className="right-controls">
            <div className="relative" ref={contextSelectorRef}>
              <button
                className={`mode-chip ${modeInfo.class}`}
                onClick={() => setShowContextSelector(!showContextSelector)}
                disabled={isLoading}
                title="検索モード切替"
                data-tutorial="context-selector"
              >
                {modeInfo.icon}
                <span>{modeInfo.label}</span>
                <ChevronDownIcon />
              </button>

              {showContextSelector && (
                <div className="search-options-popover capsule-popover">
                  <ContextSelector
                    settings={searchSettings}
                    onSettingsChange={setSearchSettings}
                  />
                </div>
              )}
            </div>

            <button
              className={`send-btn ${canSend ? 'active' : ''}`}
              onClick={handleSend}
              disabled={!canSend}
              title="送信"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>

      <p className="input-disclaimer">
        AIは不正確な情報を表示することがあるため、生成された回答を再確認するようにしてください。
      </p>
    </div>
  );
};

export default ChatInput;