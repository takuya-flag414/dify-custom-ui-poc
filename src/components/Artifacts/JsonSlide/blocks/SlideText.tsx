import React from 'react';
import SlideMarkdown from '../MarkdownRenderer';

interface Props {
    content: string;
    heading_level?: 1 | 2 | 3;
}

export const SlideText: React.FC<Props> = ({ content, heading_level }) => {
    if (heading_level === 1) {
        return (
            <h1 className="slide-block slide-text slide-heading-1">
                <SlideMarkdown content={content} inline />
            </h1>
        );
    }
    if (heading_level === 2) {
        return (
            <h2 className="slide-block slide-text slide-heading-2">
                <SlideMarkdown content={content} inline />
            </h2>
        );
    }
    if (heading_level === 3) {
        return (
            <h3 className="slide-block slide-text slide-heading-3">
                <SlideMarkdown content={content} inline />
            </h3>
        );
    }
    return (
        <p className="slide-block slide-text">
            <SlideMarkdown content={content} inline />
        </p>
    );
};

