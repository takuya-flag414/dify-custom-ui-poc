// src/components/Artifacts/JsonSlide/slides/TitleSlide.jsx
// タイトルスライド: プレゼンの表紙に使用されるレイアウト
import React from 'react';
import { motion } from 'framer-motion';

/**
 * TitleSlide - タイトル + サブタイトル + 著者名
 * @param {Object} content - { title, subtitle, author }
 * @param {boolean} isStatic - アニメーションを無効化するかどうか
 */
const TitleSlide = ({ content, isStatic = false }) => {
    const { title, subtitle, author } = content || {};

    const Container = isStatic ? 'div' : motion.div;
    const Text = isStatic ? 'p' : motion.p;

    return (
        <div className="json-slide-layout json-slide-title">
            {/* 装飾用グラデーションオーバーレイ */}
            <div className="title-slide-decoration" />

            <Container
                className="title-slide-content"
                {...(!isStatic && {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] }
                })}
            >
                {/* メインタイトル */}
                <h1 className="slide-main-title">
                    {title || 'タイトル未設定'}
                </h1>

                {/* サブタイトル */}
                {subtitle && (
                    <Text
                        className="slide-subtitle"
                        {...(!isStatic && {
                            initial: { opacity: 0, y: 10 },
                            animate: { opacity: 1, y: 0 },
                            transition: { delay: 0.15, duration: 0.4 }
                        })}
                    >
                        {subtitle}
                    </Text>
                )}

                {/* 著者名 */}
                {author && (
                    <Text
                        className="slide-author"
                        {...(!isStatic && {
                            initial: { opacity: 0 },
                            animate: { opacity: 1 },
                            transition: { delay: 0.3, duration: 0.4 }
                        })}
                    >
                        {author}
                    </Text>
                )}
            </Container>

            {/* 下部のアクセントライン */}
            <div className="title-slide-accent-line" />
        </div>
    );
};

export default TitleSlide;
