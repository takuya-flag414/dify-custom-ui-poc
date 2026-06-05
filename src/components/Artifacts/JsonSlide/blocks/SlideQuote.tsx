import React from 'react';

interface Props {
    text: string;
    author?: string;
    role?: string;
}

/**
 * SlideQuote - 引用文・インパクトある一文を表示するブロック
 * quote ブロックタイプに対応する
 */
export const SlideQuote: React.FC<Props> = ({ text, author, role }) => {
    return (
        <div className="slide-block slide-quote" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: '24px 32px',
            boxSizing: 'border-box',
            textAlign: 'center',
            position: 'relative',
            gap: '20px'
        }}>
            {/* 装飾的な引用符（背景） */}
            <div style={{
                position: 'absolute',
                top: '12px',
                left: '24px',
                fontSize: 'clamp(48px, 8cqi, 100px)',
                lineHeight: 1,
                fontFamily: 'Georgia, serif',
                color: 'var(--primary-color, #00205B)',
                opacity: 0.08,
                userSelect: 'none',
                pointerEvents: 'none'
            }}>
                "
            </div>

            {/* 引用本文 */}
            <blockquote style={{
                margin: 0,
                padding: 0,
                fontSize: 'clamp(14px, 2cqi, 24px)',
                fontWeight: 500,
                fontStyle: 'italic',
                lineHeight: 1.6,
                color: 'var(--text-main, #0f172a)',
                maxWidth: '85%',
                position: 'relative',
                zIndex: 1
            }}>
                "{text}"
            </blockquote>

            {/* 著者情報 */}
            {(author || role) && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    position: 'relative',
                    zIndex: 1
                }}>
                    {/* アクセントライン */}
                    <div style={{
                        width: '40px',
                        height: '2px',
                        background: 'var(--primary-color, #00205B)',
                        marginBottom: '8px',
                        borderRadius: '1px'
                    }} />
                    {author && (
                        <span style={{
                            fontSize: 'clamp(11px, 1.4cqi, 16px)',
                            fontWeight: 700,
                            color: 'var(--text-main, #0f172a)',
                            fontStyle: 'normal'
                        }}>
                            {author}
                        </span>
                    )}
                    {role && (
                        <span style={{
                            fontSize: 'clamp(10px, 1.2cqi, 14px)',
                            fontWeight: 400,
                            color: 'var(--text-muted, #64748b)',
                            fontStyle: 'normal'
                        }}>
                            {role}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
