// src/components/SuggestionButtons.jsx
import React from 'react';
import './styles/MessageBlock.css';

/**
 * プロアクティブ提案ボタン (T-11, P-3)
 * DESIGN_RULE.md: Pill-shaped interactive buttons
 */
const SuggestionButtons = ({ suggestions, onSuggestionClick }) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="suggestion-container">
      <div className="suggestion-label">関連する質問</div>
      <div className="suggestion-list">
        {suggestions.map((q, index) => (
          <button
            key={index}
            className="suggestion-chip"
            onClick={() => onSuggestionClick(q)}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestionButtons;