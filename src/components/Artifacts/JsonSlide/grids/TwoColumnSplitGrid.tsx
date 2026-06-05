import React from 'react';
import { getBlockWeight } from '../engine/LayoutEngine';
import SlideMarkdown from '../MarkdownRenderer';

interface Props {
    keyMessage?: string;
    children: React.ReactNode;
}

export const TwoColumnSplitGrid: React.FC<Props> = ({ keyMessage, children }) => {
    const leftBlocks: React.ReactNode[] = [];
    const rightBlocks: React.ReactNode[] = [];

    const childrenArray = React.Children.toArray(children);

    // 根本的な解決：最初の要素を左列（Narrative）とし、2つ目以降の全要素を右列（Evidence/Cards）として配置する。
    // これにより、複数要素が全て縦積みになってオーバーフローするのを防ぎ、コンサルスライドの標準的な構成（左にメッセージ、右に図表やカード）を強制する。
    childrenArray.forEach((child, idx) => {
        if (React.isValidElement(child)) {
            if (idx === 0) {
                leftBlocks.push(child);
            } else {
                rightBlocks.push(child);
            }
        }
    });

    return (
        <div className="dynamic-grid two-column-split-grid" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {keyMessage && (
                <h2 className="slide-key-message" style={{ flexShrink: 0 }}>
                    <SlideMarkdown content={keyMessage} inline />
                </h2>
            )}
            <div className="grid-content split-layout" style={{ display: 'flex', flexDirection: 'row', gap: '24px', flex: 1, minHeight: 0 }}>
                <div className="left-zone" style={{ flex: 4, display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, overflowY: 'auto', paddingRight: '8px' }}>{leftBlocks}</div>
                <div className="right-zone" style={{ flex: 6, display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, overflowY: 'auto', paddingRight: '8px' }}>{rightBlocks}</div>
            </div>
        </div>
    );
};
