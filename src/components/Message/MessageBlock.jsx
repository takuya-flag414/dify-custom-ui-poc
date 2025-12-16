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

const MessageBlock = ({ message, onSuggestionClick, className, style, onOpenArtifact }) => {
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

  // ★変更: FastモードでもデフォルトではRaw表示にしない
  // ユーザーが明示的にボタンを押した時のみ生データ(JSON/Raw)を表示する
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    // ストリーミング終了時にRawモードを解除（通常表示に戻す）
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
    <div className={`message-block ${className || ''}`} style={style}>
      <div className={`message-container ${!isAi ? 'message-container-user' : ''} group`}>

        <div className={isAi ? 'avatar-ai' : 'avatar-user'}>
          {isAi ? <AssistantIcon /> : 'You'}
        </div>

        <div className={`message-content ${isAi ? 'message-content-ai' : 'message-content-user'}`}>

          <div className="message-bubble-row">
            {!isAi && renderCopyButton()}

            <div className={`message-bubble ${isAi ? 'ai-bubble' : 'user-bubble'}`}>
              {/* Rawボタン: Fastモード以外でもデバッグ用に表示しても良いが、要件に従い調整可。ここでは全モードで有効化しておく */}
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

              {/* 思考プロセスは常に表示 */}
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
                    // ★追加: Fastモードなら 'realtime'、それ以外は 'normal' を指定
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
    </div>
  );
};

const arePropsEqual = (prev, next) => {
  const p = prev.message;
  const n = next.message;

  if (prev.className !== next.className || JSON.stringify(prev.style) !== JSON.stringify(next.style)) {
    return false;
  }

  return p.id === n.id
    && p.text === n.text
    && p.rawContent === n.rawContent
    && p.isStreaming === n.isStreaming
    && p.traceMode === n.traceMode
    && p.citations === n.citations
    && p.suggestions === n.suggestions
    && JSON.stringify(p.thoughtProcess) === JSON.stringify(n.thoughtProcess)
    && JSON.stringify(p.files) === JSON.stringify(n.files);
};

export default React.memo(MessageBlock, arePropsEqual);