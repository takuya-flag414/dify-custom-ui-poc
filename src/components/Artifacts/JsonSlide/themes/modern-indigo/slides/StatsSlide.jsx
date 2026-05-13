// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/StatsSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

const StatsSlide = ({ content, isStatic = false }) => {
    const {
        title,
        stats = [],
        description,
        body_text,
        annotations = [],
        layout_variation = 'default'
    } = content || {};

    const activeStats = Array.isArray(stats) ? stats : [];
    const mainText = body_text || description;
    const isTwoColumn = layout_variation === 'two-column';

    // 要素数に応じたグリッド列数の計算
    let cols = 3;
    if (activeStats.length === 1) cols = 1;
    if (activeStats.length === 2 || activeStats.length === 4) cols = 2;

    const gridClass = cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : 'grid-cols-3';

    // 個別の指標モジュール
    const StatItem = ({ stat, index }) => {
        // グリッドの左端ではない要素にのみ、1pxの左ディバイダーを引く
        const hasLeftBorder = cols > 1 && (index % cols !== 0);

        return (
            <motion.div
                className="flex flex-col relative"
                style={{
                    paddingLeft: hasLeftBorder ? '3cqi' : '1cqi',
                    borderLeft: hasLeftBorder ? '1px solid #E2E8F0' : '1px solid transparent'
                }}
                initial={!isStatic ? { opacity: 0, x: 15 } : {}}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
            >
                {/* ラベルと Architectural Tick (視線のアンカー) */}
                <div className="flex items-center gap-[1cqi] mb-[1cqi]">
                    <div style={{ width: '4px', height: '1.6cqi', backgroundColor: 'var(--slide-primary)' }} />
                    <span style={{
                        fontSize: '1.2cqi',
                        color: '#64748B',
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase'
                    }}>
                        <SlideMarkdown content={stat.label} inline />
                    </span>
                </div>

                {/* 巨大なバリュー（数値） */}
                <div style={{
                    fontSize: activeStats.length > 2 ? '4.5cqi' : '5.5cqi', // 要素数でサイズを微調整
                    fontWeight: 900,
                    color: 'var(--slide-heading)',
                    lineHeight: 1.1,
                    marginBottom: '1.5cqi',
                    letterSpacing: '-0.02em'
                }}>
                    <SlideMarkdown content={stat.value} inline />
                </div>

                {/* 補足説明 */}
                {stat.description && (
                    <div style={{
                        fontSize: '1.4cqi',
                        color: 'var(--slide-body)',
                        lineHeight: 1.6,
                        paddingLeft: '0.5cqi' // 少しだけ内側に入れて数字を際立たせる
                    }}>
                        <SlideMarkdown content={stat.description} />
                    </div>
                )}
            </motion.div>
        );
    };

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
                {...(!isStatic && { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } })}
            >
                <h2 style={{ fontSize: '2.6cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    <SlideMarkdown content={title || 'Key Metrics'} />
                </h2>
            </motion.div>

            {/* メインレイアウト */}
            <div className="flex-1 flex mt-[1cqi]">
                {isTwoColumn ? (
                    // 2カラム (左：示唆 / 右：指標グリッド)
                    <div className="w-full flex items-center gap-[4cqi]">
                        {mainText && (
                            <div className="flex-[4] flex flex-col pr-[2cqi]">
                                <h3 style={{ fontSize: '1.2cqi', color: '#94A3B8', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '1.5cqi', textTransform: 'uppercase' }}>
                                    Key Takeaway
                                </h3>
                                <motion.div
                                    style={{ borderLeft: '4px solid var(--slide-primary)', paddingLeft: '1.5cqi' }}
                                    initial={!isStatic ? { opacity: 0, x: -15 } : {}}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                >
                                    <div style={{ fontSize: '1.5cqi', color: 'var(--slide-body)', lineHeight: 1.7, fontWeight: 500 }}>
                                        <SlideMarkdown content={mainText} />
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* 中央ディバイダー */}
                        <div className="w-[1px] h-[80%] bg-slate-200" />

                        <div className="flex-[7] flex flex-col justify-center pl-[2cqi]">
                            <div className={`grid ${gridClass} gap-y-[5cqi] gap-x-[1cqi]`}>
                                {activeStats.map((stat, i) => <StatItem key={i} stat={stat} index={i} />)}
                            </div>
                        </div>
                    </div>
                ) : (
                    // 1カラム (上：指標グリッド / 下：示唆)
                    <div className="w-full flex flex-col justify-center gap-[6cqi]">
                        <div className="w-full">
                            <div className={`grid ${gridClass} gap-y-[5cqi] gap-x-[1cqi]`}>
                                {activeStats.map((stat, i) => <StatItem key={i} stat={stat} index={i} />)}
                            </div>
                        </div>
                        {mainText && (
                            <motion.div
                                className="w-[90%] mx-auto"
                                style={{
                                    borderLeft: '4px solid var(--slide-primary)',
                                    paddingLeft: '2cqi'
                                }}
                                initial={!isStatic ? { opacity: 0, y: 15 } : {}}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <div style={{ fontSize: '1.5cqi', color: 'var(--slide-body)', lineHeight: 1.7, fontWeight: 500 }}>
                                    <SlideMarkdown content={mainText} />
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>

            {/* 注釈 */}
            {annotations?.length > 0 && (
                <div style={{
                    fontSize: '1.1cqi',
                    color: '#64748B',
                    marginTop: 'auto',
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

export default StatsSlide;