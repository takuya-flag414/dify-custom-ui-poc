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

// ★追加: 完了アイコン
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

const ArtifactPanel = ({ isOpen, onClose, artifact }) => {
    // ★追加: コピー状態管理
    const [isCopied, setIsCopied] = useState(false);

    // アーティファクトが切り替わったら状態リセット
    useEffect(() => {
        setIsCopied(false);
    }, [artifact]);

    if (!artifact) return <div className="artifact-panel" />;

    const handleCopy = async () => {
        if (isCopied) return;
        try {
            await navigator.clipboard.writeText(artifact.content);
            setIsCopied(true);
            // 2秒後に戻す
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className={`artifact-panel ${isOpen ? 'open' : ''}`}>
            {/* Header */}
            <div className="artifact-header">
                <div className="artifact-title-group">
                    <div className="artifact-icon">
                        <DocIcon />
                    </div>
                    <div className="artifact-info">
                        <span className="artifact-title">{artifact.title || 'Untitled Document'}</span>
                        <span className="artifact-meta">{artifact.type || 'MARKDOWN'}</span>
                    </div>
                </div>

                <div className="artifact-actions">
                    {/* ★修正: コピーボタンに状態反映 */}
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
        </div>
    );
};

export default ArtifactPanel;