// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/ChartSlide.jsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';
import {
    ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
    PieChart, Pie, Legend,
    Area, AreaChart, Line, LineChart
} from 'recharts';

// プロフェッショナル・エディトリアル・パレット (Financial Times / McKinsey 風)
// 彩度を抑えつつ、データの判別性を高めた配色
const SOPHISTICATED_PALETTE = [
    '#4F46E5', // Indigo (Primary)
    '#0D9488', // Teal
    '#D97706', // Amber
    '#4338CA', // Deep Indigo
    '#0891B2', // Cyan
    '#059669', // Emerald
    '#7C3AED', // Violet
    '#64748B', // Slate
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid var(--slide-border)',
                padding: '1cqi 1.5cqi',
                minWidth: '10cqi',
                boxShadow: 'none'
            }}>
                <p style={{ margin: '0 0 0.5cqi 0', fontSize: '1.1cqi', color: 'var(--slide-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.8cqi', fontSize: '1.3cqi', fontWeight: 800, color: 'var(--slide-heading)' }}>
                        <div style={{ width: '8px', height: '8px', backgroundColor: entry.color || entry.fill }} />
                        {entry.value.toLocaleString()}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const ChartSlide = ({ content, isStatic = false }) => {
    const {
        title,
        chart_type = 'bar',
        data: rawData = [],
        body_text,
        key_message,
        layout_variation = 'bottom-desc',
        annotations = []
    } = content || {};

    const chartData = useMemo(() => {
        return (Array.isArray(rawData) ? rawData : []).map(item => ({
            name: item.label || item.name || '',
            value: Number(item.value) || 0,
            ...item
        }));
    }, [rawData]);

    const isTwoColumn = layout_variation === 'left-desc' || layout_variation === 'two-column';

    const renderChart = () => {
        if (!chartData || chartData.length === 0) return null;

        const commonAxisProps = {
            tick: { fill: 'var(--slide-muted)', fontSize: '1.1cqi', fontWeight: 600 },
            axisLine: { stroke: 'var(--slide-border)', strokeWidth: 1.5 },
            tickLine: false,
        };

        const gridProps = {
            strokeDasharray: "3 3",
            vertical: false,
            stroke: "#F1F5F9",
            strokeWidth: 1.5
        };

        // パラメータ切り替えの修正 (line, area, bar, pie, doughnut に対応)
        const type = chart_type.toLowerCase();

        if (type === 'pie' || type === 'doughnut') {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={type === 'doughnut' ? "55%" : "0%"}
                            outerRadius="85%"
                            paddingAngle={2}
                            dataKey="value"
                            stroke="#fff"
                            strokeWidth={2}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`var(--slide-chart-${(index % 5) + 1})`} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="square" verticalAlign="bottom" wrapperStyle={{ paddingTop: '2cqi', fontSize: '1.1cqi', fontWeight: 600 }} />
                    </PieChart>
                </ResponsiveContainer>
            );
        }

        if (type === 'line' || type === 'area') {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid {...gridProps} />
                        <XAxis dataKey="name" {...commonAxisProps} />
                        <YAxis {...commonAxisProps} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="var(--slide-chart-1)"
                            strokeWidth={3}
                            fill="var(--slide-chart-1)"
                            fillOpacity={type === 'area' ? 0.1 : 0} 
                            activeDot={{ r: 5, fill: "var(--slide-chart-1)", stroke: "#fff", strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            );
        }

        // Default: Bar
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="name" {...commonAxisProps} />
                    <YAxis {...commonAxisProps} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
                    <Bar dataKey="value" fill="var(--slide-chart-1)">
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || `var(--slide-chart-${(index % 5) + 1})`} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col">
            {/* ヘッダー */}
            <motion.div
                className="indigo-slide-header flex-shrink-0"
                style={{ marginBottom: '2.5cqi', borderBottom: '2.5px solid var(--slide-primary)', paddingBottom: '1.2cqi' }}
                {...(!isStatic && { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 } })}
            >
                <h2 style={{ fontSize: '2.6cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    <SlideMarkdown content={title || 'Data Analysis'} />
                </h2>
            </motion.div>

            {/* メインコンテンツ */}
            <div className="flex-1 flex min-h-0 mt-[1cqi]">
                {isTwoColumn ? (
                    <div className="w-full flex items-stretch gap-[4cqi]">
                        <div className="flex-[4] flex flex-col justify-center">
                            {key_message && (
                                <div style={{ borderLeft: '4px solid var(--slide-primary)', paddingLeft: '1.5cqi', marginBottom: '2cqi' }}>
                                    <div style={{ fontSize: '1.8cqi', fontWeight: 800, color: 'var(--slide-heading)', lineHeight: 1.4 }}>
                                        <SlideMarkdown content={key_message} />
                                    </div>
                                </div>
                            )}
                            {body_text && (
                                <div style={{ fontSize: '1.4cqi', color: 'var(--slide-body)', lineHeight: 1.7 }}>
                                    <SlideMarkdown content={body_text} />
                                </div>
                            )}
                        </div>
                        <div className="w-[1px] bg-slate-200 my-[2cqi]" />
                        <div className="flex-[8] relative min-h-0">
                            {/* 重要: Rechartsのために親要素に高さを明示 */}
                            <div className="absolute inset-0 pb-[2cqi]">
                                {renderChart()}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex flex-col gap-[3cqi]">
                        <div className="flex-1 min-h-0 relative">
                            <div className="absolute inset-0">
                                {renderChart()}
                            </div>
                        </div>
                        {(key_message || body_text) && (
                            <div className="flex-shrink-0 w-full max-w-[95%] mx-auto mb-[1cqi]">
                                {key_message && (
                                    <div style={{ borderLeft: '4px solid var(--slide-primary)', paddingLeft: '1.5cqi', marginBottom: '1cqi' }}>
                                        <div style={{ fontSize: '1.7cqi', fontWeight: 800, color: 'var(--slide-heading)', lineHeight: 1.4 }}>
                                            <SlideMarkdown content={key_message} />
                                        </div>
                                    </div>
                                )}
                                {body_text && (
                                    <div style={{ fontSize: '1.4cqi', color: 'var(--slide-body)', lineHeight: 1.6, paddingLeft: key_message ? '1.5cqi' : '0' }}>
                                        <SlideMarkdown content={body_text} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* フッター */}
            {annotations?.length > 0 && (
                <div className="flex-shrink-0" style={{ fontSize: '1.1cqi', color: '#64748B', marginTop: '1.5cqi', paddingTop: '1cqi', borderTop: '1px solid #E2E8F0' }}>
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

export default ChartSlide;