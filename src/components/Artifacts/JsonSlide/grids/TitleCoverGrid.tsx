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
            padding: '0 4cqi',
            boxSizing: 'border-box',
            position: 'relative'
        }}>
            {/* メインタイトル */}
            <h1 className="title-cover-title" style={{
                fontSize: 'var(--text-cover-title, 4.2cqi)',
                fontWeight: 700,
                color: 'var(--primary-color, #00205B)',
                marginBottom: '1.4cqi',
                lineHeight: 'var(--text-line-height-heading, 1.3)',
                textAlign: 'left',
                maxWidth: '92%'
            }}>
                {coverBlock.title}
            </h1>
            
            {/* セパレーター線 (CSSでテーマごとに制御) */}
            <div className="title-cover-separator" style={{
                width: '100%',
                height: '2px',
                backgroundColor: 'var(--primary-color, #00205B)',
                margin: '1.5cqi 0'
            }}></div>

            {/* サブタイトルおよびその他のメタ情報の垂直スタック */}
            <div className="title-cover-meta-stack" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1cqi',
                marginTop: '0.8cqi',
                textAlign: 'left'
            }}>
                {coverBlock.subtitle && (
                    <h2 className="title-cover-subtitle" style={{
                        fontSize: 'var(--text-cover-subtitle, 1.8cqi)',
                        fontWeight: 500,
                        color: 'var(--text-main, #333333)',
                        lineHeight: 'var(--text-line-height-heading, 1.3)',
                        margin: 0,
                        maxWidth: '92%'
                    }}>
                        {coverBlock.subtitle}
                    </h2>
                )}

                {coverBlock.presenter && (
                    <div className="title-cover-presenter" style={{
                        fontSize: 'var(--text-body, 1.2cqi)',
                        color: 'var(--text-secondary, #475569)',
                        fontWeight: 'normal'
                    }}>
                        {coverBlock.presenter}
                        {coverBlock.organization && ` | ${coverBlock.organization}`}
                    </div>
                )}

                {coverBlock.date && (
                    <div className="title-cover-date" style={{
                        fontSize: 'var(--text-body, 1.2cqi)',
                        color: 'var(--text-secondary, #475569)'
                    }}>
                        {coverBlock.date}
                    </div>
                )}
            </div>
        </div>
    );
}
