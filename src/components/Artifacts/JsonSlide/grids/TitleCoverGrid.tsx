import React from 'react';

interface TitleCoverGridProps {
    blocks: any[];
}

export default function TitleCoverGrid({ blocks }: TitleCoverGridProps) {
    if (!blocks || blocks.length === 0) return null;
    const coverBlock = blocks[0]; // { title, subtitle, date, presenter, organization }

    return (
        <div className="title-cover-grid" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'flex-start',
            textAlign: 'left',
            height: '100%', 
            padding: '10% 15%' 
        }}>
            <h1 className="title-cover-title" style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: 'var(--primary-color)',
                marginBottom: '1rem',
                lineHeight: 1.2,
                textAlign: 'left'
            }}>
                {coverBlock.title}
            </h1>
            
            {coverBlock.subtitle && (
                <h2 className="title-cover-subtitle" style={{
                    fontSize: '1.25rem',
                    fontWeight: 400,
                    color: 'var(--text-color)',
                    marginBottom: '2rem'
                }}>
                    {coverBlock.subtitle}
                </h2>
            )}

            <div className="title-cover-separator" style={{
                width: '100%',
                height: '2px',
                backgroundColor: 'var(--primary-color)',
                marginBottom: '2rem'
            }}></div>

            <div className="title-cover-meta" style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: 'var(--text-color)',
                fontSize: '0.85rem'
            }}>
                <div>
                    {coverBlock.presenter && <div style={{ fontWeight: 600 }}>{coverBlock.presenter}</div>}
                    {coverBlock.organization && <div>{coverBlock.organization}</div>}
                </div>
                <div>
                    {coverBlock.date && <div>{coverBlock.date}</div>}
                </div>
            </div>
        </div>
    );
}
