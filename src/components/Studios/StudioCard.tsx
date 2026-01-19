/**
 * StudioCard - ガラス質感のスタジオカード
 * 
 * Liquid Glass デザイン準拠のカードコンポーネント。
 * Hover時の物理アニメーション（Scale, Y-axis translation, Glow）を実装。
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import { Studio, IntelligenceColor } from '../../types/studio';
import './StudioCard.css';

interface StudioCardProps {
    /** スタジオデータ */
    studio: Studio;
    /** ホバー状態 */
    isHovered?: boolean;
    /** ホバー開始コールバック */
    onHover?: () => void;
    /** ホバー終了コールバック */
    onLeave?: () => void;
    /** クリックコールバック */
    onClick?: () => void;
    /** 編集コールバック */
    onEdit?: () => void;
    /** 削除コールバック */
    onDelete?: () => void;
    /** デフォルトスタジオかどうか（編集・削除不可） */
    isDefault?: boolean;
}

/**
 * テーマカラーに対応するグローカラーを取得
 */
const getGlowColors = (color: IntelligenceColor): { primary: string; secondary: string } => {
    const colorMap: Record<IntelligenceColor, { primary: string; secondary: string }> = {
        cyan: { primary: '#00FFFF', secondary: '#0088FF' },
        magenta: { primary: '#FF00FF', secondary: '#8800FF' },
        yellow: { primary: '#FFD60A', secondary: '#FF9F0A' },
        blue: { primary: '#007AFF', secondary: '#0055FF' },
        orange: { primary: '#FF9500', secondary: '#FF6B00' },
        green: { primary: '#30D158', secondary: '#00C853' },
        purple: { primary: '#BF5AF2', secondary: '#8944AB' },
    };
    return colorMap[color] || colorMap.blue;
};

/**
 * StudioCard
 * 
 * - Liquid Glass マテリアル
 * - Hover時の浮上アニメーション (scale: 1.02, y: -5)
 * - テーマカラーのGlowエフェクト
 * - 編集・削除ボタン（ユーザー作成スタジオのみ）
 */
export const StudioCard: React.FC<StudioCardProps> = ({
    studio,
    isHovered = false,
    onHover,
    onLeave,
    onClick,
    onEdit,
    onDelete,
    isDefault = false,
}) => {
    const glowColors = useMemo(
        () => getGlowColors(studio.themeColor),
        [studio.themeColor]
    );

    // カードのカスタムCSSプロパティ
    const cardStyle = {
        '--card-glow-primary': glowColors.primary,
        '--card-glow-secondary': glowColors.secondary,
        '--card-glow-alpha': `${glowColors.primary}40`,
    } as React.CSSProperties;

    // 編集ボタンクリック（バブリング防止）
    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit?.();
    };

    // 削除ボタンクリック（バブリング防止）
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.();
    };

    // アクションボタンの表示条件
    const showActions = isHovered && (onEdit || onDelete);

    return (
        <motion.article
            className="studio-card"
            style={cardStyle}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onClick={onClick}
            whileHover={{
                scale: 1.005,
                y: -2,
            }}
            whileTap={{
                scale: 0.98,
            }}
            transition={{
                type: 'spring',
                stiffness: 250,
                damping: 25,
            }}
            role="button"
            tabIndex={0}
            aria-label={`${studio.name}に入室`}
        >
            {/* Glow Layer (Behind) */}
            <motion.div
                className="studio-card__glow"
                animate={{
                    opacity: isHovered ? 0.15 : 0,
                }}
                transition={{
                    duration: 0.3,
                    ease: "easeOut"
                }}
            />

            {/* Glass Surface */}
            <div className="studio-card__surface">
                {/* Action Buttons */}
                <AnimatePresence>
                    {showActions && (
                        <motion.div
                            className="studio-card__actions"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 25,
                            }}
                        >
                            {onEdit && (
                                <motion.button
                                    className="studio-card__action-btn studio-card__action-btn--edit"
                                    onClick={handleEditClick}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    aria-label="スタジオを編集"
                                >
                                    <Pencil size={14} />
                                </motion.button>
                            )}
                            {onDelete && (
                                <motion.button
                                    className="studio-card__action-btn studio-card__action-btn--delete"
                                    onClick={handleDeleteClick}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    aria-label="スタジオを削除"
                                >
                                    <Trash2 size={14} />
                                </motion.button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Icon */}
                <div className="studio-card__icon">
                    <span className="studio-card__emoji">{studio.icon}</span>
                </div>

                {/* Content */}
                <div className="studio-card__content">
                    <h3 className="studio-card__name">{studio.name}</h3>
                    <p className="studio-card__description">{studio.description}</p>
                </div>

                {/* Theme Color Indicator */}
                <div className="studio-card__color-indicator" />
            </div>

            {/* Border Highlight */}
            <div className="studio-card__border" />
        </motion.article>
    );
};

export default StudioCard;

