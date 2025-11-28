// src/components/MessageBlock.jsx
import React from 'react';
import './styles/MessageBlock.css';
import MarkdownRenderer from './MarkdownRenderer';
import CitationList from './CitationList';
import SuggestionButtons from './SuggestionButtons';
// import ProcessStatusIndicator from './ProcessStatusIndicator'; // 削除またはコメントアウト
import ThinkingProcess from './ThinkingProcess'; // ★ New
import SkeletonLoader from './SkeletonLoader';   // ★ New
import AiKnowledgeBadge from './AiKnowledgeBadge';
import FileIcon from './FileIcon';

export const AssistantIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
  </svg>
);

const MessageBlock = ({ message, onSuggestionClick }) => {
  const {
    role,
    text,
    citations,
    suggestions,
    isStreaming,
    thoughtProcess, // ★ useChatから受け取る配列
    files,
    traceMode,
    messageId,
    id
  } = message;

  const isAi = role === 'ai';
  const uniqueMessageId = messageId || id || `msg_${Date.now()}`;

  // テキストがまだ空かどうか
  const isTextEmpty = !text || text.length === 0;

  // 出典を表示するかどうかの判定
  const showCitations = (traceMode === 'search' || traceMode === 'document') || (citations && citations.length > 0);

  // 知識バッジを表示するかどうかの判定
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

            {/* AI: Plan A+ Thinking Process Timeline */}
            {isAi && thoughtProcess && thoughtProcess.length > 0 && (
              <ThinkingProcess steps={thoughtProcess} isStreaming={isStreaming} />
            )}

            {/* AI: Plan B Skeleton Loader (思考中またはテキスト生成開始直前) */}
            {isAi && isStreaming && isTextEmpty && (
              <SkeletonLoader />
            )}

            {/* Markdown Content (テキストがある場合のみ表示) */}
            {!isTextEmpty && (
              <MarkdownRenderer
                content={text || ''}
                isStreaming={isAi && isStreaming}
                citations={citations}
                messageId={uniqueMessageId}
              />
            )}

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

// Deep compare
const arePropsEqual = (prev, next) => {
  const p = prev.message;
  const n = next.message;
  return p.id === n.id
    && p.text === n.text
    && p.isStreaming === n.isStreaming
    && p.traceMode === n.traceMode
    && p.citations === n.citations
    && p.suggestions === n.suggestions
    // 思考プロセスの差分比較を追加
    && JSON.stringify(p.thoughtProcess) === JSON.stringify(n.thoughtProcess);
};

export default React.memo(MessageBlock, arePropsEqual);