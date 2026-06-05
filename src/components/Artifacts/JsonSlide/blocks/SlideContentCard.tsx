import React from 'react';
import SlideMarkdown from '../MarkdownRenderer';

interface Props {
    title: string;
    description: string;
    points?: string[];
}

export const SlideContentCard: React.FC<Props> = ({ title, description, points }) => {
    return (
        <div className="slide-block slide-content-card" style={{
            border: '1px solid var(--border-color, #cbd5e1)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: '#ffffff',
            overflow: 'hidden', // 角丸の代わりにはみ出しを防ぐ
            boxSizing: 'border-box'
        }}>
            <div style={{
                backgroundColor: 'var(--primary-color, #00205B)',
                color: '#ffffff',
                padding: '0.8cqi 1.2cqi',
                fontWeight: 'bold',
                fontSize: '1.3cqi',
                borderBottom: '1px solid var(--primary-color, #00205B)'
            }}>
                {title}
            </div>
            <div style={{ padding: '1.2cqi', display: 'flex', flexDirection: 'column', gap: '0.8cqi', flex: 1 }}>
                <div style={{ margin: 0, fontSize: '1.3cqi', lineHeight: 1.4, color: 'var(--text-main)' }}>
                    <SlideMarkdown content={description} inline />
                </div>
                {points && points.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: '1.6cqi', fontSize: '1.2cqi', lineHeight: 1.4, color: '#475569' }}>
                        {points.map((pt, i) => (
                            <li key={i}>
                                <SlideMarkdown content={pt} inline />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
