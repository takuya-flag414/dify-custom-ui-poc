// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';
import {
    ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
    PieChart, Pie, Legend,
    Area, AreaChart, Line, LineChart
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid var(--slide-border)',
                padding: '1cqi 1.5cqi',
                minWidth: '10cqi',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}>
                <p style={{ margin: '0 0 0.5cqi 0', fontSize: '1.1cqi', color: 'var(--slide-muted)', fontWeight: 700 }}>{label}</p>
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

const DataInsightSlide = ({ content, isStatic = false }) => {
    const {
        title,
        insight_title = "Key Insight",
        insight_text,
        chart_type = 'bar',
        data: rawData = [],
        headers: rawHeaders = [],
        rows: rawRows = [],
        annotations = []
    } = content || {};

    const chartData = useMemo(() => {
        return (Array.isArray(rawData) ? rawData : []).map(item => ({
            name: item.label || item.name || '',
            value: Number(item.value) || 0,
            ...item
        }));
    }, [rawData]);

    const headers = Array.isArray(rawHeaders) ? rawHeaders : [];
    const rows = Array.isArray(rawRows) ? rawRows : [];
    const hasTableData = headers.length > 0 || rows.length > 0;

    const renderTable = () => (
        <div className="w-full h-full flex items-center justify-center p-[1cqi]">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr>
                        {headers.map((header, idx) => (
                            <th key={idx} style={{
                                padding: '1cqi 1.2cqi',
                                borderTop: '2px solid var(--slide-primary)',
                                borderBottom: '1px solid var(--slide-heading)',
                                fontSize: '1.1cqi',
                                color: '#64748B',
                                fontWeight: 800,
                                verticalAlign: 'bottom'
                            }}>
                                <SlideMarkdown content={header} inline />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.slice(0, 6).map((row, rowIndex) => (
                        <tr key={rowIndex} style={{ borderBottom: '1px solid #E2E8F0' }}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex} style={{
                                    padding: '1cqi 1.2cqi',
                                    fontSize: '1.2cqi',
                                    color: 'var(--slide-body)',
                                    lineHeight: 1.4
                                }}>
                                    <SlideMarkdown content={cell} inline />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderChart = () => {
        if (!chartData || chartData.length === 0) return (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span style={{ fontSize: '1.2cqi', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    No Data Available
                </span>
            </div>
        );

        const commonAxisProps = {
            tick: { fill: '#64748B', fontSize: '1cqi', fontWeight: 600 },
            axisLine: { stroke: '#CBD5E1', strokeWidth: 1 },
            tickLine: false,
        };

        const gridProps = {
            strokeDasharray: "3 3",
            vertical: false,
            stroke: "#E2E8F0",
            strokeWidth: 1
        };

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
                            outerRadius="80%"
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
                        <Legend iconType="square" verticalAlign="bottom" wrapperStyle={{ paddingTop: '1cqi', fontSize: '1cqi', fontWeight: 600 }} />
                    </PieChart>
                </ResponsiveContainer>
            );
        }

        if (type === 'line' || type === 'area') {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
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
                        />
                    </AreaChart>
                </ResponsiveContainer>
            );
        }

        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="name" {...commonAxisProps} />
                    <YAxis {...commonAxisProps} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
                    <Bar dataKey="value" fill="var(--slide-chart-1)" radius={[4, 4, 0, 0]}>
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

                {/* 左側：チャート/テーブル ビジュアルエリア */}
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
                        <div className="absolute inset-0 p-[2cqi] flex items-center justify-center">
                            {hasTableData ? renderTable() : renderChart()}
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