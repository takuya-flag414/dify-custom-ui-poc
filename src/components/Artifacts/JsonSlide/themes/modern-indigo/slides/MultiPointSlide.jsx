// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/MultiPointSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

/**
 * Modern Indigo - MultiPointSlide (Structured Modularity)
 * @param {Object} content - { title, subtitle, items: [{ icon, heading, text }], annotations }
 */
const MultiPointSlide = ({ content, isStatic = false }) => {
    const {
        title,
        subtitle,
        items = [],
        annotations = []
    } = content || {};

    // アイテム数に応じたグリッド列数の自動計算（プロフェッショナルなプロポーションを維持）
    const getGridConfig = (count) => {
        if (count === 1) return { cols: 'grid-cols-1', maxW: 'max-w-4xl mx-auto' };
        if (count === 2) return { cols: 'grid-cols-2', maxW: 'w-full' };
        if (count === 4) return { cols: 'grid-cols-2', maxW: 'w-[85%] mx-auto' }; // 4つの場合は2x2で少し中央に寄せる
        return { cols: 'grid-cols-3', maxW: 'w-full' }; // 3, 5, 6... は3カラム
    };

    const gridConfig = getGridConfig(items.length);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        // 下からではなく、左からスライドさせることで「横のモジュール展開」を強調
        hidden: { opacity: 0, x: 15 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col">
            {/* ヘッダー: 常に一定の規律 */}
            <motion.div
                className="indigo-slide-header"
                style={{
                    marginBottom: subtitle ? '1cqi' : '2cqi',
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
                    <SlideMarkdown content={title || 'Key Points'} />
                </h2>
            </motion.div>

            {/* サブタイトル */}
            {subtitle && (
                <motion.div
                    style={{
                        fontSize: '1.4cqi',
                        color: '#64748B', // slate-500
                        fontWeight: 600,
                        marginBottom: '2.5cqi',
                        letterSpacing: '0.02em'
                    }}
                    {...(!isStatic && {
                        initial: { opacity: 0 },
                        animate: { opacity: 1 },
                        transition: { delay: 0.2 }
                    })}
                >
                    <SlideMarkdown content={subtitle} />
                </motion.div>
            )}

            {/* モジュール・グリッド・エリア */}
            <div className="flex-1 flex flex-col justify-center">
                <motion.div
                    className={`grid ${gridConfig.cols} gap-x-[4cqi] gap-y-[3.5cqi] ${gridConfig.maxW}`}
                    variants={!isStatic ? containerVariants : undefined}
                    initial={!isStatic ? "hidden" : undefined}
                    animate={!isStatic ? "visible" : undefined}
                >
                    {items.map((item, index) => (
                        <motion.div
                            key={index}
                            variants={!isStatic ? itemVariants : undefined}
                            className="flex flex-col relative"
                            style={{
                                paddingLeft: '2cqi' // 左ボーダーからのインデント
                            }}
                        >
                            {/* 構造的アクセント (Architectural Tick) */}
                            {/* 1. ベースとなる1pxのグレーライン (モジュールの高さを定義) */}
                            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-slate-200" />
                            {/* 2. 強調のための太く短いIndigoライン (視線のアンカー) */}
                            <div className="absolute left-[-1px] top-0 h-[2.5cqi] w-[3px]" style={{ backgroundColor: 'var(--slide-primary)' }} />

                            {/* モジュール・ヘッダー (水平基調) */}
                            <div className="flex items-start gap-[1cqi] mb-[1.2cqi]">
                                {/* インデックスまたはアイコン */}
                                <div style={{
                                    fontSize: '1.3cqi',
                                    fontWeight: 800,
                                    color: 'var(--slide-primary)',
                                    fontFamily: 'monospace',
                                    marginTop: '0.2cqi', // 見出しテキストとのベースライン微調整
                                    letterSpacing: '0.05em'
                                }}>
                                    {item.icon ? (
                                        <SlideMarkdown content={item.icon} inline />
                                    ) : (
                                        String(index + 1).padStart(2, '0')
                                    )}
                                </div>

                                {/* 小見出し */}
                                <h3 style={{
                                    fontSize: '1.6cqi',
                                    fontWeight: 800,
                                    color: 'var(--slide-heading)',
                                    lineHeight: 1.3,
                                    margin: 0
                                }}>
                                    <SlideMarkdown content={item.heading || `Point ${index + 1}`} inline />
                                </h3>
                            </div>

                            {/* 本文 (完璧な左揃え) */}
                            <div style={{
                                fontSize: '1.4cqi',
                                color: 'var(--slide-body)',
                                lineHeight: 1.7,
                                fontWeight: 400
                            }}>
                                <SlideMarkdown content={item.text || ''} />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* 注釈 (共通フッター) */}
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

export default MultiPointSlide;