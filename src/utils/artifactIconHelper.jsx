import React from 'react';
import { 
    Presentation, 
    FileText, 
    FileSpreadsheet, 
    Scissors, 
    Table, 
    CheckSquare, 
    HelpCircle, 
    Workflow, 
    Network, 
    FileCode 
} from 'lucide-react';

// 各成果物（Artifact）タイプに応じたSVGアイコンマッピング
export const ITEM_ICONS = {
    slide_creation: Presentation,
    json_slide: Presentation,
    json_slide_advanced: Presentation,
    html_slide: Presentation,
    document_studio: FileText,
    json_document: FileText,
    html_document: FileText,
    meeting_minutes: FileSpreadsheet,
    summarize_text: Scissors,
    summary_report: Scissors,
    comparison_table: Table,
    checklist: CheckSquare,
    faq_creation: HelpCircle,
    faq: HelpCircle,
    drawio_studio: Workflow,
    drawio: Workflow,
    mermaid_studio: Network,
    mermaid: Network
};

// 各成果物（Artifact）タイプに応じた直感的なカラーマッピング
export const ITEM_COLORS = {
    slide_creation: '#ff9500',    // オレンジ
    json_slide: '#ff9500',
    json_slide_advanced: '#ff9500',
    html_slide: '#ff9500',
    document_studio: '#007aff',   // ブルー
    json_document: '#007aff',
    html_document: '#007aff',
    meeting_minutes: '#34c759',   // グリーン
    summarize_text: '#af52de',    // パープル
    summary_report: '#af52de',
    comparison_table: '#5ac8fa',   // シアン
    checklist: '#30d158',          // ライムグリーン
    faq_creation: '#ffd60a',       // イエロー
    faq: '#ffd60a',
    drawio_studio: '#ff2d55',      // ピンク
    drawio: '#ff2d55',
    mermaid_studio: '#5856d6',     // インディゴ
    mermaid: '#5856d6'
};

/**
 * 成果物タイプから対応するLucide SVGアイコンコンポーネントを取得します。
 * (mermaid_flowchart などの subtype にも対応させるため、前方一致もチェック)
 */
export const getArtifactIcon = (type) => {
    if (type && type.startsWith('mermaid')) {
        return Network;
    }
    return ITEM_ICONS[type] || FileCode;
};

/**
 * 成果物タイプから対応する直感的なカラーコードを取得します。
 */
export const getArtifactColor = (type) => {
    if (type && type.startsWith('mermaid')) {
        return '#5856d6';
    }
    return ITEM_COLORS[type] || 'var(--color-text-main)';
};
