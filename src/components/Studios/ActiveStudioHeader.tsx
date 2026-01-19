/**
 * ActiveStudioHeader - アクティブスタジオのヘッダー
 * 
 * Studio入室後に表示される専用ヘッダー。
 * 現在のStudioのアイコン・名前を表示し、Galleryへの戻るボタンを提供。
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Settings } from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import './ActiveStudioHeader.css';

interface ActiveStudioHeaderProps {
    /** 設定を開くコールバック */
    onOpenSettings?: () => void;
}

/**
 * ActiveStudioHeader
 */
export const ActiveStudioHeader: React.FC<ActiveStudioHeaderProps> = ({
    onOpenSettings,
}) => {
    const { activeStudio, exitStudio } = useStudio();

    if (!activeStudio) {
        return null;
    }

    return (
        <motion.header
            className="active-studio-header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            {/* Back Button */}
            <motion.button
                className="active-studio-header__back"
                onClick={exitStudio}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label="ギャラリーに戻る"
            >
                <ChevronLeft size={20} />
                <span>Studios</span>
            </motion.button>

            {/* Center: Studio Info */}
            <div className="active-studio-header__center">
                <motion.span
                    className="active-studio-header__icon"
                    animate={{
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    {activeStudio.icon}
                </motion.span>
                <span className="active-studio-header__name">
                    {activeStudio.name}
                </span>
            </div>

            {/* Right: Settings (optional) */}
            <div className="active-studio-header__right">
                {onOpenSettings && (
                    <motion.button
                        className="active-studio-header__settings"
                        onClick={onOpenSettings}
                        whileHover={{ rotate: 30 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="スタジオ設定"
                    >
                        <Settings size={18} />
                    </motion.button>
                )}
            </div>
        </motion.header>
    );
};

export default ActiveStudioHeader;
