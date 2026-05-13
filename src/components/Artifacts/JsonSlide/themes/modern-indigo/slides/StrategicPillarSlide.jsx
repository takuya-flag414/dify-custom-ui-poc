// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/StrategicPillarSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

const StrategicPillarSlide = ({ content, isStatic = false }) => {
    const { title, pillars = [], foundation, annotations = [] } = content || {};

    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col">
            {/* ヘッダー: 常に一定の規律 */}
            <motion.div
                className="indigo-slide-header"
                style={{
                    marginBottom: '1.5cqi',
                    borderBottom: '2.5px solid var(--slide-primary)',
                    paddingBottom: '1.2cqi'
                }}
                {...(!isStatic && {
                    initial: { opacity: 0, y: -10 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.4 }
                })}
            >
                <h2 style={{ fontSize: '2.6cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    <SlideMarkdown content={title || 'Strategic Pillars'} />
                </h2>
            </motion.div>

            {/* 戦略構造体 (Architectural Grid) */}
            <div className="flex-1 flex flex-col mt-[1.5cqi]">

                {/* 梁 (Roof Line): 全体を束ねるIndigoのライン */}
                <motion.div
                    className="w-full h-[3px]"
                    style={{ backgroundColor: 'var(--slide-primary)' }}
                    initial={!isStatic ? { scaleX: 0 } : {}}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />

                {/* 柱 (Pillars Grid): 1pxのヘアラインで区切り、抜け感を出す */}
                <div className="flex-1 grid grid-cols-3">
                    {pillars.slice(0, 3).map((p, i) => (
                        <motion.div
                            key={i}
                            className={`flex flex-col pt-[2.5cqi] pb-[3cqi] ${
                                // タイトルとの垂直方向のアライメントを厳密に調整
                                i === 0 ? 'pr-[2.5cqi]' : i === 2 ? 'pl-[2.5cqi]' : 'px-[2.5cqi]'
                                }`}
                            style={{
                                borderLeft: i > 0 ? '1px solid #E2E8F0' : 'none'
                            }}
                            initial={!isStatic ? { opacity: 0 } : {}}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 + (i * 0.1) }}
                        >
                            <div style={{
                                fontSize: '1.2cqi',
                                fontWeight: 800,
                                color: 'var(--slide-primary)',
                                fontFamily: 'monospace',
                                marginBottom: '1cqi',
                                opacity: 0.8
                            }}>
                                {String(i + 1).padStart(2, '0')}
                            </div>

                            <h3 style={{
                                fontSize: '1.6cqi',
                                fontWeight: 800,
                                color: 'var(--slide-heading)',
                                marginBottom: '1.5cqi',
                                lineHeight: 1.4
                            }}>
                                <SlideMarkdown content={p.heading} inline />
                            </h3>

                            <div style={{
                                fontSize: '1.4cqi',
                                color: 'var(--slide-body)',
                                lineHeight: 1.7
                            }}>
                                <SlideMarkdown content={p.text} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* 土台 (Structural Foundation): 黒ベタを廃止し、クリーンな構造へ */}
                <motion.div
                    className="w-full flex items-center justify-center relative"
                    style={{
                        // 背景は極めて薄いグレーか白にし、ラインで「支える」印象を作る
                        backgroundColor: '#F8FAFC',
                        borderTop: '2px solid var(--slide-primary)',
                        borderBottom: '1px solid #E2E8F0',
                        padding: '1.8cqi 2cqi'
                    }}
                    initial={!isStatic ? { opacity: 0, y: 10 } : {}}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <span style={{
                        fontSize: '1.5cqi',
                        color: 'var(--slide-heading)',
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase'
                    }}>
                        <SlideMarkdown content={foundation || 'Unified Foundation'} inline />
                    </span>
                </motion.div>
            </div>

            {/* 注釈 */}
            {annotations?.length > 0 && (
                <div style={{
                    fontSize: '1.1cqi',
                    color: '#64748B',
                    marginTop: '2cqi',
                    paddingTop: '1cqi',
                    borderTop: '1px solid #E2E8F0'
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

export default StrategicPillarSlide;