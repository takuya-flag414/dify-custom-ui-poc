// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/TimelineSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

const TimelineSlide = ({ content, isStatic = false }) => {
    const {
        title,
        items = [],
        events = [],
        annotations = [],
        layout_variation = 'vertical'
    } = content || {};

    // データの正規化
    const rawEvents = events.length > 0 ? events : items;
    const activeEvents = Array.isArray(rawEvents) ? rawEvents.map(e => ({
        date: e.date || e.year || e.label || e.step || '',
        title: e.title || e.label || '',
        description: e.description || ''
    })) : [];

    const isHorizontal = layout_variation === 'horizontal';

    // 垂直レイアウト (Vertical): ストイックなリスト化
    const renderVertical = () => (
        <div className="relative w-full ml-[2cqi] mt-[1.5cqi]">
            {/* メイントラック (Vertical 1px Line) */}
            <motion.div
                className="absolute left-0 top-[1.5cqi] bottom-[1.5cqi] w-[1px]"
                style={{ backgroundColor: 'var(--slide-border)' }}
                initial={!isStatic ? { scaleY: 0, transformOrigin: 'top' } : {}}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            />

            <div className="flex flex-col gap-[3.5cqi]">
                {activeEvents.map((event, i) => (
                    <motion.div
                        key={i}
                        className="relative flex flex-col pl-[3.5cqi]"
                        initial={!isStatic ? { opacity: 0, x: 15 } : {}}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 + (i * 0.1) }}
                    >
                        {/* 幾何学ノード & Architectural Tick */}
                        <div className="absolute left-[-2.5px] top-[0.6cqi] w-[6px] h-[6px] bg-[var(--slide-primary)] rounded-sm z-10" />
                        <div className="absolute left-0 top-[0.6cqi] w-[2cqi] h-[1px] mt-[2.5px]" style={{ backgroundColor: 'var(--slide-border)' }} />

                        {/* Date (時間のインデックス) */}
                        <div style={{
                            fontSize: '1.2cqi',
                            fontWeight: 800,
                            color: 'var(--slide-primary)',
                            fontFamily: 'monospace',
                            letterSpacing: '0.1em',
                            marginBottom: '0.8cqi'
                        }}>
                            {event.date}
                        </div>

                        {/* 見出し */}
                        <h3 style={{
                            fontSize: '1.6cqi',
                            fontWeight: 800,
                            color: 'var(--slide-heading)',
                            marginBottom: '1cqi',
                            lineHeight: 1.3
                        }}>
                            <SlideMarkdown content={event.title} inline />
                        </h3>

                        {/* 本文 (箱を排除し余白で魅せる) */}
                        {event.description && (
                            <div style={{
                                fontSize: '1.4cqi',
                                color: 'var(--slide-body)',
                                lineHeight: 1.6,
                                paddingLeft: '1.5cqi',
                                borderLeft: '2px solid #F1F5F9' // 極薄のインデント
                            }}>
                                <SlideMarkdown content={event.description} />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );

    // 水平レイアウト (Horizontal): ドロップラインと左揃えモジュール
    const renderHorizontal = () => {
        const gridColumns = activeEvents.length > 0 ? `repeat(${activeEvents.length}, minmax(0, 1fr))` : '1fr';

        return (
            <div className="relative w-full flex-1 flex flex-col justify-center mt-[1cqi]">
                {/* メイントラック (Horizontal 1px Line) */}
                <motion.div
                    className="absolute top-1/2 left-[1.5cqi] right-[1.5cqi] h-[1px] bg-slate-200 -translate-y-1/2 z-0"
                    initial={!isStatic ? { scaleX: 0, transformOrigin: 'left' } : {}}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />

                <div className="relative z-10 w-full h-[85%] flex flex-col">
                    {/* 上段グリッド (偶数インデックス) */}
                    <div className="flex-1 grid items-end pb-[2.5cqi]" style={{ gridTemplateColumns: gridColumns }}>
                        {activeEvents.map((event, i) => (
                            <div key={`top-${i}`} className="relative px-[1.5cqi]">
                                {i % 2 === 0 && (
                                    <motion.div
                                        className="flex flex-col"
                                        style={{ borderLeft: '2px solid var(--slide-border)', paddingLeft: '1.2cqi' }}
                                        initial={!isStatic ? { opacity: 0, y: -10 } : {}}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.3 + (i * 0.1) }}
                                    >
                                        {/* ドロップライン(茎)とノード */}
                                        <div className="absolute left-[1.5cqi] bottom-[-2.5cqi] w-[1px] h-[2.5cqi] bg-slate-200" />
                                        <div className="absolute left-[1.5cqi] bottom-[-2.5cqi] w-[6px] h-[6px] bg-[var(--slide-primary)] rounded-sm -translate-x-[2.5px] translate-y-[3px] z-10" />

                                        <div style={{ fontSize: '1.2cqi', fontWeight: 800, color: 'var(--slide-primary)', fontFamily: 'monospace', letterSpacing: '0.05em', marginBottom: '0.6cqi' }}>{event.date}</div>
                                        <h3 style={{ fontSize: '1.5cqi', fontWeight: 800, color: 'var(--slide-heading)', marginBottom: '0.8cqi', lineHeight: 1.3 }}><SlideMarkdown content={event.title} inline /></h3>
                                        {event.description && <div style={{ fontSize: '1.3cqi', color: 'var(--slide-body)', lineHeight: 1.6 }}><SlideMarkdown content={event.description} /></div>}
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>
                    {/* 下段グリッド (奇数インデックス) */}
                    <div className="flex-1 grid items-start pt-[2.5cqi]" style={{ gridTemplateColumns: gridColumns }}>
                        {activeEvents.map((event, i) => (
                            <div key={`bottom-${i}`} className="relative px-[1.5cqi]">
                                {i % 2 !== 0 && (
                                    <motion.div
                                        className="flex flex-col"
                                        style={{ borderLeft: '2px solid var(--slide-border)', paddingLeft: '1.2cqi' }}
                                        initial={!isStatic ? { opacity: 0, y: 10 } : {}}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.3 + (i * 0.1) }}
                                    >
                                        {/* ドロップライン(茎)とノード */}
                                        <div className="absolute left-[1.5cqi] top-[-2.5cqi] w-[1px] h-[2.5cqi] bg-slate-200" />
                                        <div className="absolute left-[1.5cqi] top-[-2.5cqi] w-[6px] h-[6px] bg-[var(--slide-primary)] rounded-sm -translate-x-[2.5px] -translate-y-[3px] z-10" />

                                        <div style={{ fontSize: '1.2cqi', fontWeight: 800, color: 'var(--slide-primary)', fontFamily: 'monospace', letterSpacing: '0.05em', marginBottom: '0.6cqi' }}>{event.date}</div>
                                        <h3 style={{ fontSize: '1.5cqi', fontWeight: 800, color: 'var(--slide-heading)', marginBottom: '0.8cqi', lineHeight: 1.3 }}><SlideMarkdown content={event.title} inline /></h3>
                                        {event.description && <div style={{ fontSize: '1.3cqi', color: 'var(--slide-body)', lineHeight: 1.6 }}><SlideMarkdown content={event.description} /></div>}
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col">
            {/* ヘッダー */}
            <motion.div
                className="indigo-slide-header"
                style={{
                    marginBottom: '1cqi',
                    borderBottom: '2.5px solid var(--slide-primary)',
                    paddingBottom: '1.2cqi'
                }}
                {...(!isStatic && { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } })}
            >
                <h2 style={{ fontSize: '2.6cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    <SlideMarkdown content={title || 'Timeline'} />
                </h2>
            </motion.div>

            {/* タイムライン・メインエリア */}
            <div className="flex-1 flex w-full">
                {isHorizontal ? renderHorizontal() : renderVertical()}
            </div>

            {/* 注釈 */}
            {annotations?.length > 0 && (
                <div style={{
                    fontSize: '1.1cqi',
                    color: 'var(--slide-muted)',
                    marginTop: '2cqi',
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

export default TimelineSlide;