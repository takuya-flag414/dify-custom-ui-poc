import React from 'react';

/**
 * DocCover
 * ドキュメントの表紙を表示するコンポーネントです。
 */
const DocCover = ({ block }) => {
    const { meta } = block || {};
    const { title, subtitle, author, date } = meta || {};

    return (
        <div className="doc-cover-container" style={{
            flex: 1, // 親の flex コンテナ内で全高を占有
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center', // 垂直中央
            alignItems: 'center',    // 水平中央
            textAlign: 'center',
            fontFamily: 'var(--doc-font-sans)',
            width: '100%'
        }}>
            <div className="doc-cover-main" style={{ marginBottom: '60px' }}>
                <h1 style={{ 
                    fontSize: '32pt', 
                    fontWeight: '800', 
                    margin: '0 0 20px 0',
                    lineHeight: '1.2',
                    color: '#000'
                }}>
                    {title || 'Untitled Document'}
                </h1>
                {subtitle && (
                    <h2 style={{ 
                        fontSize: '18pt', 
                        fontWeight: '400', 
                        margin: '0',
                        color: '#444',
                        fontFamily: 'var(--doc-font-serif)'
                    }}>
                        {subtitle}
                    </h2>
                )}
            </div>

            {/* 下部：著者と日付 */}
            <div className="doc-cover-footer" style={{
                fontSize: '14pt',
                color: '#333',
                fontFamily: 'var(--doc-font-serif)'
            }}>
                <div style={{ marginBottom: '10px', fontWeight: '700' }}>
                    {author || ''}
                </div>
                <div style={{ fontSize: '12pt' }}>
                    {date || ''}
                </div>
            </div>
        </div>
    );
};

export default DocCover;
