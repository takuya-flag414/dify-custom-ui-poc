import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

export class TimelineSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const { title, items = [], events = [], layout_variation = 'vertical', annotations = [] } = content;
    const rawEvents = (events && events.length > 0) ? events : items;
    const activeEvents = Array.isArray(rawEvents) ? rawEvents.map((e: any) => ({
      date: e.date || e.year || e.label || e.step || '',
      title: e.title || e.label || '',
      description: e.description || ''
    })) : [];

    // 1. ヘッダー
    let currentY = this.ui.renderSlideHeader(slide, title || 'Timeline');
    currentY += 0.2;

    const isHorizontal = layout_variation === 'horizontal';

    if (isHorizontal) {
      // --- 水平レイアウト (Horizontal) ---
      const centerY = currentY + 1.8;
      // メイントラック
      slide.addShape(this.pptx.ShapeType.rect, {
        x: this.config.layout.baseX + 0.2, y: centerY, w: this.config.layout.safeW - 0.4, h: 0.01,
        fill: { color: this.config.colors.border.light }
      });

      const stepW = (this.config.layout.safeW - 0.4) / Math.max(activeEvents.length, 1);
      
      activeEvents.forEach((event: any, i: number) => {
        const x = this.config.layout.baseX + 0.2 + (i * stepW);
        const isTop = i % 2 === 0;
        
        // ノード (トラック上の点)
        slide.addShape(this.pptx.ShapeType.rect, {
          x: x - 0.04, y: centerY - 0.04, w: 0.08, h: 0.08,
          fill: { color: this.config.colors.primary },
          rectRadius: 0.01
        });

        // 接続ライン (Stem)
        const stemH = 0.8;
        const stemY = isTop ? centerY - stemH : centerY;
        slide.addShape(this.pptx.ShapeType.rect, {
          x: x, y: stemY, w: 0.01, h: stemH,
          fill: { color: this.config.colors.border.light }
        });

        // コンテンツエリア
        const contentY = isTop ? stemY - 1.2 : stemY + stemH;
        const contentW = stepW - 0.2;
        const contentX = x - (contentW / 2) + 0.1;

        // 左ボーダー (インデントの代用)
        slide.addShape(this.pptx.ShapeType.rect, {
          x: x - (contentW / 2), y: contentY, w: 0.02, h: 1.0,
          fill: { color: this.config.colors.bg.highlight }
        });

        // 日付
        slide.addText(event.date, {
          x: contentX, y: contentY, w: contentW, h: 0.2,
          fontSize: 10, color: this.config.colors.primary, bold: true, fontFace: 'Courier New'
        });
        // 見出し
        slide.addText(event.title, {
          x: contentX, y: contentY + 0.25, w: contentW, h: 0.3,
          fontSize: 12, bold: true, color: this.config.colors.text.header
        });
        // 本文
        if (event.description) {
          slide.addText(event.description, {
            x: contentX, y: contentY + 0.55, w: contentW, h: 0.45,
            fontSize: 10, color: this.config.colors.text.body, valign: 'top'
          });
        }
      });
    } else {
      // --- 垂直レイアウト (Vertical) ---
      const trackX = this.config.layout.baseX + 0.2;
      slide.addShape(this.pptx.ShapeType.rect, {
        x: trackX, y: currentY + 0.2, w: 0.01, h: 3.5,
        fill: { color: this.config.colors.border.light }
      });

      const stepY = 3.5 / Math.max(activeEvents.length, 1);
      
      activeEvents.forEach((event: any, i: number) => {
        const y = currentY + 0.2 + (i * stepY);
        
        // ノード (トラック上の点)
        slide.addShape(this.pptx.ShapeType.rect, {
          x: trackX - 0.04, y: y, w: 0.08, h: 0.08,
          fill: { color: this.config.colors.primary },
          rectRadius: 0.01
        });

        // 水平のチック線
        slide.addShape(this.pptx.ShapeType.rect, {
          x: trackX, y: y + 0.03, w: 0.3, h: 0.01,
          fill: { color: this.config.colors.border.light }
        });

        const contentX = trackX + 0.4;
        const contentW = this.config.layout.safeW - 0.6;
        let pY = y - 0.1;

        // 日付
        slide.addText(event.date, {
          x: contentX, y: pY, w: contentW, h: 0.2,
          fontSize: 10, color: this.config.colors.primary, bold: true, fontFace: 'Courier New'
        });
        pY += 0.25;

        // 見出し
        slide.addText(event.title, {
          x: contentX, y: pY, w: contentW, h: 0.3,
          fontSize: 14, bold: true, color: this.config.colors.text.header
        });
        pY += 0.35;

        // 本文 (左ボーダー付き)
        if (event.description) {
          slide.addShape(this.pptx.ShapeType.rect, {
            x: contentX, y: pY, w: 0.02, h: 0.4,
            fill: { color: this.config.colors.bg.highlight }
          });
          slide.addText(event.description, {
            x: contentX + 0.1, y: pY, w: contentW - 0.1, h: 0.4,
            fontSize: 11, color: this.config.colors.text.body, valign: 'top'
          });
        }
      });
    }

    // 4. フッター
    if (annotations) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
