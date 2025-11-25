// src/components/MessageBlock.jsx
import React from 'react';
import './styles/MessageBlock.css';
import MarkdownRenderer from './MarkdownRenderer';
import CitationList from './CitationList';
import SuggestionButtons from './SuggestionButtons';
import ProcessStatusIndicator from './ProcessStatusIndicator';
import FileIcon from './FileIcon';

export const AssistantIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
  </svg>
);

const MessageBlock = ({ message, onSuggestionClick }) => {
  const { role, text, citations, suggestions, isStreaming, processStatus, files, id, messageId } = message;
  const isAi = role === 'ai';

  // メッセージの一意なIDを取得（フォールバック処理付き）
  const uniqueMessageId = messageId || id || `msg_fallback_${Date.now()}_${Math.random()}`;

  return (
    <div className="message-block">
      <div className={`message-container ${!isAi ? 'message-container-user' : ''}`}>

        {/* アバター */}
        <div className={isAi ? 'avatar-ai' : 'avatar-user'}>
          {isAi ? <AssistantIcon /> : 'You'}
        </div>

        {/* コンテンツエリア */}
        <div className={`message-content ${isAi ? 'message-content-ai' : 'message-content-user'}`}>

          {/* ★修正: 全てを包むバブルラッパーを追加 */}
          <div className={`message-bubble ${isAi ? 'ai-bubble' : 'user-bubble'}`}>

            {/* 1. 添付ファイル (User) */}
            {!isAi && files && files.length > 0 && (
              <div className="file-attachment-chip">
                <FileIcon filename={files[0].name} />
                <span className="file-attachment-name">{files[0].name}</span>
              </div>
            )}

            {/* 2. 進捗ステータス (AI) - バブルの中に配置 */}
            {isAi && isStreaming && (
              <ProcessStatusIndicator status={processStatus} />
            )}

            {/* 3. 本文 (Markdown) */}
            <MarkdownRenderer
              content={text || ''}
              isStreaming={isAi && isStreaming}
              citations={citations}
              messageId={uniqueMessageId}
            />
          </div>

          {/* 4. 出典・提案 (バブルの外に配置) */}
          {isAi && text && !isStreaming && (
            <>
              <CitationList citations={citations} messageId={uniqueMessageId} />
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

const arePropsEqual = (prevProps, nextProps) => {
  const prevMsg = prevProps.message;
  const nextMsg = nextProps.message;

  return (
    prevMsg.id === nextMsg.id &&
    prevMsg.text === nextMsg.text &&
    prevMsg.isStreaming === nextMsg.isStreaming &&
    prevMsg.processStatus === nextMsg.processStatus &&
    prevMsg.role === nextMsg.role &&
    // 配列の比較は簡易的に長さチェック＋中身の参照チェックなどが理想だが、
    // ここでは厳密なDeepEqualまではせず、主要なプロパティの変化を見る
    prevMsg.citations === nextMsg.citations && 
    prevMsg.suggestions === nextMsg.suggestions &&
    prevMsg.files === nextMsg.files
  );
};

export default React.memo(MessageBlock, arePropsEqual);