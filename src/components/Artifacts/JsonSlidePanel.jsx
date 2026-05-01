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

const MonitorIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
);

const JsonSlidePanel = ({ isOpen, onClose, artifact, streamingMessage }) => {
    const isGeneratingArtifact = streamingMessage && streamingMessage.isStreaming && streamingMessage.artifact;
    const shouldShowPanel = artifact || isGeneratingArtifact;

    const streamingArtifact = isGeneratingArtifact ? streamingMessage.artifact : null;
    const displayContent = streamingArtifact?.artifact_content || artifact?.content || '';
    const displayTitle = streamingArtifact?.artifact_title || artifact?.title || artifact?.label || 'プレゼンスライド';

    const [viewMode, setViewMode] = useState('single'); // 'single' | 'list'
    const presentationRef = useRef(null);

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
                                <span className="artifact-type-badge-panel">🎯 プレゼンスライド(JSON)</span>
                            </div>
                        </div>

                        <div className="artifact-actions">
                            <button 
                                className={`artifact-action-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode(prev => prev === 'single' ? 'list' : 'single')} 
                                title={viewMode === 'single' ? "一覧表示" : "単一表示"}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--color-text-secondary)', borderRadius: '6px' }}
                            >
                                <GridIcon />
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

                            <button className="artifact-close-btn" onClick={onClose} title="閉じる">
                                <CloseIcon />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div 
                        className="artifact-body" 
                        ref={presentationRef}
                        style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0', backgroundColor: '#f5f5f7' }}
                    >
                        <PresentationPanel 
                            content={displayContent} 
                            isGenerating={isGeneratingArtifact}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default JsonSlidePanel;
