// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/ChartSlide.jsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';
import {
    ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
    PieChart, Pie, Legend,
    Area, AreaChart
} from 'recharts';

// プレミアム Indigo テーマパレット
const INDIGO_COLORS = [
    '#4f46e5', // Primary Indigo
    '#06b6d4', // Secondary Cyan
    '#8b5cf6', // Tertiary Violet
    '#f59e0b', // Accent Amber
    '#10b981', // Success Emerald
    '#94a3b8', // Neutral Slate
];

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
            name: item.label || '',
            value: Number(item.value) || 0,
            color: item.color || null
        }));
    }, [rawData]);

    const isTwoColumn = layout_variation === 'two-column';

    const renderChart = () => {
        if (chartData.length === 0) return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slide-muted)', fontSize: '1.5cqi', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                データがありません
            </div>
        );

        return (
            <ResponsiveContainer width="100%" height="100%">
                {chart_type === 'line' || chart_type === 'area' ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: '1.6cqi', fill: '#64748b' }} 
                            axisLine={false} 
                            tickLine={false} 
                            dy={10}
                        />
                        <YAxis 
                            tick={{ fontSize: '1.6cqi', fill: '#64748b' }} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#4f46e5" 
                            fillOpacity={1} 
                            fill="url(#indigoGradient)" 
                            strokeWidth={3} 
                            isAnimationActive={!isStatic} 
                        />
                    </AreaChart>
                ) : chart_type === 'pie' ? (
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%" cy="50%"
                            innerRadius="60%"
                            outerRadius="85%"
                            paddingAngle={5}
                            dataKey="value"
                            isAnimationActive={!isStatic}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || INDIGO_COLORS[index % INDIGO_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '1.8cqi' }} />
                    </PieChart>
                ) : (
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: '2.2cqi', fill: '#64748b' }} 
                            axisLine={false} 
                            tickLine={false} 
                            dy={10}
                        />
                        <YAxis 
                            tick={{ fontSize: '2.2cqi', fill: '#64748b' }} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <Tooltip 
                            cursor={{ fill: 'rgba(79, 70, 229, 0.04)' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={!isStatic} barSize={40}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || INDIGO_COLORS[index % INDIGO_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                )}
            </ResponsiveContainer>
        );
    };

    return (
        <div className="json-slide-layout indigo-style" style={{ display: 'flex', flexDirection: 'column' }}>
            <motion.div 
                className="indigo-slide-header"
                style={{ marginBottom: '2.5cqi', borderBottom: '2.5px solid var(--slide-primary)', paddingBottom: '1.2cqi', flexShrink: 0 }}
                {...(!isStatic && { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } })}
            >
                <h2 style={{ fontSize: '2.8cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 700 }}>
                    <SlideMarkdown content={title || 'データ分析'} />
                </h2>
            </motion.div>

            <div className="indigo-slide-body" style={{ flex: 1, display: 'flex', flexDirection: isTwoColumn ? 'row' : 'column', gap: '3cqi', overflow: 'hidden' }}>
                {isTwoColumn ? (
                    <>
                        <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: '2cqi', justifyContent: 'center' }}>
                            {key_message && (
                                <div style={{ 
                                    fontSize: '2cqi', 
                                    fontWeight: 800, 
                                    color: 'var(--slide-primary)', 
                                    lineHeight: 1.3,
                                    paddingLeft: '1.5cqi',
                                    borderLeft: '4px solid var(--slide-primary)'
                                }}>
                                    <SlideMarkdown content={key_message} />
                                </div>
                            )}
                            {body_text && (
                                <div style={{ fontSize: '1.5cqi', color: 'var(--slide-body)', lineHeight: 1.6, margin: 0 }}>
                                    <SlideMarkdown content={body_text} />
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1.2, minHeight: 0 }}>
                            {renderChart()}
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            {renderChart()}
                        </div>
                        {(key_message || body_text) && (
                            <div className="indigo-point-box" style={{ marginTop: 'auto', flexShrink: 0 }}>
                                {key_message && (
                                    <div className="indigo-point-box-title" style={{ color: 'var(--slide-primary)', fontSize: '1.8cqi' }}>
                                        <SlideMarkdown content={key_message} />
                                    </div>
                                )}
                                {body_text && (
                                    <div style={{ fontSize: '1.4cqi', margin: 0, color: '#475569', lineHeight: 1.5 }}>
                                        <SlideMarkdown content={body_text} />
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {annotations.length > 0 && (
                <div style={{ 
                    fontSize: '1.1cqi', 
                    color: 'var(--slide-muted, #94a3b8)', 
                    marginTop: '2cqi', 
                    paddingTop: '1cqi', 
                    borderTop: '1px solid var(--slide-border, #e2e8f0)' 
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

export default ChartSlide;
