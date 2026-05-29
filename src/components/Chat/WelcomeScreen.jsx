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
import UseCasePanel from './UseCasePanel';

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
    onEnterStudio, // ★追加: 統合型
}) => {
    const { greeting, subMessage } = getTimeBasedGreeting(userName);
    const [isFaded, setIsFaded] = useState(false);
    const [activeWizardId, setActiveWizardId] = useState(null);

    const handleChipClick = (id) => {
        const studioIds = ['slide_creation', 'document_studio', 'mermaid_studio', 'drawio_studio', 'meeting_minutes', 'summarize_text', 'comparison_table', 'checklist', 'faq_creation'];
        if (studioIds.includes(id)) {
            if (onEnterStudio) onEnterStudio(id);
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

                        {/* UseCasePanel - Apple Intelligence風 Glassmorphism パネル */}
                        <UseCasePanel isFaded={isFaded} onSelect={handleChipClick} />

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