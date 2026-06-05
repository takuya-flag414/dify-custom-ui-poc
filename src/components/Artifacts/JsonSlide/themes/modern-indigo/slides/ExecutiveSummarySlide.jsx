// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/ExecutiveSummarySlide.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

const ExecutiveSummarySlide = ({ content, isStatic = false }) => {
    const { title, summary_left, summary_right, annotations = [] } = content || {};

    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col">
            {/* ヘッダー */}
            <motion.div
                className="indigo-slide-header"
                style={{
                    marginBottom: '2.5cqi',
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
                    <SlideMarkdown content={title || 'Executive Summary'} />
                </h2>
            </motion.div>

            {/* メインコンテンツエリア */}
            <div className="flex-1 flex relative items-stretch gap-[4cqi]">

                {/* 中央のディバイダー（視線誘導） */}
                <div className="absolute left-[41.66%] top-1/2 -translate-y-1/2 -translate-x-1/2 h-[80%] w-[1px] bg-slate-200 hidden md:block z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-[2.5cqi] h-[2.5cqi] bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 z-10 shadow-sm" style={{ fontSize: '1cqi' }}>
                        ▶
                    </div>
                </div>

                {/* 左側：現状と課題（静・抑制） */}
                <motion.div
                    className="flex-[5] flex flex-col justify-center p-[2.5cqi] z-10"
                    style={{
                        border: '1px solid rgba(99, 102, 241, 0.2)', // 薄いIndigoボーダー
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        backdropFilter: 'blur(4px)'
                    }}
                    initial={!isStatic ? { opacity: 0, x: -20 } : {}}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h3 style={{
                        fontSize: '1.4cqi',
                        color: 'var(--slide-muted)',
                        fontWeight: 800,
                        marginBottom: '1.5cqi',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase'
                    }}>
                        <SlideMarkdown content={summary_left?.title || '現状と課題'} inline />
                    </h3>
                    <div style={{
                        fontSize: '1.6cqi',
                        lineHeight: 1.75,
                        color: 'var(--slide-body)',
                        fontWeight: 500
                    }}>
                        <SlideMarkdown content={summary_left?.text} />
                    </div>
                </motion.div>

                {/* 右側：提言と結論（動・強調） */}
                <motion.div
                    className="flex-[7] flex flex-col justify-center z-10"
                    initial={!isStatic ? { opacity: 0, x: 20 } : {}}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <h3 style={{
                        fontSize: '1.8cqi',
                        fontWeight: 800,
                        marginBottom: '2cqi',
                        color: 'var(--slide-heading)',
                        letterSpacing: '0.02em'
                    }}>
                        <SlideMarkdown content={summary_right?.title || '主要な提言'} inline />
                    </h3>

                    <div className="flex flex-col gap-[1.5cqi]">
                        {summary_right?.items?.map((item, i) => (
                            <motion.div
                                key={i}
                                className="flex items-center p-[1.5cqi] relative overflow-hidden"
                                style={{
                                    background: 'white',
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0,0,0,0.03)', // 上品なドロップシャドウ
                                    borderLeft: '4px solid var(--slide-primary)' // Indigoのアクセントライン
                                }}
                                initial={!isStatic ? { opacity: 0, y: 10 } : {}}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.4 + (i * 0.1) }}
                            >
                                {/* 背景の透かし数字 (オプションの装飾) */}
                                <div className="absolute -right-2 -bottom-4 text-slate-50 font-black italic select-none pointer-events-none" style={{ fontSize: '8cqi', lineHeight: 1 }}>
                                    {String(i + 1).padStart(2, '0')}
                                </div>

                                {/* 連番 */}
                                <div style={{
                                    fontSize: '2.2cqi',
                                    fontWeight: 900,
                                    color: 'var(--slide-primary)',
                                    opacity: 0.3,
                                    marginRight: '1.5cqi',
                                    fontFamily: 'monospace'
                                }}>
                                    {String(i + 1).padStart(2, '0')}
                                </div>

                                {/* テキスト */}
                                <div style={{
                                    fontSize: '1.6cqi',
                                    fontWeight: 700,
                                    color: 'var(--slide-heading)',
                                    lineHeight: 1.5,
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    <SlideMarkdown content={item} inline />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
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

export default ExecutiveSummarySlide;