import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

/**
 * StrategicPillarSlideRenderer - 戦略の柱スライド
 * 
 * デザイン意図: 
 * 「屋根・柱・土台」という建築的構造を表現。
 * 3つの戦略の柱を垂直ヘアラインで区切り、統一された土台で支える。
 */
export class StrategicPillarSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const pillars = (Array.isArray(content.pillars) ? content.pillars : []).slice(0, 3);
    const { title, foundation, annotations = [] } = content;

    // --- 1. ヘッダー描画 ---
    let currentY = this.ui.renderSlideHeader(slide, title || 'Strategic Pillars');
    currentY += 0.2;

    // --- 2. 梁 (Roof Line) ---
    slide.addShape(this.pptx.ShapeType.rect, {
      x: this.config.layout.baseX, y: currentY, w: this.config.layout.safeW, h: 0.04,
      fill: { color: this.config.colors.primary }
    });
    
    const roofY = currentY;
    currentY += 0.1;

    // --- 3. 柱 (Pillars Grid) ---
    const baseX = this.config.layout.baseX;
    const safeW = this.config.layout.safeW;
    const pillarH = 2.6; // フッターとはみ出さないように高さを圧縮

    const cols = this.calculateColumns(safeW, 3, 0);


    pillars.forEach((p: any, i: number) => {
      const col = cols[i];
      // JSXに合わせた左右のパディング調整 (1列目は左0、3列目は右0)
      const padL = i === 0 ? 0 : 0.3;
      const padR = i === 2 ? 0 : 0.3;
      const contentX = col.x + padL;
      const contentW = col.w - padL - padR;
      
      let pY = currentY + 0.2;

      // 垂直分割線
      if (i > 0) {
        slide.addShape(this.pptx.ShapeType.rect, {
          x: col.x, y: roofY, w: 0.01, h: pillarH + 0.1,
          fill: { color: this.config.colors.border.light }
        });
      }

      // インデックス (01, 02...) - 左端に配置
      slide.addText(String(i + 1).padStart(2, '0'), {
        x: contentX, y: pY, w: contentW, h: 0.25,
        fontSize: 10, color: this.config.colors.primaryDark, fontFace: 'Courier New', bold: true,
        margin: 0
      });
      pY += 0.3;

      // 見出し - 字下げ
      const headingIndent = 0.15;
      const headingParts = this.textProcessor.parseRichText(p.heading || '', {
        fontSize: 13, bold: true, color: this.config.colors.text.header
      });
      slide.addText(headingParts, {
        x: contentX + headingIndent, y: pY, w: contentW - headingIndent, h: 0.5, 
        valign: 'top', margin: 0
      });
      pY += 0.6;

      // 本文 (共通メソッドで改行バグを修正済み)
      const textItems = this.processTextLines(p.text || '', 10);
      slide.addText(textItems, {
        x: contentX, y: pY, w: contentW, h: pillarH - (pY - currentY),
        valign: 'top', margin: 0, lineSpacing: 10 * 1.6
      });
    });

    currentY += pillarH;

    // --- 4. 土台 (Foundation) ---
    const foundationY = currentY + 0.05;
    const foundationH = 0.6;

    // 土台背景
    slide.addShape(this.pptx.ShapeType.rect, {
      x: baseX, y: foundationY, w: safeW, h: foundationH,
      fill: { color: this.config.colors.bg.highlightIndigo }
    });

    // 土台の境界線
    slide.addShape(this.pptx.ShapeType.rect, {
      x: baseX, y: foundationY, w: safeW, h: 0.03,
      fill: { color: this.config.colors.primaryDark }
    });
    slide.addShape(this.pptx.ShapeType.rect, {
      x: baseX, y: foundationY + foundationH, w: safeW, h: 0.01,
      fill: { color: this.config.colors.border.light }
    });

    // 土台テキスト
    const foundationParts = this.textProcessor.parseRichText(foundation || 'Unified Foundation', {
      fontSize: 12, bold: true, color: this.config.colors.text.header
    });
    slide.addText(foundationParts, {
      x: baseX, y: foundationY, w: safeW, h: foundationH,
      valign: 'middle', align: 'center', charSpacing: 1.5
    });

    // --- 5. 注釈 ---
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
