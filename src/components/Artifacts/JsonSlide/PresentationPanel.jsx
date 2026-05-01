// src/components/Artifacts/JsonSlide/PresentationPanel.jsx
// JSON Slideのメインコンテナコンポーネント
// artifact_content (JSON文字列) をパースし、スライドをレンダリングする
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideRenderer from './SlideRenderer';
import SlideNavigation from './SlideNavigation';
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
const THEME_TOKENS = {
    'corporate-modern': {
        '--slide-bg-start': '#ffffff',
        '--slide-bg-end': '#f8fafc',
        '--slide-text': '#334155',
        '--slide-text-muted': '#64748b',
        '--slide-accent': '#0f172a',
        '--slide-accent-light': '#e2e8f0',
        '--slide-bullet-color': '#2563eb',
        '--slide-divider': '#cbd5e1',
        '--slide-title-gradient-start': '#1e293b',
        '--slide-title-gradient-end': '#334155',
    },
    'creative-dark': {
        '--slide-bg-start': '#0f0f0f',
        '--slide-bg-end': '#1a1a1a',
        '--slide-text': '#f5f5f5',
        '--slide-text-muted': '#a3a3a3',
        '--slide-accent': '#a855f7',
        '--slide-accent-light': 'rgba(168, 85, 247, 0.15)',
        '--slide-bullet-color': '#a855f7',
        '--slide-divider': 'rgba(255, 255, 255, 0.08)',
        '--slide-title-gradient-start': '#a855f7',
        '--slide-title-gradient-end': '#c084fc',
    },
    'minimal-light': {
        '--slide-bg-start': '#fafafa',
        '--slide-bg-end': '#f0f0f0',
        '--slide-text': '#1a1a1a',
        '--slide-text-muted': '#6b7280',
        '--slide-accent': '#059669',
        '--slide-accent-light': 'rgba(5, 150, 105, 0.1)',
        '--slide-bullet-color': '#059669',
        '--slide-divider': 'rgba(0, 0, 0, 0.08)',
        '--slide-title-gradient-start': '#059669',
        '--slide-title-gradient-end': '#34d399',
    },
};

/**
 * PresentationPanel - JSON Slideのメインコンテナ
 * @param {string} content - artifact_content (JSON文字列)
 * @param {boolean} isGenerating - 生成中かどうか
 * @param {string} viewMode - 表示モード ('single' | 'list')
 * @param {function} setViewMode - モード変更関数
 */
const PresentationPanel = ({ content, isGenerating, viewMode = 'single', setViewMode }) => {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

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
            }));

            return {
                presentationData: {
                    presentation_title: parsed.presentation_title || 'Untitled Presentation',
                    theme: parsed.theme || 'corporate-modern',
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

    // コンテンツが変更されたらスライドを先頭にリセット
    useEffect(() => {
        setCurrentSlideIndex(0);
    }, [content]);

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
                        <motion.div
                            className="generating-pulse"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <span className="generating-icon">🎯</span>
                            <p className="generating-text">プレゼンスライドを構成しています...</p>
                            <p className="generating-subtext">AIが最適なレイアウトを設計しています</p>
                        </motion.div>
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

    const { slides, theme } = presentationData;
    const themeTokens = THEME_TOKENS[theme] || THEME_TOKENS['corporate-modern'];
    const currentSlide = slides[currentSlideIndex];

    // 一覧表示（ギャラリービュー）
    if (viewMode === 'list') {
        return (
            <div
                className="presentation-panel"
                data-theme={theme}
                style={themeTokens}
                tabIndex={0}
            >
                <div className="slide-list-container">
                    {slides.map((slide, index) => (
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
                                    slideIndex={index}
                                    totalSlides={slides.length}
                                    isStatic={true}
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
        <div
            className="presentation-panel"
            data-theme={theme}
            style={themeTokens}
            tabIndex={0}
        >
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
                            slideIndex={currentSlideIndex}
                            totalSlides={slides.length}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ナビゲーション */}
            <SlideNavigation
                currentIndex={currentSlideIndex}
                totalSlides={slides.length}
                onPrev={handlePrev}
                onNext={handleNext}
                onGoTo={handleGoTo}
            />
        </div>
    );
};

export default PresentationPanel;
