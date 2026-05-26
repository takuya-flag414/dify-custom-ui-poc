// src/components/Chat/WelcomeScreen.jsx
// Zen Mode Welcome Screen - Feature B
// ChatInput centered layout

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './WelcomeScreen.css';
import { getTimeBasedGreeting } from '../../utils/timeUtils';
import ChatInput from './ChatInput';
import { useSeasonalBackground } from '../../hooks/useSeasonalBackground';
import PromptWizardModal from './Wizard/PromptWizardModal';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.15 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { type: "spring", stiffness: 200, damping: 24, mass: 1 }
    }
};

/**
 * WelcomeScreen - Zen Mode
 * 
 * 中央にChatInputを配置し、その上に挨拶を表示。
 * Focus Fade: 入力フォーカス時に挨拶をフェードアウト。
 */
const WelcomeScreen = ({
    userName,
    onStartTutorial,
    // ChatInput用Props
    onSendMessage,
    isGenerating = false,
    activeContextFiles = [],
    setActiveContextFiles,
    searchSettings,
    setSearchSettings,
    onOpenConfig,
    // Phase B: Backend B連携用
    mockMode = 'OFF',
    backendBApiKey = '',
    backendBApiUrl = '',
    activeArtifact, // ★追加
    setActiveArtifact, // ★追加
    sendKey,
    // ★追加: Wizard連携
    restoreText,
    onRestoreTextConsumed,
    onWizardComplete,
    onEnterSlideStudio, // ★追加
    onEnterDocumentStudio, // ★追加
    onEnterMermaidStudio, // ★追加
    onEnterDrawioStudio, // ★追加
}) => {
    const { greeting, subMessage } = getTimeBasedGreeting(userName);
    const [isFaded, setIsFaded] = useState(false);
    const [activeWizardId, setActiveWizardId] = useState(null);

    // ★追加: チップクリック時のハンドラ
    const handleChipClick = (id) => {
        if (id === 'slide_creation' && onEnterSlideStudio) {
            onEnterSlideStudio();
        } else if (id === 'document_studio' && onEnterDocumentStudio) {
            onEnterDocumentStudio();
        } else if (id === 'mermaid_studio' && onEnterMermaidStudio) {
            onEnterMermaidStudio();
        } else if (id === 'drawio_studio' && onEnterDrawioStudio) {
            onEnterDrawioStudio();
        } else {
            setActiveWizardId(id);
        }
    };

    // Get the seasonal background CSS class if we are in a special period
    const seasonalClass = useSeasonalBackground();

    // フォーカスイベント監視
    useEffect(() => {
        const handleFocusIn = (e) => {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
                setIsFaded(true);
            }
        };

        const handleFocusOut = (e) => {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
                setTimeout(() => {
                    const activeEl = document.activeElement;
                    if (activeEl.tagName !== 'TEXTAREA' && activeEl.tagName !== 'INPUT') {
                        setIsFaded(false);
                    }
                }, 100);
            }
        };

        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);

        return () => {
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    return (
        <div className={`welcome-container welcome-container--zen ${seasonalClass || ''}`}>
            <motion.div
                className="welcome-inner welcome-inner--zen"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Grid-based layout for vertical centering */}
                <div className="welcome-grid-layout">
                    {/* Greeting Display (Row 1 bottom-aligned) */}
                    <motion.header
                        className={`welcome-greeting ${isFaded ? 'faded' : ''}`}
                        variants={itemVariants}
                    >
                        <div className="welcome-logo-badge">
                            Desktop Intelligence
                        </div>
                        <h1 className="welcome-title">{greeting}</h1>
                        <p className="welcome-subtitle">
                            {subMessage}
                        </p>
                    </motion.header>

                    {/* Hero ChatInput (Row 2 vertically centered) */}
                    <motion.div
                        className="welcome-hero-input"
                        variants={itemVariants}
                    >

                        <ChatInput
                            isLoading={isGenerating}
                            onSendMessage={onSendMessage}
                            isCentered={true}
                            activeContextFiles={activeContextFiles}
                            setActiveContextFiles={setActiveContextFiles}
                            searchSettings={searchSettings}
                            setSearchSettings={setSearchSettings}
                            onOpenConfig={onOpenConfig}
                            mockMode={mockMode}
                            backendBApiKey={backendBApiKey}
                            backendBApiUrl={backendBApiUrl}
                            activeArtifact={activeArtifact} // ★追加
                            setActiveArtifact={setActiveArtifact} // ★追加
                            sendKey={sendKey}
                            restoreText={restoreText}
                            onRestoreTextConsumed={onRestoreTextConsumed}
                        />

                        {/* 各種生成スタジオ機能の起動ボタン（Gensparkスタイル） */}
                        <div className={`welcome-feature-launcher ${isFaded ? 'faded' : ''}`}>
                            <button className="feature-launch-button slide" onClick={() => handleChipClick('slide_creation')}>
                                <div className="feature-icon-wrapper">
                                    {/* AIスライド用のカスタムSVG（プロジェクタースクリーンと資料構成） */}
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="3" width="20" height="14" rx="2" />
                                        <path d="M8 21l4-4 4 4" />
                                        <path d="M12 17v4" />
                                        <line className="anim-slide-item anim-slide-1" x1="6" y1="7" x2="18" y2="7" strokeWidth="1.5" />
                                        <g className="anim-slide-item anim-slide-2">
                                            <circle cx="7" cy="11" r="1" />
                                            <line x1="10" y1="11" x2="16" y2="11" strokeWidth="1.5" />
                                        </g>
                                        <g className="anim-slide-item anim-slide-3">
                                            <circle cx="7" cy="14" r="1" />
                                            <line x1="10" y1="14" x2="14" y2="14" strokeWidth="1.5" />
                                        </g>
                                    </svg>
                                </div>
                                <span className="feature-label">AIスライド</span>
                            </button>
                            <button className="feature-launch-button document" onClick={() => handleChipClick('document_studio')}>
                                <div className="feature-icon-wrapper">
                                    {/* AIドキュメント用のカスタムSVG（Word風のテキスト書類レイアウト） */}
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
                                        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                                        <line className="anim-doc-line anim-doc-1" x1="7" y1="12" x2="17" y2="12" strokeWidth="2.5" />
                                        <line className="anim-doc-line anim-doc-2" x1="7" y1="16" x2="17" y2="16" strokeWidth="1.5" />
                                        <line className="anim-doc-line anim-doc-3" x1="7" y1="19" x2="13" y2="19" strokeWidth="1.5" />
                                    </svg>
                                </div>
                                <span className="feature-label">AIドキュメント</span>
                            </button>
                            <button className="feature-launch-button mermaid" onClick={() => handleChipClick('mermaid_studio')}>
                                <div className="feature-icon-wrapper">
                                    {/* AI構成・設計図用のカスタムSVG（サーバー、DB、接続コネクタのシステムアーキテクチャ） */}
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect className="anim-mermaid-node" x="10" y="2" width="8" height="5" rx="1" />
                                        <path className="anim-mermaid-node anim-mermaid-db" d="M4 19v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H6a2 2 0 0 1-2-2z" />
                                        <rect className="anim-mermaid-node" x="16" y="16" width="6" height="6" rx="1" />
                                        <path d="M14 7v6c0 1.1-.9 2-2 2H8" />
                                        <path d="M14 11h5c1.1 0 2 .9 2 2v3" />
                                        <circle className="anim-mermaid-dot" cx="14" cy="7" r="1.5" fill="currentColor" />
                                        <circle className="anim-mermaid-dot" cx="8" cy="15" r="1.5" fill="currentColor" />
                                    </svg>
                                </div>
                                <span className="feature-label">AI構成・設計図</span>
                            </button>
                            <button className="feature-launch-button drawio" onClick={() => handleChipClick('drawio_studio')}>
                                <div className="feature-icon-wrapper">
                                    {/* AI業務フロー・手順図用のカスタムSVG（開始、ひし形分岐、処理のフローチャート） */}
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle className="anim-drawio-node anim-drawio-1" cx="12" cy="4" r="3" />
                                        <rect className="anim-drawio-node anim-drawio-3" x="8" y="18" width="8" height="4" rx="1" />
                                        <path className="anim-drawio-node anim-drawio-2" d="M12 9l4 2.5-4 2.5-4-2.5z" />
                                        <path d="M12 7v2" />
                                        <path d="M12 14v4" />
                                    </svg>
                                </div>
                                <span className="feature-label">AI業務フロー・手順図</span>
                            </button>
                        </div>

                        {/* さりげないマニュアルリンク */}
                        <motion.a
                            href="/user_manual.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`welcome-manual-link ${isFaded ? 'faded' : ''}`}
                            variants={itemVariants}
                            whileHover={{ y: -1 }}
                        >
                            <svg className="welcome-manual-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                            <span>ユーザーマニュアル</span>
                            <svg className="welcome-manual-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="7" y1="17" x2="17" y2="7"></line>
                                <polyline points="7 7 17 7 17 17"></polyline>
                            </svg>
                        </motion.a>
                    </motion.div>

                    <div className="welcome-grid-spacer" />
                </div>
            </motion.div>

            {/* ★追加: プロンプトウィザードモーダル */}
            <AnimatePresence>
                {activeWizardId && (
                    <PromptWizardModal
                        wizardId={activeWizardId}
                        onClose={() => setActiveWizardId(null)}
                        onComplete={(prompt, addMenu, context) => {
                            if (onWizardComplete) {
                                onWizardComplete(prompt, addMenu, context);
                            }
                            setActiveWizardId(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default WelcomeScreen;