// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/MatrixSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

const MatrixSlide = ({ content, isStatic = false }) => {
    const { title, quadrants = [], x_label = '重要度', y_label = '緊急度', annotations = [] } = content || {};

    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col">
            {/* ヘッダー */}
            <motion.div
                className="indigo-slide-header"
                style={{
                    marginBottom: '1.5cqi', // 余白を少し調整
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
                    <SlideMarkdown content={title || 'Matrix Analysis'} />
                </h2>
            </motion.div>

            {/* マトリックス・メインエリア */}
            <div className="flex-1 relative w-full h-full" style={{ marginTop: '2.5cqi' }}>

                {/* 座標軸コンテナ (ラベル分を確保するため 90% 程度にインセット) */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '2cqi' }}>

                    {/* 座標軸本体 */}
                    <div className="relative w-full h-full flex items-center justify-center">

                        {/* X軸 (水平) */}
                        <div className="absolute w-full h-[1px] bg-slate-300">
                            <span className="absolute left-full ml-[1cqi] top-1/2 -translate-y-1/2 whitespace-nowrap"
                                style={{ fontSize: '1.1cqi', color: '#64748B', fontWeight: 700, letterSpacing: '0.1em' }}>
                                {x_label} ➔
                            </span>
                        </div>

                        {/* Y軸 (垂直) */}
                        <div className="absolute h-full w-[1px] bg-slate-300">
                            {/* ラベル位置を調整: 軸の頂点に対して余裕を持たせて配置 */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[1.2cqi] flex flex-col items-center">
                                <span style={{
                                    fontSize: '1.1cqi',
                                    color: '#64748B',
                                    fontWeight: 700,
                                    letterSpacing: '0.1em',
                                    marginBottom: '0.4cqi',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {y_label}
                                </span>
                                <span style={{ fontSize: '0.8cqi', color: '#CBD5E1', lineHeight: 1 }}>▲</span>
                            </div>
                        </div>

                        {/* 4象限グリッド (軸と完全に同期) */}
                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                            {quadrants.slice(0, 4).map((q, i) => {
                                const isHighlight = i === 1; // 右上をハイライト
                                return (
                                    <motion.div
                                        key={i}
                                        className="flex flex-col"
                                        style={{ padding: '3cqi' }}
                                        initial={!isStatic ? { opacity: 0 } : {}}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5, delay: 0.2 + (i * 0.1) }}
                                    >
                                        <h3 style={{
                                            fontSize: '1.6cqi',
                                            fontWeight: 800,
                                            color: isHighlight ? 'var(--slide-primary)' : 'var(--slide-heading)',
                                            borderLeft: `4px solid ${isHighlight ? 'var(--slide-primary)' : '#CBD5E1'}`,
                                            paddingLeft: '1.2cqi',
                                            marginBottom: '1.5cqi',
                                            lineHeight: 1.3
                                        }}>
                                            <SlideMarkdown content={q.label} inline />
                                        </h3>
                                        <div style={{
                                            fontSize: '1.4cqi',
                                            color: 'var(--slide-body)',
                                            lineHeight: 1.6,
                                            paddingLeft: '1.6cqi'
                                        }}>
                                            <SlideMarkdown content={q.text} />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* 注釈 */}
            {annotations?.length > 0 && (
                <div style={{
                    fontSize: '1.1cqi',
                    color: '#64748B',
                    marginTop: '1.5cqi',
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

export default MatrixSlide;