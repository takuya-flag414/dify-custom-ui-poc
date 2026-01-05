// src/components/Shared/FluidOrbBackground.jsx
// Glass Sandwich最下層の背景オーブアニメーション
import React from 'react';
import { motion } from 'framer-motion';
import './FluidOrbBackground.css';

/**
 * 背景用の大きなFluid Orbアニメーション
 * ガラス越しにゆっくりと動く光の球を表現
 */
const FluidOrbBackground = () => (
    <div className="fluid-orb-background">
        {/* Primary Orb - 右上 */}
        <motion.div
            className="orb orb-primary"
            animate={{
                x: [0, 50, -30, 0],
                y: [0, -40, 20, 0],
                scale: [1, 1.1, 0.9, 1],
            }}
            transition={{
                repeat: Infinity,
                duration: 20,
                ease: "easeInOut",
            }}
        />

        {/* Secondary Orb - 左下 */}
        <motion.div
            className="orb orb-secondary"
            animate={{
                x: [0, -60, 40, 0],
                y: [0, 30, -50, 0],
                scale: [1, 0.9, 1.1, 1],
            }}
            transition={{
                repeat: Infinity,
                duration: 25,
                ease: "easeInOut",
                delay: 2,
            }}
        />

        {/* Accent Orb - 中央 */}
        <motion.div
            className="orb orb-accent"
            animate={{
                x: [0, 30, -20, 0],
                y: [0, -20, 30, 0],
                scale: [1, 1.05, 0.95, 1],
            }}
            transition={{
                repeat: Infinity,
                duration: 15,
                ease: "easeInOut",
                delay: 5,
            }}
        />
    </div>
);

export default FluidOrbBackground;
