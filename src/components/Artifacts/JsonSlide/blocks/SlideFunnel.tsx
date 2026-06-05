import React from 'react';

interface FunnelStage {
    label: string;
    value: number | string;
}

interface Props {
    title?: string;
    stages?: FunnelStage[];
}

export const SlideFunnel: React.FC<Props> = ({ title, stages = [] }) => {
    return (
        <div className="slide-block slide-funnel" style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center', padding: '1.5cqi' }}>
            {title && <div style={{ fontSize: '1.5cqi', fontWeight: 'bold', marginBottom: '1.5cqi', color: 'var(--text-color, #1e293b)' }}>{title}</div>}
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80%', gap: '0.4cqi' }}>
                {stages.map((stage, idx) => {
                    const widthPercent = 100 - (idx * (60 / (stages.length || 1)));
                    
                    // #00205B (rgba: 0, 32, 91) から #00A3E0 (rgba: 0, 163, 224) へのグラデーション
                    const ratio = stages.length > 1 ? idx / (stages.length - 1) : 0;
                    const r = 0;
                    const g = Math.round(32 + ratio * (163 - 32));
                    const b = Math.round(91 + ratio * (224 - 91));
                    
                    return (
                        <div key={idx} style={{
                            width: `${widthPercent}%`,
                            height: '4cqi',
                            backgroundColor: `rgb(${r}, ${g}, ${b})`,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '1.2cqi',
                            borderTopLeftRadius: idx === 0 ? '0.4cqi' : '0',
                            borderTopRightRadius: idx === 0 ? '0.4cqi' : '0',
                            borderBottomLeftRadius: idx === stages.length - 1 ? '0.4cqi' : '0',
                            borderBottomRightRadius: idx === stages.length - 1 ? '0.4cqi' : '0',
                            clipPath: 'polygon(3% 0, 97% 0, 100% 100%, 0% 100%)',
                        }}>
                            {stage.label}: {stage.value}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
