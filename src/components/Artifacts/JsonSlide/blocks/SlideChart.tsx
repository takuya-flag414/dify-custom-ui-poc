import React from 'react';

interface ChartData {
    label: string;
    value: number;
    color?: string;
}

interface Props {
    title?: string;
    data: ChartData[];
}

export const SlideChart: React.FC<Props> = ({ title, data }) => {
    const maxVal = Math.max(...data.map(d => d.value));
    
    return (
        <div className="slide-block slide-chart" style={{ width: '100%', padding: '16px', boxSizing: 'border-box' }}>
            {title && <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 'bold' }}>{title}</h3>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '80px', fontSize: '12px', textAlign: 'right', paddingRight: '12px', color: 'var(--text-main, #333)' }}>{item.label}</div>
                        <div style={{ flex: 1, backgroundColor: '#f1f5f9', height: '24px', borderRadius: '2px', position: 'relative' }}>
                            <div style={{ 
                                width: `${maxVal > 0 ? (item.value / maxVal) * 100 : 0}%`, 
                                height: '100%', 
                                backgroundImage: `linear-gradient(90deg, var(--primary-color, #00205B), #3b82f6)`,
                                borderRadius: '2px',
                                transition: 'width 0.5s ease-out',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}></div>
                        </div>
                        <div style={{ width: '50px', fontSize: '12px', textAlign: 'left', paddingLeft: '12px', fontWeight: 'bold', color: 'var(--text-main, #333)' }}>{item.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
