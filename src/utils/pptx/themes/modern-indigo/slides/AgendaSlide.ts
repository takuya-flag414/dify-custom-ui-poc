import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

export class AgendaSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const { title, items = [], lead_text, annotations = [], layout_variation = 'one-column' } = content;

    // 1. ヘッダー
    let currentY = this.ui.renderSlideHeader(slide, title || 'Agenda');
    currentY += 0.2;

    // 2. Lead Text
    if (lead_text) {
      // 垂直バーの高さを少し絞る
      slide.addShape(this.pptx.ShapeType.rect, {
        x: this.config.layout.baseX, y: currentY, w: 0.04, h: 0.4,
        fill: { color: this.config.colors.primary }
      });
      // リッチテキスト解析を適用してタグを除去
      const leadParts = this.textProcessor.parseRichText(lead_text, {
        fontSize: 13, color: this.config.colors.text.body
      });
      // フォントサイズを縮小し、Y座標を微調整して垂直バーと中央揃えになるようにする
      slide.addText(leadParts, {
        x: this.config.layout.baseX + 0.15, y: currentY - 0.05, w: 8.0, h: 0.5,
        valign: 'middle', lineSpacing: 20
      });
      currentY += 0.7; // 次の要素へのマージンを少し詰める
    }

    // 3. Agenda Items
    const activeItems = Array.isArray(items) ? items : [];
    const isTwoColumn = layout_variation === 'two-column' || activeItems.length > 5;

    const cols = isTwoColumn ? 2 : 1;
    const maxSafeW = isTwoColumn ? this.config.layout.safeW : this.config.layout.safeW * 0.8;
    const gap = 0.6;
    const colW = (maxSafeW - (isTwoColumn ? gap : 0)) / cols;

    const colY = new Array(cols).fill(currentY);
    const itemsPerCol = Math.ceil(activeItems.length / cols);
    
    // --- 空間配分アルゴリズムによる高さ計算 ---
    const SAFE_BOTTOM = 5.0;
    const availableH = SAFE_BOTTOM - currentY;
    const gapY = 0.2;
    const totalGapsH = Math.max(0, (itemsPerCol - 1) * gapY);
    
    // 1項目あたりの利用可能な高さを計算（間延びを防ぐため上限0.8）
    const calculatedItemH = itemsPerCol > 0 ? (availableH - totalGapsH) / itemsPerCol : 0.8;
    const itemH = Math.min(calculatedItemH, 0.8);
    
    // 圧縮モードの判定
    const isCompressed = itemH < 0.5;
    const indexFontSize = isCompressed ? 10 : 12;
    const titleFontSize = isCompressed ? 12 : 15;
    const descFontSize = isCompressed ? 9 : 11;

    activeItems.forEach((item: any, i: number) => {
      const col = isTwoColumn ? (i < itemsPerCol ? 0 : 1) : 0;
      const x = this.config.layout.baseX + (col * (colW + gap));
      const y = colY[col];

      const itemTitle = item.title || item.label || '';
      const subText = item.description || item.subtitle || item.text;

      // 各要素の高さを可変にする
      const titleH = isCompressed ? 0.2 : 0.25;
      const subH = subText ? (itemH - titleH - 0.05) : 0;
      const textGap = subText ? 0.05 : 0;
      const lineH = itemH;

      // インデックス
      slide.addText(String(i + 1).padStart(2, '0'), {
        x: x, y: y, w: 0.5, h: titleH,
        fontSize: indexFontSize, color: this.config.colors.primary,
        bold: true, fontFace: 'Courier New', charSpacing: 1
      });

      // 垂直セパレーター
      slide.addShape(this.pptx.ShapeType.rect, {
        x: x + 0.5, y: y, w: 0.01, h: lineH,
        fill: { color: this.config.colors.border.light }
      });

      // タイトル
      const titleParts = this.textProcessor.parseRichText(itemTitle, {
        fontSize: titleFontSize, bold: true, color: this.config.colors.text.header
      });
      slide.addText(titleParts, {
        x: x + 0.65, y: y, w: colW - 0.65, h: titleH,
        valign: 'top', margin: 0
      });

      // サブテキスト
      if (subText) {
        const subParts = this.textProcessor.parseRichText(subText, {
          fontSize: descFontSize, color: this.config.colors.text.body
        });
        slide.addText(subParts, {
          x: x + 0.65, y: y + titleH + textGap, w: colW - 0.65, h: subH,
          valign: 'top', margin: 0, lineSpacing: descFontSize * 1.4
        });
      }

      // 次のアイテムのためのY座標更新
      colY[col] = y + itemH + gapY;
    });

    // 2カラム時の全体中央ディバイダーを描画
    if (isTwoColumn && activeItems.length > 0) {
      const dividerX = this.config.layout.baseX + colW + (gap / 2);
      const maxColY = Math.max(...colY);
      const dividerH = maxColY - currentY - 0.25; // 余白分を引く

      if (dividerH > 0) {
        slide.addShape(this.pptx.ShapeType.rect, {
          x: dividerX, y: currentY, w: 0.01, h: dividerH,
          fill: { color: this.config.colors.border.light }
        });
      }
    }

    // 4. フッター
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
