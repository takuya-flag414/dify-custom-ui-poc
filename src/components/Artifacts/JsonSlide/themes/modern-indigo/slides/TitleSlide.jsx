// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/TitleSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';

import SlideMarkdown from '../../../MarkdownRenderer';

/**
 * Modern Indigo - TitleSlide
 * @param {Object} content - { title, subtitle, author, eyebrow, tags, logo_text }
 */
const TitleSlide = ({ content, isStatic = false }) => {
    const { 
        title, 
        subtitle, 
        author, 
        eyebrow, 
        tags = [], 
        logo_text = 'PRESENTATION',
        date 
    } = content || {};

    const Container = isStatic ? 'div' : motion.div;

    return (
        <div className="json-slide-layout indigo-style indigo-dark-context" style={{ 
            color: '#ffffff',
            justifyContent: 'center',
            paddingInline: '8cqi',
            paddingBlock: '6cqi',
            position: 'relative',
            overflow: 'hidden',
            background: 'none' // 親の背景を消し、子要素で描画
        }}>
            {/* 背景キャプチャ用レイヤー */}
            <div className="indigo-bg-layer" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'var(--slide-indigo-gradient)',
                zIndex: 0
            }} />

            <Container
                className="title-body"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    maxWidth: '800px',
                    zIndex: 2
                }}
                {...(!isStatic && {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
                })}
            >
                {/* ロゴ/ブランド (logo-placeholder再現) */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid var(--slide-border-color, rgba(255,255,255,0.7))',
                    padding: '0.4cqi 1.2cqi',
                    fontSize: '1.1cqi',
                    fontFamily: 'var(--font-heading, sans-serif)',
                    letterSpacing: '0.1em',
                    color: '#ffffff',
                    borderRadius: '3px',
                    marginBottom: '1.8cqi',
                    width: 'fit-content',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                }}>
                    <SlideMarkdown content={logo_text} />
                </div>

                {/* 眉題 (eyebrow再現) */}
                {eyebrow && (
                    <div className="eyebrow" style={{
                        fontSize: '1.2cqi',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.78)',
                        marginBottom: '0.8cqi'
                    }}>
                        <SlideMarkdown content={eyebrow} />
                    </div>
                )}

                {/* メインタイトル (h1再現) */}
                <h1 style={{
                    fontSize: '5.2cqi',
                    lineHeight: 1.15,
                    marginBottom: '2cqi',
                    color: '#ffffff',
                    fontWeight: 700,
                    margin: '0 0 2cqi 0'
                }}>
                    <SlideMarkdown content={title || 'タイトル未設定'} />
                </h1>

                {/* サブタイトル (subtitle再現) */}
                {subtitle && (
                    <p className="subtitle" style={{
                        fontSize: '2cqi',
                        color: 'rgba(255,255,255,0.85)',
                        marginBottom: '3.4cqi',
                        maxWidth: '80%',
                        lineHeight: 1.5
                    }}>
                        <SlideMarkdown content={subtitle} />
                    </p>
                )}

                {/* メタチップ (title-meta / meta-chip再現) */}
                {tags && tags.length > 0 && (
                    <div className="title-meta" style={{ 
                        display: 'flex', 
                        gap: '1.2cqi', 
                        flexWrap: 'wrap', 
                        marginTop: '0.8cqi' 
                    }}>
                        {tags.map((tag, idx) => (
                            <span key={idx} className="meta-chip" style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.6cqi 1.2cqi',
                                borderRadius: '999px',
                                background: 'rgba(255,255,255,0.16)',
                                color: '#ffffff',
                                fontSize: '1.3cqi',
                                fontWeight: 700,
                                letterSpacing: '0.04em'
                            }}>
                                <SlideMarkdown content={tag} />
                            </span>
                        ))}
                    </div>
                )}
            </Container>

            {/* プレゼンター情報 (presenter-info再現: 右下) */}
            <div className="presenter-info" style={{
                position: 'absolute',
                bottom: '3.8cqi',
                right: '8cqi',
                textAlign: 'right',
                color: 'rgba(255,255,255,0.78)',
                fontSize: '1.3cqi',
                lineHeight: 1.7,
                zIndex: 1
            }}>
                {author && <div><SlideMarkdown content={author} /></div>}
                {date && <div>{date}</div>}
            </div>
        </div>
    );
};

export default TitleSlide;
