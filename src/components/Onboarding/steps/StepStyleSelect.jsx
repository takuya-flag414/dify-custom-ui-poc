// src/components/Onboarding/steps/StepStyleSelect.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LivePreviewBubble from '../components/LivePreviewBubble';

// 効率重視アイコン
const EfficientIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="13 17 18 12 13 7" />
        <polyline points="6 17 11 12 6 7" />
    </svg>
);

// 思考パートナーアイコン
const PartnerIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
);

// チェックアイコン
const CheckIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const STYLES = [
    {
        id: 'efficient',
        icon: EfficientIcon,
        title: '効率重視',
        description: '結論から簡潔に。箇条書きを多用し、時間を節約します。'
    },
    {
        id: 'partner',
        icon: PartnerIcon,
        title: '思考パートナー',
        description: '背景や理由を含めて丁寧に。壁打ち相手として対話します。'
    }
];

/**
 * ステップ3: スタイル選択
 * チェックバッジ、浮き上がり効果、アイコン拡大付き
 */
const StepStyleSelect = ({ selectedStyle, onStyleChange, onNext, onPrev }) => {
    const handleCardClick = (styleId) => {
        onStyleChange(styleId);
    };

    return (
        <div className="onboarding-step-new" style={{ maxWidth: '720px', width: '100%' }}>
            {/* タイトル */}
            <motion.h1
                className="onboarding-title-new"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                どのようなサポートを<br />希望しますか？
            </motion.h1>

            {/* サブタイトル */}
            <motion.p
                className="onboarding-subtitle-new"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
            >
                あなたに合ったコミュニケーションスタイルを選んでください。
            </motion.p>

            {/* 2カラムレイアウト */}
            <motion.div
                className="onboarding-style-layout"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
            >
                {/* 左: スタイルカード */}
                <div className="style-cards-section">
                    {STYLES.map((style, index) => {
                        const IconComponent = style.icon;
                        const isSelected = selectedStyle === style.id;

                        return (
                            <motion.div
                                key={style.id}
                                className={`onboarding-card-new ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleCardClick(style.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleCardClick(style.id);
                                    }
                                }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{
                                    opacity: isSelected ? 1 : 0.85,
                                    x: 0,
                                    y: isSelected ? -4 : 0
                                }}
                                whileHover={{
                                    opacity: 1,
                                    y: isSelected ? -4 : -2
                                }}
                                transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                                whileTap={{ scale: 0.98 }}
                                style={{ position: 'relative' }}
                            >
                                {/* 選択チェックバッジ */}
                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            className="style-card-check"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                        >
                                            <CheckIcon />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="onboarding-card-icon-new">
                                    <IconComponent />
                                </div>
                                <div className="onboarding-card-content-new">
                                    <h3 className="onboarding-card-title-new">{style.title}</h3>
                                    <p className="onboarding-card-desc-new">{style.description}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* 右: ライブプレビュー */}
                <motion.div
                    className="style-preview-section"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                >
                    <LivePreviewBubble style={selectedStyle} />
                </motion.div>
            </motion.div>

            {/* ボタン */}
            <motion.div
                className="onboarding-actions-new"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
            >
                <motion.button
                    className="onboarding-btn-new onboarding-btn-primary-new"
                    onClick={onNext}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    次へ
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

export default StepStyleSelect;
