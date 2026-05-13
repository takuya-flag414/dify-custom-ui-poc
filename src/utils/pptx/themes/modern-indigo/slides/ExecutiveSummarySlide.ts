import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

export class ExecutiveSummarySlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const sLeft = (content as any).summary_left || {};
    const sRight = (content as any).summary_right || {};

    // 1. ヘッダー
    let currentY = this.ui.renderSlideHeader(slide, content.title || 'Executive Summary');
    currentY += 0.3;

    // 高さをフッター(5.1)に干渉しないように 3.8 -> 3.4 に縮小
    const mainH = 3.4;
    const splitX = this.config.layout.baseX + (this.config.layout.safeW * 0.4166);
    const gap = 0.5;

    // 2. 中央のディバイダー
    const dividerY = currentY + 0.4;
    const dividerH = mainH - 0.8;
    slide.addShape(this.pptx.ShapeType.rect, {
      x: splitX - 0.005, y: dividerY, w: 0.01, h: dividerH,
      fill: { color: this.config.colors.border.light }
    });

    // 矢印アイコンのサークル
    const iconCenterY = dividerY + (dividerH / 2);
    slide.addShape(this.pptx.ShapeType.ellipse, {
      x: splitX - 0.125, y: iconCenterY - 0.125, w: 0.25, h: 0.25,
      fill: { color: this.config.colors.text.white },
      line: { color: this.config.colors.border.light, width: 1 }
    });
    slide.addText('▶', {
      x: splitX - 0.125, y: iconCenterY - 0.125, w: 0.25, h: 0.25,
      align: 'center', valign: 'middle', fontSize: 8, color: this.config.colors.text.annotation
    });

    // 3. 左側：現状と課題
    const leftW = (splitX - this.config.layout.baseX) - (gap / 2);
    slide.addShape(this.pptx.ShapeType.roundRect, {
      x: this.config.layout.baseX, y: currentY, w: leftW, h: mainH,
      fill: { color: this.config.colors.text.white },
      line: { color: this.config.colors.primary, width: 1, transparency: 80 },
      rectRadius: 0.05
    });

    const pX = this.config.layout.baseX + 0.3;
    const pW = leftW - 0.6;
    let lY = currentY + 0.3; // 上下のマージンを少し詰める

    slide.addText((sLeft.title || '現状と課題').toUpperCase(), {
      x: pX, y: lY, w: pW, h: 0.3,
      fontSize: 12, color: this.config.colors.text.muted, bold: true, charSpacing: 2
    });
    lY += 0.4;

    // 本文 (枠内に収まるよう lineSpacing を調整)
    const lTextParts = this.textProcessor.parseRichText(sLeft.text || '', {
      fontSize: 14, color: this.config.colors.text.body, bold: false
    });
    slide.addText(lTextParts, {
      x: pX, y: lY, w: pW, h: mainH - (lY - currentY),
      valign: 'top', lineSpacing: 20
    });

    // 4. 右側：提言と結論
    const rightX = splitX + (gap / 2);
    const rightW = (this.config.layout.baseX + this.config.layout.safeW) - rightX;

    slide.addText(sRight.title || '主要な提言', {
      x: rightX, y: currentY, w: rightW, h: 0.4,
      fontSize: 18, color: this.config.colors.text.header, bold: true, charSpacing: 1
    });

    const items = sRight.items || [];
    // 3つのアイテムがフッター領域に被らないよう高さと間隔を縮小
    const itemH = 0.8;
    const itemGap = 0.2;
    let itemY = currentY + 0.5;

    items.forEach((item: string, i: number) => {
      // カードの背景
      slide.addShape(this.pptx.ShapeType.rect, {
        x: rightX, y: itemY, w: rightW, h: itemH,
        fill: { color: this.config.colors.text.white },
        rectRadius: 0.02,
        shadow: { type: 'outer', color: '000000', opacity: 0.06, blur: 4, offset: 2, angle: 90 }
      });
      // 左ボーダー
      slide.addShape(this.pptx.ShapeType.rect, {
        x: rightX, y: itemY, w: 0.05, h: itemH,
        fill: { color: this.config.colors.primary }
      });

      // 透かし数字 (高さ変更に伴いフォントサイズとY位置を微調整)
      slide.addText(String(i + 1).padStart(2, '0'), {
        x: rightX + rightW - 1.0, y: itemY + 0.15, w: 1.0, h: itemH,
        fontSize: 48, color: this.config.colors.bg.highlight, bold: true, italic: true, align: 'right', valign: 'bottom',
        margin: 0
      });

      // 連番 (前面)
      slide.addText(String(i + 1).padStart(2, '0'), {
        x: rightX + 0.15, y: itemY, w: 0.6, h: itemH,
        fontSize: 22, color: this.config.colors.primary, transparency: 70, bold: true, fontFace: 'Courier New',
        valign: 'middle'
      });

      // テキスト
      const iTextParts = this.textProcessor.parseRichText(item, {
        fontSize: 15, color: this.config.colors.text.header, bold: true
      });
      slide.addText(iTextParts, {
        x: rightX + 0.8, y: itemY, w: rightW - 1.2, h: itemH,
        valign: 'middle', margin: 0, lineSpacing: 22
      });

      itemY += itemH + itemGap;
    });

    // 5. フッター
    if (content.annotations) {
      this.ui.renderFooterAnnotations(slide, content.annotations);
    }
  }
}
