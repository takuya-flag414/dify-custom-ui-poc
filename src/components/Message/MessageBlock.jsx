// src/components/Message/MessageBlock.jsx
import React, { useState, useEffect } from 'react';
import './MessageBlock.css';
import MarkdownRenderer from '../Shared/MarkdownRenderer';
import CitationList from './CitationList';
import SuggestionButtons from './SuggestionButtons';
import ThinkingProcess from './ThinkingProcess';
import SkeletonLoader from './SkeletonLoader';
import AiKnowledgeBadge from './AiKnowledgeBadge';
import FileIcon from '../Shared/FileIcon';
import CopyButton from '../Shared/CopyButton';

export const AssistantIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
  </svg>
);

const MessageBlock = ({ message, onSuggestionClick }) => {
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
    id
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

  // コピーボタンのレンダリングヘルパー
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
    <div className="message-block">
      {/* groupクラスを追加し、ホバー検知の親とする */}
      <div className={`message-container ${!isAi ? 'message-container-user' : ''} group`}>

        <div className={isAi ? 'avatar-ai' : 'avatar-user'}>
          {isAi ? <AssistantIcon /> : 'You'}
        </div>

        <div className={`message-content ${isAi ? 'message-content-ai' : 'message-content-user'}`}>

          {/* バブルとボタンを横並びにするラッパー */}
          <div className="message-bubble-row">

            {/* Userの場合: 左側にボタン配置 */}
            {!isAi && renderCopyButton()}

            <div className={`message-bubble ${isAi ? 'ai-bubble' : 'user-bubble'}`}>

              {/* Debug: Raw Toggle Button (AI & Streaming only) */}
              {isAi && isStreaming && (
                <button
                  className={`raw-toggle-btn ${showRaw ? 'active' : ''}`}
                  onClick={() => setShowRaw(!showRaw)}
                  title="生成中の生データを表示"
                >
                  ⚡️ Raw
                </button>
              )}

              {/* User: File Attachment */}
              {!isAi && files && files.length > 0 && (
                <div className="file-attachment-chip">
                  <FileIcon filename={files[0].name} />
                  <span className="file-attachment-name">{files[0].name}</span>
                </div>
              )}

              {/* AI: Thinking Process */}
              {isAi && thoughtProcess && thoughtProcess.length > 0 && !showRaw && (
                <ThinkingProcess steps={thoughtProcess} isStreaming={isStreaming} />
              )}

              {/* AI: Skeleton Loader */}
              {isAi && isStreaming && isTextEmpty && !showRaw && (
                <SkeletonLoader />
              )}

              {/* Content Area */}
              {showRaw ? (
                // Raw Data View
                <pre className="raw-content-view">
                  {rawContent || '(データ受信待機中...)'}
                </pre>
              ) : (
                // Normal Markdown View
                !isTextEmpty && (
                  <MarkdownRenderer
                    content={text || ''}
                    isStreaming={isAi && isStreaming}
                    citations={citations}
                    messageId={uniqueMessageId}
                  />
                )
              )}
            </div>

            {/* AIの場合: 右側にボタン配置 */}
            {isAi && renderCopyButton()}

          </div>

          {/* Footer Area (出典、バッジ、提案) */}
          {isAi && !isStreaming && (
            <div className="message-footer">
              {showCitations && <CitationList citations={citations} messageId={uniqueMessageId} />}
              {showKnowledgeBadge && <AiKnowledgeBadge />}
              <SuggestionButtons suggestions={suggestions} onSuggestionClick={onSuggestionClick} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Deep compare
const arePropsEqual = (prev, next) => {
  const p = prev.message;
  const n = next.message;
  return p.id === n.id
    && p.text === n.text
    && p.rawContent === n.rawContent
    && p.isStreaming === n.isStreaming
    && p.traceMode === n.traceMode
    && p.citations === n.citations
    && p.suggestions === n.suggestions
    && JSON.stringify(p.thoughtProcess) === JSON.stringify(n.thoughtProcess);
};

export default React.memo(MessageBlock, arePropsEqual);