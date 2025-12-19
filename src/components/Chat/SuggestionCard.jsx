// src/components/Chat/SuggestionCard.jsx
import React from 'react';
import './SuggestionCard.css';

/**
 * 機能提案カードコンポーネント
 * onClickが渡されない場合は「表示専用」としてレンダリングします
 */
const SuggestionCard = ({
    icon: Icon,
    title,
    description,
    onClick,
    delay = 0
}) => {
    // onClickがある場合はボタン、なければdivとしてレンダリング
    const Component = onClick ? 'button' : 'div';
    const interactiveClass = onClick ? 'interactive' : '';

    return (
        <Component
            className={`suggestion-card ${interactiveClass}`}
            onClick={onClick}
            style={{ animationDelay: `${delay}ms` }}
            aria-label={`${title}: ${description}`}
            // divの場合はフォーカスを受け取らないようにする
            tabIndex={onClick ? 0 : -1}
        >
            <div className="suggestion-card-icon-wrapper">
                {Icon && <Icon className="suggestion-card-icon" />}
            </div>
            <div className="suggestion-card-content">
                <h3 className="suggestion-card-title">{title}</h3>
                <p className="suggestion-card-desc">{description}</p>
            </div>

            {/* インタラクティブな場合のみ矢印を表示 */}
            {onClick && (
                <div className="suggestion-card-arrow" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </div>
            )}
        </Component>
    );
};

export default SuggestionCard;