import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PresentationPanel from './JsonSlide/PresentationPanel';
import './ArtifactPanel.css'; // スタイルはArtifactPanelと共有

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
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

const GridIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
);

const PencilIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const MonitorIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
);

const DownloadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const JsonSlidePanel = ({ isOpen, onClose, artifact, streamingMessage }) => {
    const isGeneratingArtifact = streamingMessage && streamingMessage.isStreaming && streamingMessage.artifact;
    const shouldShowPanel = artifact || isGeneratingArtifact;

    const streamingArtifact = isGeneratingArtifact ? streamingMessage.artifact : null;
    const displayContent = streamingArtifact?.artifact_content || artifact?.content || '';
    const displayTitle = streamingArtifact?.artifact_title || artifact?.title || artifact?.label || 'プレゼンスライド';

    const [viewMode, setViewMode] = useState('single'); // 'single' | 'list'
    const [isExporting, setIsExporting] = useState(false);
    const presentationRef = useRef(null);
    const presentationApiRef = useRef(null);

    const handleFullscreen = async () => {
        if (!presentationRef.current) return;
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await presentationRef.current.requestFullscreen();
            }
        } catch (err) {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        }
    };

    const handleExport = () => {
        if (presentationApiRef.current) {
            presentationApiRef.current.handleExportPPTX();
        }
    };

    return (
        <AnimatePresence>
            {shouldShowPanel && (
                <motion.div
                    className={`artifact-panel ${isOpen ? 'open' : ''} ${isGeneratingArtifact ? 'ai-generating' : ''}`}
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: isOpen ? 0 : '100%', opacity: isOpen ? 1 : 0 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{
                        type: 'spring',
                        stiffness: 250,
                        damping: 25,
                        mass: 1
                    }}
                >
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
                                <span className="artifact-type-badge-panel">🎯 プレゼンスライド</span>
                            </div>
                        </div>

                        <div className="artifact-actions">
                            {/* 一覧表示ボタン */}
                            <button 
                                className={`artifact-action-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode(prev => prev === 'single' ? 'list' : 'single')} 
                                title={viewMode === 'single' ? "一覧表示" : "単一表示"}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--color-text-secondary)', borderRadius: '6px' }}
                            >
                                <GridIcon />
                            </button>

                            {/* 編集ボタン */}
                            <button
                                className={`artifact-action-btn ${viewMode === 'edit' ? 'active' : ''}`}
                                onClick={() => setViewMode('edit')}
                                title="フォームで編集"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: viewMode === 'edit' ? 'rgba(0,122,255,0.1)' : 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '6px 10px',
                                    color: viewMode === 'edit' ? '#007aff' : 'var(--color-text-secondary)',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    fontFamily: 'inherit',
                                }}
                            >
                                <PencilIcon />
                                <span style={{ fontSize: '13px' }}>編集</span>
                            </button>

                            <button 
                                className="artifact-action-btn"
                                onClick={handleFullscreen} 
                                title="スライドショー（全画面表示）"
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--color-text-secondary)', borderRadius: '6px' }}
                            >
                                <MonitorIcon />
                            </button>

                            <div style={{ width: 1, height: 20, backgroundColor: 'var(--color-border)', margin: '0 8px' }} />

                            {/* PPTXエクスポートボタン (Appleスタイル) */}
                            <button
                                className="pptx-export-button"
                                onClick={handleExport}
                                disabled={isExporting}
                                title="PowerPoint形式でエクスポート"
                            >
                                {isExporting ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span className="export-loading-dot"></span>
                                        エクスポート中...
                                    </span>
                                ) : (
                                    <>
                                        <DownloadIcon />
                                        PPTX
                                    </>
                                )}
                            </button>

                            <div style={{ width: 1, height: 20, backgroundColor: 'var(--color-border)', margin: '0 8px' }} />

                            <button className="artifact-close-btn" onClick={onClose} title="閉じる">
                                <CloseIcon />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div 
                        className="artifact-body artifact-presentation-body" 
                        ref={presentationRef}
                        style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0' }}
                    >
                        <PresentationPanel 
                            ref={presentationApiRef}
                            content={displayContent} 
                            isGenerating={isGeneratingArtifact}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            onExportStatusChange={setIsExporting}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default JsonSlidePanel;
