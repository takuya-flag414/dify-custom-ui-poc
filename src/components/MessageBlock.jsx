// src/components/MessageBlock.jsx
import React from 'react';
import './styles/MessageBlock.css'; 

import MarkdownRenderer from './MarkdownRenderer';
import CitationList from './CitationList';
import SuggestionButtons from './SuggestionButtons';
import ProcessStatusIndicator from './ProcessStatusIndicator';

/**
 * 1つのQ&Aペアを表示
 */
const MessageBlock = ({ message, onSuggestionClick }) => {
  // ★ files を分割代入
  const { role, text, citations, suggestions, isStreaming, processStatus, files } = message;
  const isAi = role === 'ai';

  return (
    <div
      className={`message-block ${
        isAi ? 'message-block-ai' : 'message-block-user'
      }`}
    >
      {/* 役割ラベル */}
      <div
        className={`message-role ${
          isAi ? 'message-role-ai' : 'message-role-user'
        }`}
      >
        {isAi ? 'AI' : 'あなた'}
      </div>

      {/* メッセージコンテナ */}
      <div
        className={`message-container ${
          isAi ? 'message-container-ai' : 'message-container-user'
        }`}
      >
        {/* アイコン */}
        <div style={{ width: '32px', height: '32px', flexShrink: 0, marginTop: '4px' }}>
          {isAi ? <AssistantIcon /> : <UserIcon />}
        </div>

        {/* コンテンツ本体 */}
        <div
          className={`message-content ${
            isAi ? 'message-content-ai' : 'message-content-user'
          }`}
        >
          
          {/* ★ 追加: 添付ファイル表示 (ユーザー側) */}
          {!isAi && files && files.length > 0 && (
             <div className="message-file-attachment" style={{
                 display: 'inline-flex',
                 alignItems: 'center',
                 marginBottom: '8px',
                 padding: '6px 10px',
                 backgroundColor: 'rgba(255, 255, 255, 0.2)',
                 borderRadius: '6px',
                 fontSize: '0.9rem',
                 border: '1px solid rgba(255,255,255,0.3)'
             }}>
                 <span style={{ marginRight: '6px' }}>📄</span>
                 {files[0].name}
             </div>
          )}

          {/* プロセスインジケーター */}
          {isAi && isStreaming && (
            <ProcessStatusIndicator status={processStatus} />
          )}

          {/* 本文 */}
          <MarkdownRenderer
            content={text || ''}
            isStreaming={isAi && isStreaming}
            citations={citations}
          />

          {/* AIの回答の場合のみ、出典と提案を表示 */}
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

// === アイコン定義 (変更なし) ===
const UserIcon = () => (
    <div style={{
        display: 'flex',
        width: '32px',
        height: '32px',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        backgroundColor: '#2563EB',
        color: 'white',
        fontSize: '0.875rem',
        fontWeight: 'bold'
    }}>
        You
    </div>
);

export const AssistantIcon = () => (
    <div style={{
        display: 'flex',
        width: '32px',
        height: '32px',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        backgroundColor: '#1F2937',
        color: 'white',
        padding: '4px'
    }}>
        <LogoIcon />
    </div>
);

const LogoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
    </svg>
);

export default MessageBlock;