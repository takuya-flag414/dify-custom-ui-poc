import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

export class MatrixSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const quadrants = (content as any).quadrants || [];

    // 1. ヘッダー
    let currentY = this.ui.renderSlideHeader(slide, content.title || 'Matrix Analysis');
    currentY += 0.2;

    const mainH = 3.8;
    const centerX = this.config.layout.baseX + (this.config.layout.safeW / 2);
    const centerY = currentY + (mainH / 2);

    // 2. 座標軸の描画
    // X軸 (水平)
    slide.addShape(this.pptx.ShapeType.rect, {
      x: this.config.layout.baseX + 0.5, y: centerY, w: this.config.layout.safeW - 1.0, h: 0.01,
      fill: { color: this.config.colors.border.main }
    });
    // Y軸 (垂直)
    slide.addShape(this.pptx.ShapeType.rect, {
      x: centerX, y: currentY + 0.3, w: 0.01, h: mainH - 0.6,
      fill: { color: this.config.colors.border.main }
    });

    // 軸ラベル
    // X軸ラベル
    slide.addText((content as any).x_label || '重要度' + ' ➔', {
      x: this.config.layout.baseX + this.config.layout.safeW - 1.0, y: centerY - 0.15, w: 1.0, h: 0.3,
      fontSize: 10, color: this.config.colors.text.muted, bold: true, align: 'right'
    });
    // Y軸ラベル
    slide.addText((content as any).y_label || '緊急度', {
      x: centerX - 0.5, y: currentY, w: 1.0, h: 0.3,
      fontSize: 10, color: this.config.colors.text.muted, bold: true, align: 'center'
    });
    slide.addText('▲', {
      x: centerX - 0.5, y: currentY + 0.2, w: 1.0, h: 0.2,
      fontSize: 8, color: this.config.colors.border.main, align: 'center'
    });

    // 3. 4象限の描画
    const qW = (this.config.layout.safeW / 2) - 0.6;
    const qH = (mainH / 2) - 0.4;

    // インデックスと描画位置のマッピング
    // 0:右上, 1:左上, 2:左下, 3:右下
    const quadrantMap = [
      { x: centerX + 0.3, y: currentY + 0.4, isHighlight: true },      // 0: 右上 (Highlight)
      { x: this.config.layout.baseX + 0.3, y: currentY + 0.4 },          // 1: 左上
      { x: this.config.layout.baseX + 0.3, y: centerY + 0.2 },          // 2: 左下
      { x: centerX + 0.3, y: centerY + 0.2 }                            // 3: 右下
    ];

    quadrants.slice(0, 4).forEach((q: any, i: number) => {
      const pos = quadrantMap[i];
      if (!pos) return;

      let pY = pos.y;
      const isHighlight = pos.isHighlight;

      // 象限の見出し (改行バグ回避のため renderTextBlock を使用可能だが、見出しは1行想定なので addText で継続)
      slide.addShape(this.pptx.ShapeType.rect, {
        x: pos.x, y: pY, w: 0.05, h: 0.4,
        fill: { color: isHighlight ? this.config.colors.primary : this.config.colors.border.main }
      });
      
      const qTitleParts = this.textProcessor.parseRichText(q.label || '', {
        fontSize: 13, bold: true, color: isHighlight ? this.config.colors.primary : this.config.colors.text.header
      });
      slide.addText(qTitleParts, {
        x: pos.x + 0.15, y: pY, w: qW, h: 0.4,
        valign: 'middle', margin: 0
      });
      pY += 0.5;

      // 象限のテキスト (改行バグ・重なり回避のため renderTextBlock を使用)
      this.renderTextBlock(slide, q.text || '', {
        x: pos.x + 0.15, y: pY, w: qW, h: qH - 0.5,
        fontSize: 10,
        color: this.config.colors.text.body,
        lineSpacing: 10 * 1.4,
        valign: 'top'
      });
    });

    // 4. フッター
    if (content.annotations) {
      this.ui.renderFooterAnnotations(slide, content.annotations);
    }
  }
}
