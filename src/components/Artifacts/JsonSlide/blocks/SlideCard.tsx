import React from 'react';

interface Props {
    title?: string;  // content_card互換 (key_value_cardでもtitleとして使える)
    label?: string;  // key_value_card の正式フィールド
    value: string;
    unit?: string;
    change?: string;
    trend?: 'up' | 'down' | 'flat';
}

// トレンドアイコンと色のマッピング
const trendConfig = {
    up:   { icon: '↑', color: '#16a34a' },
    down: { icon: '↓', color: '#dc2626' },
    flat: { icon: '→', color: '#d97706' }
};

export const SlideCard: React.FC<Props> = ({ title, label, value, unit, change, trend }) => {
    // label が優先。なければ title をフォールバックとして使う
    const displayLabel = label ?? title ?? '';
    const trendInfo = trend ? trendConfig[trend] : null;

    return (
        <div className="slide-block slide-card">
            <div className="card-title">{displayLabel}</div>
            <div className="card-value" style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' }}>
                <span>{value}</span>
                {unit && (
                    <span style={{ fontSize: '0.55em', fontWeight: 500, color: 'var(--text-muted, #64748b)', marginLeft: '2px' }}>
                        {unit}
                    </span>
                )}
            </div>
            {/* change / trend の表示エリア */}
            {(change || trendInfo) && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: trendInfo ? trendInfo.color : 'var(--text-muted, #64748b)'
                }}>
                    {trendInfo && <span>{trendInfo.icon}</span>}
                    {change && <span>{change}</span>}
                </div>
            )}
        </div>
    );
};

