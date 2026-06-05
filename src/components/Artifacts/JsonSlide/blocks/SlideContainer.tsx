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
        <div className={`slide-block slide-container ${emphasis ? `block-emphasis block-emphasis-${emphasis}` : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0, width: '100%', padding: '16px', backgroundColor: 'var(--bg-section, #f8fafc)', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
            {title && <div className="container-title" style={{ flexShrink: 0, fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '8px', marginBottom: '8px' }}>{title}</div>}
            <div className="container-blocks" style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0 }}>
                {blocks && blocks.map((block, i) => (
                    <BlockFactory key={i} block={block} slideIndex={slideIndex} onMermaidError={onMermaidError} />
                ))}
            </div>
        </div>
    );
};
