import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

export class StatsSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const { title, stats = [], description, body_text, layout_variation = 'default', annotations = [] } = content;

    // 1. ヘッダー
    let currentY = this.ui.renderSlideHeader(slide, title || 'Key Metrics');
    currentY += 0.3;

    const mainText = body_text || description;
    const isTwoColumn = layout_variation === 'two-column';
    const activeStats = Array.isArray(stats) ? stats : [];

    if (isTwoColumn) {
      // --- 2カラムレイアウト ---
      const leftW = 3.5;
      const rightX = leftW + 0.8;
      const rightW = this.config.layout.safeW - rightX + this.config.layout.baseX;

      // 左側: Takeaway
      if (mainText) {
        slide.addText('KEY TAKEAWAY', {
          x: this.config.layout.baseX, y: currentY, w: leftW, h: 0.2,
          fontSize: 10, color: this.config.colors.text.annotation, bold: true, charSpacing: 1
        });
        this.ui.renderInsightBox(slide, mainText, {
          x: this.config.layout.baseX, y: currentY + 0.3, w: leftW, h: 2.0
        });
      }

      // 垂直ディバイダー
      slide.addShape(this.pptx.ShapeType.rect, {
        x: leftW + 0.4, y: currentY, w: 0.01, h: 3.5,
        fill: { color: this.config.colors.border.light }
      });

      // 右側: グリッド
      this.renderStatsGrid(slide, activeStats, rightX, currentY, rightW, 3.5);
    } else {
      // --- 1カラムレイアウト ---
      this.renderStatsGrid(slide, activeStats, this.config.layout.baseX, currentY, this.config.layout.safeW, 2.5);
      
      if (mainText) {
        this.ui.renderInsightBox(slide, mainText, {
          x: this.config.layout.baseX, y: currentY + 3.0, w: this.config.layout.safeW, h: 0.8
        });
      }
    }

    // 4. フッター
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }

  private renderStatsGrid(slide: any, stats: any[], startX: number, startY: number, totalW: number, totalH: number) {
    const count = stats.length;
    if (count === 0) return;

    const cols = count === 1 ? 1 : (count === 2 || count === 4 ? 2 : 3);
    const rows = Math.ceil(count / cols);
    const itemW = totalW / cols;
    const itemH = totalH / rows;

    stats.forEach((stat, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * itemW;
      const y = startY + row * itemH;

      // 垂直ディバイダー (左端以外)
      if (col > 0) {
        slide.addShape(this.pptx.ShapeType.rect, {
          x: x, y: y, w: 0.01, h: itemH * 0.8,
          fill: { color: this.config.colors.border.light }
        });
      }

      const contentX = x + 0.2;
      const contentW = itemW - 0.3;

      // Architectural Tick + Label
      slide.addShape(this.pptx.ShapeType.rect, {
        x: contentX, y: y, w: 0.04, h: 0.2,
        fill: { color: this.config.colors.primary }
      });
      slide.addText((stat.label || '').toUpperCase(), {
        x: contentX + 0.1, y: y, w: contentW - 0.1, h: 0.2,
        fontSize: 10, color: this.config.colors.text.muted, bold: true, charSpacing: 1
      });

      // Value
      slide.addText(stat.value || '0', {
        x: contentX, y: y + 0.3, w: contentW, h: 0.8,
        fontSize: count > 2 ? 36 : 48, bold: true, color: this.config.colors.text.header,
        valign: 'top', margin: 0
      });

      // Description
      if (stat.description) {
        slide.addText(stat.description, {
          x: contentX, y: y + 1.1, w: contentW, h: 0.4,
          fontSize: 11, color: this.config.colors.text.body, valign: 'top'
        });
      }
    });
  }
}
