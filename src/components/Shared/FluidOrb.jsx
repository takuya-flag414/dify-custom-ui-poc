// src/components/Shared/FluidOrb.jsx
// AIの思考状態を表現する有機的なオーブアニメーション
import React from 'react';
import { motion } from 'framer-motion';
import './FluidOrb.css';

const FluidOrb = () => (
    <div className="fluid-orb-container">
        <svg viewBox="0 0 100 100" className="fluid-orb-svg">
            <defs>
                {/* Metaball効果を実現するSVGフィルター */}
                <filter id="goo">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feColorMatrix
                        in="blur"
                        mode="matrix"
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                        result="goo"
                    />
                </filter>
            </defs>
            <g filter="url(#goo)">
                {/* 大きな円 - ゆっくり動く */}
                <motion.circle
                    cx="50"
                    cy="50"
                    r="12"
                    animate={{
                        cx: [50, 55, 45, 50],
                        cy: [50, 45, 55, 50],
                        r: [12, 14, 11, 12]
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut"
                    }}
                />
                {/* 中サイズの円 - 少し速く動く */}
                <motion.circle
                    cx="50"
                    cy="50"
                    r="10"
                    animate={{
                        cx: [50, 42, 58, 50],
                        cy: [50, 55, 48, 50],
                        r: [10, 12, 9, 10]
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 2.5,
                        ease: "easeInOut",
                        delay: 0.5
                    }}
                />
                {/* 小さな円 - 最も速く動く */}
                <motion.circle
                    cx="50"
                    cy="50"
                    r="8"
                    animate={{
                        cx: [50, 48, 54, 50],
                        cy: [50, 52, 46, 50],
                        r: [8, 9, 7, 8]
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "easeInOut",
                        delay: 0.3
                    }}
                />
            </g>
        </svg>
    </div>
);

export default FluidOrb;
