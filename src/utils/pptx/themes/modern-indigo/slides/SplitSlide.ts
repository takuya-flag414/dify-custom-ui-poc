import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

/**
 * SplitSlideRenderer - 対比・分割スライド
 * 
 * デザイン意図: 
 * 現状(Left)と理想(Right)を中央のディバイダーとVSバッジで対比させる。
 * 左右で箇条書きの記号を変え、右側の解決策を視覚的に強調する。
 */
export class SplitSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const {
      title,
      left_title, left_label, left_text, left_body, left_bullets = [], left_column = [],
      right_title, right_label, right_text, right_body, right_bullets = [], right_column = [],
      comparison_icon = 'VS',
      annotations = []
    } = content;

    // --- 1. ヘッダー描画 ---
    let currentY = this.ui.renderSlideHeader(slide, title || 'Comparison');
    currentY += 0.3;

    const mainH = 3.6;
    const slideW = 10.0;
    const marginX = 0.6;
    const safeW = slideW - (marginX * 2);
    const centerGap = 1.2; // 左右各0.6インチの広い余白
    const colW = (safeW - centerGap) / 2;

    const leftX = marginX;
    const rightX = slideW / 2 + 0.6;

    // --- 2. 中央ディバイダーとVSバッジ ---
    slide.addShape(this.pptx.ShapeType.rect, {
      x: 5.0, y: currentY, w: 0.01, h: mainH,
      fill: { color: this.config.colors.border.light }
    });

    if (comparison_icon) {
      const badgeW = 0.6;
      const badgeH = 0.3;
      // バッジ外枠（カプセル）
      slide.addShape(this.pptx.ShapeType.roundRect, {
        x: 5.0 - badgeW / 2, y: currentY + (mainH / 2) - (badgeH / 2),
        w: badgeW, h: badgeH,
        fill: { color: this.config.colors.text.white },
        line: { color: this.config.colors.border.light, width: 1 },
        rectRadius: 0.5
      });
      // バッジテキスト
      slide.addText(comparison_icon, {
        x: 5.0 - badgeW / 2, y: currentY + (mainH / 2) - (badgeH / 2),
        w: badgeW, h: badgeH,
        align: 'center', valign: 'middle',
        fontSize: 7, bold: true, color: this.config.colors.text.muted, charSpacing: 2,
        fontFace: this.config.fonts.face
      });
    }

    // --- 3. テキスト解析関数 (リッチテキスト & 箇条書き) ---
    const processSplitText = (text: string, bullets: string[], isRight: boolean): any[] => {
      const items: any[] = [];
      const fontSize = 10;
      const bulletCode = '2022'; // 左右共に標準の点(•)で統一
      const bulletColor = isRight ? this.config.colors.primary : this.config.colors.text.annotation;

      // 本文の処理
      if (text) {
        const lines = text.replace(/\\n|¥n|<br\s*\/?>/g, '\n').split('\n').filter(l => l.trim().length > 0);
        lines.forEach(line => {
          const trimmed = line.trim();
          const isLineBullet = trimmed.startsWith('-') || trimmed.startsWith('*');
          const cleanLine = isLineBullet ? trimmed.replace(/^[-*]\s*/, '') : trimmed;
          const parts = this.textProcessor.parseRichText(cleanLine, { fontSize, color: this.config.colors.text.body });
          if (parts.length > 0) {
            parts[0].options = {
              ...parts[0].options,
              bullet: isLineBullet ? { code: bulletCode, color: bulletColor } : false,
              breakLine: true
            };
            items.push(...parts);
          }
        });
      }

      // 箇条書き配列の処理
      const finalBullets = bullets.length > 0 ? bullets : [];
      finalBullets.forEach(pt => {
        const parts = this.textProcessor.parseRichText(pt, { fontSize, color: this.config.colors.text.body });
        if (parts.length > 0) {
          parts[0].options = {
            ...parts[0].options,
            bullet: { code: bulletCode, color: bulletColor },
            breakLine: true
          };
          items.push(...parts);
        }
      });

      return items;
    };

    // --- 4. 左カラム (現状) ---
    const lTitleStr = left_title || left_label || '現状 / 課題';
    slide.addText(lTitleStr, {
      x: leftX, y: currentY + 0.1, w: colW, h: 0.3,
      fontSize: 12, bold: true, color: this.config.colors.text.muted,
      fontFace: this.config.fonts.face
    });

    const leftTextItems = processSplitText(left_text || left_body, left_bullets.length > 0 ? left_bullets : left_column, false);
    slide.addText(leftTextItems, {
      x: leftX, y: currentY + 0.5, w: colW, h: mainH - 0.5,
      valign: 'top', margin: 0, lineSpacing: 10 * 1.6
    });

    // --- 5. 右カラム (理想) ---
    const rTitleStr = right_title || right_label || '理想 / 解決策';
    // 右見出しのアクセントバー
    slide.addShape(this.pptx.ShapeType.rect, {
      x: rightX, y: currentY + 0.1, w: 0.05, h: 0.3,
      fill: { color: this.config.colors.primary }
    });
    slide.addText(rTitleStr, {
      x: rightX + 0.15, y: currentY + 0.1, w: colW - 0.15, h: 0.3,
      fontSize: 12, bold: true, color: this.config.colors.text.header,
      fontFace: this.config.fonts.face
    });

    const rightTextItems = processSplitText(right_text || right_body, right_bullets.length > 0 ? right_bullets : right_column, true);
    slide.addText(rightTextItems, {
      x: rightX + 0.15, y: currentY + 0.5, w: colW - 0.15, h: mainH - 0.5,
      valign: 'top', margin: 0, lineSpacing: 10 * 1.6
    });

    // --- 6. フッター ---
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
