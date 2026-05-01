// src/components/Artifacts/JsonSlide/slides/ProcessFlowSlide.jsx
// プロセスフロースライド: 複数のステップを矢印で繋いで表示する
import React from 'react';
import { motion } from 'framer-motion';

// 矢印アイコン用SVG
const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

/**
 * ProcessFlowSlide - プロセスフロー図
 * @param {Object} content - { title, process_steps }
 * @param {boolean} isStatic - アニメーション無効化
 */
const ProcessFlowSlide = ({ content, isStatic = false }) => {
    const { title, process_steps } = content || {};
    const safeSteps = Array.isArray(process_steps) ? process_steps.slice(0, 4) : [];

    const Container = isStatic ? 'div' : motion.div;
    const Item = isStatic ? 'div' : motion.div;

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } }
    };

    return (
        <div className="json-slide-layout json-slide-process">
            {/* ヘッダー */}
            <div className="content-slide-header">
                <h2 className="slide-section-title">{title || 'プロセス・フロー'}</h2>
                <div className="slide-title-underline" />
            </div>

            {/* フロー本体 */}
            <Container
                className="process-flow-body"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {safeSteps.map((step, idx) => (
                    <React.Fragment key={idx}>
                        {/* ステップカード */}
                        <Item className="slide-card-flat process-step-card" variants={itemVariants}>
                            <div className="process-step-number">{idx + 1}</div>
                            <h3 className="process-step-title">{step.title}</h3>
                            {step.description && (
                                <p className="process-step-desc">{step.description}</p>
                            )}
                        </Item>
                        
                        {/* 矢印（最後の要素以外） */}
                        {idx < safeSteps.length - 1 && (
                            <Item className="process-flow-arrow" variants={itemVariants}>
                                <ChevronRightIcon />
                            </Item>
                        )}
                    </React.Fragment>
                ))}
            </Container>
        </div>
    );
};

export default ProcessFlowSlide;
