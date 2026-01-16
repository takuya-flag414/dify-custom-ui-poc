// src/components/Message/AiKnowledgeBadge.tsx
import React from 'react';
import './AiKnowledgeBadge.css';

/**
 * Sparklesアイコンコンポーネント
 */
const SparklesIcon: React.FC = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L14.4 7.2L20 9.6L14.4 12L12 17.2L9.6 12L4 9.6L9.6 7.2L12 2Z" />
    </svg>
);

/**
 * AIナレッジバッジコンポーネント
 * AIが自身の知識ベースのみで回答したことを示すバッジ
 */
const AiKnowledgeBadge: React.FC = () => {
    return (
        <div className="knowledge-badge-container">
            <div className="knowledge-badge-icon">
                <SparklesIcon />
            </div>
            <span className="knowledge-badge-text">
                Web検索を用いず、AIの知識ベースで回答しました
            </span>
        </div>
    );
};

export default AiKnowledgeBadge;
