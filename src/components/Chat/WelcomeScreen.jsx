// src/components/Chat/WelcomeScreen.jsx
// Zen Mode Welcome Screen - Feature B
// ChatInput centered layout

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './WelcomeScreen.css';
import { getTimeBasedGreeting } from '../../utils/timeUtils';
import ChatInput from './ChatInput';
import { useSeasonalBackground } from '../../hooks/useSeasonalBackground';

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
}) => {
    const { greeting, subMessage } = getTimeBasedGreeting(userName);
    const [isFaded, setIsFaded] = useState(false);

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
                {/* Greeting Display (Above ChatInput) */}
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

                {/* Hero ChatInput (Centered) */}
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
                    />
                </motion.div>

                {/* Guide Text */}
                <motion.p
                    className={`welcome-guide-text ${isFaded ? 'faded' : ''}`}
                    variants={itemVariants}
                >
                    または、サイドバーの「✨ Intelligence」からツールをお選びください。
                </motion.p>

                {/* Footer */}
                <motion.footer
                    className={`welcome-footer-links ${isFaded ? 'faded' : ''}`}
                    variants={itemVariants}
                >
                    <button className="link-button" onClick={onStartTutorial}>
                        使い方ガイドを見る
                    </button>
                    <span className="footer-divider">|</span>
                    <button className="link-button" onClick={() => window.open('https://wiki.company.local', '_blank')}>
                        システム更新情報
                    </button>
                </motion.footer>
            </motion.div>
        </div>
    );
};

export default WelcomeScreen;