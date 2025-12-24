// src/components/Onboarding/steps/StepReady.jsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// チェックアイコン
const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

// ロケットアイコン
const RocketIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
);

const STYLE_LABELS = {
    efficient: '効率重視',
    partner: '思考パートナー'
};

// コンフェッティの色
const CONFETTI_COLORS = [
    '#10B981', // 緑
    '#3B82F6', // 青
    '#F59E0B', // オレンジ
    '#EF4444', // 赤
    '#8B5CF6', // 紫
    '#EC4899', // ピンク
];

/**
 * コンフェッティピース
 */
const ConfettiPiece = ({ index, color }) => {
    const angle = (index / 12) * Math.PI * 2;
    const distance = 80 + Math.random() * 40;
    const endX = Math.cos(angle) * distance;
    const endY = Math.sin(angle) * distance;
    const rotation = Math.random() * 720 - 360;
    const size = 6 + Math.random() * 6;

    return (
        <motion.div
            className="confetti-piece"
            style={{
                width: size,
                height: size,
                background: color,
                left: '50%',
                top: '50%',
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
            initial={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 1,
                rotate: 0
            }}
            animate={{
                x: endX,
                y: endY,
                scale: [0, 1.2, 1, 0.8],
                opacity: [1, 1, 1, 0],
                rotate: rotation
            }}
            transition={{
                duration: 1.2,
                delay: 0.3 + index * 0.02,
                ease: [0.25, 0.46, 0.45, 0.94]
            }}
        />
    );
};

/**
 * ステップ4: 準備完了画面
 * コンフェッティ演出、リングパルス、招待的なボタン
 */
const StepReady = ({ name, style, onComplete, onPrev }) => {
    // コンフェッティ生成（メモ化）
    const confettiPieces = useMemo(() =>
        Array.from({ length: 16 }).map((_, i) => ({
            id: i,
            color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]
        })),
        []);

    return (
        <div className="onboarding-step-new">
            {/* チェックアイコン + 演出 */}
            <div className="ready-celebration-wrapper">
                {/* コンフェッティ */}
                <div className="confetti-container">
                    {confettiPieces.map((piece) => (
                        <ConfettiPiece
                            key={piece.id}
                            index={piece.id}
                            color={piece.color}
                        />
                    ))}
                </div>

                {/* メインアイコン */}
                <motion.div
                    className="onboarding-ready-icon-new"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 12,
                        delay: 0.1
                    }}
                    style={{ position: 'relative', zIndex: 1 }}
                >
                    <CheckIcon />
                </motion.div>
            </div>

            {/* タイトル */}
            <motion.h1
                className="onboarding-title-new"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
            >
                準備が整いました、<br />
                <motion.span
                    layoutId="user-display-name"
                    style={{ color: 'var(--color-primary)' }}
                >
                    {name || 'ユーザー'}
                </motion.span>
                さん
            </motion.h1>

            {/* サブタイトル */}
            <motion.p
                className="onboarding-subtitle-new"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
            >
                さっそく始めましょう。
            </motion.p>

            {/* 設定サマリー */}
            <motion.div
                className="onboarding-summary-new"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35, duration: 0.4 }}
            >
                <div className="onboarding-summary-item-new">
                    <span className="onboarding-summary-label-new">お名前</span>
                    <span className="onboarding-summary-value-new">{name || '未設定'}</span>
                </div>
                <div className="onboarding-summary-item-new">
                    <span className="onboarding-summary-label-new">スタイル</span>
                    <span className="onboarding-summary-value-new">{STYLE_LABELS[style] || style}</span>
                </div>
            </motion.div>

            {/* ボタン */}
            <motion.div
                className="onboarding-actions-new"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4 }}
            >
                <motion.button
                    className="onboarding-btn-new onboarding-btn-primary-new"
                    onClick={onComplete}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35), 0 0 0 1px rgba(16, 185, 129, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--space-2)'
                    }}
                >
                    チャットを開始
                    <RocketIcon />
                </motion.button>
                <button
                    type="button"
                    className="onboarding-btn-new onboarding-btn-secondary-new"
                    onClick={onPrev}
                >
                    戻る
                </button>
            </motion.div>
        </div>
    );
};

export default StepReady;
