import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

export class KpiDashboardSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const { title, summary_kpis = [], detail_kpis = [], kpis = [], body_text, annotations = [] } = content;

    // 旧データ構造への互換性
    let activeSummary = summary_kpis || [];
    let activeDetails = detail_kpis || [];
    if (activeSummary.length === 0 && activeDetails.length === 0 && kpis && kpis.length > 0) {
      activeSummary = kpis.slice(0, 2);
      activeDetails = kpis.slice(2, 8);
    }

    // 1. ヘッダー
    let currentY = this.ui.renderSlideHeader(slide, title || 'KPI Dashboard');
    currentY += 0.3;

    // 2. Summary KPIs (Top Layer)
    if (activeSummary.length > 0) {
      const sumColW = this.config.layout.safeW / activeSummary.length;
      activeSummary.forEach((kpi: any, idx: number) => {
        const x = this.config.layout.baseX + idx * sumColW;
        if (idx > 0) {
          slide.addShape(this.pptx.ShapeType.rect, { x, y: currentY, w: 0.01, h: 1.0, fill: { color: this.config.colors.border.light } });
        }

        const contentX = x + 0.2;
        // Architectural Tick
        slide.addShape(this.pptx.ShapeType.rect, { x: contentX, y: currentY, w: 0.04, h: 0.2, fill: { color: this.config.colors.primary } });
        slide.addText((kpi.label || '').toUpperCase(), {
          x: contentX + 0.1, y: currentY, w: sumColW - 0.4, h: 0.2,
          fontSize: 10, color: this.config.colors.text.muted, bold: true, charSpacing: 1
        });

        // Value & Trend
        const trend = this.getTrendInfo(kpi.trend, kpi.status);
        slide.addText(kpi.value || '0', {
          x: contentX, y: currentY + 0.3, w: sumColW * 0.7, h: 0.7,
          fontSize: 42, bold: true, color: this.config.colors.text.header, valign: 'top'
        });
        if (kpi.change) {
          slide.addText(`${trend.icon} ${kpi.change}`, {
            x: contentX + (sumColW * 0.45), y: currentY + 0.6, w: sumColW * 0.4, h: 0.3,
            fontSize: 14, bold: true, color: trend.color
          });
        }
      });
      currentY += 1.4;
    }

    // セパレーター
    slide.addShape(this.pptx.ShapeType.rect, {
      x: this.config.layout.baseX, y: currentY, w: this.config.layout.safeW, h: 0.01,
      fill: { color: this.config.colors.border.light }
    });
    currentY += 0.4;

    // 3. Detail KPIs (Grid Layer)
    if (activeDetails.length > 0) {
      const detCols = 4;
      const detColW = this.config.layout.safeW / detCols;
      activeDetails.forEach((kpi: any, idx: number) => {
        const col = idx % detCols;
        const row = Math.floor(idx / detCols);
        const x = this.config.layout.baseX + col * detColW;
        const y = currentY + row * 1.0;

        if (col > 0) {
          slide.addShape(this.pptx.ShapeType.rect, { x, y: y, w: 0.01, h: 0.8, fill: { color: this.config.colors.border.light } });
        }

        const contentX = x + 0.15;
        slide.addText((kpi.label || '').toUpperCase(), {
          x: contentX, y: y, w: detColW - 0.2, h: 0.2,
          fontSize: 9, color: this.config.colors.text.muted, bold: true
        });

        const trend = this.getTrendInfo(kpi.trend, kpi.status);
        slide.addText(kpi.value || '0', {
          x: contentX, y: y + 0.25, w: detColW * 0.6, h: 0.4,
          fontSize: 20, bold: true, color: this.config.colors.text.header
        });
        if (kpi.change) {
          slide.addText(`${trend.icon} ${kpi.change}`, {
            x: contentX + (detColW * 0.5), y: y + 0.4, w: detColW * 0.4, h: 0.2,
            fontSize: 10, bold: true, color: trend.color
          });
        }
      });
      currentY += (Math.ceil(activeDetails.length / detCols) * 1.0);
    }

    // 4. Body Text (Insight)
    if (body_text) {
      this.ui.renderInsightBox(slide, body_text, {
        x: this.config.layout.baseX, y: 4.3, w: this.config.layout.safeW, h: 0.8
      });
    }

    // 5. フッター
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }

  private getTrendInfo(trend: string, status: string) {
    let color = this.config.colors.text.muted;
    let icon = '▶';
    if (trend === 'up') icon = '▲';
    if (trend === 'down') icon = '▼';

    if (status === 'good') color = this.config.colors.status.success;
    else if (status === 'warning') color = this.config.colors.status.warning;
    else if (status === 'bad') color = this.config.colors.status.error;
    else {
      if (trend === 'up') color = this.config.colors.status.success;
      if (trend === 'down') color = this.config.colors.status.error;
    }
    return { color, icon };
  }
}
