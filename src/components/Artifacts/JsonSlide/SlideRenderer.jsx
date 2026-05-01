// src/components/Artifacts/JsonSlide/SlideRenderer.jsx
// layout_type に基づいて具象スライドコンポーネントへ委譲するディスパッチャー
import React from 'react';
import TitleSlide from './slides/TitleSlide';
import ContentSlide from './slides/ContentSlide';
import SplitSlide from './slides/SplitSlide';
import QuoteSlide from './slides/QuoteSlide';
import SectionSlide from './slides/SectionSlide';
import TableSlide from './slides/TableSlide';
import ChartSlide from './slides/ChartSlide';
import StatsSlide from './slides/StatsSlide';
import ImageContentSlide from './slides/ImageContentSlide';
import TimelineSlide from './slides/TimelineSlide';
import AgendaSlide from './slides/AgendaSlide';
import ProfileSlide from './slides/ProfileSlide';
import KpiDashboardSlide from './slides/KpiDashboardSlide';
import ProcessFlowSlide from './slides/ProcessFlowSlide';

/**
 * レイアウトタイプ → コンポーネントのマッピング
 */
const LAYOUT_MAP = {
    title_slide: TitleSlide,
    content_slide: ContentSlide,
    split_slide: SplitSlide,
    quote_slide: QuoteSlide,
    section_slide: SectionSlide,
    table_slide: TableSlide,
    chart_slide: ChartSlide,
    stats_slide: StatsSlide,
    image_content_slide: ImageContentSlide,
    timeline_slide: TimelineSlide,
    agenda_slide: AgendaSlide,
    profile_slide: ProfileSlide,
    kpi_dashboard_slide: KpiDashboardSlide,
    process_flow_slide: ProcessFlowSlide,
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
