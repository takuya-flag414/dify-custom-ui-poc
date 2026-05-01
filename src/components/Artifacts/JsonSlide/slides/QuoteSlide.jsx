// src/components/Artifacts/JsonSlide/slides/QuoteSlide.jsx
// 引用スライド: メッセージや名言を強調表示するレイアウト
import React from 'react';
import { motion } from 'framer-motion';

/**
 * QuoteSlide - タイトル + 引用文
 * @param {Object} content - { title, quote, author }
 * @param {boolean} isStatic - アニメーションを無効化するかどうか
 */
const QuoteSlide = ({ content, isStatic = false }) => {
    const { title, quote, author } = content || {};

    const Container = isStatic ? 'div' : motion.div;

    return (
        <div className="json-slide-layout json-slide-quote">
            {/* 装飾用の引用符 */}
            <div className="quote-decoration-mark">"</div>

            <Container
                className="quote-slide-content"
                {...(!isStatic && {
                    initial: { opacity: 0, scale: 0.98 },
                    animate: { opacity: 1, scale: 1 },
                    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] }
                })}
            >
                {/* タイトル（控えめに） */}
                {title && (
                    <h2 className="quote-slide-title">{title}</h2>
                )}

                {/* 引用文メイン */}
                {quote && (
                    <blockquote className="slide-quote-text">
                        {quote}
                    </blockquote>
                )}

                {/* 引用元（著者名） */}
                {author && (
                    <p className="slide-quote-author">— {author}</p>
                )}
            </Container>
        </div>
    );
};

export default QuoteSlide;
