import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownRenderer from '../Shared/MarkdownRenderer';
import { SparklesIcon } from '../Shared/SystemIcons';
import GeneratingAnimation from './GeneratingArtifact';
import GeneratingSlideAnimation from './GeneratingArtifactSlide';
import { splitArtifactPages } from '../../utils/splitArtifactPages';
import { sanitizeArtifactHtml } from '../../utils/sanitizeArtifactHtml';
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

const LightbulbIcon = ({ width = 20, height = 20, className = "" }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 18h6"></path>
        <path d="M10 22h4"></path>
        <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"></path>
    </svg>
);

/**
 * HTML生成中のプレビュー表示 (Apple Intelligence Style)
 */
const GeneratingPagePlaceholder = ({ pageNumber, isSlide, status, subtext }) => (
    <motion.div
        className={`a4-page-placeholder ${isSlide ? 'is-slide' : ''}`}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 250, damping: 25, mass: 1 }}
    >
        <div className="placeholder-content">
            <div className="placeholder-animation-container">
                {isSlide ? (
                    <GeneratingSlideAnimation className="generating-slide-animation" />
                ) : (
                    <GeneratingAnimation className="generating-pencil-animation" />
                )}
            </div>
            <div className="placeholder-text">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={status || "default-status"}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.3 }}
                    >
                        {status || `${pageNumber}ページ目を生成中...`}
                    </motion.div>
                </AnimatePresence>
            </div>
            <div className="placeholder-subtext">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={subtext || "default-subtext"}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.3, delay: 0.05 }}
                    >
                        {subtext || "AIが最適なレイアウトを構成しています"}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    </motion.div>
);

/**
 * ストリーミング中のHTMLから現在の生成ステータスを判定
 */
const getGenerationStatus = (html, pageNumber, artifactType) => {
    const isSlide = artifactType === 'html_slide';

    if (!html || html.length < 50) return {
        text: isSlide ? 'スライドプレゼンテーションを構築しています...' : '高品質なドキュメントを構築しています...',
        subtext: 'AIが最適な構成案を作成しています'
    };

    // <head>内でまだ <body> に到達していない場合
    if (!html.includes('<body')) {
        if (html.includes('<style') && !html.includes('</style>')) {
            return {
                text: isSlide ? 'モダンなビジュアルスタイルを設計しています...' : 'プロフェッショナルな書式を適用しています...',
                subtext: '洗練されたデザインを適用しています'
            };
        }
        if (html.includes('<script') && !html.includes('</script>')) {
            return {
                text: isSlide ? 'インタラクティブな演出を準備しています...' : 'ドキュメントの機能をセットアップしています...',
                subtext: '動的な要素とインタラクションを準備しています'
            };
        }
        return {
            text: isSlide ? 'スライドのストーリーを構成しています...' : 'ドキュメントの構成を設計しています...',
            subtext: 'ヘッダーとメタデータを構成しています'
        };
    }

    // <body> に到達した後は各ページの生成状況を表示
    return {
        text: isSlide ? `${pageNumber}枚目のスライドをレイアウトしています...` : `${pageNumber}ページ目の内容を詳しく生成しています...`,
        subtext: 'AIがコンテンツを最適な形式で配置しています'
    };
};

/**
 * artifact_type に応じたバッジ表示
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
    json_slide: { emoji: '🎯', label: '編集可能なプレゼンスライド' },
    json_slide_advanced: { emoji: '🎯', label: '編集可能なプレゼンスライド' },
};

const getTypeBadge = (type) => {
    const info = ARTIFACT_TYPE_MAP[type];
    if (info) return `${info.emoji} ${info.label}`;
    return type || 'ドキュメント';
};

/**
 * LocalStorage キー
 */
const LOCAL_STORAGE_PPTX_BANNER_KEY = 'dify_pptx_banner_seen';

/**
 * PPTX変換ヒントコンポーネント
 */
