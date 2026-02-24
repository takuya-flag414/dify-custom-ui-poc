// src/components/Onboarding/steps/StepReady.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// チェックアイコン
const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

// ロケットアイコン
const RocketIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
);

/**
 * 完了サマリーのアイテム
 */
const SummaryItem = ({ label, value, isPositive }) => (
    <motion.div
        className="ready-summary-item"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
    >
        <span className="ready-summary-label">{label}</span>
        <span className={`ready-summary-value ${isPositive ? 'positive' : 'neutral'}`}>
            {value}
        </span>
    </motion.div>
);

/**
 * ステップ6: 完了画面
 */
const StepReady = ({ name, customInstructions, onComplete, onPrev }) => {
    const hasInstructions = customInstructions && customInstructions.trim().length > 0;

    return (
        <div className="onboarding-step-new" style={{ maxWidth: '800px', margin: '0 auto', padding: '16px 0' }}>
            {/* 完了アイコン */}
            <motion.div
                className="onboarding-icon-new ready-icon-glow"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                    type: 'spring',
                    stiffness: 250,
                    damping: 20,
                    delay: 0.1,
                }}
                style={{ width: '100px', height: '100px', margin: '0 auto 24px' }}
            >
                <RocketIcon />
            </motion.div>

            {/* タイトル */}
            <motion.h1
                className="onboarding-title-new"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px' }}
            >
                {name ? `${name}さん、はじめましょう！` : 'はじめましょう！'}
            </motion.h1>
            <div className="title-decoration-line" style={{ margin: '0 auto 24px' }} />

            {/* サブタイトル */}
            <motion.p
                className="onboarding-subtitle-new"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{ fontSize: '1.25rem', color: 'var(--color-text-sub)', marginBottom: '32px' }}
            >
                準備が整いました。あなたのAIアシスタントが使えます。
            </motion.p>

            {/* サマリーカード */}
            <motion.div
                className="ready-summary-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.45 }}
                style={{ width: '100%', maxWidth: '440px', margin: '0 auto 32px', padding: '24px', borderRadius: 'var(--radius-3xl)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
            >
                <SummaryItem
                    label="お名前"
                    value={name || '（未設定）'}
                    isPositive={!!name}
                />
                <SummaryItem
                    label="カスタム指示"
                    value={hasInstructions ? '設定済み ✓' : '未設定（後で設定できます）'}
                    isPositive={hasInstructions}
                />
            </motion.div>

            {/* ボタン */}
            <motion.div
                className="onboarding-actions-new"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.45 }}
                style={{ flexDirection: 'row', maxWidth: 'none', justifyContent: 'center', paddingTop: 0 }}
            >
                <button
                    type="button"
                    className="onboarding-btn-new onboarding-btn-secondary-new"
                    onClick={onPrev}
                    style={{ minWidth: '120px' }}
                >
                    戻る
                </button>
                <motion.button
                    className="onboarding-btn-new onboarding-btn-primary-new"
                    onClick={onComplete}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ minWidth: '240px' }}
                >
                    チャットをはじめる
                </motion.button>
            </motion.div>
        </div>
    );
};

export default StepReady;
