// src/components/SuggestionButtons.jsx
import React from 'react';
import './styles/MessageBlock.css';

/**
 * プロアクティブ提案ボタン (T-11, P-3)
 * @param {Array} suggestions - 提案文字列の配列 (T-11)
 * @param {function} onSuggestionClick - 提案クリック時の処理
 */
const SuggestionButtons = ({ suggestions, onSuggestionClick }) => {
  if (!suggestions || suggestions.length === 0) {
    return null; // 提案がなければ何も表示しない
  }

  // T-03時点のダミー表示
  // TODO: T-11で Dify API (suggested) の形式に合わせて修正
  const dummySuggestions = [
    'APIキーの管理方法は？',
    'エラーハンドリングは？',
  ];

  return (
    <div className="suggestion-buttons">
      <h4 className="suggestion-title">関連する質問</h4>
      {dummySuggestions.map((q, index) => (
        <button
          key={index}
          className="suggestion-button"
          onClick={() => onSuggestionClick(q)} // TODO: T-11で実装
        >
          {q}
        </button>
      ))}
    </div>
  );
};

export default SuggestionButtons;