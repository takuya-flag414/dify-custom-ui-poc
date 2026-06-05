import React from 'react';

interface Props {
    title: string;
    subtitle?: string;
    section_number?: string;
}

/**
 * SlideSectionHeader - セクション区切りスライド専用の全幅見出しブロック
 * section_header ブロックタイプに対応する
 */
export const SlideSectionHeader: React.FC<Props> = ({ title, subtitle, section_number }) => {
    return (
        <div className="slide-block slide-section-header" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            textAlign: 'center',
            gap: '16px',
            padding: '32px',
            boxSizing: 'border-box'
        }}>
            {/* セクション番号（例: PART 01） */}
            {section_number && (
                <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--primary-color, #00205B)',
                    opacity: 0.7,
                    borderTop: '2px solid var(--primary-color, #00205B)',
                    borderBottom: '2px solid var(--primary-color, #00205B)',
                    padding: '4px 16px'
                }}>
                    {section_number}
                </div>
            )}

            {/* メインタイトル */}
            <h2 style={{
                margin: 0,
                fontSize: 'clamp(20px, 3cqi, 36px)',
                fontWeight: 800,
                lineHeight: 1.25,
                color: 'var(--text-main, #0f172a)',
                letterSpacing: '-0.02em'
            }}>
                {title}
            </h2>

            {/* アクセントライン */}
            <div style={{
                width: '60px',
                height: '4px',
                borderRadius: '2px',
                background: 'var(--primary-color, #00205B)'
            }} />

            {/* サブタイトル */}
            {subtitle && (
                <p style={{
                    margin: 0,
                    fontSize: 'clamp(12px, 1.6cqi, 18px)',
                    color: 'var(--text-muted, #64748b)',
                    fontWeight: 400,
                    lineHeight: 1.5,
                    maxWidth: '70%'
                }}>
                    {subtitle}
                </p>
            )}
        </div>
    );
};
