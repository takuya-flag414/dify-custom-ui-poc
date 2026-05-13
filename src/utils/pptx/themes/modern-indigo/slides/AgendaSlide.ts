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
    const half = Math.ceil(activeItems.length / 2);

    activeItems.forEach((item: any, i: number) => {
      const col = isTwoColumn ? (i < half ? 0 : 1) : 0;
      const x = this.config.layout.baseX + (col * (colW + gap));
      const y = colY[col];

      const itemTitle = item.title || item.label || '';
      const subText = item.description || item.subtitle || item.text;

      // アイテムの高さを縮小計算
      const titleH = 0.25;
      const subH = subText ? 0.3 : 0;
      const textGap = subText ? 0.05 : 0;
      const lineH = Math.max(0.35, titleH + textGap + subH);

      // インデックス (幅 w を 0.5 に広げて改行を防ぐ)
      slide.addText(String(i + 1).padStart(2, '0'), {
        x: x, y: y, w: 0.5, h: 0.25,
        fontSize: 12, color: this.config.colors.primary,
        bold: true, fontFace: 'Courier New', charSpacing: 1
      });

      // 垂直セパレーター (インデックス幅に合わせて x 座標を右へ 0.1 ずらす)
      slide.addShape(this.pptx.ShapeType.rect, {
        x: x + 0.5, y: y, w: 0.01, h: lineH,
        fill: { color: this.config.colors.border.light }
      });

      // タイトル (セパレーターに合わせて開始位置 x を右へずらし、幅を調整)
      const titleParts = this.textProcessor.parseRichText(itemTitle, {
        fontSize: 15, bold: true, color: this.config.colors.text.header
      });
      slide.addText(titleParts, {
        x: x + 0.65, y: y, w: colW - 0.65, h: titleH,
        valign: 'top', margin: 0
      });

      // サブテキスト (タイトルと同じく開始位置と幅を調整)
      if (subText) {
        const subParts = this.textProcessor.parseRichText(subText, {
          fontSize: 11, color: this.config.colors.text.body
        });
        slide.addText(subParts, {
          x: x + 0.65, y: y + titleH + textGap, w: colW - 0.65, h: subH,
          valign: 'top', margin: 0, lineSpacing: 16
        });
      }

      // 次のアイテムのためのY座標更新
      colY[col] = y + lineH + 0.25;
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
