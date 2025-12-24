// src/components/Onboarding/steps/StepWelcome.jsx
import React from 'react';
import { motion } from 'framer-motion';

// App Icon with animation
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
 * ステップ1: ウェルカム画面
 * アプリへの最初の印象を決める重要な画面
 * - アイコンにグロー + パルス効果
 * - タイトルに段階的表示
 * - ボタンにバウンスアニメーション
 */
const StepWelcome = ({ onNext }) => {
    return (
        <div className="onboarding-step-new">
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
            >
                あなたの新しい思考のパートナーへ。
            </motion.p>

            {/* 説明 */}
            <motion.p
                className="onboarding-description-new"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
            >
                数ステップの簡単な設定で、<br />
                あなたに最適化されたAIアシスタントが始まります。
            </motion.p>

            {/* ボタン */}
            <motion.div
                className="onboarding-actions-new"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
            >
                <motion.button
                    className="onboarding-btn-new onboarding-btn-primary-new"
                    onClick={onNext}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    始める
                    <ArrowRightIcon />
                </motion.button>
            </motion.div>
        </div>
    );
};

export default StepWelcome;
