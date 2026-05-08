// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/CommonSlides.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

/**
 * QuoteSlide - 引用スライド
 * @param {Object} content - { quote, author, role, annotations }
 */
export const QuoteSlide = ({ content, isStatic = false }) => {
    const { quote, author, role, annotations = [] } = content || {};
    return (
        <div className="json-slide-layout indigo-style" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '6cqi 10cqi' }}>
            <div style={{ position: 'absolute', top: '10%', left: '10%', fontSize: '15cqi', color: 'var(--slide-primary)', opacity: 0.08, fontFamily: 'serif', lineHeight: 1, zIndex: 0 }}>“</div>
            <motion.div style={{ zIndex: 1 }} {...(!isStatic && { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.6 } })}>
                <blockquote style={{ 
                    fontSize: '3.2cqi', 
                    fontWeight: 600, 
                    color: 'var(--slide-heading)', 
                    margin: '0 0 3cqi 0', 
                    lineHeight: 1.5,
                    position: 'relative'
                }}>
                    <SlideMarkdown content={quote || 'メッセージをここに入力してください。'} />
                </blockquote>
                {(author || role) && (
                    <div style={{ borderTop: '1px solid var(--slide-border)', paddingTop: '1.5cqi', display: 'inline-block' }}>
                        {author && <div style={{ fontSize: '2cqi', fontWeight: 700, color: 'var(--slide-primary)' }}><SlideMarkdown content={author} /></div>}
                        {role && <div style={{ fontSize: '1.4cqi', color: 'var(--slide-muted)', marginTop: '0.4cqi' }}><SlideMarkdown content={role} /></div>}
                    </div>
                )}
            </motion.div>
            {annotations.length > 0 && (
                <div style={{ position: 'absolute', bottom: '3cqi', left: '6cqi', fontSize: '1.1cqi', color: 'var(--slide-muted)' }}>
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

/**
 * SectionSlide - セクション区切り
 * @param {Object} content - { title, subtitle, section_number, annotations }
 */
export const SectionSlide = ({ content, isStatic = false }) => {
    const { title, subtitle, section_number, annotations = [] } = content || {};
    return (
        <div className="json-slide-layout indigo-style indigo-dark-context" style={{ background: 'var(--slide-dark-gradient, #0f172a)', color: '#ffffff', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <motion.div {...(!isStatic && { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } })}>
                {section_number && (
                    <div style={{ fontSize: '1.8cqi', fontWeight: 800, color: 'var(--slide-primary)', letterSpacing: '0.2em', marginBottom: '1cqi' }}>
                        SECTION {section_number}
                    </div>
                )}
                <div style={{ width: '80px', height: '4px', background: 'var(--slide-primary)', margin: '0 auto 2.5cqi auto', borderRadius: '2px' }} />
                <h1 style={{ fontSize: '4.8cqi', fontWeight: 800, margin: '0 0 1.5cqi 0', letterSpacing: '-0.02em' }}>
                    <SlideMarkdown content={title || 'セクションタイトル'} />
                </h1>
                {subtitle && (
                    <div style={{ fontSize: '2cqi', color: 'rgba(255,255,255,0.7)', fontWeight: 400, maxWidth: '600px', margin: '0 auto' }}>
                        <SlideMarkdown content={subtitle} />
                    </div>
                )}
            </motion.div>
            {annotations.length > 0 && (
                <div style={{ position: 'absolute', bottom: '3cqi', left: '6cqi', fontSize: '1.1cqi', color: 'rgba(255,255,255,0.5)' }}>
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

/**
 * ProfileSlide - プロフィール
 * @param {Object} content - { name, role, bio, image_url, highlights, annotations }
 */
export const ProfileSlide = ({ content, isStatic = false }) => {
    const { name, role, bio, image_url, highlights = [], annotations = [] } = content || {};
    return (
        <div className="json-slide-layout indigo-style">
            <div style={{ display: 'flex', gap: '5cqi', alignItems: 'center', flex: 1, padding: '2cqi 4cqi' }}>
                {/* 左側: 画像 */}
                <motion.div 
                    style={{ width: '32cqi', flexShrink: 0 }}
                    {...(!isStatic && { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } })}
                >
                    <div style={{ 
                        aspectRatio: '4/5', 
                        background: '#f1f5f9', 
                        borderRadius: '12px', 
                        overflow: 'hidden', 
                        boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                        border: '1px solid var(--slide-border)'
                    }}>
                        {image_url ? (
                            <img src={image_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10cqi', color: '#cbd5e1' }}>👤</div>
                        )}
                    </div>
                </motion.div>

                {/* 右側: テキスト */}
                <div style={{ flex: 1 }}>
                    <motion.div {...(!isStatic && { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 } })}>
                        <h2 style={{ fontSize: '4cqi', fontWeight: 800, color: 'var(--slide-heading)', margin: '0 0 0.5cqi 0' }}>
                            <SlideMarkdown content={name || 'お名前'} />
                        </h2>
                        <div style={{ fontSize: '1.8cqi', fontWeight: 700, color: 'var(--slide-primary)', marginBottom: '2cqi' }}>
                            <SlideMarkdown content={role || '役職 / 肩書き'} />
                        </div>
                        <div style={{ fontSize: '1.5cqi', color: 'var(--slide-body)', lineHeight: 1.6, marginBottom: '2.5cqi' }}>
                            <SlideMarkdown content={bio || 'プロフィール詳細内容がここに入ります。'} />
                        </div>
                    </motion.div>
                </div>
            </div>
            {annotations.length > 0 && (
                <div style={{ position: 'absolute', bottom: '3cqi', left: '6cqi', fontSize: '1.1cqi', color: 'var(--slide-muted)' }}>
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

/**
 * ImageContentSlide - 画像とコンテンツ
 * @param {Object} content - { title, key_message, image_url, image_caption, body_text, bullet_points, layout_variation, annotations }
 */
export const ImageContentSlide = ({ content, isStatic = false }) => {
    const { title, key_message, image_url, image_caption, body_text, bullet_points = [], layout_variation = 'image-left', annotations = [] } = content || {};
    
    const isImageRight = layout_variation === 'image-right';

    return (
        <div className="json-slide-layout indigo-style">
            <header className="indigo-slide-header">
                <h2><SlideMarkdown content={title || '画像とコンテンツ'} /></h2>
            </header>

            <div className="indigo-slide-body" style={{ flex: 1, display: 'flex', flexDirection: isImageRight ? 'row-reverse' : 'row', gap: '4cqi', alignItems: 'center' }}>
                {/* 画像エリア */}
                <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                    <div style={{ 
                        background: '#f8fafc', 
                        borderRadius: '10px', 
                        overflow: 'hidden', 
                        boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                        border: '1px solid var(--slide-border)',
                        maxHeight: '32cqi'
                    }}>
                        {image_url ? (
                            <img 
                                src={image_url} 
                                alt={title} 
                                style={{ 
                                    width: '100%', 
                                    height: 'auto', 
                                    maxHeight: '32cqi', 
                                    objectFit: 'contain', 
                                    display: 'block' 
                                }} 
                            />
                        ) : (
                            <div style={{ height: '25cqi', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '1.5cqi' }}>Image Placeholder</div>
                        )}
                    </div>
                    {image_caption && (
                        <div style={{ 
                            fontSize: '1.2cqi', 
                            textAlign: 'center', 
                            color: 'var(--slide-muted)', 
                            marginTop: '0.8cqi',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            <SlideMarkdown content={image_caption} />
                        </div>
                    )}
                </div>

                {/* コンテンツエリア */}
                <div style={{ flex: 1 }}>
                    {key_message && (
                        <div style={{ fontSize: '2cqi', fontWeight: 700, color: 'var(--slide-primary)', marginBottom: '1.5cqi', lineHeight: 1.4 }}>
                            <SlideMarkdown content={key_message} />
                        </div>
                    )}
                    {body_text && (
                        <div style={{ fontSize: '1.6cqi', lineHeight: 1.6, color: 'var(--slide-body)', marginBottom: '2cqi' }}>
                            <SlideMarkdown content={body_text} />
                        </div>
                    )}
                </div>
            </div>

            {annotations.length > 0 && (
                <div style={{ fontSize: '1.1cqi', color: 'var(--slide-muted)', marginTop: 'auto', paddingTop: '1cqi', borderTop: '1px solid var(--slide-border)' }}>
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
