import React from 'react';

interface MatrixItem {
    label: string;
    x: number; // 0.0 to 1.0
    y: number; // 0.0 to 1.0
}

interface Props {
    title?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    items?: MatrixItem[];
}

export const SlideMatrix2x2: React.FC<Props> = ({ title, xAxisLabel = "X Axis", yAxisLabel = "Y Axis", items = [] }) => {
    return (
        <div className="slide-block slide-matrix" style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1, minHeight: 0, padding: '1.5cqi' }}>
            {title && <div style={{ flexShrink: 0, fontSize: '1.5cqi', fontWeight: 'bold', marginBottom: '1.5cqi', textAlign: 'center' }}>{title}</div>}
            
            <div className="matrix-container" style={{ position: 'relative', flex: 1, border: '0.1cqi solid var(--border-color, #e2e8f0)', minHeight: '15cqi', marginLeft: '2.5cqi', marginBottom: '2.5cqi', background: 'var(--bg-color, #ffffff)' }}>
                {/* Axes */}
                <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '0.1cqi', backgroundColor: 'var(--border-color, #e2e8f0)' }} />
                <div style={{ position: 'absolute', top: 0, left: '50%', width: '0.1cqi', height: '100%', backgroundColor: 'var(--border-color, #e2e8f0)' }} />
                
                {/* Labels */}
                <div style={{ position: 'absolute', bottom: '-2.2cqi', left: '50%', transform: 'translateX(-50%)', fontSize: '1.1cqi', fontWeight: 'bold', color: 'var(--text-muted, #64748b)' }}>{xAxisLabel}</div>
                <div style={{ position: 'absolute', top: '50%', left: '-2.2cqi', transform: 'translateY(-50%) rotate(-90deg)', fontSize: '1.1cqi', fontWeight: 'bold', color: 'var(--text-muted, #64748b)', whiteSpace: 'nowrap' }}>{yAxisLabel}</div>
                
                {/* Items */}
                {items.map((item, idx) => (
                    <div key={idx} style={{ 
                        position: 'absolute', 
                        left: `${item.x * 100}%`, 
                        bottom: `${item.y * 100}%`, 
                        transform: 'translate(-50%, 50%)',
                        backgroundColor: 'var(--primary-color, #00205B)',
                        color: 'white',
                        padding: '0.4cqi 0.8cqi',
                        borderRadius: '1.5cqi',
                        fontSize: '1.1cqi',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap'
                    }}>
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    );
};
