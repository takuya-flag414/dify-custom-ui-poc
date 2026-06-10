import React from 'react';

interface ChartData {
    label: string;
    value: number;
    color?: string;
}

interface Props {
    title?: string;
    chartType?: 'bar' | 'column' | 'donut' | 'line';
    data: ChartData[];
}

export const SlideChart: React.FC<Props> = ({ title, chartType = 'bar', data = [] }) => {
    if (!data || data.length === 0) {
        return (
            <div style={{ padding: '1.2cqi', color: 'var(--text-muted, #64748b)', fontSize: '0.9cqi' }}>
                {title && <h4 style={{ marginBottom: '0.6cqi', fontSize: '1.0cqi', fontWeight: 'bold' }}>{title}</h4>}
                No data available
            </div>
        );
    }

    const maxVal = Math.max(...data.map(d => d.value), 1);

    // 1. 横棒グラフ (bar)
    const renderBarChart = () => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4cqi', padding: '0.2cqi 0' }}>
                {data.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ 
                            width: '6.5cqi', 
                            fontSize: '1.05cqi', 
                            textAlign: 'right', 
                            paddingRight: '0.6cqi', 
                            color: 'var(--text-main, #333)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }} title={item.label}>
                            {item.label}
                        </div>
                        <div style={{ flex: 1, backgroundColor: '#f1f5f9', height: '1.2cqi', borderRadius: '0.2cqi', position: 'relative' }}>
                            <div style={{ 
                                width: `${(item.value / maxVal) * 100}%`, 
                                height: '100%', 
                                backgroundImage: item.color 
                                    ? `linear-gradient(90deg, ${item.color}, ${item.color})` 
                                    : `linear-gradient(90deg, var(--primary-color, #00205B), #3b82f6)`,
                                borderRadius: '0.2cqi',
                                transition: 'width 0.5s ease-out'
                            }}></div>
                        </div>
                        <div style={{ width: '3.5cqi', fontSize: '1.05cqi', textAlign: 'left', paddingLeft: '0.6cqi', fontWeight: 'bold', color: 'var(--text-main, #333)' }}>
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // 2. 縦棒グラフ (column)
    const renderColumnChart = () => {
        return (
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '10.0cqi', padding: '0.4cqi 0', gap: '0.4cqi' }}>
                {data.map((item, idx) => {
                    const heightPercent = (item.value / maxVal) * 100;
                    return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                            <div style={{ fontSize: '1.05cqi', fontWeight: 'bold', marginBottom: '0.3cqi', color: 'var(--text-main, #333)' }}>
                                {item.value}
                            </div>
                            <div style={{ 
                                height: `${heightPercent * 0.7}%`, 
                                width: '1.5cqi', 
                                backgroundImage: item.color 
                                    ? `linear-gradient(180deg, ${item.color}, ${item.color}cc)` 
                                    : `linear-gradient(180deg, #3b82f6, var(--primary-color, #00205B))`,
                                borderRadius: '0.2cqi 0.2cqi 0 0',
                                transition: 'height 0.5s ease-out'
                            }} />
                            <div style={{ 
                                fontSize: '0.95cqi', 
                                marginTop: '0.4cqi', 
                                color: 'var(--text-muted, #64748b)', 
                                whiteSpace: 'nowrap', 
                                textOverflow: 'ellipsis', 
                                overflow: 'hidden', 
                                maxWidth: '5.0cqi', 
                                textAlign: 'center' 
                            }} title={item.label}>
                                {item.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // 3. 折れ線グラフ (line)
    const renderLineChart = () => {
        const width = 200;
        const height = 90;
        const paddingX = 25;
        const paddingY = 15;
        const chartWidth = width - paddingX * 2;
        const chartHeight = height - paddingY * 2;
        
        const points = data.map((item, idx) => {
            const x = paddingX + (data.length > 1 ? (idx / (data.length - 1)) * chartWidth : chartWidth / 2);
            const y = height - paddingY - (item.value / maxVal) * chartHeight;
            return { x, y, label: item.label, value: item.value };
        });

        const pathD = points.length > 0 
            ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
            : '';
            
        const areaD = points.length > 0
            ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
            : '';

        const gradId = `lineGrad-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxHeight: '10.0cqi' }}>
                    <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>
                    {/* 背景目盛 */}
                    <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#f1f5f9" strokeWidth="1" />
                    <line x1={paddingX} y1={height/2} x2={width - paddingX} y2={height/2} stroke="#f1f5f9" strokeWidth="1" />
                    <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#e2e8f0" strokeWidth="1" />

                    {/* エリアグラデーション */}
                    {areaD && <path d={areaD} fill={`url(#${gradId})`} />}

                    {/* 折れ線本体 */}
                    {pathD && <path d={pathD} fill="none" stroke="var(--primary-color, #00205B)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                    {/* ノードとラベル */}
                    {points.map((p, idx) => (
                        <g key={idx}>
                            <circle cx={p.x} cy={p.y} r="3" fill="#ffffff" stroke="var(--primary-color, #00205B)" strokeWidth="1.5" />
                            <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="9.5px" fontWeight="bold" fill="var(--text-main, #333)">
                                {p.value}
                            </text>
                            <text x={p.x} y={height - 2} textAnchor="middle" fontSize="9px" fill="var(--text-muted, #64748b)">
                                {p.label}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>
        );
    };

    // 4. ドーナツグラフ (donut)
    const renderDonutChart = () => {
        const total = data.reduce((sum, d) => sum + d.value, 0);
        const radius = 24;
        const strokeWidth = 6;
        const circumference = 2 * Math.PI * radius;
        let accumulatedPercent = 0;
        
        const colors = ['#00205B', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
        
        const slices = data.map((item, idx) => {
            const percent = total > 0 ? item.value / total : 0;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;
            const color = item.color || colors[idx % colors.length];
            return {
                ...item,
                percent,
                strokeDasharray,
                strokeDashoffset,
                color
            };
        });

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2cqi', padding: '0.4cqi 0', width: '100%' }}>
                {/* 円本体 */}
                <div style={{ width: '6.5cqi', height: '6.5cqi', position: 'relative', flexShrink: 0 }}>
                    <svg viewBox="0 0 64 64" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                        <circle cx="32" cy="32" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth={strokeWidth} />
                        {slices.map((slice, idx) => (
                            <circle
                                key={idx}
                                cx="32"
                                cy="32"
                                r={radius}
                                fill="transparent"
                                stroke={slice.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={slice.strokeDasharray}
                                strokeDashoffset={slice.strokeDashoffset}
                                strokeLinecap="butt"
                                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                            />
                        ))}
                    </svg>
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <span style={{ fontSize: '0.8cqi', color: 'var(--text-muted, #64748b)', transform: 'scale(0.85)' }}>Total</span>
                        <span style={{ fontSize: '1.05cqi', fontWeight: 'bold', color: 'var(--text-main, #333)', marginTop: '-2px' }}>{total}</span>
                    </div>
                </div>
                
                {/* 凡例 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4cqi', flex: 1, minWidth: 0 }}>
                    {slices.map((slice, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5cqi', fontSize: '0.95cqi', minWidth: 0 }}>
                            <div style={{ width: '0.6cqi', height: '0.6cqi', borderRadius: '50%', backgroundColor: slice.color, flexShrink: 0 }} />
                            <span style={{ color: 'var(--text-main, #333)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                                {slice.label}
                            </span>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-muted, #64748b)', flexShrink: 0 }}>
                                {slice.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (chartType) {
            case 'column':
                return renderColumnChart();
            case 'line':
                return renderLineChart();
            case 'donut':
                return renderDonutChart();
            case 'bar':
            default:
                return renderBarChart();
        }
    };

    return (
        <div className="slide-block slide-chart" style={{ width: '100%', boxSizing: 'border-box' }}>
            {title && <h4 style={{ marginBottom: '0.5cqi', fontSize: '1.0cqi', fontWeight: 'bold', color: 'var(--primary-color, #00205B)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4cqi' }}>{title}</h4>}
            {renderContent()}
        </div>
    );
};
