import pptxgen from 'pptxgenjs';

import { PaletteName } from '../../types/palette';

/**
 * スライドデータの型定義
 */
export interface SlideContent {
  title?: string;
  subtitle?: string;
  palette?: PaletteName; // パレット指定を追加
  subtitle_palette?: PaletteName;
  eyebrow?: string;
  logo_text?: string;
  tags?: string[];
  author?: string;
  organization?: string;
  date?: string;
  key_message?: string;
  body_text?: string;
  lead_text?: string;
  description?: string;
  annotations?: string[];
  // 特殊フィールド
  items?: any[];
  headers?: string[];
  rows?: any[][];
  section_number?: string | number;
  quote?: string;
  role?: string;
  name?: string;
  bio?: string;
  image_url?: string;
  image_caption?: string;
  layout_variation?: string;
  comparison_icon?: string;
  // Split Slide
  left_title?: string;
  left_label?: string;
  left_text?: string;
  left_body?: string;
  left_bullets?: string[];
  right_title?: string;
  right_label?: string;
  right_text?: string;
  right_body?: string;
  right_bullets?: string[];
  // Data / Flow
  stats?: any[];
  summary_kpis?: any[];
  detail_kpis?: any[];
  process_steps?: any[];
  steps?: any[];
  events?: any[];
  // SplitSlide 互換フィールド
  left_column?: string[];
  right_column?: string[];
}

export interface SlideData {
  type: string;
  layout_type?: string;
  content: SlideContent;
}

export interface ExportOptions {
  themeName: string;
  palette?: PaletteName; // 追加
  fileName?: string;
}

export interface ThemeConfig {
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    text: {
      header: string;
      body: string;
      muted: string;
      annotation: string;
      white: string;
      accent: string;
    };
    bg: {
      main: string;
      dark: string;
      highlight: string;
      highlightIndigo: string;
      card: string;
    };
    border: {
      main: string;
      light: string;
    };
    status: {
      success: string;
      warning: string;
      error: string;
    };
  };
  fonts: {
    face: string;
    title: number;
    header: number;
    body: number;
    bodySmall: number;
    bodyTiny: number;
    sub: number;
    tag: number;
    annotation: number;
  };
  layout: {
    baseX: number;
    safeW: number;
    headerY: number;
    headerH: number;
    headerBorderY: number;
    headerTotalH: number;
    gutter: number;
    footerY: number;
    titleSlide: {
      eyebrowY: number;
      titleY: number;
      subtitleY: number;
      presenterY: number;
      tagY: number;
    };
  };
}
