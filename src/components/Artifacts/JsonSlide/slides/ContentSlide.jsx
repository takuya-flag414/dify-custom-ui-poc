// src/components/Artifacts/JsonSlide/slides/ContentSlide.jsx
// コンテンツスライド: タイトル + 本文 + 箇条書きの汎用レイアウト
import React from 'react';
import { motion } from 'framer-motion';

/**
 * ContentSlide - タイトル + body_text + bullet_points
 * @param {Object} content - { title, body_text, bullet_points }
 * @param {boolean} isStatic - アニメーションを無効化するかどうか
 */
const ContentSlide = ({ content, isStatic = false }) => {
    const { title, body_text, bullet_points } = content || {};

    return (
        <div className="json-slide-layout json-slide-content">
            {/* スライドヘッダー */}
            <div className="content-slide-header">
                <h2 className="slide-section-title">
                    {title || 'セクションタイトル'}
                </h2>
                <div className="slide-title-underline" />
            </div>

            {/* スライドボディ */}
            <div className="content-slide-body">
                {/* 本文テキスト */}
                {body_text && (
                    <p className="slide-body-text">{body_text}</p>
                )}

                {/* 箇条書きリスト */}
                {bullet_points && bullet_points.length > 0 && (
                    <ul className="slide-bullet-list">
                        {bullet_points.map((point, idx) => {
                            const ListItem = isStatic ? 'li' : motion.li;
                            return (
                                <ListItem
                                    key={idx}
                                    className="slide-bullet-item"
                                    {...(!isStatic && {
                                        initial: { opacity: 0, x: -10 },
                                        animate: { opacity: 1, x: 0 },
                                        transition: { delay: idx * 0.05, duration: 0.3 }
                                    })}
                                >
                                    {/* 番号付きリスト判定: 先頭が数字+記号か */}
                                    {!/^\d+[.、)\s]/.test(point) && (
                                        <span className="bullet-marker">・</span>
                                    )}
                                    <span className="bullet-text">{point}</span>
                                </ListItem>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ContentSlide;
