// src/components/Chat/ChatInput.jsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ContextSelector from '../Shared/ContextSelector';
import FileIcon from '../Shared/FileIcon';
import PrivacyConfirmDialog from './PrivacyConfirmDialog';
import PrivacyShieldButton from './PrivacyShieldButton';
import { scanText } from '../../utils/privacyDetector';
import { scanFiles, hasFileWarnings, getFileDetections, isScannableFile } from '../../utils/fileScanner';
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

// ★追加: 停止アイコン (StopCircle)
const StopIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <rect x="9" y="9" width="6" height="6" rx="1"></rect>
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

// 🚀 RocketLaunch (フルパワー)
const RocketLaunchIcon = () => (
  <svg {...iconProps}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.01-.09-2.79a1.993 1.993 0 0 0-2.91.09z"></path>
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
  </svg>
);

// 🏢 BuildingOffice (社内データ)
const BuildingOfficeIcon = () => (
  <svg {...iconProps}>
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
    <path d="M9 22v-4h6v4"></path>
    <path d="M8 6h.01"></path>
    <path d="M16 6h.01"></path>
    <path d="M12 6h.01"></path>
    <path d="M12 10h.01"></path>
    <path d="M12 14h.01"></path>
    <path d="M16 10h.01"></path>
    <path d="M16 14h.01"></path>
    <path d="M8 10h.01"></path>
    <path d="M8 14h.01"></path>
  </svg>
);

// 🌏 GlobeAlt (Web検索)
const GlobeAltIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M2 12h20"></path>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

// 🛡️ Shield (プライバシー警告)
const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

// --- Helper: Get Mode Info ---
const getModeInfo = (settings) => {
  const { ragEnabled, webMode, domainFilters } = settings;

  // ドメイン指定がある場合、件数をラベルに付記する
  const filterCount = domainFilters?.length || 0;
  const suffix = filterCount > 0 ? ` (${filterCount})` : '';

  // 1. フルパワー (RAG + Web)
  if (ragEnabled && webMode !== 'off') {
    return { label: `フルパワー${suffix}`, class: 'mode-hybrid', icon: <RocketLaunchIcon /> };
  }
  // 2. 社内データ (RAG Only)
  if (ragEnabled) {
    return { label: '社内データ', class: 'mode-enterprise', icon: <BuildingOfficeIcon /> };
  }
  // 3. Web検索 (Web Force)
  if (webMode === 'force') {
    return { label: `Web検索${suffix}`, class: 'mode-deep', icon: <GlobeAltIcon /> };
  }
  // 4. オート (Web Auto)
  if (webMode === 'auto') {
    return { label: `オート${suffix}`, class: 'mode-standard', icon: <SparklesIcon /> };
  }

  // 5. スピード (Offline)
  return { label: 'スピード', class: 'mode-fast', icon: <ZapIcon /> };
};

