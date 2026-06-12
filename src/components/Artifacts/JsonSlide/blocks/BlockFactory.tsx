import React from 'react';
import { SlideBlock } from '../engine/LayoutEngine.ts';
import { SlideText } from './SlideText.tsx';
import { SlideTable } from './SlideTable.tsx';
import { SlideCard } from './SlideCard.tsx';
import { SlideContentCard } from './SlideContentCard.tsx';
import { SlideList } from './SlideList.tsx';
import { SlideChart } from './SlideChart.tsx';
import { SlideMermaid } from './SlideMermaid.tsx';
import { SlideSectionHeader } from './SlideSectionHeader.tsx';
import { SlideQuote } from './SlideQuote.tsx';

// 新規拡張ブロック
import { SlideContainer } from './SlideContainer.tsx';
import { SlideTimeline } from './SlideTimeline.tsx';
import { SlideMatrix2x2 } from './SlideMatrix2x2.tsx';
import { SlideFunnel } from './SlideFunnel.tsx';
import { SlideKpiMetrics } from './SlideKpiMetrics.tsx';
import { SlideVenn } from './SlideVenn.tsx';
import { SlideAgenda } from './SlideAgenda.tsx';
import { SlideImagePlaceholder } from './SlideImagePlaceholder.tsx';

interface Props {
    block: SlideBlock;
    gridName?: string;
    slideIndex?: number;
    onMermaidError?: (slideIndex: number, error: string | null, code: string) => void;
    isInsideContainer?: boolean;
}

export const BlockFactory: React.FC<Props> = ({ block, gridName, slideIndex, onMermaidError, isInsideContainer }) => {
    // 共通プロパティの抽出
    const emphasisClass = block.emphasis ? `block-emphasis block-emphasis-${block.emphasis}` : '';
    
    // コンテンツのレンダリング
    const renderContent = () => {
        switch (block.type) {
            case 'text':
                return <SlideText content={block.content} heading_level={block.heading_level} isInsideContainer={isInsideContainer} />;
            case 'list':
                return <SlideList items={block.items} style={block.style} />;
            case 'comparison_table':
                return (
                    <SlideTable 
                        headers={block.headers} 
                        rows={block.rows} 
                        emphasis_row={block.emphasis_row} 
                        emphasis_cells={block.emphasis_cells}
                        emphasis_box={block.emphasis_box}
                    />
                );
            case 'key_value_card':
                return <SlideCard label={block.label} title={block.title} value={block.value} unit={block.unit} change={block.change} trend={block.trend} />;
            case 'content_card':
                return <SlideContentCard title={block.title} description={block.description} points={block.points} />;
            case 'chart':
                return <SlideChart title={block.title} chartType={block.chart_type} data={block.data} />;
            case 'mermaid':
                return <SlideMermaid code={block.code} slideIndex={slideIndex} onMermaidError={onMermaidError} />;
            case 'section_header':
                return <SlideSectionHeader title={block.title} subtitle={block.subtitle} section_number={block.section_number} />;
            case 'quote':
                return <SlideQuote text={block.text} author={block.author} role={block.role} />;
            
            // 拡張: コンテナブロック
            case 'card':
            case 'column_group':
                return <SlideContainer title={block.title} blocks={block.blocks} slideIndex={slideIndex} onMermaidError={onMermaidError} />;
            
            // 拡張: 高次ブロック
            case 'timeline':
            case 'process_flow':
                const forcedDirection = (gridName === 'RowStackGrid' || gridName === 'SingleColumnGrid')
                    ? 'horizontal'
                    : (block.direction || 'horizontal');
                return <SlideTimeline direction={forcedDirection as any} show_arrows={block.show_arrows} steps={block.steps} />;
            case 'matrix_2x2':
                return <SlideMatrix2x2 title={block.title} xAxisLabel={block.xAxisLabel} yAxisLabel={block.yAxisLabel} items={block.items} />;
            case 'funnel':
                return <SlideFunnel title={block.title} stages={block.stages} />;
            case 'kpi_metrics':
                return <SlideKpiMetrics metrics={block.metrics} />;
            case 'venn_diagram':
            case 'cycle':
                return <SlideVenn title={block.title} items={block.items} />;
            case 'agenda':
                return <SlideAgenda items={block.items} activeIndex={block.active_index} />;
            case 'image_placeholder':
                return (
                    <SlideImagePlaceholder 
                        label={block.label} 
                        prompt={block.prompt} 
                        search_query={block.search_query} 
                        aspect_ratio={block.aspect_ratio} 
                        image_url={block.image_url} 
                        fallback_text={block.fallback_text} 
                    />
                );
            
            default:
                return <SlideText content={`[Unsupported block: ${block.type}]`} />;
        }
    };

    // emphasis などのラッパーが必要な場合はここでラップする
    if (emphasisClass) {
        return (
            <div className={emphasisClass} style={{ display: 'flex', flexDirection: 'column', border: '2px solid var(--accent-color, #e11d48)', borderRadius: '8px', padding: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                {renderContent()}
            </div>
        );
    }

    return renderContent();
};
