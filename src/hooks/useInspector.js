// src/hooks/useInspector.js
import { useState, useCallback } from 'react';

/**
 * Inspector Panel の状態管理フック
 * - 選択中メッセージの情報（ThinkingProcess, Citations等）をInspectorに渡す
 * - Citation クリック連携の状態管理
 */
export const useInspector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('thought');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [highlightedCitation, setHighlightedCitation] = useState(null);

  // Inspectorを開く
  const openInspector = useCallback((tab = 'thought') => {
    setIsOpen(true);
    setActiveTab(tab);
  }, []);

  // Inspectorを閉じる
  const closeInspector = useCallback(() => {
    setIsOpen(false);
    setHighlightedCitation(null);
  }, []);

  // メッセージを選択（その情報をInspectorに表示）
  const selectMessage = useCallback((message) => {
    setSelectedMessage(message);
    if (message) {
      setIsOpen(true);
      // メッセージに応じて適切なタブを選択
      if (message.thoughtProcess && message.thoughtProcess.length > 0) {
        setActiveTab('thought');
      } else if (message.citations && message.citations.length > 0) {
        setActiveTab('citations');
      }
    }
  }, []);

  // Citation をハイライト
  const highlightCitation = useCallback((citationIndex, messageId) => {
    setHighlightedCitation({ index: citationIndex, messageId });
    setActiveTab('citations');
    setIsOpen(true);
    
    // 一定時間後にハイライト解除
    setTimeout(() => setHighlightedCitation(null), 3000);
  }, []);

  // Artifactを選択
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  
  const selectArtifact = useCallback((artifact) => {
    setSelectedArtifact(artifact);
    setActiveTab('artifacts');
    setIsOpen(true);
  }, []);

  const closeArtifact = useCallback(() => {
    setSelectedArtifact(null);
    // Inspectorは開いたまま
  }, []);

  return {
    // 状態
    isOpen,
    activeTab,
    selectedMessage,
    selectedArtifact,
    highlightedCitation,
    
    // アクション
    openInspector,
    closeInspector,
    setActiveTab,
    selectMessage,
    selectArtifact,
    closeArtifact,
    highlightCitation,
  };
};

export default useInspector;
