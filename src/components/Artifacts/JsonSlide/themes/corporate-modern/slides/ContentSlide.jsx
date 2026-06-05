// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/slides/ContentSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';

/**
 * ContentSlide - コーポレート標準スライド
 * @param {Object} content - { title, key_message, body_text, bullet_points, layout_variation, annotations }
 */
const ContentSlide = ({ content, isStatic = false }) => {
    const { 
        title, 
        key_message: rawKeyMessage, 
        body_text, 
        bullet_points: rawBulletPoints = [], 
        layout_variation = 'one-column',
        annotations = []
    } = content || {};

    // 互換性維持: body_text を key_message として扱う（空の場合）
    const keyMessage = rawKeyMessage || body_text;
    const bulletPoints = Array.isArray(rawBulletPoints) ? rawBulletPoints : [];
    const isTwoColumn = layout_variation === 'two-column';

    return (
        <div className="json-slide-layout content-slide corporate-style">
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
                <h2 className="agenda-corporate-title">{title || 'セクションタイトル'}</h2>
            </motion.div>

            {/* ボディエリア */}
            <div className="chart-corporate-body-area">
                
                {/* キーメッセージ */}
                {keyMessage && (
                    <motion.div 
                        className="corporate-key-message"
                        {...(!isStatic && {
                            initial: { opacity: 0, y: 10 },
                            animate: { opacity: 1, y: 0 },
                            transition: { delay: 0.2, duration: 0.5 }
                        })}
                    >
                        {keyMessage}
                    </motion.div>
                )}

                {/* メイン本文 */}
                <div className={`corporate-content-body ${isTwoColumn ? 'two-column' : ''}`}>
                    <ul className="corporate-bullet-list">
                        {bulletPoints.map((bullet, idx) => (
                            <motion.li 
                                key={idx} 
                                className="corporate-bullet-item"
                                {...(!isStatic && {
                                    initial: { opacity: 0, x: -10 },
                                    animate: { opacity: 1, x: 0 },
                                    transition: { delay: 0.3 + idx * 0.05, duration: 0.4 }
                                })}
                            >
                                <div className="corporate-bullet-icon" />
                                <span>{bullet}</span>
                            </motion.li>
                        ))}
                    </ul>
                </div>

                {/* 注釈エリア (最下部) */}
                {annotations.length > 0 && (
                    <motion.div 
                        className="kpi-corporate-annotations"
                        style={{ marginTop: 'auto', paddingTop: '2cqi' }}
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

export default ContentSlide;
