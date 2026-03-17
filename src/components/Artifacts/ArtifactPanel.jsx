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

const ZoomInIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="11" y1="8" x2="11" y2="14"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
);

const ZoomOutIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
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
 *   - streamingMessage: 現在生成中のAIメッセージ (リアルタイムレンダリング用)
 */
const ArtifactPanel = ({ isOpen, onClose, artifact, streamingMessage }) => {
    const [isCopied, setIsCopied] = useState(false);
    
    // ★追加: ズームとスクロール用の状態管理
    const [zoomLevel, setZoomLevel] = useState(100);
    const [autoFit, setAutoFit] = useState(true);
    const [panelWidth, setPanelWidth] = useState(0);

    // ★追加: 現在のストリーミングメッセージがArtifact生成用かどうかを判定
    const isGeneratingArtifact = streamingMessage && streamingMessage.isStreaming && streamingMessage.artifact;
    
    // 実表示用のデータ（ストリーミング中ならストリーミング文字列を使用）
    const displayContent = isGeneratingArtifact ? streamingMessage.text : (artifact?.content || '');
    const displayTitle = artifact?.title || artifact?.label || 'Untitled Document';
    const displayType = artifact?.type || 'summary_report';
    const displayCitations = artifact?.citations || [];

    // アーティファクトが切り替わったら状態リセット
    useEffect(() => {
        setIsCopied(false);
    }, [artifact?.title, displayContent]);

    // ★追加: パネル幅の監視と自動ズーム (Auto Fit)
    useEffect(() => {
        const panelEl = document.querySelector('.artifact-panel');
        if (!panelEl) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                setPanelWidth(entry.contentRect.width);
            }
        });

        resizeObserver.observe(panelEl);
        return () => resizeObserver.disconnect();
    }, []);

    // ★追加: AutoFitが有効な場合、パネル幅に応じて最適なズームレベルを計算
    useEffect(() => {
        if (!autoFit || panelWidth === 0) return;

        // 用紙の本来の横幅 720px と左右の余白を含めて収まるようにスケール計算
        // パネル幅からスクロールバー分や安全マージン(約40px)を引いた有効幅
        const availableWidth = panelWidth - 40; 
        const basePaperWidth = 720; 
        
        let optimalZoom = Math.floor((availableWidth / basePaperWidth) * 100);
        
        // 最小50%、最大150%程度に制限
        optimalZoom = Math.max(50, Math.min(150, optimalZoom));
        setZoomLevel(optimalZoom);

    }, [panelWidth, autoFit]);

    // ★追加: 手動ズーム操作
    const handleZoomIn = () => {
        setAutoFit(false);
        setZoomLevel(prev => Math.min(200, prev + 10));
    };

    const handleZoomOut = () => {
        setAutoFit(false);
        setZoomLevel(prev => Math.max(30, prev - 10));
    };

    const handleZoomReset = () => {
        setAutoFit(true);
    };

    // ★変更: artifactもストリーミングメッセージもない場合は何も表示しない
    if (!artifact && !isGeneratingArtifact) return <div className="artifact-panel" />;

    // ★仕様書3.4準拠: # タイトル + 本文 でコピー
    const handleCopy = async () => {
        if (isCopied) return;
        try {
            const copyText = `# ${displayTitle}\n\n${displayContent}`;
            await navigator.clipboard.writeText(copyText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const citations = displayCitations;

    return (
        <div className={`artifact-panel ${isOpen ? 'open' : ''}`}>
            {/* Header */}
            <div className="artifact-header">
                <div className="artifact-title-group">
                    <div className="artifact-icon">
                        <DocIcon />
                    </div>
                    <div className="artifact-header-info">
                        <span className="artifact-title">
                            {displayTitle}
                            {isGeneratingArtifact && <span className="typing-cursor"></span>}
                        </span>
                        <span className="artifact-type-badge-panel">{getTypeBadge(displayType)}</span>
                    </div>
                </div>

                <div className="artifact-actions">
                    {/* ★追加: Zoom Controls */}
                    <div className="artifact-zoom-controls">
                        <button className="zoom-btn" onClick={handleZoomOut} title="縮小">
                            <ZoomOutIcon />
                        </button>
                        <button 
                            className={`zoom-label-btn ${autoFit ? 'auto-fit-active' : ''}`} 
                            onClick={handleZoomReset} 
                            title="ウィンドウ幅に合わせる (Auto Fit)"
                        >
                            {zoomLevel}%
                        </button>
                        <button className="zoom-btn" onClick={handleZoomIn} title="拡大">
                            <ZoomInIcon />
                        </button>
                    </div>

                    <div style={{ width: 1, height: 20, backgroundColor: 'var(--color-border)', margin: '0 4px' }} />

                    <button
                        className={`artifact-action-btn primary ${isCopied ? 'copied' : ''}`}
                        onClick={handleCopy}
                        title="内容をクリップボードにコピー"
                        disabled={isGeneratingArtifact} // 生成中はコピーボタンを無効化
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

            {/* Body: Document Viewer with Scale Wrapper */}
            <div className="artifact-body" style={{ overflow: 'auto' }}>
                {/* 
                  ★追加: スクロール領域を確保するためのプレースホルダーラッパー 
                  scaleをかけると要素の実寸（レイアウト計算上の占有サイズ）は変わらないため、
                  親要素にスケール後のピクセル幅をminWidthとして与えることで正しくスクロールバーを出す。
                */}
                <div style={{ 
                    minWidth: `${720 * (zoomLevel / 100)}px`, 
                    display: 'flex', 
                    justifyContent: 'center',
                    paddingBottom: '64px' // 下部余白
                }}>
                    <div 
                        className="artifact-content" 
                        style={{ 
                            transform: `scale(${zoomLevel / 100})`, 
                            transformOrigin: 'top center',
                            transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
                        }}
                    >
                        <MarkdownRenderer
                            content={displayContent}
                            isStreaming={isGeneratingArtifact}
                        />
                    </div>
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