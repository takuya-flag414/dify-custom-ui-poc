// src/components/Artifacts/MermaidPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MermaidViewer from './MermaidViewer';
import { detectMermaidType, MERMAID_DIAGRAM_MAP } from '../../utils/mermaidHelper';
import './ArtifactPanel.css'; // ボタン、ヘッダー、背景などの共通CSSを共有
import './MermaidPanel.css';  // Mermaid専用レイアウトのCSS

// アイコンコンポーネントの定義
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

const DiagramIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
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

const DownloadIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const ImageIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
);

const MoreIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="19" cy="12" r="1"></circle>
        <circle cx="5" cy="12" r="1"></circle>
    </svg>
);

/**
 * MermaidPanel - Mermaidダイアグラム専用表示パネル
 */
const MermaidPanel = ({ isOpen, onClose, artifact, streamingMessage, onSendMessage }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [zoomOffset, setZoomOffset] = useState(0);
    const [panelWidth, setPanelWidth] = useState(0);
    const [viewerError, setViewerError] = useState(null); // レンダリングエラーを保持するステート

    const panelRef = useRef(null);

    // 生成中かどうかのフラグ
    const isGeneratingArtifact = streamingMessage && streamingMessage.isStreaming && streamingMessage.artifact;
    const shouldShowPanel = artifact || isGeneratingArtifact;

    // ストリーミング中または確定済みのコンテンツの取得
    const streamingArtifact = isGeneratingArtifact ? streamingMessage.artifact : null;
    const displayContent = streamingArtifact?.artifact_content || artifact?.content || '';
    const displayTitle = streamingArtifact?.artifact_title || artifact?.title || artifact?.label || '無題のダイアグラム';
    const displayType = streamingArtifact?.artifact_type || artifact?.type || 'mermaid_generic';
    const displayFileName = artifact?.fileName || null; // ファイル名を取得

    // コンテンツが更新された場合、エラー情報をリセットする
    useEffect(() => {
        setViewerError(null);
    }, [displayContent]);

    // ダイアグラム種別の解決 (日本語マッピング)
    let subType = 'generic';
    if (displayType.startsWith('mermaid_')) {
        subType = displayType.substring(8);
    } else {
        subType = detectMermaidType(displayContent);
    }
    const typeInfo = MERMAID_DIAGRAM_MAP[subType] || MERMAID_DIAGRAM_MAP.generic;

    // パネル幅の監視と自動ズーム (Auto Fit)
    useEffect(() => {
        const panelEl = panelRef.current;
        if (!panelEl) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                setPanelWidth(entry.contentRect.width);
            }
        });

        resizeObserver.observe(panelEl);
        return () => resizeObserver.disconnect();
    }, [shouldShowPanel, isOpen]);

    // ウィンドウ幅に応じた最適な拡大率の再計算
    useEffect(() => {
        if (panelWidth === 0) return;

        // パネル左右の余白等を考慮した有効幅
        const availableWidth = panelWidth - 48;
        const baseWidth = 720; // 基準サイズ

        let optimalZoom = Math.floor((availableWidth / baseWidth) * 100);
        let finalZoom = optimalZoom + zoomOffset;

        // ズーム幅を制限 (最小30%〜最大250%)
        finalZoom = Math.max(30, Math.min(250, finalZoom));
        setZoomLevel(finalZoom);
    }, [panelWidth, zoomOffset]);

    // 拡大・縮小・リセット処理
    const handleZoomIn = () => {
        setZoomOffset(prev => Math.min(150, prev + 10));
    };

    const handleZoomOut = () => {
        setZoomOffset(prev => Math.max(-80, prev - 10));
    };

    const handleZoomReset = () => {
        setZoomOffset(0);
    };

    // クリップボードへのコピー処理 (Mermaidコードブロックとしてコピー)
    const handleCopy = async () => {
        if (isCopied) return;
        try {
            const copyText = `# ${displayTitle}\n\n\`\`\`mermaid\n${displayContent}\n\`\`\``;
            await navigator.clipboard.writeText(copyText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('コピーに失敗しました:', err);
        }
    };

    // ダウンロード時のベース名決定処理
    const getDownloadFileName = () => {
        if (displayFileName) {
            // 拡張子（.mmd, .md等）があれば除去したベース名にする
            return displayFileName.replace(/\.[^/.]+$/, "");
        }
        return displayTitle;
    };

    // Markdown形式でのダウンロード処理
    const handleDownloadMarkdown = () => {
        try {
            const baseName = getDownloadFileName();
            const safeTitle = baseName.replace(/[\\/:*?"<>|]/g, '_');
            const fileContent = `# ${displayTitle}\n\n\`\`\`mermaid\n${displayContent}\n\`\`\``;
            const blob = new Blob([fileContent], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safeTitle}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setIsMenuOpen(false);
        } catch (err) {
            console.error('ダウンロードに失敗しました:', err);
        }
    };

    // SVG形式でのダウンロード処理
    const handleDownloadSVG = () => {
        try {
            const svgElement = document.querySelector('.mermaid-panel-content svg');
            if (!svgElement) return;

            // SVGのHTML構造をシリアライズ化して文字列データにする
            const svgString = new XMLSerializer().serializeToString(svgElement);
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const baseName = getDownloadFileName();
            const safeTitle = baseName.replace(/[\\/:*?"<>|]/g, '_');
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safeTitle}.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setIsMenuOpen(false);
        } catch (err) {
            console.error('SVGのダウンロードに失敗しました:', err);
        }
    };

    // 高解像度PNG形式でのダウンロード処理 (3倍サイズ)
    const handleDownloadPNG = () => {
        try {
            const svgElement = document.querySelector('.mermaid-panel-content svg');
            if (!svgElement) return;

            const baseName = getDownloadFileName();
            const safeTitle = baseName.replace(/[\\/:*?"<>|]/g, '_');
            
            // 1. オリジナルのサイズを算出
            const svgRect = svgElement.getBoundingClientRect();
            const viewBox = svgElement.getAttribute('viewBox');
            let width = svgRect.width || 800;
            let height = svgRect.height || 600;
            
            if (viewBox) {
                const parts = viewBox.split(' ');
                if (parts.length === 4) {
                    width = parseFloat(parts[2]);
                    height = parseFloat(parts[3]);
                }
            }

            // 2. スケール係数を設定してCanvasサイズを拡大 (高精細化)
            const scale = 3;
            const canvas = document.createElement('canvas');
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');

            // 3. 背景色は常に白 (Mermaidレンダリングがライト固定であるため)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 4. SVG文字列からImageオブジェクト経由でCanvasに描画
            let svgString = new XMLSerializer().serializeToString(svgElement);
            
            // CORS汚染防止のため、外部リソースへの@importを除外
            svgString = svgString.replace(/@import\s+url\([^)]+\);?/gi, '');

            // Blob URLによるCanvasのCORS汚染を防ぐため、Base64形式のData URIに変換
            const base64Svg = window.btoa(unescape(encodeURIComponent(svgString)));
            const dataUrl = 'data:image/svg+xml;base64,' + base64Svg;

            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // 5. DataURLを生成してダウンロードを実行
                const pngUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = pngUrl;
                a.download = `${safeTitle}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                setIsMenuOpen(false);
            };
            img.src = dataUrl;
        } catch (err) {
            console.error('PNGのダウンロードに失敗しました:', err);
        }
    };

    // AIに修正を依頼する処理
    const handleFixRequest = () => {
        if (!onSendMessage || !viewerError) return;

        const promptText = `生成されたMermaidダイアグラムのレンダリング中に以下のエラーが発生しました。文法を修正し、正しいMermaidコードを再生成してください。

■ 発生したエラーメッセージ：
\`\`\`
${viewerError}
\`\`\`

■ エラーが発生した元のソースコード：
\`\`\`mermaid
${displayContent}
\`\`\`
`;
        onSendMessage(promptText);
    };

    return (
        <AnimatePresence>
            {shouldShowPanel && (
                <motion.div
                    ref={panelRef}
                    className={`artifact-panel mermaid-panel ${isOpen ? 'open' : ''} ${isGeneratingArtifact ? 'ai-generating' : ''}`}
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
                            <div className="artifact-icon">
                                <span style={{ fontSize: '18px' }}>{typeInfo.emoji}</span>
                            </div>
                            <div className="artifact-header-info">
                                <span className="artifact-title" title={displayFileName || displayTitle}>
                                    {displayFileName || displayTitle}
                                    {isGeneratingArtifact && <span className="typing-cursor"></span>}
                                </span>
                                <span className="artifact-type-badge-panel">
                                    {typeInfo.label}
                                    {displayFileName && ` (${displayTitle})`}
                                </span>
                            </div>
                        </div>

                        <div className="artifact-actions">
                            {/* ズームコントロール */}
                            <div className="artifact-zoom-controls">
                                <button className="zoom-btn" onClick={handleZoomOut} title="縮小">
                                    <ZoomOutIcon />
                                </button>
                                <button
                                    className="zoom-label-btn auto-fit-active"
                                    onClick={handleZoomReset}
                                    title="フィット (Auto Fit)"
                                >
                                    {zoomLevel}%
                                </button>
                                <button className="zoom-btn" onClick={handleZoomIn} title="拡大">
                                    <ZoomInIcon />
                                </button>
                            </div>

                            <div style={{ width: 1, height: 20, backgroundColor: 'var(--color-border)', margin: '0 4px' }} />

                            {/* アクションメニュー */}
                            <div className="artifact-action-group">
                                <button
                                    className={`artifact-action-btn primary action-more-btn ${isMenuOpen ? 'active' : ''}`}
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    title="アクション"
                                    disabled={isGeneratingArtifact}
                                >
                                    <MoreIcon />
                                </button>

                                {isMenuOpen && (
                                    <>
                                        <div className="artifact-menu-backdrop" onClick={() => setIsMenuOpen(false)} />
                                        <div className="artifact-actions-menu">
                                            <button className="artifact-menu-item" onClick={handleDownloadMarkdown}>
                                                <DownloadIcon />
                                                <span>Markdown (.md)</span>
                                            </button>
                                            <button className="artifact-menu-item" onClick={handleDownloadSVG}>
                                                <DownloadIcon />
                                                <span>ベクター画像 (.svg)</span>
                                            </button>
                                            <button className="artifact-menu-item" onClick={handleDownloadPNG}>
                                                <ImageIcon />
                                                <span>高画質画像 (.png)</span>
                                            </button>
                                            <div className="artifact-menu-divider" />
                                            <button
                                                className={`artifact-menu-item ${isCopied ? 'copied' : ''}`}
                                                onClick={handleCopy}
                                                disabled={isCopied}
                                            >
                                                {isCopied ? <CheckIcon /> : <CopyIcon />}
                                                <span>{isCopied ? 'コピー完了' : 'コードをコピー'}</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div style={{ width: 1, height: 20, backgroundColor: 'var(--color-border)', margin: '0 4px' }} />

                            <button className="artifact-close-btn" onClick={onClose} title="閉じる">
                                <CloseIcon />
                            </button>
                        </div>
                    </div>

                    {/* ダイアグラムの描画ボディ部 (紙の背景を持たず直接描画) */}
                    <div className="artifact-body mermaid-panel-body" style={{ overflow: 'auto' }}>
                        {viewerError ? (
                            <div className="mermaid-error-panel">
                                <div className="mermaid-error-banner">
                                    <h4 className="mermaid-error-title">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                            <line x1="12" y1="9" x2="12" y2="13"></line>
                                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                        </svg>
                                        レンダリングエラーが発生しました
                                    </h4>
                                    <p className="mermaid-error-desc">
                                        ダイアグラムのレンダリング中にエラーが検出されました。構文（シンタックス）に不整合がある可能性があります。
                                    </p>
                                    <pre className="mermaid-error-details">
                                        <code>{viewerError}</code>
                                    </pre>
                                </div>

                                <div className="mermaid-error-actions">
                                    <button 
                                        className="mermaid-fix-btn"
                                        onClick={handleFixRequest}
                                        title="AIにエラー内容を送信して修正を依頼します"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                        </svg>
                                        AIに修正を依頼する
                                    </button>
                                </div>

                                <div className="mermaid-error-code-section">
                                    <span className="mermaid-error-code-label">対象のソースコード:</span>
                                    <pre className="mermaid-error-code-block">
                                        <code>{displayContent}</code>
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                minWidth: `${720 * (zoomLevel / 100)}px`,
                                display: 'flex',
                                justifyContent: 'center',
                                paddingBottom: '64px',
                                width: '100%'
                            }}>
                                <div
                                    className="mermaid-panel-content"
                                    style={{
                                        transform: `scale(${zoomLevel / 100})`,
                                        transformOrigin: 'top center',
                                        transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <MermaidViewer chartCode={displayContent} onError={setViewerError} />
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MermaidPanel;
