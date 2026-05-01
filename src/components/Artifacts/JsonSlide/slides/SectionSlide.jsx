// src/components/Artifacts/JsonSlide/slides/SectionSlide.jsx
// セクション区切りスライド: 章やパートの区切りに使用
import React from 'react';
import { motion } from 'framer-motion';

/**
 * SectionSlide - セクション区切り表示
 * @param {Object} content - { title, subtitle }
 * @param {boolean} isStatic - アニメーションを無効化するかどうか
 */
const SectionSlide = ({ content, isStatic = false }) => {
    const { title, subtitle } = content || {};

    const Container = isStatic ? 'div' : motion.div;

    return (
        <div className="json-slide-layout json-slide-section">
            <Container
                className="section-slide-content"
                {...(!isStatic && {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] }
                })}
            >
                {/* セクション装飾ライン */}
                <div className="section-slide-accent" />

                {/* セクションタイトル */}
                <h2 className="section-slide-title">
                    {title || 'セクション'}
                </h2>

                {/* サブタイトル */}
                {subtitle && (
                    <p className="section-slide-subtitle">{subtitle}</p>
                )}
            </Container>
        </div>
    );
};

export default SectionSlide;
