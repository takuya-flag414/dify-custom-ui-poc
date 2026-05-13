import { RendererRegistry, globalThemeRegistry } from '../../core/Registry';
import { getModernIndigoConfig, MODERN_INDIGO_CONFIG } from './config';
import { TitleSlideRenderer } from './slides/TitleSlide';
import { ContentSlideRenderer } from './slides/ContentSlide';
import { AgendaSlideRenderer } from './slides/AgendaSlide';
import { TableSlideRenderer } from './slides/TableSlide';
import { ChartSlideRenderer } from './slides/ChartSlide';
import { QuoteSlideRenderer } from './slides/QuoteSlide';
import { SectionSlideRenderer } from './slides/SectionSlide';
import { ProfileSlideRenderer } from './slides/ProfileSlide';
import { ImageContentSlideRenderer } from './slides/ImageContentSlide';
import { KpiDashboardSlideRenderer } from './slides/KpiDashboardSlide';
import { SplitSlideRenderer } from './slides/SplitSlide';
import { StatsSlideRenderer } from './slides/StatsSlide';
import { ProcessFlowSlideRenderer } from './slides/ProcessFlowSlide';
import { TimelineSlideRenderer } from './slides/TimelineSlide';
import { RoadmapSlideRenderer } from './slides/RoadmapSlide';
import { StrategicPillarSlideRenderer } from './slides/StrategicPillarSlide';
import { MultiPointSlideRenderer } from './slides/MultiPointSlide';
import { ExecutiveSummarySlideRenderer } from './slides/ExecutiveSummarySlide';
import { DataInsightSlideRenderer } from './slides/DataInsightSlide';
import { MatrixSlideRenderer } from './slides/MatrixSlide';

const registry = new RendererRegistry();

const registerSet = (types: string[], renderer: any) => {
  types.forEach(t => registry.register(t, renderer));
};

// レンダラーの登録
registerSet(['title', 'title_slide', 'titleslide'], TitleSlideRenderer);
registerSet(['content', 'content_slide', 'contentslide'], ContentSlideRenderer);
registerSet(['agenda', 'agenda_slide', 'agendaslide'], AgendaSlideRenderer);
registerSet(['table', 'table_slide', 'tableslide'], TableSlideRenderer);
registerSet(['chart', 'chart_slide', 'chartslide'], ChartSlideRenderer);
registerSet(['quote', 'quote_slide', 'quoteslide'], QuoteSlideRenderer);
registerSet(['section', 'section_slide', 'sectionslide'], SectionSlideRenderer);
registerSet(['profile', 'profile_slide', 'profileslide'], ProfileSlideRenderer);
registerSet(['image_content', 'image_content_slide', 'imagecontentslide'], ImageContentSlideRenderer);
registerSet(['kpi_dashboard', 'kpi_dashboard_slide', 'kpidashboardslide'], KpiDashboardSlideRenderer);
registerSet(['split', 'split_slide', 'splitslide'], SplitSlideRenderer);
registerSet(['stats', 'stats_slide', 'statsslide'], StatsSlideRenderer);
registerSet(['process_flow', 'process_flow_slide', 'processflowslide'], ProcessFlowSlideRenderer);
registerSet(['timeline', 'timeline_slide', 'timelineslide'], TimelineSlideRenderer);
registerSet(['roadmap', 'roadmap_slide', 'roadmapslide'], RoadmapSlideRenderer);
registerSet(['strategic_pillar', 'strategic_pillar_slide', 'strategicpillarslide'], StrategicPillarSlideRenderer);
registerSet(['multi_point', 'multi_point_slide', 'multipointslide'], MultiPointSlideRenderer);
registerSet(['executive_summary', 'executive_summary_slide', 'executivesummaryslide'], ExecutiveSummarySlideRenderer);
registerSet(['data_insight', 'data_insight_slide', 'datainsightslide'], DataInsightSlideRenderer);
registerSet(['matrix', 'matrix_slide', 'matrixslide'], MatrixSlideRenderer);

// グローバルレジストリに登録
globalThemeRegistry.registerTheme('modern-indigo', getModernIndigoConfig, registry);

export { registry as modernIndigoRegistry, MODERN_INDIGO_CONFIG };
