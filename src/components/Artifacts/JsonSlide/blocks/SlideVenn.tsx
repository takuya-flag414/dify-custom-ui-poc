import React from 'react';

interface Props {
    title?: string;
    items?: string[]; // Expecting 2 or 3 items for Venn
}

export const SlideVenn: React.FC<Props> = ({ title, items = [] }) => {
    // マッキンゼー風の透過ブルーとグレー系統
    const colors = [
        'rgba(0, 32, 91, 0.55)',   // McKinsey Navy
        'rgba(0, 163, 224, 0.55)', // McKinsey Sky Blue
        'rgba(100, 116, 139, 0.55)' // McKinsey Slate Grey
    ];
    
    return (
        <div className="slide-block slide-venn" style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center', padding: '1.5cqi' }}>
            {title && <div style={{ fontSize: '1.5cqi', fontWeight: 'bold', marginBottom: '2cqi', color: 'var(--text-color, #1e293b)' }}>{title}</div>}
            
            <div style={{ position: 'relative', width: '25cqi', height: '25cqi', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {items.length === 2 && (
                    <>
                        <div style={{ position: 'absolute', width: '16cqi', height: '16cqi', borderRadius: '50%', backgroundColor: colors[0], border: '0.15cqi solid #ffffff', left: '2cqi', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '2cqi', fontWeight: 'bold', color: 'white', fontSize: '1.2cqi' }}>{items[0]}</div>
                        <div style={{ position: 'absolute', width: '16cqi', height: '16cqi', borderRadius: '50%', backgroundColor: colors[1], border: '0.15cqi solid #ffffff', right: '2cqi', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '2cqi', fontWeight: 'bold', color: 'white', fontSize: '1.2cqi' }}>{items[1]}</div>
                    </>
                )}
                {items.length >= 3 && (
                    <>
                        <div style={{ position: 'absolute', width: '13cqi', height: '13cqi', borderRadius: '50%', backgroundColor: colors[0], border: '0.15cqi solid #ffffff', top: '2cqi', left: '6cqi', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '2cqi', fontWeight: 'bold', color: 'white', fontSize: '1.2cqi' }}>{items[0]}</div>
                        <div style={{ position: 'absolute', width: '13cqi', height: '13cqi', borderRadius: '50%', backgroundColor: colors[1], border: '0.15cqi solid #ffffff', bottom: '4cqi', left: '2cqi', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '1.5cqi', fontWeight: 'bold', color: 'white', fontSize: '1.2cqi' }}>{items[1]}</div>
                        <div style={{ position: 'absolute', width: '13cqi', height: '13cqi', borderRadius: '50%', backgroundColor: colors[2], border: '0.15cqi solid #ffffff', bottom: '4cqi', right: '2cqi', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '1.5cqi', fontWeight: 'bold', color: 'white', fontSize: '1.2cqi' }}>{items[2]}</div>
                    </>
                )}
                {items.length < 2 && (
                    <div style={{ color: 'var(--text-muted, #64748b)', fontSize: '1.2cqi' }}>Venn diagram needs at least 2 items.</div>
                )}
            </div>
        </div>
    );
};