const ConversionHint = ({ isDismissed, onToggle, onDismiss }) => {
    return (
        <AnimatePresence>
            {!isDismissed ? (
                <motion.div
                    className="conversion-hint-banner"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                >
                    <div className="conversion-hint-content">
                        <div className="conversion-hint-icon">
                            <LightbulbIcon width="16" height="16" />
                        </div>
                        <div className="conversion-hint-text-group">
                            <div className="conversion-hint-title">📽️ PPTX変換ヒント</div>
                            <div className="conversion-hint-body">
                                PowerPoint(PPTX)形式が必要な場合は、右上のアクションメニューから「印刷」を選択してPDFとして保存した後、
                                <a
                                    href="https://www.canva.com/ja_jp/features/pdf-to-ppt-converter/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="conversion-hint-link"
                                >
                                    Canva
                                </a>
                                などの外部ツールでPPTXへ変換可能です。
                            </div>
                        </div>
                        <button className="conversion-hint-close" onClick={onDismiss} title="ヒントを隠す">
                            <CloseIcon />
                        </button>
                    </div>
                </motion.div>
            ) : (
                <motion.button
                    className="conversion-hint-icon-btn"
                    onClick={onToggle}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="PPTX変換ヒントを表示"
                >
                    <LightbulbIcon width="20" height="20" />
                </motion.button>
            )}
        </AnimatePresence>
    );
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
const ArtifactPanel = ({ isOpen, onClose, artifact, streamingMessage, onQuoteSelect }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isCitationsExpanded, setIsCitationsExpanded] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isPptxHintDismissed, setIsPptxHintDismissed] = useState(() => {
        try {
            return localStorage.getItem(LOCAL_STORAGE_PPTX_BANNER_KEY) === 'true';
        } catch (e) {
            return false;
        }
    });

    // ★追加: ズームとスクロール用の状態管理
    const [zoomLevel, setZoomLevel] = useState(100);
    const [zoomOffset, setZoomOffset] = useState(0); // ★追加: 標準フィットに対するオフセット
    const [panelWidth, setPanelWidth] = useState(0);

    // ★追加: PDFエクスポート用の状態と参照
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    // ★追加: Wordエクスポート用の状態
    const [isExportingWord, setIsExportingWord] = useState(false);

    const hiddenExportRef = useRef(null);

    // ★追加: テキスト選択からの「ここを修正」機能用状態
    const [selectionState, setSelectionState] = useState({ text: '', x: 0, y: 0, show: false });

    // ★v2.0追加: iframe高さ管理（複数ページ対応）
    const panelRef = useRef(null);
    const iframeRefs = useRef({});
    const [pageHeights, setPageHeights] = useState({});

    // ★追加: 描画を安定させるための「確定済みページ」ステート
    const [stablePages, setStablePages] = useState([]);

    // ★追加: 現在のストリーミングメッセージがArtifact生成用かどうかを判定
    const isGeneratingArtifact = streamingMessage && streamingMessage.isStreaming && streamingMessage.artifact;
    
    // パネル表示判定
    const shouldShowPanel = artifact || isGeneratingArtifact;

    // ★変更: ストリーミング中はstreamingMessage.artifactの中間値を使用
    const streamingArtifact = isGeneratingArtifact ? streamingMessage.artifact : null;
    const displayContent = streamingArtifact?.artifact_content || artifact?.content || '';
    const displayTitle = streamingArtifact?.artifact_title || artifact?.title || artifact?.label || 'Untitled Document';
    const displayType = streamingArtifact?.artifact_type || artifact?.type || 'summary_report';
    const displayCitations = artifact?.citations || [];

    // ★v2.0追加: HTML直接生成方式かどうかの判定 (A4ドキュメントおよびスライド)
    const isHtmlA4Document = displayType === 'html_document';
    const isHtmlDocument = isHtmlA4Document || displayType === 'html_slide';
    const isHtmlSlide = displayType === 'html_slide';


    // バナー表示時に表示済みフラグを保存
    useEffect(() => {
        if (isHtmlSlide && !isGeneratingArtifact && !isPptxHintDismissed) {
            try {
                localStorage.setItem(LOCAL_STORAGE_PPTX_BANNER_KEY, 'true');
            } catch (e) {
                console.warn('Failed to save banner status to LocalStorage:', e);
            }
        }
    }, [isHtmlSlide, isGeneratingArtifact, isPptxHintDismissed]);



    // アーティファクトが切り替わったら状態リセット
    useEffect(() => {
        setIsCopied(false);
        setPageHeights({});
        setStablePages([]); // 新しいドキュメントならリセット
        iframeRefs.current = {}; // ★修正: 前のArtifactのiframe参照をクリア
    }, [artifact?.id, artifact?.title, artifact?.content]); // ★修正: contentも監視してカード切り替えを確実にリセット

    // ★追加: 基本となる用紙・キャンバス幅の定義 (AutoFitとレンダリングで共有)
    const basePaperWidth = isHtmlSlide ? 960 : (isHtmlDocument ? 850 : 720);

    /**
     * ★ちらつき防止：ページバッファリングロジック
     * ストリーミング中の displayContent を解析し、完全に終了したページのみを stablePages に追加する。
     */
    useEffect(() => {
        if (!isHtmlDocument) {
            if (stablePages.length > 0) setStablePages([]);
            return;
        }

        const { sanitized, error } = sanitizeArtifactHtml(displayContent);
        if (error && displayContent.length > 20 && !isGeneratingArtifact) {
            console.warn("Artifact Sanitize Warning:", error);
        }

        const allPages = splitArtifactPages(sanitized);

        if (isGeneratingArtifact) {
            // 現在生成中の場合、最後の1ページを除いた「確定済み」の部分だけをチェック
            if (allPages.length > 1) {
                const justCompletedPages = allPages.slice(0, -1);
                // 確定済みページの数が増えた場合のみステートを更新（既存のiframeのリロードを防ぐ）
                if (justCompletedPages.length > stablePages.length) {
                    setStablePages(justCompletedPages);
                }
            }
        } else {
            // 生成が終わっている場合は、全ページを反映
            // (すでにある内容と等しい場合は更新しないようにして無限ループや不要な再描画を防ぐ)
            if (allPages.length !== stablePages.length) {
                setStablePages(allPages);
            }
        }
    }, [displayContent, isGeneratingArtifact, isHtmlDocument]);

    // 以前の useMemo による pages 計算は削除し、stablePages を表示に使う
    const pages = stablePages;

    // ★v2.0追加: postMessage による iframe 高さ自動調整
    useEffect(() => {
        if (!isHtmlDocument) return;
        const handleMessage = (e) => {
            if (e.data?.type === 'artifact-resize' && typeof e.data.height === 'number') {
                const index = Object.keys(iframeRefs.current).find(
                    key => iframeRefs.current[key] && iframeRefs.current[key].contentWindow === e.source
                );
                if (index !== undefined) {
                    setPageHeights(prev => {
                        const currentHeight = prev[index] || 0;
                        const minHeight = isHtmlSlide ? 540 : (297 * 3.7795);
                        const newHeight = Math.max(e.data.height, minHeight);
                        // 2px 未満の微小な変化は無視（フィードバックループ防止）
                        if (Math.abs(currentHeight - newHeight) < 2) return prev;
                        return { ...prev, [index]: newHeight };
                    });
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isHtmlDocument, pages.length]);

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
    }, [shouldShowPanel, isOpen]);

    // ★修正: 常にAutoFitを有効にし、パネル幅とユーザー指定のオフセットに応じて最適な倍率を計算
    useEffect(() => {
        if (panelWidth === 0) return;

        // パネル幅からスクロールバー分や安全マージン(約40px)を引いた有効幅
        const availableWidth = panelWidth - 40;
        const basePaperWidth = isHtmlSlide ? 1020 : (isHtmlDocument ? 850 : 720);

        let optimalZoom = Math.floor((availableWidth / basePaperWidth) * 100);
        
        // 最終的な表示倍率は、最適倍率にユーザーの指定したオフセットを加えたもの
        let finalZoom = optimalZoom + zoomOffset;

        // 最小30%、最大250%程度に制限
        finalZoom = Math.max(30, Math.min(250, finalZoom));
        setZoomLevel(finalZoom);

    }, [panelWidth, zoomOffset, isHtmlDocument, isHtmlSlide]);

    // ★修正: 手動ズーム操作を「オフセット（増減値）」の変更として扱う
    const handleZoomIn = () => {
        setZoomOffset(prev => Math.min(150, prev + 10)); // 最大オフセット制限
    };

    const handleZoomOut = () => {
        setZoomOffset(prev => Math.max(-80, prev - 10)); // 最小オフセット制限
    };

    const handleZoomReset = () => {
        setZoomOffset(0); // オフセットリセット（ジャストフィット）
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

    // ★追加: HTML ダウンロード処理
    const handleDownloadHtml = () => {
        try {
            const safeTitle = displayTitle.replace(/[\\/:*?"<>|]/g, '_');
            const blob = new Blob([displayContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safeTitle}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setIsMenuOpen(false);
        } catch (err) {
            console.error('Failed to download html:', err);
        }
    };

    const handlePrintHtmlDocument = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const { sanitized } = sanitizeArtifactHtml(displayContent);
        let processedContent = sanitized || displayContent;

        const printEnhancer = `
            <style>
                @page { size: A4; margin: 0; }
                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            </style>
        `;

        if (processedContent.includes('</head>')) {
            processedContent = processedContent.replace('</head>', `${printEnhancer}</head>`);
        } else {
            processedContent = `<!DOCTYPE html><html><head><meta charset="UTF-8" />${printEnhancer}</head><body>${processedContent}</body></html>`;
        }

        printWindow.document.open();
        printWindow.document.write(processedContent);
        printWindow.document.close();

        printWindow.addEventListener('load', () => {
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }, 300);
        });

        setIsMenuOpen(false);
    };


    const injectIntoHead = (html, injection) => {
        if (html.includes('</head>')) {
            return html.replace('</head>', `${injection}
</head>`);
        }
        return `<!DOCTYPE html><html><head><meta charset="UTF-8">${injection}</head><body>${html}</body></html>`;
    };

    const buildPrintReadySlideHtml = (html) => {
        const printEnhancer = `
            <style>
                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    overflow: visible !important;
                }

                body {
                    display: block !important;
                    min-height: auto !important;
                }

                .slide {
                    width: 960px !important;
                    height: 540px !important;
                    margin: 0 !important;
                    box-shadow: none !important;
                    overflow: hidden !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }

                .slide-body {
                    height: 100% !important;
                    min-height: 0 !important;
                    box-sizing: border-box !important;
                    overflow: hidden !important;
                }

                .chart-shell {
                    display: grid !important;
                    grid-template-columns: 200px minmax(0, 1fr) !important;
                    gap: 18px !important;
                    align-items: stretch !important;
                    min-width: 0 !important;
                }

                .chart-side,
                .chart-panel,
                .chart-area {
                    min-width: 0 !important;
                }

                .chart-panel {
                    display: flex !important;
                    flex-direction: column !important;
                }

                .chart-area {
                    position: relative !important;
                    width: 100% !important;
                    min-width: 0 !important;
                    min-height: 220px !important;
                    height: 100% !important;
                    overflow: hidden !important;
                }

                .chart-area canvas,
                canvas[data-chart-role] {
                    display: block !important;
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100% !important;
                    max-height: 100% !important;
                }

                @media print {
                    @page {
                        size: 10in 5.625in;
                        margin: 0;
                    }

                    html, body {
                        background: none !important;
                        overflow: visible !important;
                    }

                    body {
                        display: block !important;
                    }

                    .slide {
                        width: 960px !important;
                        height: 540px !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        page-break-after: always;
                    }
                }
            </style>

            <script>
                (function() {
                    function waitForChartsReady(callback, attempts) {
                        attempts = attempts || 0;
                        if (typeof Chart === 'undefined') {
                            if (attempts > 120) {
                                callback();
                                return;
                            }
                            setTimeout(function() {
                                waitForChartsReady(callback, attempts + 1);
                            }, 50);
                            return;
                        }
                        callback();
                    }

                    function syncCanvasResolution(canvas) {
                        if (!canvas) return;
                        var rect = canvas.getBoundingClientRect();
                        var cssWidth = Math.max(1, Math.round(rect.width));
                        var cssHeight = Math.max(1, Math.round(rect.height));
                        var dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

                        var targetWidth = Math.round(cssWidth * dpr);
                        var targetHeight = Math.round(cssHeight * dpr);

                        if (canvas.width !== targetWidth) canvas.width = targetWidth;
                        if (canvas.height !== targetHeight) canvas.height = targetHeight;

                        canvas.style.width = cssWidth + 'px';
                        canvas.style.height = cssHeight + 'px';

                        var ctx = canvas.getContext && canvas.getContext('2d');
                        if (ctx) {
                            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                        }
                    }

                    function resizeChartsForPrint() {
                        var canvases = document.querySelectorAll('.chart-area canvas, canvas[data-chart-role]');
                        canvases.forEach(function(canvas) {
                            syncCanvasResolution(canvas);

                            var chart =
                                (window.Chart && Chart.getChart && Chart.getChart(canvas)) ||
                                canvas.__chartInstance ||
                                null;

                            if (chart) {
                                chart.resize();
                                if (chart.render) chart.render();
                                syncCanvasResolution(canvas);
                                chart.resize();
                                if (chart.update) chart.update('none');
                            }
                        });
                    }

                    function runPrintLayoutPass() {
                        waitForChartsReady(function() {
                            requestAnimationFrame(function() {
                                requestAnimationFrame(function() {
                                    resizeChartsForPrint();
                                });
                            });
                        });
                    }

                    window.addEventListener('load', runPrintLayoutPass);
                    window.addEventListener('resize', runPrintLayoutPass);

                    if (document.fonts && document.fonts.ready) {
                        document.fonts.ready.then(runPrintLayoutPass);
                    }

                    if (window.matchMedia) {
                        var mediaQueryList = window.matchMedia('print');
                        if (mediaQueryList.addEventListener) {
                            mediaQueryList.addEventListener('change', function(e) {
                                if (e.matches) runPrintLayoutPass();
                            });
                        } else if (mediaQueryList.addListener) {
                            mediaQueryList.addListener(function(e) {
                                if (e.matches) runPrintLayoutPass();
                            });
                        }
                    }

                    window.addEventListener('beforeprint', runPrintLayoutPass);
                })();
            </script>
        `;

        return injectIntoHead(html, printEnhancer);
    };

    const handlePrintHtmlSlide = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const processedContent = buildPrintReadySlideHtml(displayContent);

        printWindow.document.open();
        printWindow.document.write(processedContent);
        printWindow.document.close();

        const triggerPrint = () => {
            setTimeout(() => {
                try {
                    printWindow.focus();
                    if (printWindow.dispatchEvent) {
                        printWindow.dispatchEvent(new Event('beforeprint'));
                    }
                    printWindow.print();
                } finally {
                    setTimeout(() => {
                        try {
                            printWindow.close();
                        } catch (e) { }
                    }, 300);
                }
            }, 700);
        };

        if (printWindow.document.readyState === 'complete') {
            triggerPrint();
        } else {
            printWindow.addEventListener('load', triggerPrint, { once: true });
        }

        setIsMenuOpen(false);
    };

    // ★修正: HTML 印刷処理
    const handlePrintHtml = () => {
        if (isHtmlA4Document) {
            handlePrintHtmlDocument();
            return;
        }

        handlePrintHtmlSlide();
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

    // ★追加: テキスト選択イベントハンドラ (mouseupベース: 選択確定後のみ表示)
    useEffect(() => {
        const handleMouseUp = () => {
            // mouseup後、ブラウザがselectionを確定するまで少し待つ
            setTimeout(() => {
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

                const text = selection.toString().trim();
                if (text.length === 0) return;

                // 選択範囲が現在のパネル内かチェック
                if (!panelRef.current || !panelRef.current.contains(selection.anchorNode)) return;

                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                if (rect.width > 0 && rect.height > 0) {
                    setSelectionState({
                        text,
                        x: rect.left + rect.width / 2,
                        y: rect.bottom + window.scrollY + 12, // スクロール分を考慮しつつ配置
                        show: true
                    });
                }
            }, 50);
        };

        // パネル外クリックやselection解除でツールチップを閉じる
        const handleMouseDown = (e) => {
            // ツールチップ自体のクリックは無視（handleFixRequestで処理）
            if (e.target.closest('.selection-tooltip')) return;
            setSelectionState(prev => prev.show ? { text: '', x: 0, y: 0, show: false } : prev);
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    const handleFixRequest = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (onQuoteSelect && selectionState.text) {
            onQuoteSelect(selectionState.text);
            // 選択解除
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }
        }
        setSelectionState({ text: '', x: 0, y: 0, show: false });
    };

    const handleScroll = () => {
        if (selectionState.show) {
            setSelectionState(prev => ({ ...prev, show: false }));
        }
    };

    return (
        <AnimatePresence>
            {shouldShowPanel && (
                <motion.div
                    ref={panelRef}
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
                                    className="zoom-label-btn auto-fit-active"
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

                            {/* ★ エクスポートメニュー */}
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
                                            {isHtmlDocument ? (
                                                <>
                                                    <button className="artifact-menu-item" onClick={handleDownloadHtml}>
                                                        <DownloadIcon />
                                                        <span>HTML (.html)</span>
                                                    </button>
                                                    <button className="artifact-menu-item" onClick={handlePrintHtml}>
                                                        <PrintIcon />
                                                        <span>印刷 / PDF</span>
                                                    </button>
                                                </>
                                             ) : (
                                                <>
                                                    <button className="artifact-menu-item" onClick={handleDownloadMarkdown}>
                                                        <DownloadIcon />
                                                        <span>Markdown (.md)</span>
                                                    </button>
                                                    <button className="artifact-menu-item" onClick={handleDownloadWord} disabled={isExportingWord}>
                                                        <DownloadIcon />
                                                        <span>{isExportingWord ? 'Word 出力中...' : 'Word (.docx)'}</span>
                                                    </button>
                                                </>
                                            )}
                                            <div className="artifact-menu-divider" />
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

                    {/* Body: Document Viewer */}
                    <div
                        className="artifact-body"
                        style={{ overflow: 'auto' }}
                        onScroll={handleScroll}
                    >
                        {/* ★v2.0: html_document の場合は A4用紙ビューワーで描画 */}
                        {isHtmlDocument ? (
                            <div
                                className="artifact-viewer-bg"
                                style={{
                                    minWidth: `${basePaperWidth * (zoomLevel / 100)}px`
                                }}
                            >
                                <div style={{
                                    transform: `scale(${zoomLevel / 100})`,
                                    transformOrigin: 'top center',
                                    transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '32px'
                                }}>
                                    {pages.map((pageHtml, index) => {
                                        const defaultHeight = isHtmlSlide ? 540 : (297 * 3.7795);
                                        const h = pageHeights[index] || defaultHeight;

                                        // スライド表示時のスタイル補正：
                                        // 1. iframe内のbody背景色(#f0f2f5)を透明にして外側の余白(20px)を消す
                                        // 2. .slideのシャドウとマージンを消してiframeいっぱいに表示する
                                        const FINAL_HTML = isHtmlSlide
                                            ? pageHtml.replace('</head>', `
                                                <style>
                                                    html, body {
                                                        background: transparent !important;
                                                        margin: 0 !important;
                                                        padding: 0 !important;
                                                        overflow: hidden !important;
                                                        width: 960px !important;
                                                        height: 540px !important;
                                                    }

                                                    body {
                                                        display: block !important;
                                                        min-height: 540px !important;
                                                    }

                                                    .slide {
                                                        margin: 0 !important;
                                                        box-shadow: none !important;
                                                        border: none !important;
                                                        width: 960px !important;
                                                        height: 540px !important;
                                                        display: flex !important;
                                                        flex-direction: column !important;
                                                        overflow: hidden !important;
                                                    }

                                                    .slide-body {
                                                        display: flex !important;
                                                        flex-direction: column !important;
                                                        height: 100% !important;
                                                        min-height: 0 !important;
                                                        overflow: hidden !important;
                                                    }

                                                    .chart-shell {
                                                        display: grid !important;
                                                        grid-template-columns: 200px minmax(0, 1fr) !important;
                                                        gap: 18px !important;
                                                        align-items: stretch !important;
                                                        min-width: 0 !important;
                                                    }

                                                    .chart-side,
                                                    .chart-panel,
                                                    .chart-area {
                                                        min-width: 0 !important;
                                                    }

                                                    .chart-panel {
                                                        display: flex !important;
                                                        flex-direction: column !important;
                                                    }

                                                    .chart-area {
                                                        position: relative !important;
                                                        width: 100% !important;
                                                        min-width: 0 !important;
                                                        min-height: 220px !important;
                                                        height: 100% !important;
                                                        overflow: hidden !important;
                                                    }

                                                    .chart-area canvas,
                                                    canvas[data-chart-role] {
                                                        width: 100% !important;
                                                        height: 100% !important;
                                                        max-width: 100% !important;
                                                        max-height: 100% !important;
                                                        display: block !important;
                                                    }

                                                    .two-col {
                                                        display: flex !important;
                                                        flex-shrink: 0 !important;
                                                    }
                                                </style>
                                                </head>`)
                                            : pageHtml;

                                        return (
                                            <React.Fragment key={index}>
                                                <motion.div
                                                    className={`a4-page-wrapper ${isHtmlSlide ? 'is-slide' : ''}`}
                                                    style={{ minHeight: `${isHtmlSlide ? 540 : h}px` }}
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.4 }}
                                                >
                                                    <iframe
                                                        ref={(el) => { iframeRefs.current[index] = el; }}
                                                        sandbox="allow-scripts allow-same-origin"
                                                        srcDoc={FINAL_HTML}
                                                        style={{ height: `${isHtmlSlide ? 540 : h}px` }}
                                                        title={`${displayTitle} - Page ${index + 1}`}
                                                    />
                                                </motion.div>
                                                <div className={`a4-page-number ${isHtmlSlide ? 'is-slide' : ''}`}>
                                                    {index + 1} / {isGeneratingArtifact ? '?' : pages.length}
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                    {/* 生成中のプレビュー表示 */}
                                    <AnimatePresence mode="wait">
                                        {isGeneratingArtifact && (() => {
                                            const statusInfo = getGenerationStatus(displayContent, pages.length + 1, displayType);
                                            return (
                                                <motion.div
                                                    key={`generating-p${pages.length + 1}`}
                                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}
                                                    initial={{ opacity: 0, y: 40 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.98 }}
                                                    transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                                                >
                                                    <GeneratingPagePlaceholder
                                                        pageNumber={pages.length + 1}
                                                        isSlide={isHtmlSlide}
                                                        status={statusInfo.text}
                                                        subtext={statusInfo.subtext}
                                                    />
                                                    <div className={`a4-page-number ${isHtmlSlide ? 'is-slide' : ''}`}>
                                                        {pages.length + 1} / ?
                                                    </div>
                                                </motion.div>
                                            );
                                        })()}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ) : (
                            /* 既存 Markdown 型: スケール変換付きの MarkdownRenderer */
                            <div style={{
                                minWidth: `${720 * (zoomLevel / 100)}px`,
                                display: 'flex',
                                justifyContent: 'center',
                                paddingBottom: '64px'
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
                                        renderMode={isGeneratingArtifact ? 'realtime' : 'normal'}
                                        disableCitationReplacement={true}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {!isHtmlDocument && (
                        <div className="artifact-disclaimer-fixed">
                            ※ プレビュー表示のため、実際の出力レイアウトとは異なる場合があります。
                        </div>
                    )}

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

                    {/* ★追加: エクスポート用の隠し領域 (Markdown型のみ) */}
                    {!isHtmlDocument && (
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
                    )}

                    {/* ★追加: テキスト選択ツールチップ (Portalでbody直下にレンダリング) */}
                    {ReactDOM.createPortal(
                        <AnimatePresence>
                            {selectionState.show && (
                                <motion.div
                                    className="selection-tooltip"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                    style={{
                                        position: 'fixed',
                                        left: selectionState.x,
                                        top: selectionState.y,
                                        transform: 'translateX(-50%)',
                                        zIndex: 999999
                                    }}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onClick={handleFixRequest}
                                >
                                    <SparklesIcon className="selection-tooltip-icon" width="14" height="14" />
                                    <span className="selection-tooltip-text">ここを修正</span>
                                </motion.div>
                            )}
                        </AnimatePresence>,
                        document.body
                    )}

                    {/* ★追加: PPTX変換ヒント (html_slideのみ) */}
                    {isHtmlSlide && !isGeneratingArtifact && (
                        <ConversionHint
                            isDismissed={isPptxHintDismissed}
                            onToggle={() => setIsPptxHintDismissed(false)}
                            onDismiss={() => setIsPptxHintDismissed(true)}
                        />
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ArtifactPanel;