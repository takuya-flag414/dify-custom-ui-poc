// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/AgendaSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';

import SlideMarkdown from '../../../MarkdownRenderer';

/**
 * Modern Indigo - AgendaSlide
 * @param {Object} content - { title, lead_text, items: [{ label }] }
 */
const MAX_ITEMS = 10;

const AgendaSlide = ({ content, isStatic = false }) => {
    const { title, lead_text, items: rawItems = [], annotations = [] } = content || {};
    const items = Array.isArray(rawItems) ? rawItems.slice(0, MAX_ITEMS) : [];

    // 5件を超えたら2カラム化
    const isMultiColumn = items.length > 4;

    return (
        <div className="json-slide-layout indigo-style" style={{ display: 'flex', flexDirection: 'column' }}>
            <motion.div 
                className="indigo-slide-header"
                style={{
                    marginBottom: '2.5cqi',
                    borderBottom: '2.5px solid var(--slide-primary, #6366f1)',
                    paddingBottom: '1.2cqi',
                    flexShrink: 0
                }}
                {...(!isStatic && {
                    initial: { opacity: 0, x: -20 },
                    animate: { opacity: 1, x: 0 },
                    transition: { duration: 0.5 }
                })}
            >
                <h2 style={{ fontSize: '2.8cqi', margin: 0, color: 'var(--slide-heading, #0f172a)', fontWeight: 700 }}>
                    <SlideMarkdown content={title || '本日のアジェンダ'} />
                </h2>
            </motion.div>

            <div className="indigo-slide-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {lead_text && (
                    <div style={{ 
                        fontSize: '1.9cqi', 
                        color: '#334155', 
                        marginBottom: '2cqi',
                        lineHeight: 1.5
                    }}>
                        <SlideMarkdown content={lead_text} />
                    </div>
                )}

                <div style={{ 
                    display: isMultiColumn ? 'grid' : 'flex', 
                    gridTemplateColumns: isMultiColumn ? '1fr 1fr' : 'none',
                    flexDirection: isMultiColumn ? 'none' : 'column',
                    columnGap: '4cqi',
                    rowGap: 0
                }}>
                    {items.map((item, idx) => (
                        <motion.div 
                            key={idx}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '1.8cqi',
                                padding: '1.2cqi 0',
                                borderBottom: '1px solid var(--slide-border, #e2e8f0)',
                                minHeight: '4.5cqi'
                            }}
                            {...(!isStatic && {
                                initial: { opacity: 0, y: 10 },
                                animate: { opacity: 1, y: 0 },
                                transition: { delay: 0.1 + idx * 0.05, duration: 0.4 }
                            })}
                        >
                            {/* 円形番号 (TitleSlideのトーンに合わせる) */}
                            <div style={{
                                width: '3.2cqi',
                                height: '3.2cqi',
                                borderRadius: '50%',
                                background: 'var(--slide-primary, #6366f1)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '1.4cqi',
                                flexShrink: 0,
                                marginTop: '0.2cqi'
                            }}>
                                {idx + 1}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ 
                                    fontWeight: 600, 
                                    fontSize: '1.8cqi', 
                                    color: 'var(--slide-heading, #0f172a)',
                                    lineHeight: 1.3
                                }}>
                                    <SlideMarkdown content={item.label} />
                                </div>
                                {item.description && (
                                    <div style={{ 
                                        fontSize: '1.3cqi', 
                                        color: 'var(--slide-muted, #64748b)', 
                                        marginTop: '0.4cqi',
                                        lineHeight: 1.4
                                    }}>
                                        <SlideMarkdown content={item.description} />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {annotations.length > 0 && (
                <div style={{ 
                    fontSize: '1.1cqi', 
                    color: 'var(--slide-muted, #94a3b8)', 
                    marginTop: 'auto', 
                    paddingTop: '1cqi', 
                    borderTop: '1px solid var(--slide-border, #e2e8f0)' 
                }}>
                    {annotations.map((note, idx) => (
                        <React.Fragment key={idx}>
                            <SlideMarkdown content={note} inline />
                            {idx < annotations.length - 1 && <span style={{ margin: '0 1cqi', opacity: 0.5 }}>|</span>}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AgendaSlide;
