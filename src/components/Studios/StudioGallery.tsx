/**
 * StudioGallery - スタジオ一覧画面
 * 
 * アプリケーションのホーム画面。
 * ユーザーが所有するStudioがグリッド状に並ぶ。
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { Studio } from '../../types/studio';
import { defaultStudios } from '../../mocks/studioData';
import StudioCard from './StudioCard';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import './StudioGallery.css';

interface StudioGalleryProps {
    /** ウィザードを開くコールバック */
    onOpenWizard?: () => void;
    /** 編集用ウィザードを開くコールバック */
    onOpenEditWizard?: (studio: Studio) => void;
    /** スタジオ入室コールバック（指定時はこちらを使用） */
    onEnterStudio?: (studioId: string) => void;
}

/**
 * StudioGallery
 * 
 * Studioカードがグリッド状に並ぶエントリー画面
 */
export const StudioGallery: React.FC<StudioGalleryProps> = ({
    onOpenWizard,
    onOpenEditWizard,
    onEnterStudio,
}) => {
    const { studios, enterStudio, deleteStudio } = useStudio();
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    // 削除確認モーダル用の状態
    const [deleteTarget, setDeleteTarget] = useState<Studio | null>(null);

    // デフォルトスタジオかどうかを判定
    const isDefaultStudio = (id: string) => {
        return defaultStudios.some(s => s.id === id);
    };

    // 削除ボタンクリック
    const handleDeleteClick = (studio: Studio) => {
        setDeleteTarget(studio);
    };

    // 削除確定
    const handleDeleteConfirm = () => {
        if (deleteTarget) {
            deleteStudio(deleteTarget.id);
            setDeleteTarget(null);
        }
    };

    // 削除キャンセル
    const handleDeleteCancel = () => {
        setDeleteTarget(null);
    };

    // グリッドアニメーション設定
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: {
            opacity: 0,
            y: 20,
            scale: 0.95,
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 300,
                damping: 25,
            },
        },
    };

    return (
        <div className="studio-gallery">
            {/* Header */}
            <motion.header
                className="studio-gallery__header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <div className="studio-gallery__title-group">
                    <Sparkles className="studio-gallery__icon" size={28} />
                    <h1 className="studio-gallery__title">Studios（開発中）</h1>
                </div>
                <p className="studio-gallery__subtitle">
                    目的に特化した作業空間を選んでください
                </p>
            </motion.header>

            {/* Grid */}
            <motion.div
                className="studio-gallery__grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <AnimatePresence mode="popLayout">
                    {studios.map((studio) => {
                        const isDefault = isDefaultStudio(studio.id);
                        return (
                            <motion.div
                                key={studio.id}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                layout
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                <StudioCard
                                    studio={studio}
                                    isHovered={hoveredId === studio.id}
                                    onHover={() => setHoveredId(studio.id)}
                                    onLeave={() => setHoveredId(null)}
                                    onClick={() => onEnterStudio ? onEnterStudio(studio.id) : enterStudio(studio.id)}
                                    onEdit={() => onOpenEditWizard?.(studio)}
                                    onDelete={() => handleDeleteClick(studio)}
                                    isDefault={isDefault}
                                />
                            </motion.div>
                        );
                    })}

                    {/* New Studio Card */}
                    <motion.div
                        key="add-new"
                        variants={itemVariants}
                        layout
                    >
                        <button
                            className="studio-gallery__add-card"
                            onClick={onOpenWizard}
                            aria-label="新しいスタジオを作成"
                        >
                            <motion.div
                                className="studio-gallery__add-icon"
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            >
                                <Plus size={32} strokeWidth={1.5} />
                            </motion.div>
                            <span className="studio-gallery__add-label">
                                新しいスタジオ
                            </span>
                        </button>
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            {/* 削除確認モーダル */}
            <ConfirmDeleteModal
                isOpen={deleteTarget !== null}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                studioName={deleteTarget?.name || ''}
            />
        </div>
    );
};

export default StudioGallery;

