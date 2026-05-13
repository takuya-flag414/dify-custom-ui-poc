import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

/**
 * ImageContentSlideRenderer - 画像とコンテンツ (Magazine Spread)
 * 
 * デザイン意図: 
 * 画像とテキストを対等に配置し、垂直のディバイダーでセパレートする雑誌風レイアウト。
 * 画像のトリミング（Cover）と、テキストブロックの垂直中央配置により、高級感を演出。
 */
export class ImageContentSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const { title, key_message, image_url, image_caption, body_text, bullet_points = [], layout_variation = 'image-left', annotations = [] } = content;

    // --- 1. ヘッダー描画 ---
    let currentY = this.ui.renderSlideHeader(slide, title || 'Overview');
    currentY += 0.3;

    // --- 2. レイアウト計算 (50:50分割と広い中央ギャップ) ---
    const slideW = 10.0;
    const marginX = 0.6; // JSX: 6cqi
    const safeW = slideW - (marginX * 2);
    const centerGap = 0.8; // JSX: margin 0 4cqi (左右計8cqi)
    
    const colW = (safeW - centerGap) / 2;
    const isImageRight = layout_variation === 'image-right';
    
    const imageX = isImageRight ? marginX + colW + centerGap : marginX;
    const contentX = isImageRight ? marginX : marginX + colW + centerGap;
    
    const mainH = 3.2; // キャプション領域を考慮して高さを調整

    // --- 3. 画像エリア (Left or Right) ---
    
    // 背景（画像がない場合のプレースホルダー）
    slide.addShape(this.pptx.ShapeType.rect, {
      x: imageX, y: currentY, w: colW, h: mainH,
      fill: { color: this.config.colors.bg.highlight }
    });

    if (image_url) {
      slide.addImage({
        path: image_url,
        x: imageX, y: currentY, w: colW, h: mainH,
        sizing: { type: 'cover', w: colW, h: mainH } // JSX: object-fit: cover を再現
      });
    }

    if (image_caption) {
      slide.addText(image_caption, {
        x: imageX, y: currentY + mainH + 0.02, w: colW, h: 0.4,
        fontSize: 8, color: this.config.colors.text.muted, align: 'left',
        valign: 'top', fontFace: this.config.fonts.face, margin: 0
      });
    }

    // --- 4. 垂直ディバイダー ---
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 5.0, // スライド中央
      y: currentY,
      w: 0.01,
      h: mainH,
      fill: { color: this.config.colors.border.light }
    });

    // --- 5. コンテンツエリア (垂直中央配置の計算) ---
    
    // Markdown/RichText と 箇条書きを両立する解析関数
    const processTextToBullets = (text: string, fontSize: number): any[] => {
      if (!text) return [];
      const lines = text.replace(/\\n|¥n|<br\s*\/?>/g, '\n').split('\n').filter(l => l.trim().length > 0);
      const items: any[] = [];
      lines.forEach((line: string) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith('-') || trimmed.startsWith('*');
        const cleanLine = isBullet ? trimmed.replace(/^[-*]\s*/, '') : trimmed;

        const lineParts = this.textProcessor.parseRichText(cleanLine, {
          color: this.config.colors.text.body,
          fontSize: fontSize
        });

        if (lineParts.length > 0) {
          lineParts[0].options = {
            ...lineParts[0].options,
            bullet: isBullet ? { code: '2022' } : false, // 箇条書きドット
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

    // Body Text と Bullet Points を統合して高さを推定
    const bodyLines = body_text ? body_text.replace(/\\n|¥n|<br\s*\/?>/g, '\n').split('\n').filter((l: string) => l.trim().length > 0).length : 0;
    const bulletLines = (bullet_points || []).length;
    
    const hKM = key_message ? 0.8 : 0;
    const hBody = (bodyLines + bulletLines) * 0.28; // 簡易推定 (行あたり0.28インチ)
    
    const totalTextH = hKM + hBody + (key_message && (bodyLines > 0) ? 0.2 : 0);
    const textStartY = currentY + (mainH - totalTextH) / 2;
    
    let pY = textStartY;

    // A. Key Message (太線付き)
    if (key_message) {
      slide.addShape(this.pptx.ShapeType.rect, {
        x: contentX, y: pY, w: 0.05, h: 0.6,
        fill: { color: this.config.colors.primary }
      });
      const kmParts = this.textProcessor.parseRichText(key_message, {
        fontSize: 13, bold: true, color: this.config.colors.text.header
      });
      slide.addText(kmParts, {
        x: contentX + 0.15, y: pY, w: colW - 0.2, h: 0.6,
        valign: 'middle', margin: 0
      });
      pY += 0.8;
    }

    // B. Body Text & Bullet Points
    const allTextItems: any[] = [];
    if (body_text) {
      allTextItems.push(...processTextToBullets(body_text, 10));
    }
    if (bullet_points && bullet_points.length > 0) {
      bullet_points.forEach((pt: string) => {
        // ハイフンがなければ付与して箇条書き処理へ流す
        const text = pt.trim().startsWith('-') || pt.trim().startsWith('*') ? pt : `- ${pt}`;
        allTextItems.push(...processTextToBullets(text, 10));
      });
    }

    if (allTextItems.length > 0) {
      slide.addText(allTextItems, {
        x: contentX, y: pY, w: colW, h: mainH - (pY - currentY),
        valign: 'top', margin: 0, lineSpacing: 10 * 1.7 
      });
    }

    // --- 6. フッター ---
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
