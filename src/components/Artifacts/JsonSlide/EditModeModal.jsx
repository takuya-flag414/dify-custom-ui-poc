// src/components/Artifacts/JsonSlide/EditModeModal.jsx
// フォームベース編集モードの全画面モーダルコンポーネント
// React.createPortal で document.body 直下にレンダリングし、z-index の制約を回避する
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SlideRenderer from './SlideRenderer';
import SlideFormEditor from './SlideFormEditor';
// import { THEME_TOKENS } from './PresentationPanel';
import './EditModeModal.css';

// ======================================
// アイコン
// ======================================

const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ResetIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 .49-3.12" />
    </svg>
);

const PencilIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

// ======================================
// EditModeModal
// ======================================

/**
 * EditModeModal
 * @param {boolean} isOpen - モーダルの表示状態
 * @param {Array}   slides - 編集中のスライド配列（slideData）
 * @param {string}  theme  - 現在のテーマ名
 * @param {number}  editingSlideIndex - 選択中スライドのインデックス
 * @param {function} onClose - 閉じるコールバック
 * @param {function} onReset - リセットコールバック
 * @param {function} onSlideChange - (index, updatedSlide) => void
 * @param {function} onSlideSelect - (index) => void
 * @param {function} onThemeChange - (theme) => void
 */
const EditModeModal = ({
    isOpen,
    slides = [],
    theme,
    editingSlideIndex,
    onClose,
    onReset,
    onSlideChange,
    onSlideSelect,
    onThemeChange,
}) => {
    // モーダルが開いている間、背景のスクロールを抑制
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Escape キーで閉じる
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const currentSlide = slides[editingSlideIndex];

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="edit-mode-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    // オーバーレイ自体のクリックで閉じない（意図的）
                >
                    <motion.div
                        className="edit-mode-modal"
                        initial={{ scale: 0.95, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.97, opacity: 0, y: 4 }}
                        transition={{
                            // DESIGN_RULE §6.1 Standard UI Transition
                            type: 'spring',
                            stiffness: 250,
                            damping: 25,
                            mass: 1,
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* ヘッダー */}
                        <header className="edit-mode-header">
                            <div className="edit-mode-header-left">
                                <PencilIcon />
                                <h2 className="edit-mode-header-title">スライドを編集</h2>
                            </div>
                            <div className="edit-mode-header-right">
                                <button
                                    type="button"
                                    className="edit-mode-header-btn edit-mode-reset-btn"
                                    onClick={onReset}
                                    title="初期データにリセット"
                                >
                                    <ResetIcon />
                                    リセット
                                </button>
                                <button
                                    type="button"
                                    className="edit-mode-header-btn edit-mode-close-btn"
                                    onClick={onClose}
                                    title="編集を終了（Esc）"
                                >
                                    <CloseIcon />
                                    閉じる
                                </button>
                            </div>
                        </header>

                        {/* ボディ（左右分割） */}
                        <div className="edit-mode-body">
                            {/* ===== 左ペイン ===== */}
                            <aside className="edit-mode-left-pane">
                                {/* スライドサムネイルリスト */}
                                <nav className="edit-slide-list" aria-label="スライド一覧">
                                    {slides.map((slide, idx) => (
                                        <button
                                            key={slide.id || idx}
                                            type="button"
                                            className={`edit-slide-list-item${idx === editingSlideIndex ? ' active' : ''}`}
                                            onClick={() => onSlideSelect(idx)}
                                            title={`スライド ${idx + 1}: ${slide.content?.title || ''}`}
                                        >
                                            <span className="edit-slide-list-number">{idx + 1}</span>
                                            <span className="edit-slide-list-label">
                                                {slide.content?.title || slide.layout_type || `スライド ${idx + 1}`}
                                            </span>
                                        </button>
                                    ))}
                                </nav>

                                {/* フォームエリア */}
                                <div className="edit-form-area">
                                    <SlideFormEditor
                                        slide={currentSlide}
                                        globalTheme={theme}
                                        onSlideChange={(updatedSlide) => onSlideChange(editingSlideIndex, updatedSlide)}
                                        onThemeChange={onThemeChange}
                                    />
                                </div>
                            </aside>

                            {/* ===== 右ペイン（プレビュー） ===== */}
                            <section className="edit-mode-right-pane" aria-label="プレビュー">
                                <span className="edit-preview-label">LIVE PREVIEW</span>
                                {currentSlide && (
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={editingSlideIndex}
                                            className="edit-preview-slide-wrapper"
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                                        >
                                            <div className="presentation-panel" data-theme={theme} style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                                                <SlideRenderer
                                                    slide={currentSlide}
                                                    themeId={theme}
                                                    slideIndex={editingSlideIndex}
                                                    totalSlides={slides.length}
                                                    isStatic={true}
                                                />
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                )}
                            </section>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // createPortal で body 直下にレンダリング
    return createPortal(modalContent, document.body);
};

export default EditModeModal;
