import React from 'react';

/**
 * テキスト内のMarkdown（太字・改行・強調・下線）をレンダリングする共通関数
 */
export const renderRichText = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // LLM特有のエスケープされた改行文字列 "\\n" を実際の改行文字に置換
    const normalizedText = text.replace(/\\n/g, '\n');
    
    // 改行で分割
    return normalizedText.split('\n').map((line, i) => (
        <React.Fragment key={i}>
            {/* 太字 (**)、強調 (*)、下線 (_) の簡易パース */}
            {line.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__|_.*?_)/g).map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j}>{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('*') && part.endsWith('*')) {
                    return <span key={j} className="text-emphasis">{part.slice(1, -1)}</span>;
                }
                if ((part.startsWith('__') && part.endsWith('__')) || (part.startsWith('_') && part.endsWith('_'))) {
                    const cleanText = part.startsWith('__') ? part.slice(2, -2) : part.slice(1, -1);
                    return <span key={j} className="text-underline">{cleanText}</span>;
                }
                return part;
            })}
            {i < normalizedText.split('\n').length - 1 && <br />}
        </React.Fragment>
    ));
};

const DocRichText = ({ block }) => {
    const { variant = 'default', title, text } = block;

    // デザイン種別（variant）に応じた装飾ボックスの描画
    if (variant === 'notice-box') {
        return (
            <div className="notice-box">
                {title && <div className="notice-box-title">{title}</div>}
                <p className="no-indent">{renderRichText(text)}</p>
            </div>
        );
    }

    if (variant === 'notice-dash') {
        return (
            <div className="notice-dash">
                {title && <div className="notice-dash-title">{title}</div>}
                <p className="no-indent">{renderRichText(text)}</p>
            </div>
        );
    }

    if (variant === 'notice-side') {
        return (
            <div className="notice-side">
                {title && <div className="notice-side-title">{title}</div>}
                <p className="no-indent">{renderRichText(text)}</p>
            </div>
        );
    }

    return (
        <div className="doc-block-rich-text">
            {title && <div className="doc-rich-text-fallback-title" style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--color-text-primary)' }}>{title}</div>}
            {renderRichText(text)}
        </div>
    );
};

export default DocRichText;
