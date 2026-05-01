// src/components/Artifacts/JsonSlide/slides/SplitSlide.jsx
// 分割スライド: 左右2カラムの比較・対比レイアウト
import React from 'react';
import { motion } from 'framer-motion';

/**
 * SplitSlide - タイトル + 左右カラムの箇条書き
 * @param {Object} content - { title, left_column, right_column }
 * @param {boolean} isStatic - アニメーションを無効化するかどうか
 */
const SplitSlide = ({ content, isStatic = false }) => {
    const { title, left_column, right_column } = content || {};

    const renderColumn = (items, side) => {
        if (!items || items.length === 0) return null;

        return (
            <div className={`split-column split-column-${side}`}>
                <div className="split-column-label">
                    {side === 'left' ? '◀' : '▶'}
                </div>
                <ul className="slide-bullet-list">
                    {items.map((item, idx) => {
                        const ListItem = isStatic ? 'li' : motion.li;
                        return (
                            <ListItem
                                key={idx}
                                className="slide-bullet-item"
                                {...(!isStatic && {
                                    initial: { opacity: 0, x: side === 'left' ? -10 : 10 },
                                    animate: { opacity: 1, x: 0 },
                                    transition: { delay: idx * 0.05, duration: 0.3 }
                                })}
                            >
                                <span className="bullet-marker" />
                                <span className="bullet-text">{item}</span>
                            </ListItem>
                        );
                    })}
                </ul>
            </div>
        );
    };

    return (
        <div className="json-slide-layout json-slide-split">
            {/* スライドヘッダー */}
            <div className="content-slide-header">
                <h2 className="slide-section-title">
                    {title || 'セクションタイトル'}
                </h2>
                <div className="slide-title-underline" />
            </div>

            {/* 2カラムレイアウト */}
            <div className="split-slide-columns">
                {renderColumn(left_column, 'left')}
                <div className="split-divider" />
                {renderColumn(right_column, 'right')}
            </div>
        </div>
    );
};

export default SplitSlide;
