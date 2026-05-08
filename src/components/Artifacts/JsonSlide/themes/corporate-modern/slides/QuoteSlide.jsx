// src/components/Artifacts/JsonSlide/slides/QuoteSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';

/**
 * QuoteSlide - コーポレート引用スライド
 * @param {Object} content - { quote, author, role, annotations }
 */
const QuoteSlide = ({ content, isStatic = false }) => {
    const { 
        quote = 'ここに重要なメッセージや引用文を入力してください。', 
        author = '発言者名', 
        role = '役職 / 肩書き',
        annotations = []
    } = content || {};

    return (
        <div className="json-slide-layout quote-slide corporate-style">
            <div className="quote-corporate-container">
                {/* 背景装飾：引用符 */}
                <div className="quote-mark open">“</div>
                <div className="quote-mark close">”</div>

                <div className="quote-content-wrapper">
                    {/* 引用本文 */}
                    <motion.blockquote 
                        className="quote-text"
                        {...(!isStatic && {
                            initial: { opacity: 0, scale: 0.95 },
                            animate: { opacity: 1, scale: 1 },
                            transition: { duration: 0.8, ease: "easeOut" }
                        })}
                    >
                        {quote}
                    </motion.blockquote>

                    {/* 発言者情報 */}
                    <motion.div 
                        className="quote-attribution"
                        {...(!isStatic && {
                            initial: { opacity: 0, y: 20 },
                            animate: { opacity: 1, y: 0 },
                            transition: { delay: 0.4, duration: 0.6 }
                        })}
                    >
                        <div className="attribution-line" />
                        <div className="attribution-info">
                            <span className="attribution-name">{author}</span>
                            <span className="attribution-role">{role}</span>
                        </div>
                    </motion.div>
                </div>

                {/* 注釈エリア (最下部) */}
                {annotations.length > 0 && (
                    <motion.div 
                        className="kpi-corporate-annotations"
                        style={{ position: 'absolute', bottom: '4cqi', left: '6cqi', right: '6cqi' }}
                        {...(!isStatic && {
                            initial: { opacity: 0 },
                            animate: { opacity: 1 },
                            transition: { delay: 0.8, duration: 0.5 }
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

export default QuoteSlide;
