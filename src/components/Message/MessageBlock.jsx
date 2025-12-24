// src/components/Message/MessageBlock.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './MessageBlock.css';
import MarkdownRenderer from '../Shared/MarkdownRenderer';
import CitationList from './CitationList';
import SuggestionButtons from './SuggestionButtons';
import ThinkingProcess from './ThinkingProcess';
import SkeletonLoader from './SkeletonLoader';
import AiKnowledgeBadge from './AiKnowledgeBadge';
import FileIcon from '../Shared/FileIcon';
import CopyButton from '../Shared/CopyButton';

// Spring Physics (DESIGN_RULE準拠)
const SPRING_CONFIG = {
  type: "spring",
  stiffness: 170,
  damping: 26,
  mass: 1
};

// メッセージ出現アニメーション
const MESSAGE_VARIANTS = {
  initial: { opacity: 0, y: 20, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.96 }
};

export const AssistantIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
  </svg>
);

const MessageBlock = ({ message, onSuggestionClick, onOpenArtifact, userName, enableAnimation = true }) => {
  const {
    role,
    text,
    rawContent,
    citations,
    suggestions,
    isStreaming,
    thoughtProcess,
    files,
    traceMode,
    messageId,
    id,
    mode // 'fast' | 'normal'
  } = message;

  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (!isStreaming) {
      setShowRaw(false);
    }
  }, [isStreaming]);

  const isAi = role === 'ai';
  const uniqueMessageId = messageId || id || `msg_${Date.now()}`;
  const isTextEmpty = !text || text.length === 0;
  const showCitations = (traceMode === 'search' || traceMode === 'document') || (citations && citations.length > 0);
  const showKnowledgeBadge = isAi && !isStreaming && traceMode === 'knowledge';

  const textToCopy = rawContent || text || '';

  const renderCopyButton = () => {
    if (isStreaming || isTextEmpty) return null;
    return (
      <CopyButton
        text={textToCopy}
        isAi={isAi}
        className={isAi ? 'copy-btn-ai' : 'copy-btn-user'}
      />
    );
  };

  return (
    <motion.div
      className="message-block"
      variants={enableAnimation ? MESSAGE_VARIANTS : undefined}
      initial={enableAnimation ? "initial" : false}
      animate="animate"
      exit={enableAnimation ? "exit" : undefined}
      transition={SPRING_CONFIG}
    >
      <div className={`message-container ${!isAi ? 'message-container-user' : ''} group`}>

        <div className={isAi ? 'avatar-ai' : 'avatar-user'}>
          {isAi ? <AssistantIcon /> : (userName?.charAt(0).toUpperCase() || 'U')}
        </div>

        <div className={`message-content ${isAi ? 'message-content-ai' : 'message-content-user'}`}>

          <div className="message-bubble-row">
            {!isAi && renderCopyButton()}

            <div className={`message-bubble ${isAi ? 'ai-bubble' : 'user-bubble'}`}>
              {isAi && isStreaming && (
                <button
                  className={`raw-toggle-btn ${showRaw ? 'active' : ''}`}
                  onClick={() => setShowRaw(!showRaw)}
                  title="生成中の生データを表示"
                >
                  ⚡️ Raw
                </button>
              )}

              {!isAi && files && files.length > 0 && (
                <div className="file-attachments-wrapper">
                  {files.map((file, index) => (
                    <div key={index} className="file-attachment-chip">
                      <FileIcon filename={file.name} />
                      <span className="file-attachment-name">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {isAi && thoughtProcess && thoughtProcess.length > 0 && (
                <ThinkingProcess steps={thoughtProcess} isStreaming={isStreaming} />
              )}

              {isAi && isStreaming && isTextEmpty && !showRaw && mode !== 'fast' && (
                <SkeletonLoader />
              )}

              {showRaw ? (
                <pre className="raw-content-view">
                  {rawContent ? (
                    rawContent
                  ) : (
                    <div className="raw-empty-state">
                      <span className="raw-cursor"></span>
                      <span className="raw-loading-text">AIからの応答を待機しています...</span>
                    </div>
                  )}
                </pre>
              ) : (
                !isTextEmpty && (
                  <MarkdownRenderer
                    content={text || ''}
                    isStreaming={isAi && isStreaming}
                    renderMode={mode === 'fast' ? 'realtime' : 'normal'}
                    citations={citations}
                    messageId={uniqueMessageId}
                    onOpenArtifact={onOpenArtifact}
                  />
                )
              )}
            </div>

            {isAi && renderCopyButton()}
          </div>

          {isAi && !isStreaming && (
            <div className="message-footer">
              {showCitations && <CitationList citations={citations} messageId={uniqueMessageId} />}
              {showKnowledgeBadge && <AiKnowledgeBadge />}
              <SuggestionButtons suggestions={suggestions} onSuggestionClick={onSuggestionClick} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ★修正: JSON.stringifyを排除し、高速な参照比較へ変更
const arePropsEqual = (prev, next) => {
  // 1. メッセージオブジェクト自体の参照が同じなら、中身は変わっていないとみなす（最速）
  if (prev.message === next.message) {
    // ただし、親から渡される関数Propsが変わっていないかチェック
    // (useCallbackされていれば、ここも等価になるはず)
    return prev.onSuggestionClick === next.onSuggestionClick
      && prev.onOpenArtifact === next.onOpenArtifact
      && prev.enableAnimation === next.enableAnimation;
  }

  // 2. 参照が違う場合（ストリーミング中の更新など）、必要なフィールドだけ浅く比較
  const p = prev.message;
  const n = next.message;

  // 主要なプリミティブ値の比較
  const isPrimitiveEqual =
    p.id === n.id
    && p.text === n.text
    && p.isStreaming === n.isStreaming
    && p.rawContent === n.rawContent
    && p.traceMode === n.traceMode
    && p.mode === n.mode; // Fast/Normalモード

  if (!isPrimitiveEqual) return false;

  // 配列・オブジェクトの比較（参照チェックのみで高速化）
  // ReactのState更新がイミュータブルに行われていれば、中身が変われば参照も変わるはず
  return p.citations === n.citations
    && p.suggestions === n.suggestions
    && p.thoughtProcess === n.thoughtProcess
    && p.files === n.files;
};

export default React.memo(MessageBlock, arePropsEqual);