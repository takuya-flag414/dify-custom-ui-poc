import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

export class ProfileSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const { title, name, role, bio, image_url, highlights = [], annotations = [] } = content;

    // 1. ヘッダー
    let currentY = this.ui.renderSlideHeader(slide, title || 'Profile');
    currentY += 0.4;

    const leftW = 3.0; // 約32%
    const rightX = leftW + 0.8;
    const rightW = this.config.layout.safeW - rightX + this.config.layout.baseX;

    // 2. 画像プレースホルダー (PPTXでは直接URLを表示)
    slide.addShape(this.pptx.ShapeType.rect, {
      x: this.config.layout.baseX, y: currentY, w: leftW, h: 3.5,
      fill: { color: this.config.colors.bg.highlight }
    });
    if (image_url) {
      // NOTE: 本来は addImage だが、ここでは画像枠のシミュレーション
      slide.addText('[ Profile Image ]', {
        x: this.config.layout.baseX, y: currentY, w: leftW, h: 3.5,
        align: 'center', valign: 'middle', color: this.config.colors.text.annotation
      });
    }

    // 垂直ディバイダー
    slide.addShape(this.pptx.ShapeType.rect, {
      x: leftW + 0.4, y: currentY, w: 0.01, h: 3.5,
      fill: { color: this.config.colors.border.light }
    });

    // 3. コンテンツ
    let pY = currentY;

    // 役職
    if (role) {
      slide.addText(role.toUpperCase(), {
        x: rightX, y: pY, w: rightW, h: 0.25,
        fontSize: 12, color: this.config.colors.primary,
        bold: true, fontFace: 'Courier New', charSpacing: 1
      });
      pY += 0.35;
    }

    // 名前
    const nameParts = this.textProcessor.parseRichText(name || 'NAME', {
      fontSize: 32, bold: true, color: this.config.colors.text.header
    });
    slide.addText(nameParts, {
      x: rightX, y: pY, w: rightW, h: 0.5,
      valign: 'top', margin: 0
    });
    pY += 0.65;

    // バイオ
    const bioParts = this.textProcessor.parseRichText(bio || '', {
      fontSize: 14, color: this.config.colors.text.body
    });
    slide.addText(bioParts, {
      x: rightX, y: pY, w: rightW, h: 1.2,
      valign: 'top', margin: 0, lineSpacing: 22
    });
    pY += 1.3;

    // ハイライト (箇条書き)
    if (highlights.length > 0) {
      const bullets = highlights.map((h: string) => ({
        text: h,
        options: { bullet: true, indent: 20, fontSize: 13, color: this.config.colors.text.body }
      }));
      slide.addText(bullets, {
        x: rightX, y: pY, w: rightW, h: 1.0,
        valign: 'top', margin: 0
      });
    }

    // 4. フッター
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
