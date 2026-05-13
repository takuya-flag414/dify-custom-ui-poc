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
    
    // アイテムあたりの基本高さとグリッド全体の高さ計算
    const numRows = Math.ceil(count / numCols);
    const itemH = numRows > 1 ? 1.4 : 2.5;
    const totalGridH = (numRows * itemH) + ((numRows - 1) * gapY);

    // 垂直方向の中央配置計算
    const footerY = 5.1;
    const availableH = footerY - currentY;
    if (availableH > totalGridH) {
      // 最低でも0.3の余白を確保しつつ、中央に配置
      const offsetY = Math.max(0.3, (availableH - totalGridH) / 2);
      currentY += offsetY;
    }

    // テキスト解析関数 (既存)
    const processTextToBullets = (text: string, fontSize: number): any[] => {
      if (!text) return [];
      const lines = text.replace(/\\n|¥n|<br\s*\/?>/g, '\n').split('\n').filter(l => l.trim().length > 0);
      const items: any[] = [];
      lines.forEach((line: string) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith('-') || trimmed.startsWith('*');
        const cleanLine = isBullet ? trimmed.replace(/^[-*]\s*/, '') : trimmed;
        const lineParts = this.textProcessor.parseRichText(cleanLine, { color: this.config.colors.text.body, fontSize });
        if (lineParts.length > 0) {
          lineParts[0].options = { ...lineParts[0].options, bullet: isBullet ? { code: '2022' } : false, breakLine: true };
          for (let i = 1; i < lineParts.length; i++) lineParts[i].options = { ...lineParts[i].options, breakLine: false };
          items.push(...lineParts);
        }
      });
      return items;
    };

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
        { text: label, options: { color: this.config.colors.primaryDark, bold: true, fontSize: 10, fontFace: 'Courier New' } },
        { text: '  ' + (item.heading || `Point ${i + 1}`), options: { color: this.config.colors.text.header, bold: true, fontSize: 12 } }
      ];

      slide.addText(headerParts, {
        x: contentX, y: pY, w: contentW, h: 0.4, valign: 'top', margin: 0
      });
      pY += 0.45;

      // 本文
      const bodyItems = processTextToBullets(item.text || '', 10);
      slide.addText(bodyItems, {
        x: contentX, y: pY, w: contentW, h: itemH - (pY - itemY) - 0.1,
        valign: 'top', margin: 0, lineSpacing: 10 * 1.6
      });
    });

    // --- 4. フッター ---
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
