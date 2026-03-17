// src/components/Artifacts/ArtifactPanel.jsx
import React, { useState, useEffect } from 'react';
import MarkdownRenderer from '../Shared/MarkdownRenderer';
import './ArtifactPanel.css';

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const CopyIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const DocIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <line x1="10" y1="9" x2="8" y2="9"></line>
    </svg>
);

/**
 * artifact_type に応じたバッジ表示
 */
const ARTIFACT_TYPE_MAP = {
    summary_report: { emoji: '📋', label: 'レポート' },
    checklist: { emoji: '☑', label: 'チェックリスト' },
    comparison_table: { emoji: '📊', label: '比較表' },
    faq: { emoji: '❓', label: 'FAQ' },
    meeting_minutes: { emoji: '📝', label: '議事録' },
};

const getTypeBadge = (type) => {
    const info = ARTIFACT_TYPE_MAP[type];
    if (info) return `${info.emoji} ${info.label}`;
    return type || 'ドキュメント';
};

/**
 * ArtifactPanel - Artifact表示パネル（仕様書3.2準拠）
 * 
 * Props:
 *   - isOpen: パネルの開閉状態
 *   - onClose: 閉じるボタンのハンドラ
 *   - artifact: { title, type, content, citations }
 */
const ArtifactPanel = ({ isOpen, onClose, artifact }) => {
    const [isCopied, setIsCopied] = useState(false);

    // アーティファクトが切り替わったら状態リセット
    useEffect(() => {
        setIsCopied(false);
    }, [artifact]);

    if (!artifact) return <div className="artifact-panel" />;

    // ★仕様書3.4準拠: # タイトル + 本文 でコピー
    const handleCopy = async () => {
        if (isCopied) return;
        try {
            const copyText = `# ${artifact.title || 'Untitled'}\n\n${artifact.content || ''}`;
            await navigator.clipboard.writeText(copyText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const citations = artifact.citations || [];

    return (
        <div className={`artifact-panel ${isOpen ? 'open' : ''}`}>
            {/* Header */}
            <div className="artifact-header">
                <div className="artifact-title-group">
                    <div className="artifact-icon">
                        <DocIcon />
                    </div>
                    <div className="artifact-header-info">
                        <span className="artifact-title">{artifact.title || 'Untitled Document'}</span>
                        <span className="artifact-type-badge-panel">{getTypeBadge(artifact.type)}</span>
                    </div>
                </div>

                <div className="artifact-actions">
                    <button
                        className={`artifact-action-btn primary ${isCopied ? 'copied' : ''}`}
                        onClick={handleCopy}
                        title="内容をクリップボードにコピー"
                    >
                        {isCopied ? <CheckIcon /> : <CopyIcon />}
                        <span>{isCopied ? 'コピー完了' : 'コピー'}</span>
                    </button>

                    <div style={{ width: 1, height: 20, backgroundColor: 'var(--color-border)', margin: '0 4px' }} />

                    <button className="artifact-close-btn" onClick={onClose} title="閉じる">
                        <CloseIcon />
                    </button>
                </div>
            </div>

            {/* Body: Document Viewer */}
            <div className="artifact-body">
                <div className="artifact-content">
                    <MarkdownRenderer
                        content={artifact.content}
                        isStreaming={false}
                    />
                </div>
            </div>

            {/* Footer: Citations Section（仕様書3.2準拠） */}
            {citations.length > 0 && (
                <div className="artifact-citations-footer">
                    <div className="artifact-citations-header">
                        <span className="artifact-citations-label">📚 出典</span>
                        <span className="artifact-citations-count">{citations.length}件</span>
                    </div>
                    <ul className="artifact-citations-list">
                        {citations.map((cite, idx) => (
                            <li key={cite.id || idx} className="artifact-citation-item">
                                <span className="artifact-citation-number">{idx + 1}</span>
                                <span className="artifact-citation-source">
                                    {cite.url && cite.url !== 'null' ? (
                                        <a href={cite.url} target="_blank" rel="noopener noreferrer">
                                            {cite.source}
                                        </a>
                                    ) : (
                                        cite.source
                                    )}
                                </span>
                                {cite.type && (
                                    <span className={`artifact-citation-type artifact-citation-type-${cite.type}`}>
                                        {cite.type === 'rag' ? '社内' : cite.type === 'web' ? 'Web' : cite.type}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ArtifactPanel;