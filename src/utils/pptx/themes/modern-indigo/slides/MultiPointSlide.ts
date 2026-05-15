import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

/**
 * MultiPointSlideRenderer - マルチポイント・重要事項スライド
 * 
 * デザイン意図: 
 * 各ポイントを独立したモジュールとして扱い、グリッド状に配置。
 * 左側の Architectural Tick (L字型のアクセント) で視覚的な秩序を保つ。
 */
export class MultiPointSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const items = Array.isArray(content.items) ? content.items : [];
    const { title, subtitle, annotations = [] } = content;

    // --- 1. ヘッダー描画 ---
    let currentY = this.ui.renderSlideHeader(slide, title || 'Key Points');

    // --- 2. サブタイトル ---
    if (subtitle) {
      currentY += 0.1;
      const subtitleParts = this.textProcessor.parseRichText(subtitle, {
        fontSize: 11, color: this.config.colors.text.muted, bold: true
      });
      slide.addText(subtitleParts, {
        x: this.config.layout.baseX, y: currentY, w: this.config.layout.safeW, h: 0.3,
        valign: 'top', margin: 0
      });
      currentY += 0.4;
    } else {
      currentY += 0.2;
    }

    // --- 3. グリッド構成の決定 ---
    const count = items.length;
    let numCols = 3;
    let gridW = this.config.layout.safeW;
    
    // アイテム数に応じた幅の調整 (中央に寄せる)
    if (count === 1) {
      numCols = 1;
      gridW = 5.0;
    } else if (count === 2) {
      numCols = 2;
      gridW = 8.0; // 少し中央に寄せる
    } else if (count === 4) {
      numCols = 2;
      gridW = 7.0; // 2x2の場合はさらに中央に寄せる
    } else if (count > 0) {
      numCols = 3;
      gridW = this.config.layout.safeW;
    }

    const startX = this.config.layout.baseX + (this.config.layout.safeW - gridW) / 2;
    const gapX = 0.4;
    const gapY = 0.25; // 行間を詰めて一体感を出す
    const cols = this.calculateColumns(gridW, numCols, gapX, startX);
    
    // --- 4. 空間配分アルゴリズムによる高さ計算 ---
    const SAFE_BOTTOM = 5.0;
    const availableH = SAFE_BOTTOM - currentY;
    const numRows = Math.ceil(count / numCols);
    
    // 行間に必要なスペースを引いた実質利用可能な高さ
    const totalGapsH = Math.max(0, (numRows - 1) * gapY);
    const availableForItems = availableH - totalGapsH;
    
    // 1アイテムあたりの最大許容高さ（上限2.5として間延びを防止）
    let itemH = numRows > 0 ? Math.min(availableForItems / numRows, 2.5) : 0;
    
    // 圧縮モードの判定（高さが1.2未満ならフォントを縮小）
    const isCompressed = itemH < 1.2;
    const headerFontSize = isCompressed ? 10 : 12;
    const bodyFontSize = isCompressed ? 9 : 10;
    const lineSpacing = isCompressed ? bodyFontSize * 1.4 : bodyFontSize * 1.6;

    const totalGridH = (numRows * itemH) + totalGapsH;
    
    // 垂直方向の中央配置計算（余裕がある場合のみ）
    if (availableH > totalGridH) {
      const offsetY = Math.max(0.2, (availableH - totalGridH) / 2);
      currentY += offsetY;
    }

    // アイテムのグリッド描画
    items.forEach((item: any, i: number) => {
      const rowIdx = Math.floor(i / numCols);
      const colIdx = i % numCols;
      const col = cols[colIdx];
      const itemY = currentY + rowIdx * (itemH + gapY);

      // --- Architectural Tick ---
      slide.addShape(this.pptx.ShapeType.rect, {
        x: col.x, y: itemY, w: 0.01, h: itemH - 0.2,
        fill: { color: this.config.colors.border.light }
      });
      slide.addShape(this.pptx.ShapeType.rect, {
        x: col.x - 0.01, y: itemY, w: 0.03, h: 0.3,
        fill: { color: this.config.colors.primaryDark }
      });

      const contentX = col.x + 0.15;
      const contentW = col.w - 0.2;
      let pY = itemY;

      // ヘッダー (Index/Icon + Heading)
      const label = item.icon || String(i + 1).padStart(2, '0');
      const headerParts = [
        { text: label, options: { color: this.config.colors.primaryDark, bold: true, fontSize: headerFontSize - 2, fontFace: 'Courier New' } },
        { text: '  ' + (item.heading || `Point ${i + 1}`), options: { color: this.config.colors.text.header, bold: true, fontSize: headerFontSize } }
      ];
      slide.addText(headerParts, {
        x: contentX, y: pY, w: contentW, h: 0.4, valign: 'top', margin: 0
      });
      pY += 0.45;

      // 本文
      const bodyItems = this.processTextLines(item.text || '', bodyFontSize);
      slide.addText(bodyItems, {
        x: contentX, y: pY, w: contentW, h: itemH - (pY - itemY) - 0.05,
        valign: 'top', margin: 0, lineSpacing: lineSpacing
      });
    });


    // --- 4. フッター ---
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
