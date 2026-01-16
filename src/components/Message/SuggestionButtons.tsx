// src/components/Message/SuggestionButtons.tsx
import React from 'react';
import './MessageBlock.css';

/**
 * SuggestionButtons のProps型
 */
interface SuggestionButtonsProps {
    /** 提案リスト */
    suggestions?: string[];
    /** 提案クリック時のコールバック */
    onSuggestionClick: (suggestion: string) => void;
}

/**
 * プロアクティブ提案ボタン (T-11, P-3)
 * DESIGN_RULE.md: Pill-shaped interactive buttons
 */
const SuggestionButtons: React.FC<SuggestionButtonsProps> = ({ suggestions, onSuggestionClick }) => {
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
