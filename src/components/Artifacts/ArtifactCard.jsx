// src/components/Artifacts/ArtifactCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import './ArtifactCard.css';

/**
 * artifact_type に応じたアイコンとラベルのマッピング
 */
const ARTIFACT_TYPE_MAP = {
    html_document: { emoji: '📄', label: '印刷可能なA4ドキュメント' },
    json_document: { emoji: '📑', label: '編集可能なA4ドキュメント' },
    summary_report: { emoji: '📝', label: '要約・レポート' },
    checklist: { emoji: '✅', label: 'チェックリスト' },
    comparison_table: { emoji: '📊', label: '比較表' },
    faq: { emoji: '❓', label: 'FAQ (想定問答集)' },
    meeting_minutes: { emoji: '📋', label: '議事録・Next Action' },
    html_slide: { emoji: '📽️', label: '印刷可能なプレゼンスライド' },
    json_slide: { emoji: '🎯', label: 'プレゼンスライド' },
    json_slide_advanced: { emoji: '🎯', label: 'プレゼンスライド' },
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
 * macOS Sequoia & Apple Intelligence デザイン刷新版
 */
const ArtifactCard = ({ title, type, content, citations = [], onClick }) => {
    const typeInfo = getTypeInfo(type);

    return (
        <motion.div
            className="artifact-card"
            onClick={() => onClick({ title, type, content, citations })}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ 
                scale: 1.02, 
                y: -2,
                transition: { type: "spring", stiffness: 400, damping: 25 }
            }}
            whileTap={{ 
                scale: 0.98,
                transition: { type: "spring", stiffness: 500, damping: 30 }
            }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20
            }}
        >
            <div className="artifact-icon-box">
                <span className="artifact-type-emoji">{typeInfo.emoji}</span>
            </div>
            <div className="artifact-info">
                <div className="artifact-card-title">{title || 'Untitled'}</div>
                <div className="artifact-card-desc">
                    <span className="artifact-type-badge">{typeInfo.label}</span>
                    <span>クリックして表示</span>
                </div>
            </div>
            <div className="artifact-arrow">
                <ChevronRight />
            </div>
        </motion.div>
    );
};

export default ArtifactCard;