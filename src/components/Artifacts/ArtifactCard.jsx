// src/components/Artifacts/ArtifactCard.jsx
import React from 'react';
import './ArtifactCard.css';

/**
 * artifact_type に応じたアイコンとラベルのマッピング
 */
const ARTIFACT_TYPE_MAP = {
    html_document: { emoji: '📄', label: 'A4ドキュメント' },
    summary_report: { emoji: '📝', label: '要約・レポート' },
    checklist: { emoji: '✅', label: 'チェックリスト' },
    comparison_table: { emoji: '📊', label: '比較表' },
    faq: { emoji: '❓', label: 'FAQ (想定問答集)' },
    meeting_minutes: { emoji: '📋', label: '議事録・Next Action' },
    html_slide: { emoji: '📽️', label: 'プレゼンスライド' },
};

const getTypeInfo = (type) => {
    return ARTIFACT_TYPE_MAP[type] || { emoji: '📄', label: type || 'ドキュメント' };
};

const ChevronRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

/**
 * チャット内に表示される「Artifactへのリンク」カード（仕様書3.2準拠）
 * @param {string} title - artifact_title
 * @param {string} type - artifact_type (summary_report, checklist, etc.)
 * @param {string} content - artifact_content
 * @param {Array} citations - citations配列
 * @param {Function} onClick - クリック時のハンドラ
 */
const ArtifactCard = ({ title, type, content, citations = [], onClick }) => {
    const typeInfo = getTypeInfo(type);

    return (
        <div className="artifact-card" onClick={() => onClick({ title, type, content, citations })}>
            <div className="artifact-icon-box">
                <span className="artifact-type-emoji">{typeInfo.emoji}</span>
            </div>
            <div className="artifact-info">
                <div className="artifact-card-title">{title || 'Untitled'}</div>
                <div className="artifact-card-desc">
                    <span className="artifact-type-badge">{typeInfo.label}</span>
                    クリックして表示
                </div>
            </div>
            <div className="artifact-arrow">
                <ChevronRight />
            </div>
        </div>
    );
};

export default ArtifactCard;