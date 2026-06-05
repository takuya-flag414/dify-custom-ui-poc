// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/slides/ChartSlide.jsx
// グラフスライド: コーポレート・プロフェッショナルなチャート表示（マルチレイアウト対応）
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
    PieChart, Pie, Legend,
    LineChart, Line, Area, AreaChart
} from 'recharts';

// レイアウト崩壊防止のハード制限
const MAX_BAR_ITEMS = 10;
const MAX_LINE_ITEMS = 12;
const MAX_PIE_ITEMS = 8;
const MAX_LABEL_LENGTH = 12;

// デフォルトのカラーパレット（ビジネス向けクリーンパレット）
const DEFAULT_COLORS = [
    '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
    '#0ea5e9', '#0891b2', '#0d9488', '#10b981',
    '#6366f1', '#8b5cf6'
];

/**
 * X軸ラベルの省略用カスタムTick
 */
const TruncatedTick = ({ x, y, payload }) => (
    <text x={x} y={y + 12} textAnchor="middle" fill="var(--slide-text-muted, #64748b)" fontSize="clamp(10px, 1.4cqi, 13px)">
        {payload.value?.length > MAX_LABEL_LENGTH
            ? payload.value.substring(0, MAX_LABEL_LENGTH) + '…'
            : payload.value}
    </text>
);

/**
 * ChartSlide - タイトル + グラフ + インサイト
 * @param {Object} content - { title, chart_type, data, body_text, key_message, layout_variation }
 * @param {boolean} isStatic - アニメーション無効化
 */
const ChartSlide = ({ content, isStatic = false }) => {
    const { 
        title, 
        key_message, 
        chart_type = 'bar', 
        data: rawData, 
        body_text,
        layout_variation = 'default'
    } = content || {};

    // データの安全な取得と制限
    const chartData = useMemo(() => {
        if (!Array.isArray(rawData) || rawData.length === 0) return [];

        const maxItems = chart_type === 'pie' ? MAX_PIE_ITEMS
            : chart_type === 'line' ? MAX_LINE_ITEMS
            : MAX_BAR_ITEMS;

        if (rawData.length <= maxItems) {
            return rawData.map(item => ({
                name: item?.label ?? '',
                value: Number(item?.value) || 0,
                color: item?.color || null,
            }));
        }

        // 超過分は「その他」にまとめる
        const visible = rawData.slice(0, maxItems - 1).map(item => ({
            name: item?.label ?? '',
            value: Number(item?.value) || 0,
            color: item?.color || null,
        }));

        const otherValue = rawData.slice(maxItems - 1).reduce(
            (sum, item) => sum + (Number(item?.value) || 0), 0
        );

        visible.push({ name: 'その他', value: otherValue, color: '#9ca3af' });
        return visible;
    }, [rawData, chart_type]);

    if (chartData.length === 0) {
        return (
            <div className="json-slide-layout json-slide-chart corporate-style">
                <div className="agenda-corporate-header">
                    <div className="agenda-accent-bar" />
                    <h2 className="agenda-corporate-title">{title || 'グラフ'}</h2>
                </div>
                <div className="chart-corporate-body-area">
                    <p className="slide-body-text" style={{ padding: '4cqi', textAlign: 'center' }}>
                        グラフデータがありません
                    </p>
                </div>
            </div>
        );
    }

    const renderChart = () => (
        <ResponsiveContainer width="100%" height="100%">
            {chart_type === 'line' ? (
                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                    <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={DEFAULT_COLORS[0]} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={DEFAULT_COLORS[0]} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--slide-divider, #e2e8f0)" vertical={false} />
                    <XAxis dataKey="name" tick={<TruncatedTick />} interval={0} height={40} />
                    <YAxis tick={{ fill: 'var(--slide-text-muted, #64748b)', fontSize: 'clamp(10px, 1.4cqi, 13px)' }} />
                    <Tooltip />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={DEFAULT_COLORS[0]}
                        fill="url(#lineGradient)"
                        strokeWidth={3}
                        isAnimationActive={!isStatic}
                    />
                </AreaChart>
            ) : chart_type === 'pie' ? (
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius="75%"
                        dataKey="value"
                        nameKey="name"
                        labelLine={true}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        isAnimationActive={!isStatic}
                    >
                        {chartData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
            ) : (
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--slide-divider, #e2e8f0)" vertical={false} />
                    <XAxis dataKey="name" tick={<TruncatedTick />} interval={0} height={40} />
                    <YAxis tick={{ fill: 'var(--slide-text-muted, #64748b)', fontSize: 'clamp(10px, 1.4cqi, 13px)' }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={!isStatic}>
                        {chartData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            )}
        </ResponsiveContainer>
    );

    return (
        <div className="json-slide-layout json-slide-chart corporate-style">
            {/* ヘッダー */}
            <motion.div 
                className="agenda-corporate-header"
                {...(!isStatic && {
                    initial: { opacity: 0, x: -20 },
                    animate: { opacity: 1, x: 0 },
                    transition: { duration: 0.5 }
                })}
            >
                <div className="agenda-accent-bar" />
                <h2 className="agenda-corporate-title">{title || '分析グラフ'}</h2>
            </motion.div>

            {/* ボディエリア */}
            <motion.div 
                className="chart-corporate-body-area"
                {...(!isStatic && {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: 0.2, duration: 0.5 }
                })}
            >
                {layout_variation === 'two-column' ? (
                    <div className="chart-corporate-layout-two-column">
                        <div className="chart-corporate-desc-pane">
                            {key_message && <div className="chart-corporate-key-message">{key_message}</div>}
                            {body_text && <div className="chart-corporate-body-text">{body_text}</div>}
                        </div>
                        <div className="chart-corporate-chart-pane">
                            {renderChart()}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="chart-corporate-full-chart">
                            {renderChart()}
                        </div>
                        {layout_variation === 'bottom-desc' && (key_message || body_text) && (
                            <div className="chart-corporate-desc-bottom">
                                {key_message && <div className="chart-corporate-key-message">{key_message}</div>}
                                {body_text && <div className="chart-corporate-body-text">{body_text}</div>}
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default ChartSlide;
