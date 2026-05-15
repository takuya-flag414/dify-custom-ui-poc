import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

export class KpiDashboardSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const { title, summary_kpis = [], detail_kpis = [], kpis = [], body_text, annotations = [] } = content;

    // 1. データ構造の正規化
    let activeSummary = summary_kpis || [];
    let activeDetails = detail_kpis || [];
    if (activeSummary.length === 0 && activeDetails.length === 0 && kpis && kpis.length > 0) {
      activeSummary = kpis.slice(0, 2);
      activeDetails = kpis.slice(2, 8);
    }

    // 2. スペース計算 (垂直方向の空間配分アルゴリズム)
    const headerY = this.ui.renderSlideHeader(slide, title || 'KPI Dashboard');
    const SAFE_TOP = headerY + 0.2;
    const SAFE_BOTTOM = 5.0; // フッター開始位置の目安
    const AVAILABLE_H = SAFE_BOTTOM - SAFE_TOP;

    const hasSummary = activeSummary.length > 0;
    const hasDetails = activeDetails.length > 0;
    const hasInsight = !!body_text;

    const summaryH = hasSummary ? 1.3 : 0;
    const separatorH = (hasSummary && hasDetails) ? 0.3 : 0;
    const insightMinH = hasInsight ? 0.6 : 0;

    const gridRows = hasDetails ? Math.ceil(activeDetails.length / 4) : 0;
    const remainingForGrid = AVAILABLE_H - summaryH - separatorH - insightMinH;
    
    // 1行あたりの高さを計算 (最大1.0, 領域に合わせて縮小)
    let rowH = gridRows > 0 ? Math.min(1.0, remainingForGrid / gridRows) : 0;
    
    // 極端に狭い場合のフォントサイズ・スケーリング係数
    const isCompressed = rowH < 0.7;
    const detValueFontSize = isCompressed ? 16 : 20;
    const detLabelFontSize = isCompressed ? 8 : 9;
    const detBadgeFontSize = isCompressed ? 8 : 9;

    let currentY = SAFE_TOP;

    // 3. Summary KPIs (Top Layer)
    if (hasSummary) {
      const sumColW = this.config.layout.safeW / activeSummary.length;
      activeSummary.forEach((kpi: any, idx: number) => {
        const x = this.config.layout.baseX + idx * sumColW;
        if (idx > 0) {
          slide.addShape(this.pptx.ShapeType.rect, { 
            x, y: currentY, w: 0.01, h: 0.9, 
            fill: { color: this.config.colors.border.light } 
          });
        }

        const contentX = x + 0.2;
        slide.addShape(this.pptx.ShapeType.rect, { 
            x: contentX, y: currentY, w: 0.04, h: 0.2, 
            fill: { color: this.config.colors.primary } 
        });
        slide.addText((kpi.label || '').toUpperCase(), {
          x: contentX + 0.1, y: currentY, w: sumColW - 0.4, h: 0.2,
          fontSize: 10, color: this.config.colors.text.muted, bold: true, charSpacing: 1
        });

        const trend = this.getTrendInfo(kpi.trend, kpi.status);
        // 数値の改行を防ぐため幅を広く確保
        slide.addText(kpi.value || '0', {
          x: contentX, y: currentY + 0.3, w: sumColW - 0.4, h: 0.6,
          fontSize: 36, bold: true, color: this.config.colors.text.header, valign: 'top'
        });

        if (kpi.change) {
          const badgeX = contentX + (sumColW * 0.55);
          const badgeY = currentY + 0.6;
          const badgeW = sumColW * 0.35;
          const badgeH = 0.28;

          slide.addShape(this.pptx.ShapeType.roundRect, {
            x: badgeX, y: badgeY, w: badgeW, h: badgeH,
            fill: { color: trend.bg },
            rectRadius: 0.5
          });

          slide.addText(`${trend.icon} ${kpi.change}`, {
            x: badgeX, y: badgeY, w: badgeW, h: badgeH,
            fontSize: 11, bold: true, color: trend.text,
            align: 'center', valign: 'middle'
          });
        }
      });
      currentY += summaryH;
    }

    // セパレーター
    if (separatorH > 0) {
      slide.addShape(this.pptx.ShapeType.rect, {
        x: this.config.layout.baseX, y: currentY, w: this.config.layout.safeW, h: 0.01,
        fill: { color: this.config.colors.border.light }
      });
      currentY += separatorH;
    }

    // 4. Detail KPIs (Grid Layer)
    if (hasDetails) {
      const detCols = 4;
      const detColW = this.config.layout.safeW / detCols;
      activeDetails.forEach((kpi: any, idx: number) => {
        const col = idx % detCols;
        const row = Math.floor(idx / detCols);
        const x = this.config.layout.baseX + col * detColW;
        const y = currentY + row * rowH;

        if (col > 0) {
          slide.addShape(this.pptx.ShapeType.rect, { 
              x, y: y, w: 0.01, h: rowH * 0.8, 
              fill: { color: this.config.colors.border.light } 
          });
        }

        const contentX = x + 0.15;
        slide.addText((kpi.label || '').toUpperCase(), {
          x: contentX, y: y, w: detColW - 0.2, h: 0.2,
          fontSize: detLabelFontSize, color: this.config.colors.text.muted, bold: true
        });

        const trend = this.getTrendInfo(kpi.trend, kpi.status);
        slide.addText(kpi.value || '0', {
          x: contentX, y: y + 0.2, w: detColW * 0.65, h: 0.4,
          fontSize: detValueFontSize, bold: true, color: this.config.colors.text.header
        });

        if (kpi.change) {
          const badgeX = contentX + (detColW * 0.55);
          const badgeY = y + 0.3;
          const badgeW = detColW * 0.4;
          const badgeH = isCompressed ? 0.2 : 0.22;

          slide.addShape(this.pptx.ShapeType.roundRect, {
            x: badgeX, y: badgeY, w: badgeW, h: badgeH,
            fill: { color: trend.bg },
            rectRadius: 0.5
          });

          slide.addText(`${trend.icon} ${kpi.change}`, {
            x: badgeX, y: badgeY, w: badgeW, h: badgeH,
            fontSize: detBadgeFontSize, bold: true, color: trend.text,
            align: 'center', valign: 'middle'
          });
        }
      });
      currentY += (gridRows * rowH);
    }

    // 5. Body Text (Insight)
    if (hasInsight) {
      const insightY = Math.min(currentY + 0.1, SAFE_BOTTOM - insightMinH);
      this.ui.renderInsightBox(slide, body_text, {
        x: this.config.layout.baseX, y: insightY, w: this.config.layout.safeW, h: insightMinH
      });
    }

    // 6. フッター
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }

  private getTrendInfo(trend: string, status: string) {
    let bg = '#F1F5F9';
    let text = '64748B';
    let icon = '▶';
    if (trend === 'up') icon = '▲';
    if (trend === 'down') icon = '▼';

    if (status === 'good') {
      bg = this.config.colors.status.success;
      text = 'FFFFFF';
    } else if (status === 'warning') {
      bg = this.config.colors.status.warning;
      text = 'FFFFFF';
    } else if (status === 'bad') {
      bg = this.config.colors.status.error;
      text = 'FFFFFF';
    } else {
      if (trend === 'up') { bg = this.config.colors.status.success; text = 'FFFFFF'; }
      if (trend === 'down') { bg = this.config.colors.status.error; text = 'FFFFFF'; }
    }
    return { bg, text, icon };
  }
}
