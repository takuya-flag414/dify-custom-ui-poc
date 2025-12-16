// src/components/Artifacts/ArtifactCard.jsx
import React from 'react';
import './ArtifactCard.css';

const CodeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
);

const ChevronRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

/**
 * チャット内に表示される「成果物へのリンク」カード
 * @param {string} title - タイトル
 * @param {string} type - コンテンツタイプ (code, html, image...)
 * @param {string} content - プレビューする内容
 * @param {Function} onClick - クリック時のハンドラ
 */
const ArtifactCard = ({ title, type, content, onClick }) => {
    // 本来は type に応じてアイコンを変えますが、まずはCode固定
    const displayType = type === 'code' ? 'Code Snippet' : type.toUpperCase();

    return (
        <div className="artifact-card" onClick={() => onClick({ title, type, content })}>
            <div className="artifact-icon-box">
                <CodeIcon />
            </div>
            <div className="artifact-info">
                <div className="artifact-card-title">{title}</div>
                <div className="artifact-card-desc">クリックして {displayType} を表示</div>
            </div>
            <div className="artifact-arrow">
                <ChevronRight />
            </div>
        </div>
    );
};

export default ArtifactCard;