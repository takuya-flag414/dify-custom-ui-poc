import React from 'react';

/**
 * DocTOC
 * 自動生成された目次を表示するコンポーネントです。
 */
const DocTOC = ({ block }) => {
    const { entries = [] } = block;

    if (!entries || entries.length === 0) {
        return (
            <div className="doc-toc-empty" style={{ padding: '20px', color: '#888', border: '1px dashed #ccc', textAlign: 'center' }}>
                目次を生成中...
            </div>
        );
    }

    return (
        <div className="doc-toc-container">
            <h2>目次</h2>
            <div className="doc-toc-list">
                {entries.map((entry, index) => (
                    <div 
                        key={index} 
                        className={`doc-toc-item level-${entry.level}`}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'baseline', 
                            marginBottom: '8px',
                            paddingLeft: `${(entry.level - 1) * 20}px`,
                            fontSize: entry.level === 1 ? '11pt' : entry.level === 2 ? '10pt' : '9.5pt',
                            fontWeight: entry.level === 1 ? '700' : '400',
                            fontFamily: entry.level === 1 ? 'var(--doc-font-sans)' : 'var(--doc-font-serif)',
                            color: entry.level === 3 ? '#555' : 'inherit'
                        }}
                    >
                        <span className="doc-toc-text" style={{ flexShrink: 0 }}>{entry.text}</span>
                        <div className="doc-toc-leader" style={{ flexGrow: 1, margin: '0 8px' }}></div>
                        <span className="doc-toc-page" style={{ flexShrink: 0, fontWeight: entry.level === 1 ? '700' : '400' }}>{entry.page}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocTOC;
