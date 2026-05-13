import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

/**
 * ContentSlideRenderer - 本文・解説スライド
 * 
 * デザイン意図: 
 * エディトリアル（雑誌）のような読みやすさを重視。
 * 強調メッセージ (Key Message) と、1/2カラムの本文構成。
 */
export class ContentSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const { title, key_message, body_text, layout_variation = 'one-column', annotations = [] } = content;
    const isTwoColumn = layout_variation === 'two-column';

    // --- 1. ヘッダー描画 ---
    let currentY = this.ui.renderSlideHeader(slide, title || 'Content');
    currentY += 0.2;

    const baseX = this.config.layout.baseX;
    const safeW = this.config.layout.safeW;

    // --- 2. Key Message (Pull Quote Style) ---
    if (key_message) {
      currentY += 0.15;
      // 太い左ボーダー
      slide.addShape(this.pptx.ShapeType.rect, {
        x: baseX, y: currentY, w: 0.04, h: 0.6,
        fill: { color: this.config.colors.primaryDark }
      });
      const keyParts = this.textProcessor.parseRichText(key_message, {
        fontSize: 14, color: this.config.colors.text.header, bold: true
      });
      slide.addText(keyParts, {
        x: baseX + 0.15, y: currentY, w: safeW - 0.2, h: 0.6,
        valign: 'middle', margin: 0
      });
      currentY += 0.9;
    }

    // テキスト解析関数 (強化版: ネスト対応)
    const processTextToBullets = (text: string, fontSize: number): any[] => {
      if (!text) return [];
      const lines = text.replace(/\\n|¥n|<br\s*\/?>/g, '\n').split('\n').filter(l => l.trim().length > 0);
      const items: any[] = [];
      
      lines.forEach((line: string) => {
        // 1. インデントレベルの判定
        // 行頭のスペース数、または連続する記号 (-- , ** ) からレベルを推測
        const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
        let indentLevel = Math.floor(leadingSpaces / 2);
        
        let trimmed = line.trim();
        // 記号の連続（-- や **）をカウントしてレベルに加算
        const bulletMatch = trimmed.match(/^([-*]{1,3})\s+(.*)/);
        let isBullet = false;
        let content = trimmed;
        
        if (bulletMatch) {
          isBullet = true;
          indentLevel += (bulletMatch[1].length - 1); // -- ならレベル+1
          content = bulletMatch[2];
        }
        
        // pptxgenjsの制限 (0-3程度)
        indentLevel = Math.min(Math.max(indentLevel, 0), 3);

        const lineParts = this.textProcessor.parseRichText(content, { color: this.config.colors.text.body, fontSize });
        if (lineParts.length > 0) {
          lineParts[0].options = { 
            ...lineParts[0].options, 
            bullet: isBullet ? true : false,
            indentLevel: isBullet ? indentLevel : undefined,
            breakLine: true 
          };
          for (let i = 1; i < lineParts.length; i++) {
            lineParts[i].options = { ...lineParts[i].options, breakLine: false };
          }
          items.push(...lineParts);
        }
      });
      return items;
    };

    // --- 3. Body Text (Editorial Columns) ---
    if (body_text) {
      const footerY = 5.1;
      const contentH = footerY - currentY - 0.2;
      const fontSize = 11;
      const lineSpacing = fontSize * 1.7; // JSXのlineHeight 1.7に同期

      if (isTwoColumn) {
        // テキストを2つに分割 (簡易的に行数で分割)
        const allLines = body_text.replace(/\\n|¥n|<br\s*\/?>/g, '\n').split('\n').filter((l: string) => l.trim().length > 0);
        const mid = Math.ceil(allLines.length / 2);
        const leftText = allLines.slice(0, mid).join('\n');
        const rightText = allLines.slice(mid).join('\n');

        const gap = 0.5;
        const colW = (safeW - gap) / 2;

        // 中央境界線
        slide.addShape(this.pptx.ShapeType.rect, {
          x: baseX + colW + (gap / 2), y: currentY, w: 0.01, h: contentH,
          fill: { color: this.config.colors.border.light }
        });

        // 左カラム
        const leftItems = processTextToBullets(leftText, fontSize);
        slide.addText(leftItems, {
          x: baseX, y: currentY, w: colW, h: contentH, valign: 'top', margin: 0, lineSpacing
        });
        // 右カラム
        const rightItems = processTextToBullets(rightText, fontSize);
        slide.addText(rightItems, {
          x: baseX + colW + gap, y: currentY, w: colW, h: contentH, valign: 'top', margin: 0, lineSpacing
        });
      } else {
        // 1カラム (幅を90%に絞る)
        const oneColW = safeW * 0.9;
        const bodyItems = processTextToBullets(body_text, fontSize);
        slide.addText(bodyItems, {
          x: baseX, y: currentY, w: oneColW, h: contentH, valign: 'top', margin: 0, lineSpacing
        });
      }
    }

    // --- 4. フッター ---
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
