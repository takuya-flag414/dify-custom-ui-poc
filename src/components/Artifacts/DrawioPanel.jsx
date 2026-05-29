import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ArtifactPanel.css'; // Reusing generic panel styles
import { getArtifactIcon, getArtifactColor } from '../../utils/artifactIconHelper';

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

const DownloadIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const DrawioPanel = ({ isOpen, onClose, artifact, streamingMessage }) => {
    const [isCopied, setIsCopied] = useState(false);

    const isGeneratingArtifact = streamingMessage && streamingMessage.isStreaming && streamingMessage.artifact;
    const shouldShowPanel = artifact || isGeneratingArtifact;
    
    const streamingArtifact = isGeneratingArtifact ? streamingMessage.artifact : null;
    const displayContent = streamingArtifact?.artifact_content || artifact?.content || '';
    const displayTitle = streamingArtifact?.artifact_title || artifact?.title || artifact?.label || 'Untitled Diagram';

    const handleCopy = async () => {
        if (isCopied) return;
        try {
            await navigator.clipboard.writeText(displayContent);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleDownloadXml = () => {
        try {
            const safeTitle = displayTitle.replace(/[\\/:*?"<>|]/g, '_');
            const blob = new Blob([displayContent], { type: 'application/xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safeTitle}.drawio`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download xml:', err);
        }
    };

    // Draw.io Viewer URL creation using iframe
    const encodedXml = encodeURIComponent(displayContent);
    const viewerUrl = `https://viewer.diagrams.net/?lightbox=1&highlight=0000ff&edit=_blank&layers=1&nav=1&title=#R${encodedXml}`;

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
                    {/* ヘッダーセクション */}
                    <div className="artifact-header">
                        <div className="artifact-title-group">
                            <div className="artifact-icon" style={{ backgroundColor: `${getArtifactColor('drawio')}15` }}>
                                {(() => {
                                    const Icon = getArtifactIcon('drawio');
                                    return <Icon size={20} style={{ color: getArtifactColor('drawio') }} />;
                                })()}
                            </div>
                            <div className="artifact-header-info">
                                <span className="artifact-title" title={displayTitle}>
                                    {displayTitle}
                                    {isGeneratingArtifact && <span className="typing-cursor"></span>}
                                </span>
                                <span className="artifact-type-badge-panel">
                                    業務フロー
                                </span>
                            </div>
                        </div>

                        <div className="artifact-actions">
                            <div className="artifact-action-group">
                                <button className="artifact-action-btn primary" onClick={handleDownloadXml} title="Save XML">
                                    <DownloadIcon />
                                    <span style={{marginLeft: '6px', fontSize: '13px', fontWeight: '500'}}>Save XML</span>
                                </button>
                                <button className={`artifact-action-btn ${isCopied ? 'copied' : ''}`} onClick={handleCopy} disabled={isCopied}>
                                    {isCopied ? <CheckIcon /> : <CopyIcon />}
                                    <span style={{marginLeft: '6px', fontSize: '13px', fontWeight: '500'}}>{isCopied ? 'コピー完了' : 'Copy XML'}</span>
                                </button>
                            </div>

                            <div style={{ width: 1, height: 20, backgroundColor: 'var(--color-border)', margin: '0 4px' }} />

                            <button className="artifact-close-btn" onClick={onClose} title="閉じる">
                                <CloseIcon />
                            </button>
                        </div>
                    </div>
                    
                    {/* ダイアグラム表示ボディ */}
                    <div className="artifact-body" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 0, overflow: 'hidden', backgroundColor: '#ffffff' }}>
                        {displayContent && !isGeneratingArtifact ? (
                            <iframe 
                                src={viewerUrl}
                                width="100%" 
                                height="100%" 
                                frameBorder="0" 
                                title={displayTitle}
                                style={{ display: 'block', flex: 1, width: '100%', height: '100%', border: 'none' }}
                            />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#666' }}>
                                <p>図を生成しています...</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DrawioPanel;
