import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownRenderer from '../Shared/MarkdownRenderer';
// import html2pdf from 'html2pdf.js';
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

const PrintIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
);

const ChevronIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const DownloadIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const MoreIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="19" cy="12" r="1"></circle>
        <circle cx="5" cy="12" r="1"></circle>
    </svg>
);

/* ★追加: 出典アイコン */
const LinkIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
);

const SourceIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 7 4 4 20 4 20 7"></polyline>
        <line x1="9" y1="20" x2="15" y2="20"></line>
        <line x1="12" y1="4" x2="12" y2="20"></line>
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
    const [isCitationsExpanded, setIsCitationsExpanded] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // ★追加: ズームとスクロール用の状態管理
    const [zoomLevel, setZoomLevel] = useState(100);
    const [autoFit, setAutoFit] = useState(true);
    const [panelWidth, setPanelWidth] = useState(0);

    // ★追加: PDFエクスポート用の状態と参照
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    
    // ★追加: Wordエクスポート用の状態
    const [isExportingWord, setIsExportingWord] = useState(false);
    
    const hiddenExportRef = useRef(null);

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

    // ★変更: AnimatePresence でラップするため、ここで null を返すのではなく、
    // アニメーションの完了を待機できるようにレンダリングツリー内に条件分岐を持っていく
    // if (!artifact && !isGeneratingArtifact) return <div className="artifact-panel" />;

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

    // ★追加: 印刷処理
    const handlePrint = () => {
        window.print();
    };

    // ★追加: Markdown ダウンロード処理
    const handleDownloadMarkdown = () => {
        try {
            // ファイル名に使えない文字をアンダースコアに置換
            const safeTitle = displayTitle.replace(/[\\/:*?"<>|]/g, '_');
            const blob = new Blob([displayContent], { type: 'text/markdown;charset=utf-8' });
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
            console.error('Failed to download markdown:', err);
        }
    };

    // ★追加: PDF ダウンロード処理
    /*
    const handleDownloadPDF = async () => {
        if (!hiddenPdfRef.current) return;
        try {
            setIsExportingPDF(true);
            setIsMenuOpen(false);

            const safeTitle = displayTitle.replace(/[\\/:*?"<>|]/g, '_');
            
            const opt = {
                margin:       15,
                filename:     `${safeTitle}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, letterRendering: true, windowWidth: 800 },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(hiddenPdfRef.current).save();
        } catch (err) {
            console.error('Failed to download PDF:', err);
            alert("PDFエクスポートに失敗しました。");
        } finally {
            setIsExportingPDF(false);
        }
    };
    */

    // ★追加: Word ダウンロード処理 (CDNのhtml-docx-js利用)
    const handleDownloadWord = async () => {
        if (!hiddenExportRef.current) return;
        try {
            setIsExportingWord(true);
            setIsMenuOpen(false);

            // 1. html-docx-js のCDN動的読み込み
            if (typeof window.htmlDocx === 'undefined') {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    // jsdelivrのCDNから古いhtml-docx-jsをグローバルとして読み込む
                    script.src = 'https://cdn.jsdelivr.net/npm/html-docx-js@0.3.1/dist/html-docx.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            const safeTitle = displayTitle.replace(/[\\/:*?"<>|]/g, '_');
            
            // 2. 隠しDOM内の MarkdownRenderer の出力コンテンツ(.pdf-content)のみを取得
            // (外側のラッパーや不要なタイトル要素 <h1> を含めない)
            const contentContainer = hiddenExportRef.current.querySelector('.pdf-content');
            if (!contentContainer) {
                throw new Error("Content container not found");
            }

            // DOMをクローンしてWord用に加工する
            const cloneNode = contentContainer.cloneNode(true);

            // [加工処理 ⓪] 最初のH1要素を除去 (document-titleとの二重表示を防ぐ)
            const firstH1 = cloneNode.querySelector('h1');
            if (firstH1) {
                firstH1.remove();
            }

            // [加工処理]
            // ① Table要素のスタイリング (Wordで罫線が表示されるように属性を付与)
            const tables = cloneNode.querySelectorAll('table');
            tables.forEach(table => {
                table.setAttribute('border', '1');
                table.setAttribute('cellspacing', '0');
                table.setAttribute('cellpadding', '5');
                table.style.borderCollapse = 'collapse';
                table.style.width = '100%';
                table.style.marginBottom = '12px';
                
                const thItems = table.querySelectorAll('th');
                thItems.forEach(th => {
                    th.style.backgroundColor = '#f0f0f0';
                    th.style.fontWeight = 'bold';
                    th.style.padding = '6px';
                });

                const tdItems = table.querySelectorAll('td');
                tdItems.forEach(td => {
                    td.style.padding = '6px';
                });
            });

            // ② 太字 (strong, b) 要素がWordでも機能するようフォントウェイトをインライン化
            const strongItems = cloneNode.querySelectorAll('strong, b');
            strongItems.forEach(item => {
                item.style.fontWeight = 'bold';
            });

            // ③ 見出しタグ・段落のマージン調整
            const headings = cloneNode.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headings.forEach(h => {
                h.style.marginTop = '16px';
                h.style.marginBottom = '8px';
            });
            const paragraphs = cloneNode.querySelectorAll('p');
            paragraphs.forEach(p => {
                p.style.marginTop = '8px';
                p.style.marginBottom = '8px';
            });

            // ④ リスト項目 (ul, ol, li)
            const lists = cloneNode.querySelectorAll('ul, ol');
            lists.forEach(list => {
                list.style.marginTop = '8px';
                list.style.marginBottom = '8px';
                list.style.paddingLeft = '24px';
            });

            // 加工後のHTML文字列を取得
            const contentHtml = cloneNode.innerHTML;
            
            // 3. Word出力用にインラインCSSを含むHTML文書を構築
            // (余計なタイトル <h1> や区切り線を削除し、シンプルな文書構成にする)
            const htmlString = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>${displayTitle}</title>
                    <style>
                        body {
                            font-family: "MS Mincho", "Hiragino Mincho ProN", serif;
                            color: #000000;
                            line-height: 1.5;
                        }
                        h1, h2, h3, h4, h5, h6 {
                            font-family: "MS Gothic", "Hiragino Kaku Gothic ProN", sans-serif;
                            color: #000000;
                            border: none;
                        }
                        .document-title {
                            font-size: 24pt;
                            font-weight: bold;
                            text-align: center;
                            font-family: "MS Gothic", "Hiragino Kaku Gothic ProN", sans-serif;
                            margin-bottom: 24pt;
                            border: none;
                        }
                        p, div, span, ul, ol, li, blockquote {
                            border: none;
                        }
                        code, pre {
                            font-family: Consolas, "Courier New", monospace;
                            background-color: #f5f5f5;
                        }
                        a {
                            color: #0000ff;
                            text-decoration: underline;
                        }
                    </style>
                </head>
                <body>
                    <!-- 文書のメインタイトルのみを出力 (二重ヘッダーの防止) -->
                    <div class="document-title">${displayTitle}</div>
                    
                    <!-- Markdown加工済みの本文 -->
                    ${contentHtml}
                </body>
                </html>
            `;

            // 4. html-docx-js を用いて DOCX ファイル (Blob) に変換
            const convertedBlob = window.htmlDocx.asBlob(htmlString);

            // 5. ダウンロード実行
            const url = URL.createObjectURL(convertedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safeTitle}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download Word via CDN:', err);
            alert("Wordエクスポートに失敗しました。ネットワーク接続等をご確認ください。");
        } finally {
            setIsExportingWord(false);
        }
    };

    const citations = displayCitations;
    const shouldShowPanel = artifact || isGeneratingArtifact;

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

                    <div style={{ width: 1, height: 20, backgroundColor: 'var(--color-border)', margin: '0 4px' }} />

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
                                    <button 
                                        className="artifact-menu-item"
                                        onClick={handleDownloadMarkdown}
                                    >
                                        <DownloadIcon />
                                        <span>Markdown (.md)</span>
                                    </button>
                                    {/* 
                                    <button 
                                        className="artifact-menu-item"
                                        onClick={handleDownloadPDF}
                                        disabled={isExportingPDF}
                                    >
                                        <DownloadIcon />
                                        <span>{isExportingPDF ? 'PDF 出力中...' : 'PDF (.pdf)'}</span>
                                    </button>
                                    */}
                                    <button 
                                        className="artifact-menu-item"
                                        onClick={handleDownloadWord}
                                        disabled={isExportingWord}
                                    >
                                        <DownloadIcon />
                                        <span>{isExportingWord ? 'Word 出力中...' : 'Word (.docx)'}</span>
                                    </button>
                                    <div className="artifact-menu-divider" />
                                    {/* 
                                    <button 
                                        className="artifact-menu-item"
                                        onClick={() => { handlePrint(); setIsMenuOpen(false); }}
                                    >
                                        <PrintIcon />
                                        <span>印刷する</span>
                                    </button>
                                    */}
                                    <button 
                                        className={`artifact-menu-item ${isCopied ? 'copied' : ''}`}
                                        onClick={() => { handleCopy(); }}
                                        disabled={isCopied}
                                    >
                                        {isCopied ? <CheckIcon /> : <CopyIcon />}
                                        <span>{isCopied ? 'クリップボードにコピー' : 'コピー'}</span>
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
                            disableCitationReplacement={true}
                        />
                    </div>
                </div>
            </div>

            {/* Footer: Citations Section（仕様書3.2準拠） */}
            {citations.length > 0 && (
                <div className={`artifact-citations-footer ${isCitationsExpanded ? 'expanded' : ''}`}>
                    <div 
                        className="artifact-citations-header" 
                        onClick={() => setIsCitationsExpanded(!isCitationsExpanded)}
                        role="button"
                        aria-expanded={isCitationsExpanded}
                        title={isCitationsExpanded ? "出典を閉じる" : "出典を表示"}
                    >
                        <div className="artifact-citations-label-group">
                            <span className="artifact-citations-icon"><LinkIcon /></span>
                            <span className="artifact-citations-label">出典</span>
                            <span className="artifact-citations-count">{citations.length}</span>
                        </div>
                        <div className={`citation-toggle-icon ${isCitationsExpanded ? 'rotated' : ''}`}>
                            <ChevronIcon />
                        </div>
                    </div>
                    <div className="artifact-citations-content">
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
                </div>
            )}

            {/* ★追加: エクスポート用の隠し領域 */}
            <div style={{ position: 'absolute', top: -10000, left: -10000, width: '800px', zIndex: -1000 }}>
                <div ref={hiddenExportRef} className="pdf-export-container">
                    <h1 className="pdf-title">{displayTitle}</h1>
                    <div className="pdf-content">
                        <MarkdownRenderer
                            content={displayContent}
                            isStreaming={false}
                            disableCitationReplacement={true}
                        />
                    </div>
                </div>
            </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ArtifactPanel;