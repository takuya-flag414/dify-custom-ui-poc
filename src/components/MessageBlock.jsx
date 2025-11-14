// src/components/MessageBlock.jsx
import React from 'react';
import './styles/MessageBlock.css';

import MarkdownRenderer from './MarkdownRenderer';
import CitationList from './CitationList';
import SuggestionButtons from './SuggestionButtons';

/**
 * 1つのQ&Aペアを表示 (5.1)
 * @param {object} message - メッセージオブジェクト
 */
const MessageBlock = ({ message }) => {
  const { role, text, citations, suggestions } = message;
  const isAi = role === 'ai';

  return (
    <div className="message-block">
      {/* 役割ラベル */}
      <div
        className={`message-role ${
          isAi ? 'message-role-ai' : 'message-role-user'
        }`}
      >
        {isAi ? 'AI' : 'あなた'}
      </div>

      {/* コンテンツ本体 */}
      <div
        className={`message-content ${
          isAi ? 'message-content-ai' : 'message-content-user'
        }`}
      >
        {/* 本文 (T-06) */}
        <MarkdownRenderer content={text || '(回答を生成中...)'} />

        {/* AIの回答の場合のみ、出典と提案を表示 */}
        {isAi && (
          <>
            {/* 出典リスト (T-09) */}
            <CitationList citations={citations} />
            {/* 提案ボタン (T-11) */}
            <SuggestionButtons
              suggestions={suggestions}
              onSuggestionClick={(q) => console.log('Suggestion clicked:', q)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBlock;