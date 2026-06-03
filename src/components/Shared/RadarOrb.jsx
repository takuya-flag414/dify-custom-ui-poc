import React from 'react';
import { motion } from 'framer-motion';
import './RadarOrb.css';

/**
 * RadarOrb: LLMの思考状態を視覚化するレーダー型アニメーション
 * @param {string} mode - 'search', 'thinking', 'writing', 'error'
 * @param {string} size - size of the orb (default: 24px)
 * @param {boolean} isReversed - true if the orb should spin in reverse (clockwise)
 */
const RadarOrb = ({ mode = 'thinking', size = '24px', isReversed = false }) => {
    const modeClass = `radar-mode-${mode}`;
    const reversedClass = isReversed ? 'is-reversed' : '';
    // Base size is 64px, scale accordingly
    const sizeValue = parseFloat(size);
    const scaleFactor = isNaN(sizeValue) ? 1 : sizeValue / 64; 

    // Spring transition config (Framer Motion)
    const springConfig = {
        type: "spring",
        stiffness: 120,
        damping: 15,
        mass: 0.8
    };

    // Idle状態のときはスケールを小さくし、活動中は通常サイズにする
    const isIdle = mode === 'idle';
    const currentScale = isIdle ? scaleFactor * 0.9 : scaleFactor;

    return (
        <div className={`radar-orb-wrapper ${modeClass} ${reversedClass}`} style={{ width: size, height: size }}>
            <motion.div 
                className="radar-loader" 
                animate={{ 
                    scaleX: isReversed ? -1 : 1, 
                    scaleY: 1, 
                    scale: currentScale 
                }}
                transition={springConfig}
                style={{ originX: 0.5, originY: 0.5 }}
            >
                {/* 彗星の尾を表現する外側の軌道 */}
                <div className="comet-orbit">
                    <div className="comet-trail"></div>
                </div>
                {/* 内部のLiquid Core (マルチレイヤー・グロー) */}
                <div className="radar-core-orb"></div>
            </motion.div>
        </div>
    );
};

export default RadarOrb;
