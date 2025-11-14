// src/components/SuggestionButtons.jsx
import React from 'react';
import './styles/MessageBlock.css';

/**
 * プロアクティブ提案ボタン (T-11, P-3)
 * @param {Array} suggestions - ChatAreaから渡される実データ (文字列配列) [cite: 256-258]
 * @param {function} onSuggestionClick - 提案クリック時の処理 (ChatAreaのhandleSendMessage)
 */
const SuggestionButtons = ({ suggestions, onSuggestionClick }) => {
  // ★ suggestionsが空配列、またはnull/undefinedの場合は何も表示しない
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  // ★ T-03時点のダミー表示を削除 [cite: 328-330]

  return (
    <div className="suggestion-buttons">
      <h4 className="suggestion-title">関連する質問</h4>
      {/* ★ propsで渡された実データ(文字列配列)をmapする [cite: 334] */}
      {suggestions.map((q, index) => (
        <button
          key={index}
          className="suggestion-button"
          onClick={() => onSuggestionClick(q)} // ★ propsで渡された関数を実行 [cite: 341-342]
        >
          {q}
        </button>
      ))}
    </div>
  );
};

export default SuggestionButtons;