import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

/**
 * DataInsightSlideRenderer - データインサイト (Multi-format Analytical Grid)
 * 
 * デザイン意図: 
 * 左側に根拠データ（グラフまたは要約表）、右側にその解釈を配置。
 * インサイトを主役にしつつ、視覚的な説得力を提供する。
 */
export class DataInsightSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const { 
        title, 
        insight_title = "Key Insight", 
        insight_text, 
        chart_type = 'bar',
        data: rawData = [],
        headers: rawHeaders = [],
        rows: rawRows = [],
        annotations = [] 
    } = content;

    // --- 1. ヘッダー描画 ---
    let currentY = this.ui.renderSlideHeader(slide, title || 'Data Insight');
    currentY += 0.3;

    // --- 2. 空間配分アルゴリズムによるレイアウト計算 (JSXの 6:4 グリッドを再現) ---
    const slideW = 10.0;
    const marginX = 0.6;
    const safeW = slideW - (marginX * 2);
    const gap = 0.3;
    
    const SAFE_BOTTOM = 5.0;
    const AVAILABLE_H = SAFE_BOTTOM - currentY;
    
    const leftW = safeW * 0.6 - (gap / 2);
    const rightW = safeW * 0.4 - (gap / 2);
    const rightX = marginX + leftW + gap;
    
    // 利用可能な高さをフルに使う（最小3.0インチ）
    const mainH = Math.max(3.0, AVAILABLE_H);

    // --- 3. 左側：ビジュアルエリア描画 ---
    const headers = Array.isArray(rawHeaders) ? rawHeaders : [];
    const rows = Array.isArray(rawRows) ? rawRows : [];
    const chartData = (Array.isArray(rawData) ? rawData : []).map(item => ({
      name: item.label || item.name || '',
      value: Number(item.value) || 0
    }));

    if (headers.length > 0 || rows.length > 0) {
      // A. テーブル描画
      this.renderMiniTable(slide, headers, rows, marginX, currentY, leftW, mainH);
    } else if (chartData.length > 0) {
      // B. チャート描画
      this.renderMiniChart(slide, chart_type, chartData, marginX, currentY, leftW, mainH);
    } else {
      // C. プレースホルダー (データなし)
      slide.addShape(this.pptx.ShapeType.rect, {
        x: marginX, y: currentY, w: leftW, h: mainH,
        fill: { color: this.config.colors.bg.highlight },
        line: { color: this.config.colors.border.light, width: 1 }
      });
      slide.addText('NO DATA AVAILABLE', {
        x: marginX, y: currentY, w: leftW, h: mainH,
        align: 'center', valign: 'middle',
        fontSize: 9, color: this.config.colors.text.annotation, bold: true,
        fontFace: 'Consolas', charSpacing: 3.0
      });
    }

    // --- 4. 右側：インサイト・パネル ---
    let rY = currentY + 0.1;
    const accentLineW = 0.07;
    slide.addShape(this.pptx.ShapeType.rect, {
      x: rightX, y: rY, w: accentLineW, h: 0.5,
      fill: { color: this.config.colors.primary }
    });

    const textPaddingLeft = 0.15;
    const insightTitleParts = this.textProcessor.parseRichText(insight_title, {
      fontSize: 13, bold: true, color: this.config.colors.text.header
    });
    slide.addText(insightTitleParts, {
      x: rightX + textPaddingLeft, y: rY, w: rightW - textPaddingLeft, h: 0.5,
      valign: 'middle', margin: 0
    });
    rY += 0.7;

    if (insight_text) {
      const insightBodyItems = this.processTextLines(insight_text, 11);
      slide.addText(insightBodyItems, {
        x: rightX + textPaddingLeft,
        y: rY,
        w: rightW - textPaddingLeft,
        h: mainH - (rY - currentY),
        valign: 'top',
        margin: 0,
        lineSpacing: 11 * 1.7
      });

      slide.addShape(this.pptx.ShapeType.rect, {
        x: rightX + textPaddingLeft,
        y: currentY + mainH - 0.1,
        w: 0.3, h: 0.03,
        fill: { color: this.config.colors.primary, transparency: 60 }
      });
    }

    // --- 5. フッター ---
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }

  /**
   * インサイト用のミニテーブルを描画
   */
  private renderMiniTable(slide: any, headers: any[], rows: any[][], x: number, y: number, w: number, h: number): void {
    // 枠線を描画（JSXの背景に合わせる）
    slide.addShape(this.pptx.ShapeType.rect, {
      x, y, w, h,
      fill: { color: this.config.colors.bg.highlight },
      line: { color: this.config.colors.border.light, width: 1 }
    });

    const tableX = x + 0.2;
    const tableY = y + 0.2;
    const tableW = w - 0.4;

    const headerRow = headers.map((h: string) => ({
      text: h.toUpperCase(),
      options: {
        fontSize: 8, bold: true, color: this.config.colors.text.muted,
        valign: 'bottom', align: 'left',
        margin: [5, 8, 5, 8],
        border: [{ pt: 1.5, color: this.config.colors.primary }, { pt: 0 }, { pt: 1, color: this.config.colors.text.header }, { pt: 0 }]
      }
    }));

    const bodyRows = rows.slice(0, 6).map((row, i) => {
      const isLast = i === rows.length - 1 || i === 5;
      return row.map(cell => ({
        text: cell?.toString() || '',
        options: {
          fontSize: 9, color: this.config.colors.text.body,
          valign: 'top', align: 'left',
          margin: [4, 6, 4, 6],
          border: [{ pt: 0 }, { pt: 0 }, { pt: isLast ? 1 : 0.5, color: isLast ? this.config.colors.border.main : this.config.colors.border.light }, { pt: 0 }]
        }
      }));
    });

    slide.addTable([headerRow, ...bodyRows], {
      x: tableX, y: tableY, w: tableW,
      colW: headers.length > 1 ? [tableW * 0.3, ...Array(headers.length - 1).fill(tableW * 0.7 / (headers.length - 1))] : [tableW]
    });
  }

  /**
   * インサイト用のミニチャートを描画
   */
  private renderMiniChart(slide: any, chart_type: string, chartData: any[], x: number, y: number, w: number, h: number): void {
    // 枠線と背景
    slide.addShape(this.pptx.ShapeType.rect, {
      x, y, w, h,
      fill: { color: this.config.colors.bg.highlight },
      line: { color: this.config.colors.border.light, width: 1 }
    });

    const type = chart_type.toLowerCase();
    const labels = chartData.map(d => d.name);
    const values = chartData.map(d => d.value);
    const pptxChartData = [{ name: 'Data', labels, values }];

    const palette = this.generateMonotonicPalette(this.config.colors.primary);
    const chartColors = ['pie', 'doughnut', 'bar'].includes(type) ? palette : [palette[0]];

    const chartOpts: any = {
      x: x + 0.1, y: y + 0.1, w: w - 0.2, h: h - 0.2,
      showTitle: false,
      showLegend: type === 'pie' || type === 'doughnut',
      legendPos: 'b',
      chartColors,
      varyColors: ['bar', 'pie', 'doughnut'].includes(type),
      valAxisLabelFontSize: 8,
      valAxisLabelColor: '64748B',
      catAxisLabelFontSize: 8,
      catAxisLabelColor: '64748B',
      valAxisLineShow: false,
      catAxisLineShow: true,
      catAxisLineColor: 'E2E8F0',
      valGridLine: { color: 'F1F5F9', style: 'dash' },
      lineSize: 2,
      lineSmooth: true,
      chartColorsOpacity: type === 'area' ? 15 : 100,
    };

    let pptxChartType = this.pptx.ChartType.bar;
    if (type === 'line') pptxChartType = this.pptx.ChartType.line;
    else if (type === 'area') pptxChartType = this.pptx.ChartType.area;
    else if (type === 'pie') pptxChartType = this.pptx.ChartType.pie;
    else if (type === 'doughnut') pptxChartType = this.pptx.ChartType.doughnut;

    slide.addChart(pptxChartType, pptxChartData, chartOpts);
  }

  private generateMonotonicPalette(baseHex: string): string[] {
    const hex = baseHex.startsWith('#') ? baseHex.slice(1) : baseHex;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const adjust = (val: number, factor: number) => 
      Math.min(255, Math.max(0, Math.round(val * factor))).toString(16).padStart(2, '0').toUpperCase();
    return [
      hex,
      `${adjust(r, 0.85)}${adjust(g, 0.85)}${adjust(b, 0.85)}`,
      `${adjust(r, 1.2)}${adjust(g, 1.2)}${adjust(b, 1.2)}`,
      `${adjust(r, 0.7)}${adjust(g, 0.7)}${adjust(b, 0.7)}`,
      `${adjust(r, 1.4)}${adjust(g, 1.4)}${adjust(b, 1.4)}`
    ];
  }
}
