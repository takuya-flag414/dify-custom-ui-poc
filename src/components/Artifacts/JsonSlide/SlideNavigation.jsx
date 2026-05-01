// src/components/Artifacts/JsonSlide/SlideNavigation.jsx
// スライドナビゲーション: 前/次ボタン + ページドットインジケーター
import React from 'react';
import { motion } from 'framer-motion';

const ChevronLeftIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const ChevronRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

/**
 * SlideNavigation - スライド移動コントロール
 * @param {number} currentIndex - 現在のスライドインデックス（0-indexed）
 * @param {number} totalSlides - 総スライド数
 * @param {function} onPrev - 前へ
 * @param {function} onNext - 次へ
 * @param {function} onGoTo - 指定インデックスへジャンプ
 */
const SlideNavigation = ({ currentIndex, totalSlides, onPrev, onNext, onGoTo }) => {
    if (totalSlides <= 1) return null;

    return (
        <div className="slide-navigation">
            {/* 前へボタン */}
            <motion.button
                className="slide-nav-btn"
                onClick={onPrev}
                disabled={currentIndex === 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="前のスライド"
            >
                <ChevronLeftIcon />
            </motion.button>

            {/* ページドットインジケーター */}
            <div className="slide-nav-dots">
                {Array.from({ length: totalSlides }, (_, i) => (
                    <motion.button
                        key={i}
                        className={`slide-nav-dot ${i === currentIndex ? 'active' : ''}`}
                        onClick={() => onGoTo(i)}
                        whileHover={{ scale: 1.3 }}
                        whileTap={{ scale: 0.9 }}
                        title={`スライド ${i + 1}`}
                    />
                ))}
            </div>

            {/* 次へボタン */}
            <motion.button
                className="slide-nav-btn"
                onClick={onNext}
                disabled={currentIndex === totalSlides - 1}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="次のスライド"
            >
                <ChevronRightIcon />
            </motion.button>
        </div>
    );
};

export default SlideNavigation;
