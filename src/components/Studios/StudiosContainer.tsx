/**
 * StudiosContainer - Studios機能のルートコンテナ
 * 
 * StudioProviderでラップし、activeStudioIdに基づいて
 * Gallery または Chat画面を切り替えて表示する
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StudioProvider, useStudio } from '../../context/StudioContext';
import { Studio } from '../../types/studio';
import { StudioGallery } from './StudioGallery';
import { StudioWizardModal } from './Wizard/StudioWizardModal';
import { AmbientGlow } from '../Layout/AmbientGlow';
import './StudiosContainer.css';

interface StudiosContainerInnerProps {
    /** アクティブスタジオ時にレンダリングするチャットエリア */
    children?: React.ReactNode;
    /** スタジオ入室時のコールバック（会話リセット用） */
    onStudioEnter?: () => void;
    /** ギャラリー強制表示フラグ */
    forceShowGallery?: boolean;
    /** ギャラリー表示後のコールバック（フラグリセット用） */
    onGalleryShown?: () => void;
}

/**
 * StudiosContainerInner - 実際のUI制御
 */
const StudiosContainerInner: React.FC<StudiosContainerInnerProps> = ({
    children,
    onStudioEnter,
    forceShowGallery,
    onGalleryShown,
}) => {
    const { activeStudio, activeStudioId, exitStudio, enterStudio } = useStudio();
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [editingStudio, setEditingStudio] = useState<Studio | undefined>(undefined);

    // forceShowGalleryの前回値を追跡
    const [prevForceShowGallery, setPrevForceShowGallery] = useState(false);

    // forceShowGalleryがfalse→trueに変化したときだけギャラリーを表示
    useEffect(() => {
        if (forceShowGallery && !prevForceShowGallery && activeStudioId) {
            exitStudio();
        }
        // ギャラリー表示後にフラグをリセット
        if (forceShowGallery && !activeStudioId) {
            onGalleryShown?.();
        }
        setPrevForceShowGallery(!!forceShowGallery);
    }, [forceShowGallery, prevForceShowGallery, activeStudioId, exitStudio, onGalleryShown]);

    // スタジオ入室ハンドラー（コールバック付き）
    const handleEnterStudio = (studioId: string) => {
        // 先にコールバックを呼び出して会話をリセット
        onStudioEnter?.();
        // その後スタジオに入室
        enterStudio(studioId);
    };

    // 新規作成ウィザードを開く
    const handleOpenWizard = () => {
        setEditingStudio(undefined);
        setIsWizardOpen(true);
    };

    // 編集ウィザードを開く
    const handleOpenEditWizard = (studio: Studio) => {
        setEditingStudio(studio);
        setIsWizardOpen(true);
    };

    // ウィザードを閉じる
    const handleCloseWizard = () => {
        setIsWizardOpen(false);
        setEditingStudio(undefined);
    };

    // 画面遷移アニメーション
    const transitionVariants = {
        initial: {
            opacity: 0,
            scale: 0.98,
            filter: 'blur(4px)',
        },
        enter: {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            transition: {
                type: 'spring' as const,
                stiffness: 200,
                damping: 25,
            },
        },
        exit: {
            opacity: 0,
            scale: 0.98,
            filter: 'blur(4px)',
            transition: {
                duration: 0.2,
            },
        },
    };

    return (
        <div className="studios-container">
            {/* Ambient Glow Background */}
            <AmbientGlow
                themeColor={activeStudio?.themeColor || 'blue'}
                opacity={activeStudioId ? 0.5 : 0.3}
            />

            {/* Content */}
            <AnimatePresence mode="wait">
                {activeStudioId && activeStudio ? (
                    // Active Studio: Show Chat with custom header
                    <motion.div
                        key="active-studio"
                        className="studios-container__active"
                        variants={transitionVariants}
                        initial="initial"
                        animate="enter"
                        exit="exit"
                    >
                        <div className="studios-container__chat">
                            {children}
                        </div>
                    </motion.div>
                ) : (
                    // Gallery: Show studio selection
                    <motion.div
                        key="gallery"
                        className="studios-container__gallery"
                        variants={transitionVariants}
                        initial="initial"
                        animate="enter"
                        exit="exit"
                    >
                        <StudioGallery
                            onOpenWizard={handleOpenWizard}
                            onOpenEditWizard={handleOpenEditWizard}
                            onEnterStudio={handleEnterStudio}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Wizard Modal */}
            <StudioWizardModal
                isOpen={isWizardOpen}
                onClose={handleCloseWizard}
                editingStudio={editingStudio}
            />
        </div>
    );
};

interface StudiosContainerProps {
    children?: React.ReactNode;
    /** スタジオ入室時のコールバック（会話リセット用） */
    onStudioEnter?: () => void;
    /** ギャラリー強制表示フラグ（Studiosボタン押下時に使用） */
    forceShowGallery?: boolean;
    /** ギャラリー表示後のコールバック（フラグリセット用） */
    onGalleryShown?: () => void;
}

/**
 * StudiosContainer - StudioProviderでラップ
 */
export const StudiosContainer: React.FC<StudiosContainerProps> = ({
    children,
    onStudioEnter,
    forceShowGallery,
    onGalleryShown,
}) => {
    return (
        <StudioProvider>
            <StudiosContainerInner
                onStudioEnter={onStudioEnter}
                forceShowGallery={forceShowGallery}
                onGalleryShown={onGalleryShown}
            >
                {children}
            </StudiosContainerInner>
        </StudioProvider>
    );
};

export default StudiosContainer;


