// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/KpiDashboardSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

const KpiDashboardSlide = ({ content, isStatic = false }) => {
    const {
        title,
        summary_kpis = [],
        detail_kpis = [],
        kpis = [], // Fallback
        body_text,
        annotations = []
    } = content || {};

    // データの整理（旧フォーマットとの互換性維持）
    const hasNewStructure = (summary_kpis && summary_kpis.length > 0) || (detail_kpis && detail_kpis.length > 0);
    let activeSummary = summary_kpis || [];
    let activeDetails = detail_kpis || [];

    if (!hasNewStructure && kpis && kpis.length > 0) {
        activeSummary = kpis.slice(0, 2);
        activeDetails = kpis.slice(2, 8);
    }

    // トレンドシグナルのスタイル計算（バッジではなくソリッドなテキストカラーとして表現）
    const getTrendStyle = (trend, status) => {
        let color = '#64748B'; // flat (slate-500)
        let icon = '▶';

        if (trend === 'up') icon = '▲';
        if (trend === 'down') icon = '▼';

        // statusが明示されている場合はそれを優先（downでも良い指標があるため）
        if (status === 'good') color = '#059669'; // emerald-600
        else if (status === 'warning') color = '#D97706'; // amber-600
        else if (status === 'bad') color = '#E11D48'; // rose-600
        else {
            // fallback
            if (trend === 'up') color = '#059669';
            if (trend === 'down') color = '#E11D48';
        }

        return { color, icon };
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
                    <SlideMarkdown content={title || 'KPI Dashboard'} />
                </h2>
            </motion.div>

            {/* ターミナル・メインエリア */}
            <div className="flex-1 flex flex-col mt-[1cqi]">

                {/* 1. Summary KPIs (最重要指標レイヤー) */}
                {activeSummary.length > 0 && (
                    <div className="flex w-full mb-[3.5cqi]">
                        {activeSummary.map((kpi, idx) => {
                            const { color, icon } = getTrendStyle(kpi.trend, kpi.status);
                            const hasLeftBorder = idx !== 0;

                            return (
                                <motion.div
                                    key={`summary-${idx}`}
                                    className="flex-1 flex flex-col"
                                    style={{
                                        paddingLeft: hasLeftBorder ? '3cqi' : '0',
                                        borderLeft: hasLeftBorder ? '1px solid #E2E8F0' : 'none'
                                    }}
                                    initial={!isStatic ? { opacity: 0, y: 15 } : {}}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 + (idx * 0.1) }}
                                >
                                    {/* ラベルと Architectural Tick */}
                                    <div className="flex items-center gap-[1cqi] mb-[1.5cqi]">
                                        <div style={{ width: '4px', height: '1.6cqi', backgroundColor: 'var(--slide-primary)' }} />
                                        <span style={{ fontSize: '1.3cqi', color: '#64748B', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                            <SlideMarkdown content={kpi.label} inline />
                                        </span>
                                    </div>

                                    {/* 巨大な数値とトレンドシグナル */}
                                    <div className="flex items-baseline gap-[1.5cqi]">
                                        <span style={{ fontSize: '5cqi', fontWeight: 900, color: 'var(--slide-heading)', lineHeight: 1, letterSpacing: '-0.03em' }}>
                                            <SlideMarkdown content={kpi.value} inline />
                                        </span>
                                        {kpi.change && (
                                            <span style={{ fontSize: '1.6cqi', fontWeight: 800, color, display: 'flex', alignItems: 'center', gap: '0.3cqi' }}>
                                                <span>{icon}</span>
                                                <SlideMarkdown content={String(kpi.change)} inline />
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* 階層を分ける水平ディバイダー */}
                {activeSummary.length > 0 && activeDetails.length > 0 && (
                    <motion.div
                        className="w-full h-[1.5px] bg-slate-200 mb-[3.5cqi]"
                        initial={!isStatic ? { scaleX: 0 } : {}}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                )}

                {/* 2. Detail KPIs (詳細指標マトリックス) */}
                {activeDetails.length > 0 && (
                    <div className="w-full grid grid-cols-4 gap-y-[4cqi]">
                        {activeDetails.map((kpi, idx) => {
                            const { color, icon } = getTrendStyle(kpi.trend, kpi.status);
                            // 4列グリッドのため、右端（index 3, 7, 11...）以外に縦線を引く
                            const hasRightBorder = (idx + 1) % 4 !== 0;

                            return (
                                <motion.div
                                    key={`detail-${idx}`}
                                    className="flex flex-col"
                                    style={{
                                        paddingRight: '2cqi',
                                        paddingLeft: idx % 4 !== 0 ? '2cqi' : '0',
                                        borderRight: hasRightBorder ? '1px solid #E2E8F0' : 'none'
                                    }}
                                    initial={!isStatic ? { opacity: 0 } : {}}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.4, delay: 0.4 + (idx * 0.05) }}
                                >
                                    <span style={{ fontSize: '1.1cqi', color: '#64748B', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.8cqi' }}>
                                        <SlideMarkdown content={kpi.label} inline />
                                    </span>

                                    <div className="flex items-baseline gap-[1cqi]">
                                        <span style={{ fontSize: '2.2cqi', fontWeight: 800, color: 'var(--slide-heading)', lineHeight: 1.2 }}>
                                            <SlideMarkdown content={kpi.value} inline />
                                        </span>
                                        {kpi.change && (
                                            <span style={{ fontSize: '1.2cqi', fontWeight: 800, color, display: 'flex', alignItems: 'center', gap: '0.2cqi' }}>
                                                <span>{icon}</span>
                                                <SlideMarkdown content={String(kpi.change)} inline />
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* 3. 結論・インサイト (Body Text) */}
                {body_text && (
                    <motion.div
                        className="mt-auto pt-[2cqi]"
                        initial={!isStatic ? { opacity: 0, y: 10 } : {}}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
                        <div style={{
                            borderLeft: '4px solid var(--slide-primary)',
                            paddingLeft: '1.5cqi',
                            fontSize: '1.4cqi',
                            color: 'var(--slide-body)',
                            lineHeight: 1.6,
                            fontWeight: 500
                        }}>
                            <SlideMarkdown content={body_text} />
                        </div>
                    </motion.div>
                )}
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

export default KpiDashboardSlide;