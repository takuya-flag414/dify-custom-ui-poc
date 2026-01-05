// src/components/Chat/SuggestionCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import './SuggestionCard.css';

/**
 * 機能提案カードコンポーネント (Optimized)
 * Framer Motionによる物理挙動アニメーション付き
 */
const SuggestionCard = ({
    icon: Icon,
    title,
    description,
    onClick,
    isAiSuggested = false, // AI推奨アクション用フラグ
}) => {
    // インタラクティブでない場合は静的なdivとしてレンダリング
    if (!onClick) {
        return (
            <div className={`suggestion-card ${isAiSuggested ? 'ai-glow' : ''}`}>
                <CardContent Icon={Icon} title={title} description={description} />
            </div>
        );
    }

    // Spring Physics Parameters (Optimized for low overhead)
    // Stiffness: 300, Damping: 30 (キビキビと動き、すぐに収束する)
    const springTransition = {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 1
    };

    return (
        <motion.button
            className={`suggestion-card interactive ${isAiSuggested ? 'ai-glow' : ''}`}
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{
                scale: 1.02,
                transition: springTransition
            }}
            whileTap={{
                scale: 0.98,
                transition: { duration: 0.1 }
            }}
            transition={springTransition}
            aria-label={`${title}: ${description}`}
        >
            <CardContent Icon={Icon} title={title} description={description} />

            {/* ホバー時の矢印（CSSで制御するためここにはロジックを持たせない） */}
            <div className="suggestion-card-arrow-indicator" />
        </motion.button>
    );
};

// 内部コンテンツの分離
const CardContent = ({ Icon, title, description }) => (
    <>
        <div className="suggestion-card-icon-wrapper">
            {Icon && <Icon className="suggestion-card-icon" />}
        </div>
        <div className="suggestion-card-content">
            <h3 className="suggestion-card-title">{title}</h3>
            <p className="suggestion-card-desc">{description}</p>
        </div>
    </>
);

export default SuggestionCard;