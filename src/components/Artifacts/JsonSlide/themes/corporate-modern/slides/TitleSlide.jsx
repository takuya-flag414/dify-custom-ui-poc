// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/slides/TitleSlide.jsx
// タイトルスライド: コーポレート・プロフェッショナルなフラットデザイン
import React from 'react';
import { motion } from 'framer-motion';

/**
 * TitleSlide - コーポレートカラーを強調したプロフェッショナルレイアウト
 * @param {Object} content - { title, subtitle, author }
 * @param {boolean} isStatic - アニメーションを無効化するかどうか
 */
const TitleSlide = ({ content, isStatic = false }) => {
    const { title, subtitle, author } = content || {};

    const Container = isStatic ? 'div' : motion.div;
    const Text = isStatic ? 'p' : motion.p;
    const Sidebar = isStatic ? 'div' : motion.div;

    return (
        <div className="json-slide-layout json-slide-title corporate-style">
            {/* 左側: コーポレートカラー・サイドバー */}
            <Sidebar
                className="title-sidebar"
                {...(!isStatic && {
                    initial: { x: -50, opacity: 0 },
                    animate: { x: 0, opacity: 1 },
                    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                })}
            >
                {/* ロゴ・ブランドプレースホルダー */}
                <motion.div 
                    className="title-sidebar-logo"
                    {...(!isStatic && {
                        initial: { scale: 0.8, opacity: 0 },
                        animate: { scale: 1, opacity: 1 },
                        transition: { delay: 0.4, duration: 0.5 }
                    })}
                />
            </Sidebar>

            {/* 右側: メインコンテンツ領域 */}
            <Container
                className="title-main-content"
                {...(!isStatic && {
                    initial: { x: 30, opacity: 0 },
                    animate: { x: 0, opacity: 1 },
                    transition: { delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                })}
            >
                {/* アクセントライン */}
                <motion.div 
                    className="corporate-accent-line"
                    {...(!isStatic && {
                        initial: { width: 0 },
                        animate: { width: '6cqi' },
                        transition: { delay: 0.6, duration: 0.6 }
                    })}
                />

                {/* メインタイトル */}
                <h1 className="corporate-main-title">
                    {title || 'タイトル未設定'}
                </h1>

                {/* サブタイトル */}
                {subtitle && (
                    <Text
                        className="corporate-subtitle"
                        {...(!isStatic && {
                            initial: { opacity: 0, y: 10 },
                            animate: { opacity: 1, y: 0 },
                            transition: { delay: 0.4, duration: 0.5 }
                        })}
                    >
                        {subtitle}
                    </Text>
                )}

                {/* 著者情報 */}
                {(author) && (
                    <div className="corporate-author-info">
                        <Text
                            className="corporate-author-label"
                            {...(!isStatic && {
                                initial: { opacity: 0 },
                                animate: { opacity: 1 },
                                transition: { delay: 0.7, duration: 0.4 }
                            })}
                        >
                            Presented By
                        </Text>
                        <Text
                            className="corporate-author-name"
                            {...(!isStatic && {
                                initial: { opacity: 0, y: 5 },
                                animate: { opacity: 1, y: 0 },
                                transition: { delay: 0.8, duration: 0.4 }
                            })}
                        >
                            {author || '作成者名なし'}
                        </Text>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default TitleSlide;
