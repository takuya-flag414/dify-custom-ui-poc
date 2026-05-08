import React from 'react';

/**
 * テキスト内のMarkdown（太字・改行）をレンダリングする共通関数
 */
export const renderRichText = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // 改行で分割
    return text.split('\n').map((line, i) => (
        <React.Fragment key={i}>
            {/* 太字 (**) の簡易パース */}
            {line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j}>{part.slice(2, -2)}</strong>;
                }
                return part;
            })}
            {i < text.split('\n').length - 1 && <br />}
        </React.Fragment>
    ));
};

const DocRichText = ({ block }) => {
    return (
        <div className="doc-block-rich-text">
            {renderRichText(block.text)}
        </div>
    );
};

export default DocRichText;
