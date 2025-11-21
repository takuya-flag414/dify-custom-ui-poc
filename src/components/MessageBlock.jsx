// src/components/MessageBlock.jsx
import React from 'react';
import './styles/MessageBlock.css'; 
import MarkdownRenderer from './MarkdownRenderer';
import CitationList from './CitationList';
import SuggestionButtons from './SuggestionButtons';
import ProcessStatusIndicator from './ProcessStatusIndicator';
import FileIcon from './FileIcon'; // ★新規インポート

export const AssistantIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
    </svg>
);

const MessageBlock = ({ message, onSuggestionClick }) => {
  const { role, text, citations, suggestions, isStreaming, processStatus, files } = message;
  const isAi = role === 'ai';

  return (
    <div className="message-block">
      <div className={`message-container ${!isAi ? 'message-container-user' : ''}`}>
        
        <div className={isAi ? 'avatar-ai' : 'avatar-user'}>
          {isAi ? <AssistantIcon /> : 'You'}
        </div>

        <div className={`message-content ${isAi ? 'message-content-ai' : 'message-content-user'}`}>
          
          {/* ★ 修正: FileIcon を使用した添付表示 */}
          {!isAi && files && files.length > 0 && (
             <div className="file-attachment-chip">
                 {/* アイコン自体が白いので、そのまま配置しても青背景と相性が良い */}
                 <FileIcon filename={files[0].name} />
                 <span className="file-attachment-name">{files[0].name}</span>
             </div>
          )}

          {isAi && isStreaming && (
            <ProcessStatusIndicator status={processStatus} />
          )}

          <MarkdownRenderer
            content={text || ''}
            isStreaming={isAi && isStreaming}
            citations={citations}
          />

          {isAi && text && !isStreaming && (
            <>
              <CitationList citations={citations} />
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

export default MessageBlock;