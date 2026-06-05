// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/slides/ProcessFlowSlide.jsx
// プロセスフロースライド: 複数のステップを矢印で繋いで表示する (コーポレートデザイン版)
import React from 'react';
import { motion } from 'framer-motion';

// 矢印アイコン用SVG
const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

/**
 * ProcessFlowSlide - プロセスフロー図
 * @param {Object} content - { title, key_message, process_steps, annotations }
 * @param {boolean} isStatic - アニメーション無効化
 */
const ProcessFlowSlide = ({ content, isStatic = false }) => {
    const { title, key_message, process_steps, annotations = [] } = content || {};
    const safeSteps = Array.isArray(process_steps) ? process_steps.slice(0, 10) : []; // 最大10ステップ

    const count = safeSteps.length;
    
    // グリッド列数の決定
    let gridCols = count;
    if (count > 5) {
        if (count === 6) gridCols = 3;
        else if (count <= 8) gridCols = 4;
        else gridCols = 5;
    }

    // 項目数に応じたスケーリング
    const processScale = count > 8 ? 0.75 : count > 5 ? 0.85 : 1.0;

    const Container = isStatic ? 'div' : motion.div;
    const Item = isStatic ? 'div' : motion.div;

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
    };

    if (safeSteps.length === 0) {
        return (
            <div className="json-slide-layout json-slide-process corporate-style">
                <div className="agenda-corporate-header">
                    <div className="agenda-accent-bar" />
                    <h2 className="agenda-corporate-title">{title || 'プロセス・フロー'}</h2>
                </div>
                <div className="process-corporate-body">
                    <p className="slide-body-text" style={{ padding: '4cqi', textAlign: 'center' }}>
                        プロセスデータがありません
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="json-slide-layout json-slide-process corporate-style">
            {/* ヘッダー */}
            <motion.div 
                className="agenda-corporate-header"
                {...(!isStatic && {
                    initial: { opacity: 0, x: -20 },
                    animate: { opacity: 1, x: 0 },
                    transition: { duration: 0.5 }
                })}
            >
                <div className="agenda-accent-bar" />
                <h2 className="agenda-corporate-title">{title || 'プロセス・フロー'}</h2>
            </motion.div>
 
            {/* ボディエリア */}
            <div className="process-corporate-body">
                {key_message && (
                    <motion.div 
                        className="process-corporate-key-message"
                        {...(!isStatic && {
                            initial: { opacity: 0, y: 15 },
                            animate: { opacity: 1, y: 0 },
                            transition: { delay: 0.2, duration: 0.6 }
                        })}
                    >
                        {key_message}
                    </motion.div>
                )}

                {/* フロー本体 */}
                <Container
                    className="process-corporate-flow-container"
                    style={{ 
                        '--grid-cols': gridCols,
                        '--process-scale': processScale 
                    }}
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    {safeSteps.map((step, idx) => (
                        <Item key={idx} className="process-corporate-step-wrapper" variants={itemVariants}>
                            {/* ステップ本体 */}
                            <div className="process-corporate-step-card">
                                <div className="process-corporate-step-header">
                                    <div className="process-corporate-step-number">
                                        {String(idx + 1).padStart(2, '0')}
                                    </div>
                                    <h3 className="process-corporate-step-title">{step.title}</h3>
                                </div>
                                {step.description && (
                                    <p className="process-corporate-step-desc">{step.description}</p>
                                )}
                            </div>
                            
                            {/* 矢印（絶対配置: 行末以外 且つ 最後の要素以外） */}
                            {((idx + 1) % gridCols !== 0 && idx < safeSteps.length - 1) && (
                                <div className="process-corporate-arrow">
                                    <ChevronRightIcon />
                                </div>
                            )}
                        </Item>
                    ))}
                </Container>
            </div>

            {/* 注釈（フッター） */}
            {annotations.length > 0 && (
                <div className="content-corporate-footer">
                    {annotations.map((note, idx) => (
                        <p key={idx} className="content-corporate-annotation">{note}</p>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProcessFlowSlide;
