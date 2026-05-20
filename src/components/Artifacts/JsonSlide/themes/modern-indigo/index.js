// src/components/Artifacts/JsonSlide/themes/modern-indigo/index.js
import './theme.css';

// Indigo 専用コンポーネント
import TitleSlide from './slides/TitleSlide';
import ContentSlide from './slides/ContentSlide';
import AgendaSlide from './slides/AgendaSlide';
import SplitSlide from './slides/SplitSlide';
import ChartSlide from './slides/ChartSlide';
import TableSlide from './slides/TableSlide';
import StatsSlide from './slides/StatsSlide';
import ProcessFlowSlide from './slides/ProcessFlowSlide';
import TimelineSlide from './slides/TimelineSlide';
import KpiDashboardSlide from './slides/KpiDashboardSlide';
import ExecutiveSummarySlide from './slides/ExecutiveSummarySlide';
import DataInsightSlide from './slides/DataInsightSlide';
import MatrixSlide from './slides/MatrixSlide';
import StrategicPillarSlide from './slides/StrategicPillarSlide';
import MultiPointSlide from './slides/MultiPointSlide';
import RoadmapSlide from './slides/RoadmapSlide';
import SwimlaneSlide from './slides/SwimlaneSlide';
import SystemArchitectureSlide from './slides/SystemArchitectureSlide';
import { OrgChartSlide } from './slides/OrgChartSlide';


// Common Slides
import { 
    QuoteSlide, 
    SectionSlide, 
    ProfileSlide, 
    ImageContentSlide 
} from './slides/CommonSlides';

export const modernIndigoMap = {
    // 標準マッピング
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
    executive_summary_slide: ExecutiveSummarySlide,
    data_insight_slide: DataInsightSlide,
    matrix_slide: MatrixSlide,
    strategic_pillar_slide: StrategicPillarSlide,
    multi_point_slide: MultiPointSlide,
    roadmap_slide: RoadmapSlide,
    swimlane_slide: SwimlaneSlide,
    system_architecture_slide: SystemArchitectureSlide,
    org_chart_slide: OrgChartSlide,


    // エイリアス (ユーザー指定の揺れを吸収)
    title: TitleSlide,
    content: ContentSlide,
    split: SplitSlide,
    quote: QuoteSlide,
    section: SectionSlide,
    table: TableSlide,
    chart: ChartSlide,
    stats: StatsSlide,
    image_content: ImageContentSlide,
    timeline: TimelineSlide,
    agenda: AgendaSlide,
    profile: ProfileSlide,
    kpi_dashboard: KpiDashboardSlide,
    process_flow: ProcessFlowSlide,
    executive_summary: ExecutiveSummarySlide,
    data_insight: DataInsightSlide,
    matrix: MatrixSlide,
    strategic_pillar: StrategicPillarSlide,
    multi_point: MultiPointSlide,
    roadmap: RoadmapSlide,
    swimlane: SwimlaneSlide,
    system_architecture: SystemArchitectureSlide,
    org_chart: OrgChartSlide,
};

