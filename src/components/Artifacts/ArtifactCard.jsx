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
    mermaid_flowchart: { emoji: '📊', label: '業務フロー図' },
    mermaid_sequence: { emoji: '🔄', label: 'シーケンス連携図' },
    mermaid_class: { emoji: '🏗️', label: '構造設計図' },
    mermaid_state: { emoji: '⚙️', label: '状態遷移図' },
    mermaid_er: { emoji: '🗄️', label: 'データベース設計図' },
    mermaid_gantt: { emoji: '📅', label: 'プロジェクト工程表' },
    mermaid_pie: { emoji: '🍕', label: '割合グラフ' },
    mermaid_journey: { emoji: '🗺️', label: 'カスタマージャーニー' },
    mermaid_git: { emoji: '🌿', label: '履歴管理図' },
    mermaid_mindmap: { emoji: '🧠', label: 'アイデア整理図' },
    mermaid_timeline: { emoji: '⏳', label: 'タイムライン表' },
    mermaid_generic: { emoji: '📊', label: '構成図' },
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
const ArtifactCard = ({ title, type, content, citations = [], fileName, onClick }) => {
    const typeInfo = getTypeInfo(type);
    const displayCardTitle = fileName || title || 'Untitled';

    return (
        <motion.div
            className="artifact-card"
            onClick={() => onClick({ title, type, content, citations, fileName })}
            initial={false} // リマウント時の点滅（初期アニメーション再トリガー）を防止
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
                <div className="artifact-card-title" title={displayCardTitle}>{displayCardTitle}</div>
                <div className="artifact-card-desc">
                    <span className="artifact-type-badge">{typeInfo.label}</span>
                    {fileName && <span className="artifact-type-badge-secondary" style={{ marginLeft: '6px', opacity: 0.8 }}>{title}</span>}
                </div>
            </div>
            <div className="artifact-arrow">
                <ChevronRight />
            </div>
        </motion.div>
    );
};

export default React.memo(ArtifactCard);
