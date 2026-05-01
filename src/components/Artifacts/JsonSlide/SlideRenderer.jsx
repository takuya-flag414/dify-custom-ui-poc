// src/components/Artifacts/JsonSlide/SlideRenderer.jsx
// layout_type に基づいて具象スライドコンポーネントへ委譲するディスパッチャー
import React from 'react';
import TitleSlide from './slides/TitleSlide';
import ContentSlide from './slides/ContentSlide';
import SplitSlide from './slides/SplitSlide';
import QuoteSlide from './slides/QuoteSlide';

/**
 * レイアウトタイプ → コンポーネントのマッピング
 */
const LAYOUT_MAP = {
    title_slide: TitleSlide,
    content_slide: ContentSlide,
    split_slide: SplitSlide,
    quote_slide: QuoteSlide,
};

/**
 * SlideRenderer - スライドデータを受け取り、layout_typeに応じたコンポーネントをレンダリング
 * @param {Object} slide - { id, layout_type, content }
 * @param {number} slideIndex - スライド番号（0-indexed）
 * @param {number} totalSlides - 総スライド数
 * @param {boolean} isStatic - アニメーションを無効化するかどうか
 */
const SlideRenderer = ({ slide, slideIndex, totalSlides, isStatic = false }) => {
    if (!slide) {
        return (
            <div className="json-slide-layout json-slide-error">
                <p>スライドデータが読み込めませんでした</p>
            </div>
        );
    }

    const LayoutComponent = LAYOUT_MAP[slide.layout_type] || ContentSlide;

    return (
        <div className="slide-renderer-wrapper" data-slide-id={slide.id}>
            <LayoutComponent content={slide.content || {}} isStatic={isStatic} />

            {/* スライド番号インジケーター */}
            <div className="slide-page-indicator">
                {slideIndex + 1} / {totalSlides}
            </div>
        </div>
    );
};

export default SlideRenderer;
