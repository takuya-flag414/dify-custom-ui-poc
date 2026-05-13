import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

/**
 * TitleSlideRenderer - 表紙スライド
 * 
 * デザイン意図: 
 * インディゴのグラデーション背景に、力強いタイポグラフィを配置。
 * 透過チップや枠線付きロゴにより、モダンでプレミアムな印象を与える。
 */
export class TitleSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_TITLE' });
    const elementId = `slide-capture-${index}`;

    // --- A. 背景レイヤー ---
    const bgData = await this.captureElementAsImage(elementId, '.indigo-bg-layer');
    if (bgData) {
      slide.addImage({ data: bgData, x: 0, y: 0, w: '100%', h: '100%' });
    } else {
      // フォールバック: ネイティブの45度グラデーション
      slide.addShape(this.pptx.ShapeType.rect, {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: { type: 'gradient', color: ['4F46E5', '1E1B4B'], angle: 135 } as any
      });
    }

    const content = slideData.content || {} as any;
    const { title, subtitle, eyebrow, tags = [], author, date, logo_text = 'PRESENTATION' } = content;
    const xPos = 0.8; // 基準となる左端マージン

    // --- 1. Logo Box (ロゴ/ブランド) ---
    if (logo_text) {
      const logoW = (logo_text.length * 0.1) + 0.5;
      const logoParts = [{ 
        text: logo_text.toUpperCase(), 
        options: { fontSize: 9, bold: true, color: 'FFFFFF', charSpacing: 1.5 } 
      }];
      
      slide.addText(logoParts, {
        x: xPos, y: 0.8, w: logoW, h: 0.3,
        align: 'center', valign: 'middle',
        line: { color: 'FFFFFF', width: 1.0, transparency: 30 },
        margin: 0
      });
    }

    // --- 2. Eyebrow (眉題) ---
    if (eyebrow) {
      const ebParts = [{ 
        text: eyebrow.toUpperCase(), 
        options: { fontSize: 10, bold: true, color: 'FFFFFF', transparency: 22, charSpacing: 1.2 } 
      }];
      slide.addText(ebParts, {
        x: xPos, y: 1.6, w: 8.0, h: 0.3, align: 'left', margin: 0
      });
    }

    // --- 3. Main Title (メインタイトル) ---
    const titleParts = this.textProcessor.parseRichText(title || 'タイトル未設定', {
      fontSize: 42, bold: true, color: 'FFFFFF'
    });
    // 文字色を白に強制 (背景とのコントラスト確保)
    titleParts.forEach(p => { if (p.options) p.options.color = 'FFFFFF'; });
    slide.addText(titleParts, {
      x: xPos, y: 2.0, w: 8.0, h: 1.2,
      align: 'left', valign: 'top', lineSpacing: 42 * 1.15, margin: 0
    });

    // --- 4. Subtitle (サブタイトル) ---
    if (subtitle) {
      const subParts = this.textProcessor.parseRichText(subtitle, {
        fontSize: 16, color: 'FFFFFF', transparency: 15
      });
      // 文字色を白に強制 (背景とのコントラスト確保)
      subParts.forEach(p => { if (p.options) p.options.color = 'FFFFFF'; });
      slide.addText(subParts, {
        x: xPos, y: 3.3, w: 7.5, h: 0.6,
        align: 'left', valign: 'top', lineSpacing: 16 * 1.5, margin: 0
      });
    }

    // --- 5. Meta Tags (メタチップ) ---
    if (tags && tags.length > 0) {
      let currentX = xPos;
      const tagY = 4.2;

      tags.forEach((tag: string) => {
        const plainTag = this.textProcessor.stripFormatting(tag);
        const tagW = (plainTag.length * 0.1) + 0.35;
        const tagParts = [{ text: tag, options: { fontSize: 10, bold: true, color: 'FFFFFF' } }];

        // 透過背景チップ
        slide.addShape(this.pptx.ShapeType.roundRect, {
          x: currentX, y: tagY, w: tagW, h: 0.3,
          fill: { color: 'FFFFFF', transparency: 84 },
          rectRadius: 0.15
        });

        slide.addText(tagParts, {
          x: currentX, y: tagY, w: tagW, h: 0.3,
          align: 'center', valign: 'middle', margin: 0
        });

        currentX += tagW + 0.15;
      });
    }

    // --- 6. Presenter Info (右下) ---
    const presenterLines: any[] = [];
    if (author) presenterLines.push({ text: author, options: { bold: true, breakLine: true } });
    if (date) presenterLines.push({ text: date, options: { fontSize: 10, transparency: 22 } });

    if (presenterLines.length > 0) {
      slide.addText(presenterLines, {
        x: 6.0, y: 4.5, w: 3.5, h: 0.6,
        color: 'FFFFFF', fontSize: 11, align: 'right', valign: 'bottom',
        lineSpacing: 18, margin: 0
      });
    }
  }
}
