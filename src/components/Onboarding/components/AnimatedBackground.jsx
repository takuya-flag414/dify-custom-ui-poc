// src/components/Onboarding/components/AnimatedBackground.jsx
import React from 'react';
import { motion } from 'framer-motion';
import './AnimatedBackground.css';

/**
 * 呼吸するようにゆっくり動く背景グラデーション
 * "AIが生きている"感覚を演出
 */
const AnimatedBackground = () => {
    return (
        <div className="animated-background">
            {/* メインのグラデーションオーブ */}
            <motion.div
                className="gradient-orb gradient-orb-1"
                animate={{
                    x: [0, 100, 50, 0],
                    y: [0, 50, 100, 0],
                    scale: [1, 1.2, 1.1, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.div
                className="gradient-orb gradient-orb-2"
                animate={{
                    x: [0, -80, -40, 0],
                    y: [0, 80, 40, 0],
                    scale: [1.1, 1, 1.2, 1.1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <motion.div
                className="gradient-orb gradient-orb-3"
                animate={{
                    x: [0, 60, -30, 0],
                    y: [0, -60, 30, 0],
                    scale: [1, 1.15, 1.05, 1],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
        </div>
    );
};

export default AnimatedBackground;
