import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

/**
 * TableSlideRenderer - データテーブル・スライド
 * 
 * デザイン意図: 
 * 垂直線を排除し、水平線のみで構成されたミニマリスト・テーブル。
 * 2カラム時は 3:9 の比率でデータの視認性を確保しつつ、強力なインサイトを添える。
 */
export class TableSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const {
      title,
      headers: rawHeaders = [],
      rows: rawRows = [],
      description,
      layout_variation = 'default',
      annotations = []
    } = content;

    // --- 1. ヘッダー描画 ---
    let currentY = this.ui.renderSlideHeader(slide, title || 'Data Table');
    currentY += 0.3;

    const isTwoColumn = layout_variation === 'two-column' && description;
    const slideW = 10.0;
    const marginX = 0.6;
    const safeW = slideW - (marginX * 2);

    let tableX = marginX;
    let tableW = safeW;

    // --- 2. レイアウト計算 & インサイト描画 ---
    if (isTwoColumn) {
      const centerGap = 0.4;
      const leftW = safeW * 0.25; // 比率 3 (25%)
      tableW = safeW * 0.75 - centerGap; // 比率 9 (75%)
      tableX = marginX + leftW + centerGap;

      // "KEY TAKEAWAY" ラベル
      slide.addText('KEY TAKEAWAY', {
        x: marginX, y: currentY, w: leftW, h: 0.2,
        fontSize: 8, color: this.config.colors.text.annotation, bold: true, charSpacing: 1.5,
        fontFace: this.config.fonts.face
      });

      // 示唆ボックス (文章量とフォントサイズに合わせて高さを動的に計算)
      const descY = currentY + 0.3;
      const estimatedLines = Math.ceil(description.length / 16); // 1行約16文字と想定
      const descH = Math.max(0.6, Math.min(3.8, estimatedLines * 0.32 + 0.1)); // バッファを追加

      slide.addShape(this.pptx.ShapeType.rect, {
        x: marginX, y: descY, w: 0.04, h: descH,
        fill: { color: this.config.colors.primaryDark }
      });

      const descParts = this.textProcessor.parseRichText(description, {
        fontSize: 12, bold: false, color: this.config.colors.text.body
      });
      slide.addText(descParts, {
        x: marginX + 0.15, y: descY, w: leftW - 0.2, h: descH,
        valign: 'top', margin: 0, lineSpacing: 20
      });
    }

    // --- 3. テーブル描画 ---
    const headers = Array.isArray(rawHeaders) ? rawHeaders : [];
    const rows = Array.isArray(rawRows) ? rawRows : [];

    if (headers.length > 0 || rows.length > 0) {
      const headerFontSize = 9;
      const bodyFontSize = 10;

      // ヘッダー行
      const headerRow = headers.map((h: string) => ({
        text: h.toUpperCase(),
        options: {
          fontSize: headerFontSize, bold: true, color: this.config.colors.text.muted,
          valign: 'bottom', align: 'left',
          margin: [8, 10, 8, 10],
          border: [
            { pt: 2, color: this.config.colors.primaryDark }, // Top
            { pt: 0, color: this.config.colors.text.white }, // Right
            { pt: 1, color: this.config.colors.text.header }, // Bottom
            { pt: 0, color: this.config.colors.text.white }  // Left
          ] as [any, any, any, any]
        }
      }));

      // データ行
      const formattedRows = rows.map((row: any[], i: number) => {
        const isLast = i === rows.length - 1;
        const bottomColor = isLast ? this.config.colors.border.main : this.config.colors.border.light;
        const bottomPt = isLast ? 1.5 : 0.5;

        return (Array.isArray(row) ? row : []).map((cell) => {
          const cellParts = this.textProcessor.parseRichText(cell?.toString() || '', {
            fontSize: bodyFontSize, color: this.config.colors.text.body
          });

          return {
            text: cellParts,
            options: {
              valign: 'top', align: 'left',
              margin: [10, 10, 10, 10],
              border: [
                { pt: 0, color: this.config.colors.text.white },
                { pt: 0, color: this.config.colors.text.white },
                { pt: bottomPt, color: bottomColor },
                { pt: 0, color: this.config.colors.text.white }
              ] as [any, any, any, any]
            }
          };
        });
      });

      // テーブルの配置
      const tableRows = [headerRow, ...formattedRows] as any;
      const tableHeight = Math.min(3.5, tableRows.length * 0.45);

      slide.addTable(tableRows, {
        x: tableX, y: currentY, w: tableW,
        // 1列目（ラベル列）を少し広めにする比重
        colW: headers.length > 1
          ? [tableW * 0.25, ...Array(headers.length - 1).fill(tableW * 0.75 / (headers.length - 1))]
          : [tableW],
        border: { pt: 0 }
      });

      // デフォルトレイアウトで説明文がある場合、テーブルの下に配置
      if (!isTwoColumn && description) {
        this.ui.renderInsightBox(slide, description, {
          x: marginX + (safeW * 0.025), y: currentY + tableHeight + 0.3, w: safeW * 0.95, h: 0.8
        });
      }
    }

    // --- 4. フッター ---
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
