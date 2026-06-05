import React from 'react';

interface Metric {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'flat';
    trendValue?: string;
}

interface Props {
    metrics?: Metric[];
}

// トレンドアイコンと色のマッピング (マッキンゼー風のトーン)
const trendConfig = {
    up:   { icon: '▲', color: '#00A3E0' }, // スカイブルー
    down: { icon: '▼', color: '#b91c1c' }, // 落ち着いた赤
    flat: { icon: '▶', color: '#64748b' }  // グレー
};

export const SlideKpiMetrics: React.FC<Props> = ({ metrics = [] }) => {
    return (
        <div className="slide-block slide-kpi-metrics" style={{ display: 'flex', gap: '1cqi', width: '100%', flexWrap: 'wrap', justifyContent: 'space-around' }}>
            {metrics.map((metric, idx) => {
                const trendInfo = metric.trend ? trendConfig[metric.trend] : null;
                return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1cqi 1.2cqi', background: 'var(--bg-section, #f8fafc)', borderRadius: '0.8cqi', border: '1px solid var(--border-color, #e2e8f0)', flex: '1 1 18cqi', minWidth: '12cqi' }}>
                        <div style={{ fontSize: '1.2cqi', color: 'var(--text-muted, #64748b)', fontWeight: 'bold', marginBottom: '0.6cqi' }}>{metric.label}</div>
                        <div style={{ fontSize: '2.8cqi', fontWeight: '700', color: 'var(--primary-color, #00205B)', lineHeight: '1.2' }}>{metric.value}</div>
                        
                        {(metric.trend || metric.trendValue) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5cqi', marginTop: '0.6cqi', fontSize: '1.1cqi', fontWeight: 'bold', color: trendInfo ? trendInfo.color : 'var(--text-muted)' }}>
                                {trendInfo && <span>{trendInfo.icon}</span>}
                                {metric.trendValue && <span>{metric.trendValue}</span>}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
