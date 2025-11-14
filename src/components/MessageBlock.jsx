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
  const { role, text, citations, suggestions } = message;
  const isAi = role === 'ai';

  return (
    // ★ message-block に役割クラスを追加し、CSSで最大幅を制御しやすくする
    <div
      className={`message-block ${
        isAi ? 'message-block-ai' : 'message-block-user'
      }`}
    >
      {/* ★ 役割ラベルを吹き出しの上に移動 */}
      <div
        className={`message-role ${
          isAi ? 'message-role-ai' : 'message-role-user'
        }`}
      >
        {isAi ? 'AI' : 'あなた'}
      </div>

      {/* コンテンツ本体 (これが吹き出しとなる) */}
      <div
        className={`message-content ${
          isAi ? 'message-content-ai' : 'message-content-user'
        }`}
      >
        {/* 本文 (T-06) */}
        {/* ★ textが空（ストリーミング中）の時の表示を修正 */}
        <MarkdownRenderer content={text || '...'} />

        {/* AIの回答の場合のみ、出典と提案を表示 */}
        {/* ★ AIかつ、本文が生成された後（ストリーミング完了後）にメタデータを表示 */}
        {isAi && text && (
          <>
            {/* 出典リスト (T-09) */}
            <CitationList citations={citations} />
            {/* 提案ボタン (T-11) */}
            <SuggestionButtons
              suggestions={suggestions}
              onSuggestionClick={onSuggestionClick} // ★ T-11対応: console.logからpropsに変更
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBlock;