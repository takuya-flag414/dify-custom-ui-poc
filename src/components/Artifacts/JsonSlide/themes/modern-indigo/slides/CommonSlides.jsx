// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/CommonSlides.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

/**
 * 1. QuoteSlide - 引用スライド (Editorial Pull-Quote)
 */
export const QuoteSlide = ({ content, isStatic = false }) => {
    // JSON構造を維持
    const { quote, author, role, annotations = [] } = content || {};
    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col justify-center px-[6cqi]">
            <motion.div
                style={{
                    borderLeft: '6px solid var(--slide-primary)',
                    paddingLeft: '4cqi'
                }}
                {...(!isStatic && { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.6 } })}
            >
                <div style={{
                    fontSize: '3.6cqi',
                    fontWeight: 800,
                    color: 'var(--slide-heading)',
                    lineHeight: 1.3,
                    marginBottom: '3cqi',
                    letterSpacing: '-0.02em'
                }}>
                    <SlideMarkdown content={quote || 'メッセージをここに入力してください。'} />
                </div>

                {(author || role) && (
                    <div style={{
                        borderTop: '1px solid #E2E8F0',
                        paddingTop: '1.5cqi',
                        display: 'flex',
                        flexDirection: 'column',
                        width: 'fit-content',
                        minWidth: '30%'
                    }}>
                        {author && (
                            <span style={{ fontSize: '1.6cqi', fontWeight: 800, color: 'var(--slide-heading)' }}>
                                <SlideMarkdown content={author} inline />
                            </span>
                        )}
                        {role && (
                            <span style={{
                                fontSize: '1.2cqi',
                                color: '#64748B',
                                fontWeight: 700,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                marginTop: '0.4cqi'
                            }}>
                                <SlideMarkdown content={role} inline />
                            </span>
                        )}
                    </div>
                )}
            </motion.div>

            {annotations?.length > 0 && (
                <div style={{ position: 'absolute', bottom: '3cqi', left: '6cqi', right: '6cqi', fontSize: '1.1cqi', color: '#64748B' }}>
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
 * 2. SectionSlide - セクション区切り (Monumental Typography)
 */
export const SectionSlide = ({ content, isStatic = false }) => {
    // annotations の抽出を復元
    const { title, subtitle, section_number, annotations = [] } = content || {};
    const subText = subtitle || section_number;

    return (
        <div className="json-slide-layout h-full flex flex-col justify-center px-[8cqi]" style={{ background: 'var(--slide-dark-gradient, var(--slide-indigo-gradient))' }}>
            <motion.div {...(!isStatic && { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.6 } })}>
                {subText && (
                    <div style={{
                        fontSize: '1.8cqi',
                        fontWeight: 800,
                        color: 'var(--slide-accent, var(--slide-primary))',
                        fontFamily: 'monospace',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        marginBottom: '1.5cqi'
                    }}>
                        <SlideMarkdown content={subText} inline />
                    </div>
                )}

                <div style={{
                    height: '2px',
                    width: '100px',
                    backgroundColor: 'var(--slide-primary)',
                    marginBottom: '3cqi'
                }} />

                <h2 style={{
                    fontSize: '5.4cqi',
                    margin: 0,
                    color: '#ffffff',
                    fontWeight: 900,
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em'
                }}>
                    <SlideMarkdown content={title || 'セクションタイトル'} />
                </h2>
            </motion.div>

            {/* annotations (注釈) の表示を復元 */}
            {annotations?.length > 0 && (
                <div style={{ position: 'absolute', bottom: '3cqi', left: '8cqi', right: '8cqi', fontSize: '1.1cqi', color: 'rgba(255,255,255,0.5)' }}>
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
 * 3. ProfileSlide - プロフィール (Executive Dossier)
 */
export const ProfileSlide = ({ content, isStatic = false }) => {
    // 元のJSONプロパティ（bio, highlights）を復元
    const { title, name, role, bio, image_url, highlights = [], annotations = [] } = content || {};
    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col">
            <motion.div
                className="indigo-slide-header flex-shrink-0"
                style={{ marginBottom: '3cqi', borderBottom: '2.5px solid var(--slide-primary)', paddingBottom: '1.2cqi' }}
                {...(!isStatic && { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 } })}
            >
                <h2 style={{ fontSize: '2.6cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    <SlideMarkdown content={title || 'Profile'} />
                </h2>
            </motion.div>

            <div className="flex-1 flex items-stretch">
                {image_url && (
                    <motion.div
                        style={{ flex: '0 0 32%', position: 'relative' }}
                        {...(!isStatic && { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 } })}
                    >
                        <div style={{ width: '100%', aspectRatio: '3/4', backgroundColor: 'var(--slide-bg-accent)', overflow: 'hidden' }}>
                            <img src={image_url} alt={name || 'Profile Image'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </motion.div>
                )}

                {/* Vertical Divider */}
                {image_url && <div style={{ width: '1px', backgroundColor: 'var(--slide-border)', margin: '0 4cqi' }} />}

                <motion.div
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '1cqi' }}
                    {...(!isStatic && { initial: { opacity: 0, x: 15 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5, delay: 0.2 } })}
                >
                    <div style={{
                        fontSize: '1.3cqi',
                        color: 'var(--slide-primary)',
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        marginBottom: '0.5cqi',
                        fontFamily: 'monospace'
                    }}>
                        <SlideMarkdown content={role || '役職 / 肩書き'} inline />
                    </div>
                    <h3 style={{
                        fontSize: '3.6cqi',
                        fontWeight: 900,
                        color: 'var(--slide-heading)',
                        marginBottom: '2.5cqi',
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em'
                    }}>
                        <SlideMarkdown content={name || 'お名前'} inline />
                    </h3>

                    {/* profile_text を bio に修正し、テキストを正しく表示 */}
                    <div style={{ fontSize: '1.4cqi', color: 'var(--slide-body)', lineHeight: 1.7 }}>
                        <SlideMarkdown content={bio || 'プロフィール詳細内容がここに入ります。'} />
                    </div>

                    {/* highlights（箇条書き）の表示を復元 */}
                    {highlights.length > 0 && (
                        <ul style={{ marginTop: '1.5cqi', paddingLeft: '2cqi', color: 'var(--slide-body)', fontSize: '1.4cqi', lineHeight: 1.7 }}>
                            {highlights.map((item, idx) => (
                                <li key={idx} style={{ marginBottom: '0.5cqi' }}>
                                    <SlideMarkdown content={item} inline />
                                </li>
                            ))}
                        </ul>
                    )}
                </motion.div>
            </div>

            {annotations?.length > 0 && (
                <div className="flex-shrink-0" style={{ fontSize: '1.1cqi', color: 'var(--slide-muted)', marginTop: '2cqi', paddingTop: '1cqi', borderTop: '1px solid var(--slide-border)' }}>
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
 * 4. ImageContentSlide - 画像とコンテンツ (Magazine Spread)
 */
export const ImageContentSlide = ({ content, isStatic = false }) => {
    // bullet_points, layout_variation の抽出を復元
    const { title, key_message, image_url, image_caption, body_text, bullet_points = [], layout_variation = 'image-left', annotations = [] } = content || {};

    // レイアウトの左右反転ロジックを復元
    const isImageRight = layout_variation === 'image-right';

    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col">
            <motion.div
                className="indigo-slide-header flex-shrink-0"
                style={{ marginBottom: '2.5cqi', borderBottom: '2.5px solid var(--slide-primary)', paddingBottom: '1.2cqi' }}
                {...(!isStatic && { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 } })}
            >
                <h2 style={{ fontSize: '2.6cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    <SlideMarkdown content={title || 'Overview'} />
                </h2>
            </motion.div>

            <div className="flex-1 flex items-stretch" style={{ flexDirection: isImageRight ? 'row-reverse' : 'row' }}>
                {/* Image Area */}
                <motion.div
                    style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                    {...(!isStatic && { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 } })}
                >
                    <div style={{ flex: 1, backgroundColor: 'var(--slide-bg-accent)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {image_url ? (
                            <img src={image_url} alt={title || 'slide content'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ color: 'var(--slide-muted)', fontSize: '1.4cqi' }}>[ Image Placeholder ]</span>
                        )}
                    </div>
                    {image_caption && (
                        <div style={{
                            borderTop: '1px solid var(--slide-border)',
                            paddingTop: '0.8cqi',
                            marginTop: '1cqi',
                            fontSize: '1.1cqi',
                            color: 'var(--slide-muted)',
                            fontWeight: 500
                        }}>
                            <SlideMarkdown content={image_caption} />
                        </div>
                    )}
                </motion.div>

                {/* Vertical Divider */}
                <div style={{ width: '1px', backgroundColor: 'var(--slide-border)', margin: '0 4cqi' }} />

                {/* Content Area */}
                <motion.div
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                    {...(!isStatic && { initial: { opacity: 0, x: isImageRight ? -15 : 15 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5, delay: 0.2 } })}
                >
                    {key_message && (
                        <div style={{
                            borderLeft: '4px solid var(--slide-primary)',
                            paddingLeft: '1.5cqi',
                            marginBottom: '2.5cqi'
                        }}>
                            <div style={{ fontSize: '1.8cqi', fontWeight: 800, color: 'var(--slide-heading)', lineHeight: 1.4 }}>
                                <SlideMarkdown content={key_message} />
                            </div>
                        </div>
                    )}
                    {body_text && (
                        <div style={{ fontSize: '1.4cqi', lineHeight: 1.7, color: 'var(--slide-body)' }}>
                            <SlideMarkdown content={body_text} />
                        </div>
                    )}
                    {/* bullet_points（箇条書き）の表示を復元 */}
                    {bullet_points.length > 0 && (
                        <ul style={{ marginTop: '1.5cqi', paddingLeft: '2cqi', color: 'var(--slide-body)', fontSize: '1.4cqi', lineHeight: 1.7 }}>
                            {bullet_points.map((pt, i) => (
                                <li key={i} style={{ marginBottom: '0.5cqi' }}>
                                    <SlideMarkdown content={pt} inline />
                                </li>
                            ))}
                        </ul>
                    )}
                </motion.div>
            </div>

            {annotations?.length > 0 && (
                <div className="flex-shrink-0" style={{ fontSize: '1.1cqi', color: '#64748B', marginTop: '2cqi', paddingTop: '1cqi', borderTop: '1px solid #E2E8F0' }}>
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