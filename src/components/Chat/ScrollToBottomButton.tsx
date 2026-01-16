// src/components/Chat/ScrollToBottomButton.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ScrollToBottomButton のProps型
 */
interface ScrollToBottomButtonProps {
    /** ボタンの表示状態 */
    visible: boolean;
    /** クリック時のコールバック */
    onClick: () => void;
}

/**
 * スクロールボタンコンポーネント
 * チャット履歴の一番下へスクロールするボタン
 */
const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({ visible, onClick }) => {
    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={onClick}
                    className="scroll-to-bottom-btn"
                    aria-label="Scroll to bottom"
                    title="一番下へスクロール"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </motion.button>
            )}
        </AnimatePresence>
    );
};

export default ScrollToBottomButton;
