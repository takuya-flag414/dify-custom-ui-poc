// src/components/Chat/ChatInput.jsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// New Architecture Components
import CommandCenterContainer from './Input/CommandCenterContainer';
import ReferenceRail from './Input/ReferenceRail';
import InputCanvas from './Input/InputCanvas';
import ControlDeck from './Input/ControlDeck';
// UniversalAddMenu is now handled inside ControlDeck
// import UniversalAddMenu from './Input/UniversalAddMenu'; 
import PrivacyConfirmDialog from './PrivacyConfirmDialog';

import { scanText } from '../../utils/privacyDetector';
import { scanFiles, hasFileWarnings, getFileDetections, isScannableFile } from '../../utils/fileScanner';
// import { fetchKnowledgeStores } from '../../services/DifyClient'; // Removed in favor of hook
import { useGeminiStores } from '../../hooks/useGeminiStores';
import './ChatInput.css';

// --- Main Component ---
const ChatInput = ({
  isLoading,
  isHistoryLoading,
  onSendMessage,
  isCentered,
  searchSettings,
  setSearchSettings,
  isStreaming = false,
  onStop,
  // Phase B: Backend B連携用
  mockMode = 'OFF',
  backendBApiKey = '',
  backendBApiUrl = '',
}) => {
  const [text, setText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  // showAddMenu state is now managed inside ControlDeck (or triggered via props)
  // We only need to trigger store loading when menu opens.

  const [isDragging, setIsDragging] = useState(false);
  const [privacyWarning, setPrivacyWarning] = useState({ hasWarning: false, detections: [] });
  const [showPrivacyConfirm, setShowPrivacyConfirm] = useState(false);

  // Store & Domain State (Managed here to lift up to ReferenceRail)
  const [activeStore, setActiveStore] = useState(null); // { id, display_name, ... }
  // activeDomains is derived from searchSettings.domainFilters

  // Validation State
  const [showStoreError, setShowStoreError] = useState(false);

  // Stores Data State (for UniversalAddMenu) managed by hook
  const {
    stores,
    isLoading: isStoreLoading,
    error: storeError,
    refetch: refetchStores
  } = useGeminiStores(mockMode, backendBApiKey, backendBApiUrl);

  const fileInputRef = useRef(null);

  // Remove direct addMenuRef/handling as it's moved

  // Fetch Stores Check - utilizing hook's refetch
  const handleLoadStores = useCallback(() => {
    refetchStores();
  }, [refetchStores]);

  // Privacy detection
  useEffect(() => {
    const timer = setTimeout(() => {
      const result = scanText(text);
      setPrivacyWarning(result);
    }, 300);
    return () => clearTimeout(timer);
  }, [text]);

  // ★追加: ストアデータのロード完了後、searchSettings.selectedStoreId に基づいて activeStore を復元
  useEffect(() => {
    if (searchSettings.selectedStoreId && stores.length > 0) {
      const savedStore = stores.find(s => s.id === searchSettings.selectedStoreId);
      if (savedStore) {
        setActiveStore(savedStore);
      }
    } else if (!searchSettings.selectedStoreId) {
      setActiveStore(null);
    }
  }, [searchSettings.selectedStoreId, stores]);

  const executeSend = useCallback((excludedTypes = []) => {
    const filesToSend = selectedFiles.map(sf => sf.file);

    // 第3引数でサニタイズ除外タイプを渡す
    onSendMessage(text, filesToSend, { sanitizeExcludeTypes: excludedTypes });
    setText('');
    setSelectedFiles([]);
    setPrivacyWarning({ hasWarning: false, detections: [] });
    setShowPrivacyConfirm(false);
  }, [text, selectedFiles, onSendMessage]);

  const handleSend = () => {
    if ((!text.trim() && selectedFiles.length === 0) || isLoading) return;

    // ★バリデーション: RAG有効(Enterprise/Hybrid)かつストア未選択の場合
    const isRagEnabled = searchSettings.ragEnabled === true; // autoは除外 (標準モードはストア不要)
    const isStoreMissing = !searchSettings.selectedStoreId;

    if (isRagEnabled && isStoreMissing) {
      setShowStoreError(true);
      // 3秒後にエラー表示を消す
      setTimeout(() => setShowStoreError(false), 3000);
      return;
    }

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
      const initialFiles = newFiles.map(file => ({
        id: `file-${Date.now()}-${file.name}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        scanStatus: isScannableFile(file.name) ? 'scanning' : 'skipped',
        hasWarning: false,
        detections: [],
      }));

      setSelectedFiles(prev => [...prev, ...initialFiles]);

      const scannedResults = await scanFiles(newFiles);

      setSelectedFiles(prev => {
        return prev.map(sf => {
          if (sf.scanStatus === 'scanning') {
            const result = scannedResults.find(r => r.file === sf.file);
            if (result) return { ...sf, ...result };
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

  const fileWarnings = useMemo(() => {
    const hasWarning = hasFileWarnings(selectedFiles);
    const detections = getFileDetections(selectedFiles);
    return { hasWarning, detections };
  }, [selectedFiles]);

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

  const placeholder = isHistoryLoading ? "履歴を読み込んでいます..." : isLoading ? "思考中..." : "AIに相談...";
  const hasFiles = selectedFiles.length > 0;
  const canSend = (text.trim().length > 0 || hasFiles) && !isLoading;

  // --- Handlers for Universal Add Menu ---
  const handleAddMenuOpen = () => {
    // Trigger store loading when menu opens (managed by hook's refetch)
    handleLoadStores();
  };

  const handleSelectStore = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    if (store) {
      setActiveStore(store);
      // ★修正: ストア選択時にsearchSettingsも更新して、useChatが参照できるようにする
      setSearchSettings({
        ...searchSettings,
        selectedStoreId: storeId,
        selectedStoreName: store?.display_name || '',
      });
    }
  };

  // v3.0: ContextSelector からストアオブジェクトを直接受け取る
  const handleStoreSelected = (store) => {
    if (store) {
      setActiveStore(store);
    }
  };

  const handleAddDomain = (domain) => {
    const current = searchSettings.domainFilters || [];
    if (!current.includes(domain)) {
      setSearchSettings({
        ...searchSettings,
        domainFilters: [...current, domain]
      });
    }
  };

  const handleRemoveDomain = (index) => {
    const current = searchSettings.domainFilters || [];
    const next = [...current];
    next.splice(index, 1);
    setSearchSettings({
      ...searchSettings,
      domainFilters: next
    });
  };

  return (
    <>
      <div className={isCentered ? "chat-input-container-centered" : "chat-input-container"}>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt,.md,.csv,.xlsx"
          multiple
        />

        {/* Liquid Command Center */}
        <CommandCenterContainer
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          hasWarning={combinedWarning}
        >
          {/* Tier 1: Reference Rail */}
          <ReferenceRail
            files={selectedFiles}
            activeStore={activeStore}
            activeDomains={searchSettings.domainFilters || []}
            onRemoveFile={removeSelectedFile}
            onRemoveStore={() => {
              setActiveStore(null);
              setSearchSettings({
                ...searchSettings,
                selectedStoreId: null,
                selectedStoreName: null,
                ragEnabled: false,
                webEnabled: false,
              });
            }}
            onRemoveDomain={handleRemoveDomain}
          />

          {/* Tier 2: Input Canvas */}
          <InputCanvas
            text={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={placeholder}
            isHistoryLoading={isHistoryLoading}
          />

          {/* Tier 3: Control Deck */}
          <ControlDeck
            // Add props for Universal Add Menu
            onAddMenuOpen={handleAddMenuOpen}
            onFileUpload={() => fileInputRef.current?.click()}
            domainFilters={searchSettings.domainFilters || []}
            onAddDomain={handleAddDomain}
            onRemoveDomain={handleRemoveDomain}

            // v3.0: ContextSelector props
            onStoreSelected={handleStoreSelected}
            showStoreError={showStoreError} // ★ Validation Error Prop

            searchSettings={searchSettings}
            setSearchSettings={setSearchSettings}
            mockMode={mockMode}
            backendBApiKey={backendBApiKey}
            backendBApiUrl={backendBApiUrl}
            privacyWarning={privacyWarning}
            isTyping={text.length > 0}
            isStreaming={isStreaming}
            canSend={canSend}
            onSend={handleSend}
            onStop={onStop}
            isLoading={isLoading}
          />
        </CommandCenterContainer>

        <p className="input-disclaimer">
          AIは不正確な情報を表示することがあるため、生成された回答を再確認するようにしてください。
        </p>
      </div>

      {/* Privacy Confirm Dialog */}
      {showPrivacyConfirm && (
        <PrivacyConfirmDialog
          detections={privacyWarning.detections}
          fileDetections={fileWarnings.detections}
          onConfirm={(excludedTypes) => executeSend(excludedTypes)}
          onCancel={() => setShowPrivacyConfirm(false)}
        />
      )}
    </>
  );
};

export default ChatInput;