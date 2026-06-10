// src/components/artifacts/JsonSlide/engine/LayoutEngine.ts

export type BlockType = 'text' | 'list' | 'key_value_card' | 'content_card' | 'comparison_table' | 'chart' | 'mermaid' | 'title_cover' | 'section_header' | 'quote';

export interface SlideBlock {
    type: BlockType | string;
    [key: string]: any;
}

/**
 * ブロックの視覚的なボリューム（重み）を計算する
 * 再帰的にネストされたブロックの重みも合算する
 * 1: 軽量 (テキストなど)
 * 2: 中量 (カードなど)
 * 3: 重量 (表、グラフ、特殊図解など)
 */
export const getBlockWeight = (blockOrType: SlideBlock | string): number => {
    const weights: Record<string, number> = {
        'text': 1,
        'list': 1,
        'key_value_card': 2,
        'content_card': 2,
        'quote': 2,
        'comparison_table': 3,
        'chart': 3,
        'mermaid': 3,
        'title_cover': 0,
        'section_header': 0,
        // 高次ブロック
        'timeline': 3,
        'process_flow': 3,
        'matrix_2x2': 3,
        'funnel': 3,
        'kpi_metrics': 2,
        'venn_diagram': 3,
        'cycle': 3
    };

    if (typeof blockOrType === 'string') {
        return weights[blockOrType] || 1;
    }

    const baseWeight = weights[blockOrType.type] || 1;
    
    // コンテナブロックの場合、内部のブロックの重みを合算
    if (blockOrType.blocks && Array.isArray(blockOrType.blocks)) {
        const childrenWeight = blockOrType.blocks.reduce((sum: number, b: any) => sum + getBlockWeight(b), 0);
        return baseWeight + childrenWeight;
    }
    
    return baseWeight;
};

/**
 * ブロック群から最適なグリッドレイアウトを推論する
 * @param blocks スライド内のブロック配列
 * @returns グリッドの種類 ('SingleColumnGrid' | 'TwoColumnSplitGrid' | 'ThreeColumnMultiGrid' | 'RowStackGrid' | 'TitleCoverGrid')
 */
export const inferLayout = (blocks: SlideBlock[]): string => {
    if (!blocks || blocks.length === 0) {
        return 'SingleColumnGrid';
    }

    // 表紙の判定（最初のブロックが title_cover の場合）
    if (blocks[0].type === 'title_cover') {
        return 'TitleCoverGrid';
    }

    // セクション区切りの判定（最初のブロックが section_header の場合）
    if (blocks[0].type === 'section_header') {
        return 'SingleColumnGrid';
    }

    // direction: "horizontal" な要素が存在する場合は、水平分割レイアウトを優先適用
    if (blocks.some(b => b.direction === 'horizontal')) {
        // 要素が2つ以上なら RowStackGrid (上が説明、下がプロセス図など)
        if (blocks.length >= 2) {
            return 'RowStackGrid';
        }
        return 'SingleColumnGrid'; // 要素が1つだけなら単一カラム
    }

    const blockCount = blocks.length;
    const hasHeavyBlock = blocks.some(b => getBlockWeight(b) >= 3);
    const allLightOrMedium = blocks.every(b => getBlockWeight(b) <= 2);

    // 要素が1つだけの場合
    if (blockCount === 1) {
        return 'SingleColumnGrid';
    }

    // 要素が2つの場合
    if (blockCount === 2) {
        const hasWideBlock = blocks.some(b => 
            b.type === 'process_flow' || 
            b.type === 'timeline' || 
            b.type === 'comparison_table' || 
            b.type === 'matrix_2x2'
        );
        if (hasWideBlock) {
            return 'RowStackGrid';
        }
        return 'TwoColumnSplitGrid';
    }

    // 要素が3つで、すべてが軽量〜中量（カードなど）の場合、またはすべてが card/column_group の場合は3カラム
    if (blockCount === 3 && (allLightOrMedium || blocks.every(b => b.type === 'card' || b.type === 'column_group'))) {
        return 'ThreeColumnMultiGrid';
    }

    // 要素が4つ以上、または重量ブロックを含む場合は左右分割（1つ目を左、残りを右の列に縦積み）
    return 'TwoColumnSplitGrid';
};
