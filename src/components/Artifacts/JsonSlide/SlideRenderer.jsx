import React from 'react';
import { getThemeLayoutMap } from './config/themeRegistry';
import { getThemeTokens } from './config/themeTokens.tsx';
import { inferLayout } from './engine/LayoutEngine.ts';
import { BlockFactory } from './blocks/BlockFactory.tsx';
import { SingleColumnGrid } from './grids/SingleColumnGrid.tsx';
import { TwoColumnSplitGrid } from './grids/TwoColumnSplitGrid.tsx';
import { ThreeColumnMultiGrid } from './grids/ThreeColumnMultiGrid.tsx';
import { RowStackGrid } from './grids/RowStackGrid.tsx';
import TitleCoverGrid from './grids/TitleCoverGrid.tsx';
import './dynamic-slide.css';

const gridMap = {
    'SingleColumnGrid': SingleColumnGrid,
    'TwoColumnSplitGrid': TwoColumnSplitGrid,
    'ThreeColumnMultiGrid': ThreeColumnMultiGrid,
    'RowStackGrid': RowStackGrid,
    'TitleCoverGrid': TitleCoverGrid,
};

/**
 * SlideRenderer - スライドデータを受け取り、コンポーネントをレンダリング
 * @param {Object} slide - スライドデータ
 * @param {string} themeId - 現在選択されているテーマID
 * @param {number} slideIndex - スライド番号（0-indexed）
 * @param {number} totalSlides - 総スライド数
 * @param {boolean} isStatic - アニメーションを無効化するかどうか
 */
const SlideRenderer = ({ slide, themeId, slideIndex, totalSlides, isStatic = false, onMermaidError }) => {
    if (!slide) {
        return (
            <div className="json-slide-layout json-slide-error">
                <p>スライドデータが読み込めませんでした</p>
            </div>
        );
    }

    // 動的レイアウト（コンテンツ駆動型）の判定
    const isDynamic = !!slide.blocks;
    let contentNode;

    if (isDynamic) {
        // --- 動的レイアウト (Dynamic Slide Engine) ---
        const gridName = inferLayout(slide.blocks);
        const GridComponent = gridMap[gridName] || SingleColumnGrid;
        
        const tokens = getThemeTokens(themeId);
        const Decoration = tokens.decoration;

        const renderedBlocks = slide.blocks.map((block, idx) => (
            // blockプロパティに生の情報を渡しつつ、Grid内での重み判定にも利用させる。親のgridNameを渡してレイアウトに応じたコンポーネント特性を調整可能にする。
            <BlockFactory key={idx} block={block} gridName={gridName} slideIndex={slideIndex} onMermaidError={onMermaidError} />
        ));

        // テーマクラスを付与し、CSS変数によるスタイル注入を行う
        contentNode = (
            <div className={`json-slide-root theme-${themeId}`} style={{ position: 'relative' }}>
                {Decoration && <Decoration />}
                <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <GridComponent keyMessage={slide.key_message} blocks={slide.blocks}>
                        {renderedBlocks}
                    </GridComponent>
                </div>
            </div>
        );
    } else {
        // --- 従来の目的特化型レイアウト (フォールバック) ---
        const layoutMap = getThemeLayoutMap(themeId);
        const LayoutComponent = layoutMap[slide.layout_type] || layoutMap['content_slide'];
        contentNode = <LayoutComponent content={slide.content || {}} isStatic={isStatic} />;
    }

    return (
        <div className="slide-renderer-wrapper" data-slide-id={slide.id || `slide-${slideIndex}`}>
            {contentNode}
            {/* スライド番号インジケーター */}
            <div className="slide-page-indicator">
                {slideIndex + 1} / {totalSlides}
            </div>
        </div>
    );
};

export default SlideRenderer;
