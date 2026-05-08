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

const DocList = ({ block }) => {
    const { items = [], ordered = false } = block;
    const Tag = ordered ? 'ol' : 'ul';

    return (
        <Tag className={`doc-block-list ${ordered ? 'ordered' : 'unordered'}`}>
            {items.map((item, index) => (
                <li key={index} className="doc-list-item">
                    {renderRichText(item)}
                </li>
            ))}
        </Tag>
    );
};

export default DocList;
