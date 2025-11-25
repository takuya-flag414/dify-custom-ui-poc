// src/components/MessageBlock.jsx
import React from 'react';
import './styles/MessageBlock.css';
import MarkdownRenderer from './MarkdownRenderer';
import CitationList from './CitationList';
import SuggestionButtons from './SuggestionButtons';
import ProcessStatusIndicator from './ProcessStatusIndicator';
import AiKnowledgeBadge from './AiKnowledgeBadge';
import FileIcon from './FileIcon';

export const AssistantIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
  </svg>
);

const MessageBlock = ({ message, onSuggestionClick }) => {
  const { role, text, citations, suggestions, isStreaming, processStatus, files, traceMode, messageId, id } = message;
  const isAi = role === 'ai';
  const uniqueMessageId = messageId || id || `msg_${Date.now()}`;

  // 出典を表示するかどうかの判定
  // searchモード または documentモード、あるいは citations が存在する場合
  const showCitations = (traceMode === 'search' || traceMode === 'document') || (citations && citations.length > 0);

  // 知識バッジを表示するかどうかの判定
  // AI発言かつストリーミング終了後で、知識モードの場合
  const showKnowledgeBadge = isAi && !isStreaming && traceMode === 'knowledge';

  return (
    <div className="message-block">
      <div className={`message-container ${!isAi ? 'message-container-user' : ''}`}>

        <div className={isAi ? 'avatar-ai' : 'avatar-user'}>
          {isAi ? <AssistantIcon /> : 'You'}
        </div>

        <div className={`message-content ${isAi ? 'message-content-ai' : 'message-content-user'}`}>
          <div className={`message-bubble ${isAi ? 'ai-bubble' : 'user-bubble'}`}>

            {/* User: File Attachment */}
            {!isAi && files && files.length > 0 && (
              <div className="file-attachment-chip">
                <FileIcon filename={files[0].name} />
                <span className="file-attachment-name">{files[0].name}</span>
              </div>
            )}

            {/* AI: Status */}
            {isAi && isStreaming && <ProcessStatusIndicator status={processStatus} />}

            {/* Markdown Content */}
            <MarkdownRenderer
              content={text || ''}
              isStreaming={isAi && isStreaming}
              citations={citations}
              messageId={uniqueMessageId}
            />
          </div>

          {/* Footer Area (Outside Bubble) */}
          {isAi && !isStreaming && (
            <>
              {/* Case 1: Citations (Web/Doc) */}
              {showCitations && (
                <CitationList citations={citations} messageId={uniqueMessageId} />
              )}

              {/* Case 2: Knowledge Badge (No Search) */}
              {showKnowledgeBadge && (
                <AiKnowledgeBadge />
              )}

              {/* Suggestions */}
              <SuggestionButtons
                suggestions={suggestions}
                onSuggestionClick={onSuggestionClick}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Deep compare needed for array props to avoid re-renders
const arePropsEqual = (prev, next) => {
  const p = prev.message;
  const n = next.message;
  return p.id === n.id && p.text === n.text && p.isStreaming === n.isStreaming
    && p.processStatus === n.processStatus && p.traceMode === n.traceMode
    && p.citations === n.citations && p.suggestions === n.suggestions;
};

export default React.memo(MessageBlock, arePropsEqual);