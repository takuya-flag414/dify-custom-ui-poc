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

      // 左側: Takeaway (改行バグ回避版)
      if (mainText) {
        slide.addText('KEY TAKEAWAY', {
          x: this.config.layout.baseX, y: currentY, w: leftW, h: 0.2,
          fontSize: 10, color: this.config.colors.text.annotation, bold: true, charSpacing: 1
        });
        
        const insightX = this.config.layout.baseX;
        const insightY = currentY + 0.3;
        
        // テキストを先に描画して高さを取得
        const consumedH = this.renderTextBlock(slide, mainText, {
          x: insightX + 0.15, y: insightY, w: leftW - 0.15, h: 2.5,
          fontSize: 11, lineSpacing: 11 * 1.5, valign: 'top'
        });

        // 取得した高さでアクセントバー (縦線) を描画
        slide.addShape(this.pptx.ShapeType.rect, {
          x: insightX, y: insightY, w: 0.04, h: Math.max(0.3, consumedH),
          fill: { color: this.config.colors.primary }
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
      const gridMaxY = this.renderStatsGrid(slide, activeStats, this.config.layout.baseX, currentY, this.config.layout.safeW, 2.5);
      
      if (mainText) {
        // グリッドの終了位置から少しマージンを空けて描画
        const insightX = this.config.layout.baseX;
        const insightY = gridMaxY + 0.2;

        // テキストを先に描画して高さを取得
        const consumedH = this.renderTextBlock(slide, mainText, {
          x: insightX + 0.15, y: insightY, w: this.config.layout.safeW - 0.15, h: 1.5,
          fontSize: 11, lineSpacing: 11 * 1.5, valign: 'top'
        });

        // 取得した高さでアクセントバー (縦線) を描画
        slide.addShape(this.pptx.ShapeType.rect, {
          x: insightX, y: insightY, w: 0.04, h: Math.max(0.3, consumedH),
          fill: { color: this.config.colors.primary }
        });
      }
    }

    // 4. フッター
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }

  private renderStatsGrid(slide: any, stats: any[], startX: number, startY: number, totalW: number, totalH: number): number {
    const count = stats.length;
    if (count === 0) return startY;

    const cols = count === 1 ? 1 : (count === 2 || count === 4 ? 2 : 3);
    const rows = Math.ceil(count / cols);
    const itemW = totalW / cols;
    const itemH = totalH / rows;
    let maxY = startY;

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
      const valueFontSize = count > 2 ? 32 : 40; // 少し小さく調整
      slide.addText(stat.value || '0', {
        x: contentX, y: y + 0.25, w: contentW, h: 0.6,
        fontSize: valueFontSize, bold: true, color: this.config.colors.text.header,
        valign: 'top', margin: 0
      });

      // Description (改行バグ回避版)
      if (stat.description) {
        const descY = y + 0.9;
        const consumedH = this.renderTextBlock(slide, stat.description, {
          x: contentX, y: descY, w: contentW, h: 0.5,
          fontSize: 10, lineSpacing: 10 * 1.3, valign: 'top'
        });
        maxY = Math.max(maxY, descY + consumedH);
      } else {
        maxY = Math.max(maxY, y + 0.9);
      }
    });

    return maxY;
  }
}
