import React, { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

/**
 * TypewriterEffect
 * 
 * Displays content with a natural typewriter effect.
 * Features:
 * - Randomized typing speed (fluctuation/yuragi)
 * - Pauses at punctuation
 * - Renders markdown as it types (by slicing the source string)
 * - renderAsMarkdown: true の場合、MarkdownRendererでレンダリング
 * 
 * @param {string} content - The full text to display
 * @param {boolean} start - Whether to start the effect
 * @param {function} onComplete - Callback when typing receives end of string
 * @param {number} speed - Base typing speed in ms (default: 6)
 * @param {boolean} renderAsMarkdown - Whether to render as markdown (default: true)
 * @param {Array} citations - Citations for MarkdownRenderer (when renderAsMarkdown=true)
 * @param {string} messageId - Message ID for MarkdownRenderer (when renderAsMarkdown=true)
 */
const TypewriterEffect = ({
    content,
    start = true,
    onComplete,
    speed = 6,
    renderAsMarkdown = true,
    citations,
    messageId
}) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const currentIndexRef = useRef(0);
    const timeoutRef = useRef(null);

    const onCompleteRef = useRef(onComplete);

    // Update ref when onComplete changes
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        if (!start || !content) return;

        // Reset state on mount or content change to handle StrictMode and re-runs correctly
        currentIndexRef.current = 0;
        setDisplayedContent('');

        const typeChar = () => {
            const currentIndex = currentIndexRef.current;

            if (currentIndex >= content.length) {
                if (onCompleteRef.current) onCompleteRef.current();
                return;
            }

            // Calculate next char
            const nextChar = content.charAt(currentIndex);

            // Update state
            setDisplayedContent((prev) => prev + nextChar);
            currentIndexRef.current += 1;

            // Calculate delay for next character
            let delay = speed; // Base speed from props
            const variance = (Math.random() * 4) - 2; // +/- 2ms
            delay = delay + variance;

            // Punctuation pauses
            if (['.', '!', '?', '\n', '。'].includes(nextChar)) {
                delay += 60; // Long pause
            } else if ([',', '、'].includes(nextChar)) {
                delay += 30; // Medium pause
            }

            timeoutRef.current = setTimeout(typeChar, delay);
        };

        // Start typing
        typeChar();

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [content, start, speed]);

    // ★追加: renderAsMarkdownがfalseの場合はプレーンテキスト表示
    if (!renderAsMarkdown) {
        return <span className="typewriter-text">{displayedContent}</span>;
    }

    return (
        <MarkdownRenderer
            content={displayedContent}
            citations={citations}
            messageId={messageId}
        />
    );
};

export default TypewriterEffect;
