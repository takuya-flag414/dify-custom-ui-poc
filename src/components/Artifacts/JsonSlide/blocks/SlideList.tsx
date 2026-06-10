import React from 'react';
import SlideMarkdown from '../MarkdownRenderer';

// JSモジュールであるSlideMarkdownをTypeScriptが誤認識するのを防ぐキャスト
const Markdown: any = SlideMarkdown;

interface Props {
    items: string[];
    style?: 'bullet' | 'numbered';
}

const listStyle: React.CSSProperties = {
    margin: '0',
    paddingLeft: '2.0cqi',
    // fontSize と lineHeight は Typography System クラスに委譲
};

const itemStyle: React.CSSProperties = {
    marginBottom: '0.6cqi',
    color: 'var(--text-main, #333)'
};

export const SlideList: React.FC<Props> = ({ items, style = 'bullet' }) => {
    // リストはデフォルトで少し大きめの本文（body_large）として扱う
    const variantClass = 'text-variant-body-large';

    if (style === 'numbered') {
        return (
            <ol className={`slide-block slide-list slide-list-numbered ${variantClass}`} style={{ ...listStyle, listStyleType: 'decimal', paddingLeft: '32px' }}>
                {items.map((item, idx) => (
                    <li key={idx} style={itemStyle}>
                        <Markdown content={item} inline />
                    </li>
                ))}
            </ol>
        );
    }
    return (
        <ul className={`slide-block slide-list slide-list-bullet ${variantClass}`} style={{ ...listStyle, listStyleType: 'disc', paddingLeft: '32px' }}>
            {items.map((item, idx) => (
                <li key={idx} style={itemStyle}>
                    <Markdown content={item} inline />
                </li>
            ))}
        </ul>
    );
};
