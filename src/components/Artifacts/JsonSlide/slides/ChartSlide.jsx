// src/components/Artifacts/JsonSlide/slides/ChartSlide.jsx
// グラフスライド: Recharts を使用した棒グラフ・円グラフの表示
// レイアウト崩壊防止: データ数制限, ラベル省略, ResponsiveContainer
import React, { useMemo } from 'react';
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
const MAX_LABEL_LENGTH = 8;

// デフォルトのカラーパレット（テーマに合わせたビジネスカラー）
const DEFAULT_COLORS = [
    '#2563eb', '#0ea5e9', '#10b981', '#f59e0b',
    '#ef4444', '#8b5cf6', '#ec4899', '#6366f1',
    '#14b8a6', '#f97316'
];

/**
 * X軸ラベルの省略用カスタムTick
 */
const TruncatedTick = ({ x, y, payload }) => (
    <text x={x} y={y + 12} textAnchor="middle" fill="var(--slide-text-muted, #64748b)" fontSize="1.6cqi">
        {payload.value?.length > MAX_LABEL_LENGTH
            ? payload.value.substring(0, MAX_LABEL_LENGTH) + '…'
            : payload.value}
    </text>
);

/**
 * ChartSlide - タイトル + グラフ（棒 / 円 / 折れ線）
 * @param {Object} content - { title, chart_type, data, body_text }
 * @param {boolean} isStatic - アニメーション無効化
 */
const ChartSlide = ({ content, isStatic = false }) => {
    const { title, key_message, chart_type = 'bar', data: rawData, body_text } = content || {};

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

    // データなしのフォールバック
    if (chartData.length === 0) {
        return (
            <div className="json-slide-layout json-slide-content">
                <div className="content-slide-header">
                    <h2 className="slide-section-title">{title || 'グラフ'}</h2>
                    <div className="slide-title-underline" />
                </div>
                <div className="content-slide-body">
                    <p className="slide-body-text">グラフデータがありません</p>
                </div>
            </div>
        );
    }

    return (
        <div className="json-slide-layout json-slide-chart">
            {/* ヘッダー */}
            <div className="content-slide-header">
                <h2 className="slide-section-title">{title || 'グラフ'}</h2>
                <div className="slide-title-underline" />
            </div>

            {/* グラフとテキストのコンテナ */}
            <div className={`chart-layout-wrapper ${key_message ? 'has-key-message' : ''}`}>
                {/* 本文（任意） */}
                {(body_text || key_message) && (
                    <div className="chart-content-area">
                        {key_message && (
                            <h3 className="key-message-text">{key_message}</h3>
                        )}
                        {body_text && (
                            <p className="slide-body-text">{body_text}</p>
                        )}
                    </div>
                )}

                {/* グラフ本体 */}
                <div className="chart-slide-body">
                <ResponsiveContainer width="100%" height="100%">
                    {chart_type === 'line' ? (
                        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={DEFAULT_COLORS[0]} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={DEFAULT_COLORS[0]} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--slide-divider, #e2e8f0)" />
                            <XAxis dataKey="name" tick={<TruncatedTick />} interval={0} />
                            <YAxis tick={{ fill: 'var(--slide-text-muted, #64748b)', fontSize: '1.6cqi' }} />
                            <Tooltip />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={DEFAULT_COLORS[0]}
                                fill="url(#lineGradient)"
                                strokeWidth={2}
                                isAnimationActive={!isStatic}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={DEFAULT_COLORS[0]}
                                strokeWidth={2}
                                dot={{ r: 4, fill: DEFAULT_COLORS[0], stroke: '#fff', strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                                isAnimationActive={!isStatic}
                            />
                        </AreaChart>
                    ) : chart_type === 'pie' ? (
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                outerRadius="70%"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) =>
                                    `${name?.length > MAX_LABEL_LENGTH ? name.substring(0, MAX_LABEL_LENGTH) + '…' : name} ${(percent * 100).toFixed(0)}%`
                                }
                                labelLine={true}
                                isAnimationActive={!isStatic}
                            >
                                {chartData.map((entry, idx) => (
                                    <Cell
                                        key={idx}
                                        fill={entry.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    ) : (
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--slide-divider, #e2e8f0)" />
                            <XAxis dataKey="name" tick={<TruncatedTick />} interval={0} />
                            <YAxis tick={{ fill: 'var(--slide-text-muted, #64748b)', fontSize: '1.6cqi' }} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={!isStatic}>
                                {chartData.map((entry, idx) => (
                                    <Cell
                                        key={idx}
                                        fill={entry.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    </div>
    );
};

export default ChartSlide;
