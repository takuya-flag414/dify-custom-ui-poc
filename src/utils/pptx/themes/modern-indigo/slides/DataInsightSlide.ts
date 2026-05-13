import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

/**
 * DataInsightSlideRenderer - データインサイト (Analytical Grid)
 * 
 * デザイン意図: 
 * 視覚化データとそれに対する解釈を左右に分け、情報の因果関係を明確にする。
 * 箇条書きを含む構造化されたテキストに対応し、ビジネス分析に適したレイアウト。
 */
export class DataInsightSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const { title, insight_title = "Key Insight", insight_text, annotations = [] } = content;

    // --- 1. ヘッダー描画 ---
    // 基底クラスの UI ヘルパーを使用し、JSXのスタイル（borderBottom等）を維持
    let currentY = this.ui.renderSlideHeader(slide, title || 'Data Insight');
    currentY += 0.3; // ヘッダー下の余白

    // --- 2. レイアウト計算 (JSXの 6:4 グリッドを再現) ---
    const slideW = 10.0;
    const marginX = 0.6; // JSX: 6cqi
    const safeW = slideW - (marginX * 2);
    const gap = 0.3; // JSX: gap-[3cqi]
    
    const leftW = safeW * 0.6 - (gap / 2);
    const rightW = safeW * 0.4 - (gap / 2);
    const rightX = marginX + leftW + gap;
    
    const mainH = 3.6; // コンテンツエリアの基本高さ

    // --- 3. 左側：ビジュアライゼーション・エリア ---
    
    // 背景と枠線
    slide.addShape(this.pptx.ShapeType.rect, {
      x: marginX, y: currentY, w: leftW, h: mainH,
      fill: { color: this.config.colors.bg.highlight }, // Slate-100
      line: { color: this.config.colors.border.light, width: 1 } // Slate-200
    });

    // 装飾ヘアライン (X/Y軸を模した線)
    const hairlineOffset = 0.2; // JSX: 2cqi
    // X軸
    slide.addShape(this.pptx.ShapeType.rect, {
      x: marginX + hairlineOffset,
      y: currentY + mainH - hairlineOffset,
      w: leftW - (hairlineOffset * 2),
      h: 0.01,
      fill: { color: this.config.colors.border.main } // Slate-300
    });
    // Y軸
    slide.addShape(this.pptx.ShapeType.rect, {
      x: marginX + hairlineOffset,
      y: currentY + hairlineOffset,
      w: 0.01,
      h: mainH - (hairlineOffset * 2),
      fill: { color: this.config.colors.border.main }
    });

    // プレースホルダーテキスト (Monospace指定)
    slide.addText('DATA VISUALIZATION AREA', {
      x: marginX, y: currentY, w: leftW, h: mainH,
      align: 'center', valign: 'middle',
      fontSize: 9, color: this.config.colors.text.annotation, bold: true,
      fontFace: 'Consolas', charSpacing: 3.0
    });

    // --- 4. 右側：インサイト・パネル ---
    
    let rY = currentY + 0.1;

    // インサイト見出しアクセント (太い垂直線)
    const accentLineW = 0.07; // 約5px
    slide.addShape(this.pptx.ShapeType.rect, {
      x: rightX, y: rY, w: accentLineW, h: 0.5,
      fill: { color: this.config.colors.primary }
    });

    // インサイト見出しテキスト (パディング 1.5cqi を Xオフセットで再現)
    const textPaddingLeft = 0.15;
    const insightTitleParts = this.textProcessor.parseRichText(insight_title, {
      fontSize: 13, bold: true, color: this.config.colors.text.header
    });
    slide.addText(insightTitleParts, {
      x: rightX + textPaddingLeft, y: rY, w: rightW - textPaddingLeft, h: 0.5,
      valign: 'middle', margin: 0
    });
    rY += 0.7;

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
            bullet: isBullet ? { code: '2022' } : false,
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

    // インサイト本文 (箇条書き対応)
    if (insight_text) {
      const insightBodyItems = processTextToBullets(insight_text, 11);
      // 行間 lineHeight: 1.7 を再現するため lineSpacing を調整
      slide.addText(insightBodyItems, {
        x: rightX + textPaddingLeft,
        y: rY,
        w: rightW - textPaddingLeft,
        h: mainH - (rY - currentY),
        valign: 'top',
        margin: 0,
        lineSpacing: 11 * 1.7 // フォントサイズ * 1.7
      });

      // ボトムアクセントライン (JSX: marginTop: 'auto' を再現)
      // テキストの長さに依存せず、パネル全体の最下部に配置
      slide.addShape(this.pptx.ShapeType.rect, {
        x: rightX + textPaddingLeft,
        y: currentY + mainH - 0.1,
        w: 0.3, h: 0.03,
        fill: { color: this.config.colors.primary, transparency: 60 }
      });
    }

    // --- 5. フッター ---
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
