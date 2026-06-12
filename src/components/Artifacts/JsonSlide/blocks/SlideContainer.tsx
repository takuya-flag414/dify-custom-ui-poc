import React from 'react';
import { SlideBlock } from '../engine/LayoutEngine.ts';
import { BlockFactory } from './BlockFactory.tsx';

interface Props {
    title?: string;
    blocks?: SlideBlock[];
    slideIndex?: number;
    onMermaidError?: (slideIndex: number, error: string | null, code: string) => void;
    emphasis?: string;
}

export const SlideContainer: React.FC<Props> = ({ title, blocks, slideIndex, onMermaidError, emphasis }) => {
    return (
        <div className={`slide-block slide-container ${emphasis ? `block-emphasis block-emphasis-${emphasis}` : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.6cqi', flex: 1, minHeight: 0, width: '100%', padding: '1.0cqi', backgroundColor: 'var(--bg-section, #f8fafc)', borderRadius: '0.6cqi', border: '1px solid var(--border-color, #e2e8f0)', boxSizing: 'border-box' }}>
            {title && <div className="container-title text-variant-card-title" style={{ flexShrink: 0, borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '0.4cqi', marginBottom: '0.4cqi', color: 'var(--primary-color, #00205B)' }}>{title}</div>}
            <div className="container-blocks" style={{ display: 'flex', flexDirection: 'column', gap: '0.4cqi', flex: 1, minHeight: 0 }}>
                {blocks && blocks.map((block, i) => (
                    <BlockFactory key={i} block={block} slideIndex={slideIndex} onMermaidError={onMermaidError} isInsideContainer={true} />
                ))}
            </div>
        </div>
    );
};
