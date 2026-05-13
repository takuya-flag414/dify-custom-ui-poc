// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/DataInsightSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

const DataInsightSlide = ({ content, isStatic = false }) => {
    const { title, insight_title = "Key Insight", insight_text, annotations = [] } = content || {};

    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col">
            {/* ヘッダー: 一貫性のあるラインデザイン */}
            <motion.div
                className="indigo-slide-header"
                style={{
                    marginBottom: '2.5cqi',
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
                    <SlideMarkdown content={title || 'Data Insight'} />
                </h2>
            </motion.div>

            {/* メインコンテンツ: フラット・グリッド・レイアウト */}
            <div className="flex-1 flex items-stretch gap-[3cqi]">

                {/* 左側：チャート・ビジュアライゼーション・フレーム */}
                <motion.div
                    className="flex-[6] flex flex-col"
                    initial={!isStatic ? { opacity: 0 } : {}}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex-1 rounded-sm relative overflow-hidden"
                        style={{
                            backgroundColor: '#F1F5F9', // slate-100 (極めてフラットな背景)
                            border: '1px solid #E2E8F0' // slate-200 (繊細な境界線)
                        }}>
                        {/* 最小限の装飾: 軸を意識させるヘアライン */}
                        <div className="absolute bottom-[2cqi] left-[2cqi] right-[2cqi] h-[1px] bg-slate-300" />
                        <div className="absolute left-[2cqi] top-[2cqi] bottom-[2cqi] w-[1px] bg-slate-300" />

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span style={{
                                fontSize: '1.2cqi',
                                color: '#94A3B8',
                                fontWeight: 600,
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase'
                            }}>
                                Data Visualization Area
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* 右側：インサイト・パネル */}
                <motion.div
                    className="flex-[4] flex flex-col justify-start pt-[1cqi]"
                    initial={!isStatic ? { opacity: 0, x: 10 } : {}}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    {/* インサイトの見出し: 太い垂直線で強調 */}
                    <div style={{
                        borderLeft: '5px solid var(--slide-primary)',
                        paddingLeft: '1.5cqi',
                        marginBottom: '2cqi'
                    }}>
                        <h3 style={{
                            fontSize: '1.8cqi',
                            fontWeight: 800,
                            color: 'var(--slide-heading)',
                            lineHeight: 1.3,
                            margin: 0
                        }}>
                            <SlideMarkdown content={insight_title} inline />
                        </h3>
                    </div>

                    {/* インサイトの詳細テキスト */}
                    <div style={{
                        fontSize: '1.5cqi',
                        color: 'var(--slide-body)',
                        lineHeight: 1.7,
                        fontWeight: 400,
                        paddingLeft: '1.5cqi' // 見出しの線と合わせる
                    }}>
                        <SlideMarkdown content={insight_text} />
                    </div>

                    {/* フラットな装飾: 結論を締めるためのボトムライン (オプション) */}
                    <div style={{
                        marginTop: 'auto',
                        width: '3cqi',
                        height: '2px',
                        backgroundColor: 'var(--slide-primary)',
                        marginLeft: '1.5cqi',
                        opacity: 0.4
                    }} />
                </motion.div>
            </div>

            {/* 注釈 (共通フッター) */}
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

export default DataInsightSlide;