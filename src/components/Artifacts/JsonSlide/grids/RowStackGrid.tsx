import React from 'react';
import SlideMarkdown from '../MarkdownRenderer';

interface Props {
    keyMessage?: string;
    children: React.ReactNode;
}

export const RowStackGrid: React.FC<Props> = ({ keyMessage, children }) => {
    return (
        <div className="dynamic-grid row-stack-grid" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {keyMessage && (
                <h2 className="slide-key-message" style={{ flexShrink: 0 }}>
                    <SlideMarkdown content={keyMessage} inline />
                </h2>
            )}
            <div className="grid-content stack-layout" style={{ display: 'flex', flexDirection: 'column', gap: '2cqi', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '8px' }}>
                {React.Children.map(children, child => (
                    <div style={{ width: '100%' }}>
                        {child}
                    </div>
                ))}
            </div>
        </div>
    );
};
