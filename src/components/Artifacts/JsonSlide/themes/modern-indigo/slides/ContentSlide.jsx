// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/ContentSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';

import SlideMarkdown from '../../../MarkdownRenderer';

/**
 * Modern Indigo - ContentSlide
 * @param {Object} content - { title, body_text, bullet_points, highlight_cards, point_box }
 */
const ContentSlide = ({ content, isStatic = false }) => {
    const { 
        title, 
        key_message,
        body_text, 
        layout_variation = 'one-column',
        annotations = [] 
    } = content || {};

    const isTwoColumn = layout_variation === 'two-column';

    return (
        <div className="json-slide-layout indigo-style">
            {/* ヘッダー: Indigoボトムボーダー */}
            <motion.div 
                className="indigo-slide-header"
                style={{
                    marginBottom: '1.8cqi',
                    borderBottom: '2.5px solid var(--slide-primary)',
                    paddingBottom: '1.2cqi'
                }}
                {...(!isStatic && {
                    initial: { opacity: 0, x: -20 },
                    animate: { opacity: 1, x: 0 },
                    transition: { duration: 0.5 }
                })}
            >
                <h2 style={{ fontSize: '2.8cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 700 }}>
                    <SlideMarkdown content={title || 'タイトル'} />
                </h2>
            </motion.div>

            {/* ボディエリア */}
            <div className="indigo-slide-body" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1.5cqi',
                minHeight: 0 // 内容溢れ防止
            }}>
                {/* キーメッセージ (JSON構造で独立) */}
                {key_message && (
                    <motion.div 
                        style={{ 
                            fontSize: '2.2cqi', 
                            color: 'var(--slide-primary)', 
                            fontWeight: 700, 
                            lineHeight: 1.4,
                            padding: '1.2cqi 1.8cqi',
                            background: 'rgba(99, 102, 241, 0.04)',
                            borderLeft: '4px solid var(--slide-primary)',
                            borderRadius: '4px',
                            marginBottom: '0.5cqi'
                        }}
                        {...(!isStatic && {
                            initial: { opacity: 0, y: 10 },
                            animate: { opacity: 1, y: 0 },
                            transition: { delay: 0.2 }
                        })}
                    >
                        <SlideMarkdown content={key_message} />
                    </motion.div>
                )}

                {/* 本文 (Markdown式) */}
                <motion.div 
                    style={{ 
                        flex: 1,
                        fontSize: '1.7cqi', 
                        color: 'var(--slide-body)', 
                        lineHeight: 1.65,
                        columnCount: isTwoColumn ? 2 : 1,
                        columnGap: isTwoColumn ? '4cqi' : '0',
                        columnFill: 'auto'
                    }}
                    {...(!isStatic && {
                        initial: { opacity: 0 },
                        animate: { opacity: 1 },
                        transition: { delay: 0.4 }
                    })}
                >
                    <SlideMarkdown content={body_text || '内容を入力してください。'} />
                </motion.div>
            </div>

            {/* 注釈 (共通フッター) */}
            {annotations.length > 0 && (
                <div style={{ 
                    fontSize: '1.1cqi', 
                    color: 'var(--slide-muted)', 
                    marginTop: 'auto', 
                    paddingTop: '1cqi', 
                    borderTop: '1px solid var(--slide-border)' 
                }}>
                    {annotations.map((note, idx) => (
                        <React.Fragment key={idx}>
                            <SlideMarkdown content={note} inline />
                            {idx < annotations.length - 1 && <span style={{ margin: '0 0.8cqi', opacity: 0.5 }}>|</span>}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ContentSlide;
