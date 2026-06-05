// src/components/Artifacts/JsonSlide/PresentationPanel.jsx
// JSON Slideのメインコンテナコンポーネント
// artifact_content (JSON文字列) をパースし、スライドをレンダリングする
import React, { useState, useMemo, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideRenderer from './SlideRenderer';
import SlideNavigation from './SlideNavigation';
import EditModeModal from './EditModeModal';
import GeneratingSlideAnimation from '../GeneratingArtifactSlide';
import { PptxExportEngine } from '../../../utils/pptxExportEngine';
import { IS_DEV_MODE } from '../../../config/devMode';
import './PresentationPanel.css';

/**
 * ErrorFallback - JSONパースエラー時のフォールバック表示
 */
const ErrorFallback = ({ error, rawContent }) => (
    <div className="json-slide-error-fallback">
        <div className="error-icon">⚠️</div>
        <h3>スライドデータの読み込みに失敗しました</h3>
        <p className="error-detail">{error}</p>
        {rawContent && (
            <details className="error-raw-data">
                <summary>生データを表示</summary>
                <pre>{typeof rawContent === 'string' ? rawContent.substring(0, 500) : '不正なデータ'}</pre>
            </details>
        )}
    </div>
);

/**
 * テーマ名 → CSS変数マッピング
 */
import { themeRegistry, getAvailableThemeIds } from './config/themeRegistry';
const defaultThemeId = 'corporate-modern';

/**
 * PresentationPanel - JSON Slideのメインコンテナ
 * @param {string} content - artifact_content (JSON文字列)
 * @param {boolean} isGenerating - 生成中かどうか
 * @param {string} viewMode - 表示モード ('single' | 'list')
 * @param {function} setViewMode - モード変更関数
 */
const PresentationPanel = forwardRef(({ content, isGenerating, viewMode = 'single', setViewMode, onExportStatusChange, onSendMessage }, ref) => {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [currentPalette, setCurrentPalette] = useState('blue'); // 追加: パレット状態
    const [showPaletteOptions, setShowPaletteOptions] = useState(false); // 追加: パレット選択肢の表示状態
    const [mermaidErrors, setMermaidErrors] = useState({}); // 追加: Mermaidエラー状態

    // 編集モード用 State
    const [slideData, setSlideData] = useState(null);     // 編集中のスライド配列
    const [currentTheme, setCurrentTheme] = useState(null); // 編集中のテーマ
    const [editingSlideIndex, setEditingSlideIndex] = useState(0); // 左ペイン選択スライド
    const [isEditOpen, setIsEditOpen] = useState(false);  // 全画面編集モーダルの開閉
    const originalSlides = useRef(null); // リセット用: 初期スライド配列を保持
    const [isExporting, setIsExportingState] = useState(false); // PPTXエクスポート状態
    const isExportingRef = useRef(false); // 即時参照用

    const setIsExporting = (val) => {
        setIsExportingState(val);
        isExportingRef.current = val;
        if (onExportStatusChange) {
            onExportStatusChange(val);
        }
    };

    // JSONパースとバリデーション
    const { presentationData, parseError } = useMemo(() => {
        if (!content || content.length === 0) {
            return { presentationData: null, parseError: null };
        }

        try {
            let jsonString = content;
            // ```json コードブロックの除去
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.replace(/^```json\n/, '').replace(/\n```$/, '');
            } else if (jsonString.startsWith('```')) {
                jsonString = jsonString.replace(/^```\n/, '').replace(/\n```$/, '');
            }

            const parsed = JSON.parse(jsonString);

            // バリデーション: slides配列の存在確認
            if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
                return { presentationData: null, parseError: 'slides配列が空または不正です' };
            }

            // 各スライドの最低限のバリデーション
            const validatedSlides = parsed.slides.map((slide, idx) => ({
                id: slide.id || `slide_${idx + 1}`,
                layout_type: slide.layout_type || 'content_slide',
                content: slide.content || { title: `スライド ${idx + 1}` },
                blocks: slide.blocks,
                key_message: slide.key_message,
            }));

            return {
                presentationData: {
                    presentation_title: parsed.presentation_title || 'Untitled Presentation',
                    theme: parsed.theme || 'corporate-modern',
                    palette: parsed.palette || 'blue', // 追加
                    slides: validatedSlides,
                },
                parseError: null,
            };
        } catch (e) {
            return { presentationData: null, parseError: e.message };
        }
    }, [content]);

    // スライドインデックスがスライド数を超えた場合のリセット
    useEffect(() => {
        if (presentationData && currentSlideIndex >= presentationData.slides.length) {
            setCurrentSlideIndex(0);
        }
    }, [presentationData, currentSlideIndex]);

    // コンテンツが変更されたらスライドを先頭にリセット、および編集状態をクリア
    useEffect(() => {
        setCurrentSlideIndex(0);
        setSlideData(null);    // 編集データをクリアして再初期化を促す
        setCurrentTheme(null); // テーマもリセット
        setMermaidErrors({});  // エラー状態もリセット
    }, [content]);

    // presentationData が確定したら slideData と originalSlides を初期化
    // ※ ストリーミング中 (isGenerating) は常に最新のデータを反映させる
    // ※ 完了後は、ユーザーが編集を開始していない（slideData が null）場合のみ初期化する
    useEffect(() => {
        if (presentationData && (!slideData || isGenerating)) {
            setSlideData(presentationData.slides);
            
            // 初期テーマの設定
            let initialTheme = (presentationData.theme && themeRegistry[presentationData.theme])
                ? presentationData.theme
                : defaultThemeId;
            
            if (!IS_DEV_MODE) {
                initialTheme = 'modern-indigo';
            }
            
            // テーマが未設定（リセット直後など）の場合のみ設定
            if (!currentTheme || isGenerating) {
                setCurrentTheme(initialTheme);
                setCurrentPalette(presentationData.palette || 'blue');
            }
            
            originalSlides.current = presentationData.slides;
        }
    }, [presentationData, slideData, isGenerating]);

    // ===== PPTXエクスポート ハンドラー =====
    const handleExportPPTX = async () => {
        const activeThemeName = currentTheme || defaultThemeId;

        const activeSlidesData = slideData || presentationData.slides;
        if (!activeSlidesData) return;

        setIsExporting(true);
        try {
            const engine = new PptxExportEngine({
                themeName: activeThemeName,
                palette: currentPalette,
                fileName: `${presentationData.presentation_title || 'Presentation'}.pptx`
            });
            
            // 隠しコンテナのレンダリング完了を待つための微小な待機
            await new Promise(resolve => setTimeout(resolve, 800));
            
            await engine.export(activeSlidesData);
        } catch (error) {
            console.error('PPTX Export failed:', error);
            alert('PPTXエクスポートに失敗しました。\n詳細: ' + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    // 親コンポーネントに機能を公開
    useImperativeHandle(ref, () => ({
        handleExportPPTX,
        isExporting
    }), [handleExportPPTX, isExporting]);

    // ===== 編集モード ハンドラー =====

    /** 編集モーダルを開く（現在表示中のスライドで開始） */
    const handleOpenEdit = useCallback(() => {
        setEditingSlideIndex(currentSlideIndex);
        setIsEditOpen(true);
    }, [currentSlideIndex]);

    /** viewMode が 'edit' になったらモーダルを自動的に開く */
    useEffect(() => {
        if (viewMode === 'edit') {
            handleOpenEdit();
        }
    }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

    /** 編集モーダルを閉じる */
    const handleCloseEdit = useCallback(() => {
        setIsEditOpen(false);
        // 閲覧モードに戻す
        if (setViewMode) setViewMode('single');
        // 編集内容を閲覧モードのインデックスに同期
        setCurrentSlideIndex(editingSlideIndex);
    }, [editingSlideIndex, setViewMode]);

    /** リセット: originalSlides に戻す */
    const handleReset = useCallback(() => {
        if (originalSlides.current) {
            setSlideData(originalSlides.current);
            if (presentationData) setCurrentTheme(presentationData.theme);
        }
    }, [presentationData]);

    /** 特定スライドの内容を更新 */
    const handleSlideChange = useCallback((index, updatedSlide) => {
        setSlideData(prev => {
            if (!prev) return prev;
            return prev.map((s, i) => i === index ? updatedSlide : s);
        });
    }, []);

    /** テーマを変更 */
    const handleThemeChange = useCallback((theme) => {
        setCurrentTheme(theme);
    }, []);

    // ナビゲーションハンドラー
    const handlePrev = useCallback(() => {
        setCurrentSlideIndex(prev => Math.max(0, prev - 1));
    }, []);

    const handleNext = useCallback(() => {
        if (!presentationData) return;
        setCurrentSlideIndex(prev => Math.min(presentationData.slides.length - 1, prev + 1));
    }, [presentationData]);

    const handleGoTo = useCallback((index) => {
        setCurrentSlideIndex(index);
    }, []);

    const handleMermaidError = useCallback((index, error, code) => {
        setMermaidErrors(prev => {
            if (error) {
                return { ...prev, [index]: { error, code } };
            } else {
                const newErrors = { ...prev };
                delete newErrors[index];
                return newErrors;
            }
        });
    }, []);

    // キーボードナビゲーション
    useEffect(() => {
        const handleKeyDown = (e) => {
            // 入力フィールド（チャット入力など）にフォーカスがある場合は無視
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable) {
                return;
            }

            // 一覧表示モードの時は無効（または特定の挙動にする）
            if (viewMode === 'list') return;

            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
                e.preventDefault();
                handlePrev();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleNext();
            } else if (e.key === 'Home') {
                e.preventDefault();
                handleGoTo(0);
            } else if (e.key === 'End' && presentationData) {
                e.preventDefault();
                handleGoTo(presentationData.slides.length - 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlePrev, handleNext, handleGoTo, viewMode, presentationData]);

    // 単一表示モードになった時にフォーカスを当てる（キーボード操作を即座に可能にするため）
    useEffect(() => {
        if (viewMode === 'single') {
            const container = document.querySelector('.presentation-panel');
            if (container) container.focus();
        }
    }, [viewMode]);

    // 生成中の表示
    if (isGenerating && (!content || content.length === 0)) {
        return (
            <div className="presentation-panel" data-theme="corporate-modern">
                <div className="slide-canvas">
                    <div className="json-slide-generating">
                        <div className="generating-pulse">
                            <GeneratingSlideAnimation 
                                className="w-full max-w-[280px] h-auto" 
                                style={{ marginBottom: '8px' }}
                            />
                            <p className="generating-text">プレゼンスライドを構成しています...</p>
                            <p className="generating-subtext">AIが最適なレイアウトを設計しています</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // パースエラー
    if (parseError) {
        return (
            <div className="presentation-panel" data-theme="corporate-modern">
                <ErrorFallback error={parseError} rawContent={content} />
            </div>
        );
    }

    // データなし
    if (!presentationData) {
        return null;
    }

    // slideData が初期化済みなら編集データを使用、未初期化なら presentationData を使用
    const activeSlides = slideData || presentationData.slides;
    const activeTheme = currentTheme || defaultThemeId;
    const { slides } = presentationData; // ← 閲覧モード（キーボードナビ等）はこちら
    const currentSlide = activeSlides[currentSlideIndex];

    // 一覧表示（ギャラリービュー）
    if (viewMode === 'list') {
        return (
            <div
                className="presentation-panel"
                data-theme={activeTheme}
                data-palette={currentPalette}
                tabIndex={0}
            >
                {/* ヘッダーエリア */}
                {IS_DEV_MODE && (
                    <div className="panel-header">
                        <div className="theme-selector">
                            <label htmlFor="theme-select">Theme</label>
                            <select
                                id="theme-select"
                                className="theme-select-input"
                                value={activeTheme}
                                onChange={(e) => handleThemeChange(e.target.value)}
                            >
                                {getAvailableThemeIds().map(themeId => (
                                    <option key={themeId} value={themeId}>
                                        {themeId}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                <div className="slide-list-container">
                    {activeSlides.map((slide, index) => (
                        <div 
                            key={index} 
                            className="slide-list-item" 
                            onClick={() => {
                                handleGoTo(index);
                                if (setViewMode) setViewMode('single');
                            }}
                            title={`スライド ${index + 1} に移動`}
                        >
                            <div className="slide-frame">
                                <SlideRenderer
                                    slide={slide}
                                    themeId={activeTheme}
                                    slideIndex={index}
                                    totalSlides={activeSlides.length}
                                    isStatic={true}
                                    onMermaidError={handleMermaidError}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 単一スライド表示
    return (
        <>
            <div
                className="presentation-panel"
                data-theme={activeTheme}
                data-palette={currentPalette}
                tabIndex={0}
                style={{ position: 'relative' }}
            >
                <div className="panel-header">
                    {/* テーマセレクター (DEVモードのみ) */}
                    {IS_DEV_MODE && (
                        <div className="theme-selector">
                            <label htmlFor="theme-select-single">Theme</label>
                            <select
                                id="theme-select-single"
                                className="theme-select-input"
                                value={activeTheme}
                                onChange={(e) => handleThemeChange(e.target.value)}
                            >
                                {getAvailableThemeIds().map(themeId => (
                                    <option key={themeId} value={themeId}>
                                        {themeId}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* カラーパレットセレクター (modern-indigo専用) */}
                    {activeTheme === 'modern-indigo' && (
                        <div className="palette-selector-container">
                            <button
                                className={`palette-toggle-btn ${showPaletteOptions ? 'active' : ''}`}
                                onClick={() => setShowPaletteOptions(!showPaletteOptions)}
                                title="Color Palette"
                            >
                                <span className={`color-swatch-preview ${currentPalette}`}></span>
                                <span className="toggle-label">
                                    {currentPalette.charAt(0).toUpperCase() + currentPalette.slice(1)}
                                </span>
                                <span className="toggle-icon">{showPaletteOptions ? '✕' : '▼'}</span>
                            </button>

                            {showPaletteOptions && (
                                <motion.div 
                                    className="palette-dropdown"
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="palette-options">
                                        {['blue', 'green', 'navy', 'red', 'gray'].map(p => (
                                            <button
                                                key={p}
                                                className={`palette-btn ${currentPalette === p ? 'active' : ''}`}
                                                onClick={() => {
                                                    setCurrentPalette(p);
                                                    // ワンクッション後の使い勝手を考え、選択時に閉じないようにするか検討
                                                    // ここでは閉じずに確認できるようにする
                                                }}
                                                title={`${p.charAt(0).toUpperCase() + p.slice(1)} Palette`}
                                            >
                                                <span className={`color-swatch ${p}`}></span>
                                                <span className="palette-label">{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>

                {/* スライドキャンバス（16:9アスペクト比） */}
                <div className="slide-canvas">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlideIndex}
                            className="slide-frame"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                        >
                            <SlideRenderer
                                slide={currentSlide}
                                themeId={activeTheme}
                                slideIndex={currentSlideIndex}
                                totalSlides={activeSlides.length}
                                onMermaidError={handleMermaidError}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Mermaidエラー時のAI修正依頼ボタン（ナビゲーターの上、スライドの下） */}
                {mermaidErrors[currentSlideIndex] && onSendMessage && (
                    <div className="json-slide-panel-error-footer" style={{ 
                        position: 'absolute',
                        bottom: '68px', // ナビゲーターの上（16px padding + 52px height）
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10,
                        display: 'flex', 
                        justifyContent: 'center'
                    }}>
                        <button 
                            onClick={() => {
                                const { error, code } = mermaidErrors[currentSlideIndex];
                                const promptText = `スライド ${currentSlideIndex + 1} 枚目のMermaidダイアグラムのレンダリング中に以下のエラーが発生しました。文法を修正し、正しいMermaidコードを再生成してください。\n■ 発生したエラーメッセージ：\n\`\`\`\n${error}\n\`\`\`\n\n■ エラーが発生した元のソースコード：\n\`\`\`mermaid\n${code}\n\`\`\``;
                                onSendMessage(promptText);
                            }}
                            title="AIにエラー内容を送信して修正を依頼します"
                            style={{ 
                                padding: '8px 16px', 
                                fontSize: '13px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                cursor: 'pointer',
                                backgroundColor: 'var(--color-bg-primary)',
                                color: 'var(--color-text-primary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                transition: 'all 0.2s ease',
                                fontWeight: 500
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                e.currentTarget.style.color = 'var(--color-primary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)';
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                e.currentTarget.style.color = 'var(--color-text-primary)';
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                            AIに修正を依頼する
                        </button>
                    </div>
                )}

                {/* ナビゲーション */}
                <SlideNavigation
                    currentIndex={currentSlideIndex}
                    totalSlides={activeSlides.length}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onGoTo={handleGoTo}
                />
            </div>

            {/* 全画面編集モーダル（createPortal でbody直下にレンダリング） */}
            <EditModeModal
                isOpen={isEditOpen}
                slides={activeSlides}
                theme={activeTheme}
                editingSlideIndex={editingSlideIndex}
                onClose={handleCloseEdit}
                onReset={handleReset}
                onSlideChange={handleSlideChange}
                onSlideSelect={setEditingSlideIndex}
                onThemeChange={handleThemeChange}
            />

            {/* スナップショット用隠しコンテナ（エクスポート時に利用） */}
            <div 
                className="snapshot-hidden-container" 
                style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none', zIndex: -1000 }}
                aria-hidden="true"
            >
                {activeSlides.map((slide, index) => (
                    <div 
                        key={`snapshot-${index}`} 
                        id={`slide-capture-${index}`}
                        className="presentation-panel"
                        data-theme={activeTheme}
                        data-palette={currentPalette} // 現在のパレットを反映
                        style={{ width: '960px', height: '540px', position: 'relative' }}
                    >
                        <div className="slide-canvas" style={{ width: '100%', height: '100%', padding: 0, margin: 0, borderRadius: 0, boxShadow: 'none' }}>
                            <div className="slide-frame" style={{ width: '100%', height: '100%' }}>
                                <SlideRenderer
                                    slide={slide}
                                    themeId={activeTheme}
                                    slideIndex={index}
                                    totalSlides={activeSlides.length}
                                    isStatic={true}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
});

export default PresentationPanel;
