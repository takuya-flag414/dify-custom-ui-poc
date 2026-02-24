// src/components/Onboarding/steps/StepWelcome.jsx
import React from 'react';
import { motion } from 'framer-motion';

// App Icon
const AppIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="10" r="1" fill="currentColor" />
        <circle cx="8" cy="10" r="1" fill="currentColor" />
        <circle cx="16" cy="10" r="1" fill="currentColor" />
    </svg>
);

// 矢印アイコン
const ArrowRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

/**
 * ステップ0: ウェルカム画面
 * チュートリアル開始 または スキップ の選択
 */
const StepWelcome = ({ onNext, onSkip }) => {
    return (
        <div className="onboarding-step-new split-layout">
            <div className="onboarding-step-left">
                {/* アイコン + グローリング */}
                <div className="welcome-icon-wrapper">
                    <motion.div
                        className="onboarding-icon-new welcome-icon-glow"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                            delay: 0.1
                        }}
                    >
                        <AppIcon />
                    </motion.div>
                </div>

                {/* タイトル */}
                <motion.h1
                    className="onboarding-title-new"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '24px' }}
                >
                    ようこそ
                </motion.h1>
                <div className="title-decoration-line" />
            </div>

            <div className="onboarding-step-right">
                {/* サブタイトル */}
                <motion.p
                    className="onboarding-subtitle-new"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    style={{ fontSize: '1.75rem', color: 'var(--color-primary)' }}
                >
                    あなたの新しい思考のパートナーへ。
                </motion.p>

                {/* 説明 */}
                <motion.p
                    className="onboarding-description-new"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    style={{ fontSize: '1.25rem', lineHeight: 1.8, marginBottom: '32px' }}
                >
                    まず、このアシスタントでできることを<br />
                    簡単にご紹介します。
                </motion.p>

                {/* ボタン */}
                <motion.div
                    className="onboarding-actions-new"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    style={{ flexDirection: 'row', maxWidth: 'none', justifyContent: 'flex-start', paddingTop: 0, alignItems: 'center' }}
                >
                    <motion.button
                        className="onboarding-btn-new onboarding-btn-primary-new"
                        onClick={onNext}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ minWidth: '240px' }}
                    >
                        チュートリアルを開始
                        <ArrowRightIcon />
                    </motion.button>
                    <button
                        type="button"
                        className="onboarding-btn-new onboarding-btn-ghost-new"
                        onClick={onSkip}
                        style={{ minWidth: '120px', marginLeft: '12px' }}
                    >
                        スキップ
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default StepWelcome;