// --- Main Component ---
const ChatInput = ({
  isLoading,
  isHistoryLoading,
  onSendMessage,
  isCentered,
  activeContextFiles = [],
  searchSettings,
  setSearchSettings,
  // ★追加: 停止機能用Props
  isStreaming = false,
  onStop
}) => {
  const [text, setText] = useState('');
  // selectedFiles: Array<{ file: File, scanStatus: 'scanning'|'completed'|'skipped'|'error', hasWarning: boolean, detections: [] }>
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showContextSelector, setShowContextSelector] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Privacy detection state
  const [privacyWarning, setPrivacyWarning] = useState({ hasWarning: false, detections: [] });
  const [showPrivacyConfirm, setShowPrivacyConfirm] = useState(false);

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

  // Privacy detection with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const result = scanText(text);
      setPrivacyWarning(result);
    }, 300);
    return () => clearTimeout(timer);
  }, [text]);

  // 実際の送信処理
  const executeSend = useCallback(() => {
    // selectedFiles から File オブジェクトのみ抽出して送信
    const filesToSend = selectedFiles.map(sf => sf.file);
    onSendMessage(text, filesToSend);
    setText('');
    setSelectedFiles([]);
    setPrivacyWarning({ hasWarning: false, detections: [] });
    setShowPrivacyConfirm(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [text, selectedFiles, onSendMessage]);

  const handleSend = () => {
    if ((!text.trim() && selectedFiles.length === 0) || isLoading) return;

    // テキストまたはファイルに機密情報が検知された場合は確認ダイアログを表示
    if (combinedWarning) {
      setShowPrivacyConfirm(true);
      return;
    }

    executeSend();
  };

  const handleKeyDown = (e) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addFiles = useCallback(async (newFiles) => {
    if (newFiles && newFiles.length > 0) {
      // 初期状態: scanningステータスで追加
      const initialFiles = newFiles.map(file => ({
        file,
        scanStatus: isScannableFile(file.name) ? 'scanning' : 'skipped',
        hasWarning: false,
        detections: [],
      }));

      setSelectedFiles(prev => [...prev, ...initialFiles]);

      // 非同期でスキャン実行
      const scannedResults = await scanFiles(newFiles);

      // スキャン結果で更新
      setSelectedFiles(prev => {
        // 既存のファイルを更新
        return prev.map(sf => {
          // scanningステータスのファイルのみ更新対象
          if (sf.scanStatus === 'scanning') {
            const result = scannedResults.find(r => r.file === sf.file);
            if (result) {
              return result;
            }
          }
          return sf;
        });
      });
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

  // ファイルの警告状態を集計
  const fileWarnings = useMemo(() => {
    const hasWarning = hasFileWarnings(selectedFiles);
    const detections = getFileDetections(selectedFiles);
    return { hasWarning, detections };
  }, [selectedFiles]);

  // テキスト + ファイルの総合警告
  const combinedWarning = useMemo(() => {
    return privacyWarning.hasWarning || fileWarnings.hasWarning;
  }, [privacyWarning.hasWarning, fileWarnings.hasWarning]);

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
  // 送信済みファイル（activeContextFiles）は記録として保持されるが、UIには表示しない
  // 新規アップロードファイル（selectedFiles）のみ表示対象とする
  const hasFiles = selectedFiles.length > 0;
  const canSend = (text.trim().length > 0 || selectedFiles.length > 0) && !isLoading;
  const placeholder = isHistoryLoading ? "履歴を読み込んでいます..." :
    isLoading ? "思考中..." : "AIに相談";

  return (
    <>
      <div className={isCentered ? "chat-input-container-centered" : "chat-input-container"}>
        <div
          className={`input-capsule-container ${isDragging ? 'dragging' : ''} ${privacyWarning.hasWarning ? 'privacy-warning' : ''}`}
          data-tutorial="input-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* 1. File Preview Tray - 新規アップロードファイルのみ表示 */}
          {/* activeContextFilesは将来の機能のために親コンポーネントで保持されているが、ここでは表示しない */}
          {hasFiles && (
            <div className="file-tray">
              {selectedFiles.map((sf, idx) => {
                // スキャン状態に応じたクラス名を生成
                const statusClass = sf.scanStatus === 'scanning' ? 'scanning' :
                  sf.hasWarning ? 'warning' : '';
                return (
                  <div key={`pend-${idx}`} className={`file-card pending ${statusClass}`}>
                    <FileIcon filename={sf.file.name} className="file-tray-icon" />
                    <div className="file-card-content">
                      <span className="file-card-name">{sf.file.name}</span>
                      {sf.scanStatus === 'scanning' && (
                        <span className="file-scan-status">スキャン中...</span>
                      )}
                    </div>
                    {/* 盾ボタン: 警告がある場合のみ表示 */}
                    {sf.hasWarning && (
                      <PrivacyShieldButton
                        detections={sf.detections}
                        fileName={sf.file.name}
                        size="small"
                      />
                    )}
                    <button className="file-remove-btn" onClick={() => removeSelectedFile(idx)} title="削除">
                      <CloseIcon />
                    </button>
                  </div>
                );
              })}
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

              {/* Privacy Shield Indicator - 新コンポーネント使用 */}
              {privacyWarning.hasWarning && (
                <PrivacyShieldButton
                  detections={privacyWarning.detections}
                />
              )}

              {/* ★変更: 送信/停止ボタンのFluid Morphing (DESIGN_RULE準拠) */}
              <AnimatePresence mode="wait">
                {isStreaming ? (
                  <motion.button
                    key="stop"
                    className="send-btn stop-mode active"
                    onClick={onStop}
                    title="停止"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 170, damping: 26 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <StopIcon />
                  </motion.button>
                ) : (
                  <motion.button
                    key="send"
                    className={`send-btn ${canSend ? 'active' : ''}`}
                    onClick={handleSend}
                    disabled={!canSend}
                    title="送信"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 170, damping: 26 }}
                    whileTap={canSend ? { scale: 0.95 } : undefined}
                  >
                    <SendIcon />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <p className="input-disclaimer">
          AIは不正確な情報を表示することがあるため、生成された回答を再確認するようにしてください。
        </p>
      </div>

      {/* Privacy Confirm Dialog */}
      {showPrivacyConfirm && (
        <PrivacyConfirmDialog
          detections={privacyWarning.detections}
          fileDetections={fileWarnings.detections}
          onConfirm={executeSend}
          onCancel={() => setShowPrivacyConfirm(false)}
        />
      )}
    </>
  );
};

export default ChatInput;