// src/components/Chat/SuggestionCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import './SuggestionCard.css';

/**
 * CardContent のProps型
 */
interface CardContentProps {
    Icon?: LucideIcon;
    title: string;
    description: string;
}

/**
 * 内部コンテンツコンポーネント
 */
const CardContent: React.FC<CardContentProps> = ({ Icon, title, description }) => (
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

/**
 * SuggestionCard のProps型
 */
interface SuggestionCardProps {
    /** アイコンコンポーネント (lucide-react) */
    icon?: LucideIcon;
    /** カードタイトル */
    title: string;
    /** カード説明文 */
    description: string;
    /** クリック時のコールバック（省略時は静的表示） */
    onClick?: () => void;
    /** AI推奨アクションフラグ */
    isAiSuggested?: boolean;
}

/**
 * 機能提案カードコンポーネント (Optimized)
 * Framer Motionによる物理挙動アニメーション付き
 */
const SuggestionCard: React.FC<SuggestionCardProps> = ({
    icon: Icon,
    title,
    description,
    onClick,
    isAiSuggested = false,
}) => {
    // インタラクティブでない場合は静的なdivとしてレンダリング
    if (!onClick) {
        return (
            <div className={`suggestion-card ${isAiSuggested ? 'ai-glow' : ''}`}>
                <CardContent Icon={Icon} title={title} description={description} />
            </div>
        );
    }

    // Spring Physics Parameters
    const springTransition = {
        type: "spring" as const,
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
            <div className="suggestion-card-arrow-indicator" />
        </motion.button>
    );
};

export default SuggestionCard;
