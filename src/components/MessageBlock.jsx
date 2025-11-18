// src/components/MessageBlock.jsx
import React from 'react';
import './styles/MessageBlock.css'; // 既存のインポート

import MarkdownRenderer from './MarkdownRenderer';
import CitationList from './CitationList';
import SuggestionButtons from './SuggestionButtons';

/**
 * 1つのQ&Aペアを表示 (5.1)
 * @param {object} message - メッセージオブジェクト
 * @param {function} onSuggestionClick - 提案クリック時に実行する関数
 */
const MessageBlock = ({ message, onSuggestionClick }) => {
  // ★ 修正: isStreaming と citations フラグを message から取り出す
  const { role, text, citations, suggestions, isStreaming } = message;
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

      {/* アイコンと吹き出しを内包するコンテナ */}
      <div
        className={`message-container ${
          isAi ? 'message-container-ai' : 'message-container-user'
        }`}
      >
        {/* アイコン (吹き出しの外) */}
        <div style={{ width: '32px', height: '32px', flexShrink: 0, marginTop: '4px' }}>
          {isAi ? <AssistantIcon /> : <UserIcon />}
        </div>

        {/* コンテンツ本体 (これが吹き出しとなる) */}
        <div
          className={`message-content ${
            isAi ? 'message-content-ai' : 'message-content-user'
          }`}
        >
          {/* 本文 (T-06) */}
          {/* ★ 修正: isStreaming と citations を MarkdownRenderer に渡す */}
          <MarkdownRenderer
            content={text || '...'}
            isStreaming={isAi && isStreaming}
            citations={citations}
          />

          {/* AIの回答の場合のみ、出典と提案を表示 */}
          {isAi && text && !isStreaming && (
            <>
              {/* 出典リスト (T-09) */}
              <CitationList citations={citations} />
              {/* 提案ボタン (T-11) */}
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

// === 🔽 アイコン定義 (変更なし) 🔽 ===

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

// === 🔼 アイコン定義 🔼 ===

export default MessageBlock;