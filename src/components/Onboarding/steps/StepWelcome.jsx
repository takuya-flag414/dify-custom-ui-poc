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
                >
                    ようこそ
                </motion.h1>

                {/* サブタイトル */}
                <motion.p
                    className="onboarding-subtitle-new"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    style={{ color: 'var(--color-primary)' }}
                >
                    あなたの新しい思考のパートナーへ。
                </motion.p>
                <div className="title-decoration-line" style={{ marginTop: '24px' }} />
            </div>

            <div className="onboarding-step-right">
                {/* 説明 */}
                <motion.p
                    className="onboarding-description-new"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    style={{ fontSize: '1.25rem', lineHeight: 1.8 }}
                >
                    まず、このアシスタントでできることを<br />
                    簡単にご紹介します。
                </motion.p>

                {/* アクションバー（Sticky Footer） */}
                <motion.div
                    className="onboarding-footer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    <div className="onboarding-footer-left">
                        <button
                            type="button"
                            className="onboarding-btn-new onboarding-btn-ghost-new"
                            onClick={onSkip}
                            style={{ minWidth: '120px' }}
                        >
                            スキップ
                        </button>
                    </div>

                    <div className="onboarding-pagination">
                        {/* ページネーション: 現在ステップ0 */}
                        <div className="pagination-dot active" />
                        <div className="pagination-dot" />
                        <div className="pagination-dot" />
                        <div className="pagination-dot" />
                        <div className="pagination-dot" />
                        <div className="pagination-dot" />
                    </div>

                    <div className="onboarding-footer-right">
                        <button
                            className="onboarding-btn-new onboarding-btn-primary-new"
                            onClick={onNext}
                            style={{ minWidth: '200px', height: '48px', fontSize: '15px' }}
                        >
                            チュートリアルを開始
                            <ArrowRightIcon />
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default StepWelcome;
