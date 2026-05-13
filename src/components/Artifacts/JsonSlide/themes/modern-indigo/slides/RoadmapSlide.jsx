// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/RoadmapSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

const RoadmapSlide = ({ content, isStatic = false }) => {
    const { title, steps = [], annotations = [] } = content || {};

    // ステップ数に応じた均等分割グリッド（インラインスタイルで動的生成）
    const gridColumns = steps.length > 0 ? `repeat(${steps.length}, minmax(0, 1fr))` : '1fr';

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
                    <SlideMarkdown content={title || 'Roadmap & Milestones'} />
                </h2>
            </motion.div>

            {/* ロードマップ・メインエリア (Continuous Linear Track) */}
            <div className="flex-1 relative mt-[2cqi] w-full">

                {/* 1. ベーストラック (時間の連続性を示す1本の線) */}
                <motion.div
                    className="absolute top-[4cqi] left-0 w-full h-[2px] bg-slate-200 z-0"
                    initial={!isStatic ? { scaleX: 0, transformOrigin: 'left' } : {}}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                />

                {/* 2. ステップ・グリッド (均等配置) */}
                <div
                    className="relative z-10 grid h-full"
                    style={{ gridTemplateColumns: gridColumns }}
                >
                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            className="relative flex flex-col"
                            style={{
                                paddingTop: '7cqi', // トラックと日付のための上部余白
                                paddingLeft: i === 0 ? '0' : '2cqi', // 最初の要素は左端に揃える
                                paddingRight: '2cqi'
                            }}
                            initial={!isStatic ? { opacity: 0, y: 15 } : {}}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 + (i * 0.15) }}
                        >
                            {/* Date (期日/フェーズ) - トラックの上部に配置 */}
                            <div
                                className="absolute"
                                style={{
                                    top: '1.2cqi',
                                    left: i === 0 ? '0' : '2cqi',
                                    fontSize: '1.4cqi',
                                    fontWeight: 800,
                                    color: 'var(--slide-primary)',
                                    fontFamily: 'monospace',
                                    letterSpacing: '0.05em'
                                }}
                            >
                                {step.date}
                            </div>

                            {/* Node (幾何学的なマイルストーン点) */}
                            <div
                                className="absolute"
                                style={{
                                    top: '4cqi', // ベーストラックとY座標を完全に一致させる
                                    left: i === 0 ? '0' : '2cqi',
                                    width: '1.2cqi',
                                    height: '1.2cqi',
                                    backgroundColor: 'var(--slide-primary)',
                                    transform: 'translateY(-50%)', // トラックの真ん中にスナップさせる
                                    borderRadius: '2px' // わずかな角丸でシャープすぎない幾何学図形に
                                }}
                            />

                            {/* ドロップライン & コンテンツエリア */}
                            <div
                                className="flex-1 flex flex-col"
                                style={{
                                    borderLeft: '2px solid var(--slide-border)', // 極めて薄いドロップライン
                                    paddingLeft: '1.5cqi',
                                    marginLeft: '0.5cqi' // ノードの中心から線が落ちるように微調整
                                }}
                            >
                                {/* 見出し (Label) */}
                                <h3 style={{
                                    fontSize: '1.6cqi',
                                    fontWeight: 800,
                                    color: 'var(--slide-heading)',
                                    marginBottom: '1cqi',
                                    lineHeight: 1.3
                                }}>
                                    <SlideMarkdown content={step.label} inline />
                                </h3>

                                {/* 本文 (Description) */}
                                <div style={{
                                    fontSize: '1.4cqi',
                                    color: 'var(--slide-body)',
                                    lineHeight: 1.6
                                }}>
                                    <SlideMarkdown content={step.description} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* 注釈 (共通フッター) */}
            {annotations?.length > 0 && (
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

export default RoadmapSlide;