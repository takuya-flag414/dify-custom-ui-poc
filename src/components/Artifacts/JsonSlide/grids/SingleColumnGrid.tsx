import React from 'react';
import SlideMarkdown from '../MarkdownRenderer';

interface Props {
    keyMessage?: string;
    children: React.ReactNode;
}

export const SingleColumnGrid: React.FC<Props> = ({ keyMessage, children }) => {
    return (
        <div className="dynamic-grid single-column-grid">
            {keyMessage && (
                <h2 className="slide-key-message">
                    <SlideMarkdown content={keyMessage} inline />
                </h2>
            )}
            <div className="grid-content">
                {children}
            </div>
        </div>
    );
};
