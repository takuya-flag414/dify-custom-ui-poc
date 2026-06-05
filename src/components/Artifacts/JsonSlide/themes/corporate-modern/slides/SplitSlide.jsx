// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/slides/SplitSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';

/**
 * SplitSlide - コーポレート対比スライド
 * @param {Object} content - { title, left_title, left_text, left_bullets, right_title, right_text, right_bullets, comparison_icon, annotations }
 */
const SplitSlide = ({ content, isStatic = false }) => {
    const { 
        title, 
        left_title: rawLeftTitle, 
        left_text: rawLeftText, 
        left_bullets: rawLeftBullets = [], 
        right_title: rawRightTitle, 
        right_text: rawRightText, 
        right_bullets: rawRightBullets = [],
        comparison_icon = 'VS',
        annotations = []
    } = content || {};

    // 互換性維持: 旧データ形式の読み替え
    const leftTitle = rawLeftTitle || content.left_label || '現状 / 課題';
    const leftText = rawLeftText || content.left_body;
    const rightTitle = rawRightTitle || content.right_label || '解決策 / 理想';
    const rightText = rawRightText || content.right_body;
    
    const leftBullets = Array.isArray(rawLeftBullets) ? rawLeftBullets : (content.left_column || []);
    const rightBullets = Array.isArray(rawRightBullets) ? rawRightBullets : (content.right_column || []);

    return (
        <div className="json-slide-layout split-slide corporate-style">
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
                <h2 className="agenda-corporate-title">{title}</h2>
            </motion.div>

            {/* ボディエリア */}
            <div className="chart-corporate-body-area">
                <div className="split-body-grid">
                    
                    {/* 左カラム */}
                    <motion.div 
                        className="split-corporate-column"
                        {...(!isStatic && {
                            initial: { opacity: 0, x: -20 },
                            animate: { opacity: 1, x: 0 },
                            transition: { delay: 0.2, duration: 0.5 }
                        })}
                    >
                        <h3 className="split-corporate-sub-title">{leftTitle}</h3>
                        <div className="split-corporate-card">
                            {leftText && <p className="split-corporate-text">{leftText}</p>}
                            {leftBullets.length > 0 && (
                                <ul className="corporate-bullet-list">
                                    {leftBullets.map((bullet, idx) => (
                                        <li key={idx} className="corporate-bullet-item">
                                            <div className="corporate-bullet-icon" style={{ backgroundColor: '#94a3b8' }} />
                                            <span>{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </motion.div>

                    {/* 中央セパレーター */}
                    <div className="split-corporate-divider">
                        <div className="divider-line" />
                        <motion.div 
                            className="divider-icon-wrapper"
                            {...(!isStatic && {
                                initial: { scale: 0, opacity: 0 },
                                animate: { scale: 1, opacity: 1 },
                                transition: { delay: 0.5, type: 'spring', damping: 12 }
                            })}
                        >
                            <div className="divider-icon">{comparison_icon}</div>
                        </motion.div>
                    </div>

                    {/* 右カラム */}
                    <motion.div 
                        className="split-corporate-column"
                        {...(!isStatic && {
                            initial: { opacity: 0, x: 20 },
                            animate: { opacity: 1, x: 0 },
                            transition: { delay: 0.4, duration: 0.5 }
                        })}
                    >
                        <h3 className="split-corporate-sub-title">{rightTitle}</h3>
                        <div className="split-corporate-card highlight">
                            {rightText && <p className="split-corporate-text">{rightText}</p>}
                            {rightBullets.length > 0 && (
                                <ul className="corporate-bullet-list">
                                    {rightBullets.map((bullet, idx) => (
                                        <li key={idx} className="corporate-bullet-item">
                                            <div className="corporate-bullet-icon" />
                                            <span>{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* 注釈エリア (最下部) */}
                {annotations.length > 0 && (
                    <motion.div 
                        className="kpi-corporate-annotations"
                        style={{ marginTop: 'auto', paddingTop: '1.5cqi' }}
                        {...(!isStatic && {
                            initial: { opacity: 0 },
                            animate: { opacity: 1 },
                            transition: { delay: 0.6, duration: 0.5 }
                        })}
                    >
                        {annotations.map((note, idx) => (
                            <div key={idx}>{note}</div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default SplitSlide;
