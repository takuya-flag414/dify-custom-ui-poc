import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JsonDocRenderer from './JsonDocument/JsonDocRenderer';
import JsonDocFormEditor from './JsonDocument/JsonDocFormEditor';
import usePagination from './JsonDocument/utils/usePagination';
import { DocxExportEngine } from '../../utils/docx/engine';
import GeneratingAnimation from './GeneratingArtifact';
import './ArtifactPanel.css';
import './JsonDocument/styles/JsonDocument.css';
import './JsonDocument/styles/JsonDocEditor.css';

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

const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
    </svg>
);

const EyeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const ZoomInIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="11" y1="8" x2="11" y2="14"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
);

const ZoomOutIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
);

const FitIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 3 21 3 21 9"></polyline>
        <polyline points="9 21 3 21 3 15"></polyline>
        <line x1="21" y1="3" x2="14" y2="10"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
    </svg>
);

const DownloadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

/**
 * JsonDocumentPanel
 * 構造化されたJSONデータに基づき、A4ドキュメントを表示・編集するパネルです。
 */
const JsonDocumentPanel = ({ isOpen, onClose, artifact, streamingMessage, updateMessage }) => {
    const isGeneratingArtifact = streamingMessage && streamingMessage.isStreaming && streamingMessage.artifact;
    const shouldShowPanel = artifact || isGeneratingArtifact;

    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);
    const [localBlocks, setLocalBlocks] = useState([]);
    const [localMeta, setLocalMeta] = useState(null);
    const [scale, setScale] = useState(1.0);
    const [isExportingWord, setIsExportingWord] = useState(false);
    const containerRef = React.useRef(null);

    const { pages } = usePagination(localBlocks, localMeta);

    const handleDownloadDocx = async () => {
        if (!pages || pages.length === 0) return;
        try {
            setIsExportingWord(true);
            const engine = new DocxExportEngine();
            await engine.export(pages, displayTitle, localMeta);
        } catch (err) {
            console.error('Word export failed:', err);
            alert('Wordエクスポートに失敗しました。');
        } finally {
            setIsExportingWord(false);
        }
    };

    const streamingArtifact = isGeneratingArtifact ? streamingMessage.artifact : null;
    const rawContent = streamingArtifact?.artifact_content || artifact?.content;
    const displayTitle = streamingArtifact?.artifact_title || artifact?.title || artifact?.label || 'Wordドキュメント';

    // ズーム制御
    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
    const handleAutoFit = () => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.clientWidth - 80; // 左右パディング考慮
            const docWidth = 794; // JsonDocument.css の --doc-page-width に合わせる
            const newScale = containerWidth / docWidth;
            setScale(Math.min(newScale, 1.2)); // 最大 120%
        }
    };

    // 初期表示時およびモード切替時にオートフィット
    useEffect(() => {
        if (isOpen) {
            setTimeout(handleAutoFit, 300); // アニメーション完了待ち
        }
    }, [isOpen, isEditMode]);

    // 初期化 & 同期
    // ※ 生成中 (isGeneratingArtifact) は常に最新のデータを反映させる
    // ※ 完了後は、データが未初期化の場合のみ外部からの入力を受け入れる
    useEffect(() => {
        if (rawContent && (localBlocks.length === 0 || isGeneratingArtifact)) {
            let content = { blocks: [], meta: {} };
            if (typeof rawContent === 'string') {
                try {
                    content = JSON.parse(rawContent);
                } catch (e) {
                    content = { blocks: [{ type: 'rich_text', text: rawContent }], meta: {} };
                }
            } else {
                content = rawContent;
            }
            setLocalBlocks(content.blocks || []);
            setLocalMeta(content.meta || null);
        }
    }, [rawContent, isGeneratingArtifact]);

    // ブロック更新
    const handleUpdateBlock = (index, updatedBlock) => {
        const newBlocks = [...localBlocks];
        newBlocks[index] = updatedBlock;
        setLocalBlocks(newBlocks);

        // 親（メッセージ）へ保存
        if (updateMessage && artifact) {
            updateMessage(artifact.messageId, {
                artifact_content: JSON.stringify({ 
                    blocks: newBlocks,
                    meta: localMeta
                })
            });
        }
    };

    return (
        <AnimatePresence>
            {isEditMode && isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 999
                    }}
                />
            )}
            {shouldShowPanel && (
                <motion.div
                    className={`artifact-panel ${isOpen ? 'open' : ''} ${isGeneratingArtifact ? 'ai-generating' : ''} ${isEditMode ? 'edit-mode' : ''}`}
                    initial={isEditMode ? { opacity: 0, scale: 0.95, x: "-50%", y: "-45%" } : { x: '100%', opacity: 0 }}
                    animate={
                        isEditMode 
                            ? { opacity: 1, scale: 1, x: "-50%", y: "-50%" } 
                            : { x: isOpen ? 0 : '100%', opacity: isOpen ? 1 : 0, scale: 1, y: 0 }
                    }
                    exit={isEditMode ? { opacity: 0, scale: 0.95, x: "-50%", y: "-45%" } : { x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 250, damping: 25, mass: 1 }}
                    style={{ display: 'flex', flexDirection: 'column' }}
                >
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
                                <span className="artifact-type-badge-panel">📑 Wordドキュメント</span>
                            </div>
                        </div>

                        <div className="artifact-actions">
                            <div className="artifact-zoom-controls">
                                <button className="zoom-btn" onClick={handleZoomOut} title="縮小"><ZoomOutIcon /></button>
                                <button className="zoom-label-btn" onClick={() => setScale(1.0)} title="リセット">{Math.round(scale * 100)}%</button>
                                <button className="zoom-btn" onClick={handleZoomIn} title="拡大"><ZoomInIcon /></button>
                                <button className="zoom-btn" onClick={handleAutoFit} title="自動フィット" style={{ marginLeft: '4px' }}><FitIcon /></button>
                            </div>
                            <div className="artifact-action-divider"></div>
                            <button 
                                className="artifact-action-btn primary"
                                onClick={handleDownloadDocx}
                                disabled={isExportingWord || isGeneratingArtifact}
                                title="Word (.docx) としてダウンロード"
                            >
                                <DownloadIcon />
                                <span>{isExportingWord ? 'Word出力中...' : 'Word出力'}</span>
                            </button>
                            <button 
                                className={`artifact-action-btn ${isEditMode ? 'active' : ''}`}
                                onClick={() => setIsEditMode(!isEditMode)}
                                title={isEditMode ? "プレビューモード" : "編集モード"}
                            >
                                {isEditMode ? <EyeIcon /> : <EditIcon />}
                                <span>{isEditMode ? 'プレビュー' : '編集'}</span>
                            </button>
                            <button className="artifact-close-btn" onClick={onClose} title="閉じる">
                                <CloseIcon />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                        <div 
                            ref={containerRef}
                            className="artifact-body json-doc-container" 
                            style={{ 
                                flex: 1, 
                                display: 'flex', 
                                justifyContent: 'center', 
                                padding: isEditMode ? '40px 40px 100px' : '32px 0' 
                            }}
                        >
                            {isGeneratingArtifact && localBlocks.length === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                                    <GeneratingAnimation style={{ width: '256px', height: 'auto', opacity: 0.8 }} />
                                    <div style={{ marginTop: '32px', color: '#6b7280', fontWeight: 500, letterSpacing: '0.1em', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span className="export-loading-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#007aff', animation: 'pulse 1.5s infinite' }}></span>
                                        ドキュメントを構成中...
                                    </div>
                                </div>
                            ) : (
                                <div style={{ 
                                    width: '100%', 
                                    maxWidth: 'none', // ズーム時は制限解除
                                    transform: `scale(${scale})`,
                                    transformOrigin: 'top center',
                                    transition: 'transform 0.2s ease-out'
                                }}>
                                    <JsonDocRenderer 
                                        blocks={localBlocks} 
                                        meta={localMeta}
                                        title={displayTitle}
                                        isGenerating={isGeneratingArtifact}
                                        isEditMode={isEditMode}
                                        selectedBlockIndex={selectedBlockIndex}
                                        onBlockClick={setSelectedBlockIndex}
                                    />
                                </div>
                            )}
                        </div>

                        {isEditMode && (
                            <JsonDocFormEditor 
                                blocks={localBlocks}
                                selectedIndex={selectedBlockIndex}
                                onUpdateBlock={handleUpdateBlock}
                            />
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default JsonDocumentPanel;
