import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

/**
 * RoadmapSlideRenderer - ロードマップ・年表スライド
 * 
 * デザイン意図: 
 * 水平なベーストラックで時間の連続性を表現。
 * 各フェーズをドロップラインで吊り下げ、構造化されたタイムラインを構築。
 */
export class RoadmapSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const steps = (Array.isArray(content.steps) ? content.steps : []).slice(0, 5); // 最大5ステップ程度を推奨
    const { title, annotations = [] } = content;

    // --- 1. ヘッダー描画 ---
    let currentY = this.ui.renderSlideHeader(slide, title || 'Roadmap & Milestones');
    currentY += 0.4;

    if (steps.length === 0) return;

    // --- 2. ベーストラック (時間の連続性を示す水平線) ---
    const baseX = this.config.layout.baseX;
    const safeW = this.config.layout.safeW;
    const trackY = currentY + 0.8;
    
    slide.addShape(this.pptx.ShapeType.rect, {
      x: baseX, y: trackY, w: safeW, h: 0.02,
      fill: { color: this.config.colors.border.light }
    });

    // --- 3. ステップ描画 ---
    const stepW = safeW / steps.length;


    steps.forEach((step: any, i: number) => {
      const stepX = baseX + (i * stepW);
      const nodeSize = 0.12;
      
      // Date (期日/フェーズ) - 正方形の真上に配置
      slide.addText(step.date || '', {
        x: stepX - (nodeSize / 2), y: trackY - 0.45, w: stepW, h: 0.3,
        fontSize: 11, color: this.config.colors.primaryDark, fontFace: 'Courier New', bold: true, charSpacing: 1,
        margin: 0
      });

      // Node (幾何学的なマイルストーン点)
      slide.addShape(this.pptx.ShapeType.rect, {
        x: stepX - (nodeSize / 2), y: trackY - (nodeSize / 2) + 0.01, w: nodeSize, h: nodeSize,
        fill: { color: this.config.colors.primaryDark },
        rectRadius: 0.01
      });

      // ドロップライン (垂直) - ノードの中央から
      const dropLineH = 2.4;
      slide.addShape(this.pptx.ShapeType.rect, {
        x: stepX, y: trackY + 0.1, w: 0.02, h: dropLineH,
        fill: { color: this.config.colors.bg.highlight }
      });

      // コンテンツエリア (見出し + 本文)
      const contentX = stepX + 0.15;
      const contentW = stepW - 0.3;
      let pY = trackY + 0.15;

      // 見出し (Label)
      const headingParts = this.textProcessor.parseRichText(step.label || '', {
        fontSize: 12, bold: true, color: this.config.colors.text.header
      });
      slide.addText(headingParts, {
        x: contentX, y: pY, w: contentW, h: 0.45, valign: 'top', margin: 0
      });
      pY += 0.55;

      // 本文 (共通メソッドで改行バグを修正済み)
      const bodyItems = this.processTextLines(step.description || '', 10);
      slide.addText(bodyItems, {
        x: contentX, y: pY, w: contentW, h: dropLineH - (pY - trackY),
        valign: 'top', margin: 0, lineSpacing: 10 * 1.5
      });
    });

    // --- 4. フッター ---
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
