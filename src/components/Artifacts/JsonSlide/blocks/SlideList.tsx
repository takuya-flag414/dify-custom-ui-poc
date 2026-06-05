import React from 'react';
import SlideMarkdown from '../MarkdownRenderer';

interface Props {
    items: string[];
    style?: 'bullet' | 'numbered';
}

const listStyle: React.CSSProperties = {
    margin: '0',
    paddingLeft: '2.0cqi',
    fontSize: '1.4cqi',
    lineHeight: '1.5'
};

const itemStyle: React.CSSProperties = {
    marginBottom: '0.6cqi',
    color: 'var(--text-main, #333)'
};

export const SlideList: React.FC<Props> = ({ items, style = 'bullet' }) => {
    if (style === 'numbered') {
        return (
            <ol className="slide-block slide-list slide-list-numbered" style={{ ...listStyle, listStyleType: 'decimal', paddingLeft: '32px' }}>
                {items.map((item, idx) => (
                    <li key={idx} style={itemStyle}>
                        <SlideMarkdown content={item} inline />
                    </li>
                ))}
            </ol>
        );
    }
    return (
        <ul className="slide-block slide-list slide-list-bullet" style={{ ...listStyle, listStyleType: 'disc', paddingLeft: '32px' }}>
            {items.map((item, idx) => (
                <li key={idx} style={itemStyle}>
                    <SlideMarkdown content={item} inline />
                </li>
            ))}
        </ul>
    );
};
