import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

/**
 * ProcessFlowSlideRenderer - プロセスフロー・工程スライド
 * 
 * デザイン意図: 
 * Context (背景) -> Process (工程) -> Conclusion (結論) の3段構成。
 * 各工程をL字型アクセント付きのモジュールとしてグリッド配置する。
 */
export class ProcessFlowSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const { title, steps = [], process_steps = [], items = [], key_message, body_text, annotations = [] } = content;
    
    const rawSteps = process_steps.length > 0 ? process_steps : (steps.length > 0 ? steps : items);
    const activeSteps = Array.isArray(rawSteps) ? rawSteps : [];

    // --- 1. ヘッダー描画 ---
    let currentY = this.ui.renderSlideHeader(slide, title || 'Process Flow');
    currentY += 0.15;

    const baseX = this.config.layout.baseX;
    const safeW = this.config.layout.safeW;

    // --- 2. Analysis Context (body_text) ---
    if (body_text) {
      slide.addText('CONTEXTUAL ANALYSIS', {
        x: baseX + 0.1, y: currentY, w: safeW, h: 0.2,
        fontSize: 9, color: this.config.colors.primaryDark, bold: true, charSpacing: 1.2
      });
      currentY += 0.22;
      const bodyParts = this.textProcessor.parseRichText(body_text, {
        fontSize: 12, color: this.config.colors.text.body
      });
      slide.addText(bodyParts, {
        x: baseX + 0.1, y: currentY, w: safeW * 0.9, h: 0.5, valign: 'top'
      });
      currentY += 0.7;
    }

    // --- 3. Process Flow Grid ---
    const count = activeSteps.length;
    // JSXの getGridColumns ロジック
    const getCols = (n: number) => {
      if (n === 1) return 1;
      if (n === 2 || n === 4) return 2;
      if (n === 3 || n === 5 || n === 6) return 3;
      return 4;
    };
    const cols = getCols(count);
    const rows = Math.ceil(count / cols);
    const isHighDensity = rows > 1 || (body_text && key_message);

    const gapX = 0.4;
    const gapY = isHighDensity ? 0.3 : 0.6;
    const itemW = (safeW - (cols - 1) * gapX) / cols;
    const itemH = isHighDensity ? 1.2 : 1.6;

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

    activeSteps.forEach((step: any, idx: number) => {
      const cIdx = idx % cols;
      const rIdx = Math.floor(idx / cols);
      const x = baseX + cIdx * (itemW + gapX);
      const y = currentY + rIdx * (itemH + gapY);

      // 上部境界線と L字アクセント
      slide.addShape(this.pptx.ShapeType.rect, {
        x, y, w: itemW, h: 0.01, fill: { color: this.config.colors.border.light }
      });
      slide.addShape(this.pptx.ShapeType.rect, {
        x, y: y - 0.01, w: 0.4, h: 0.03, fill: { color: this.config.colors.primaryDark }
      });
      slide.addShape(this.pptx.ShapeType.rect, {
        x, y, w: 0.01, h: 0.25, fill: { color: this.config.colors.primaryDark }
      });

      // コンテンツ
      const innerX = x + 0.15;
      const innerW = itemW - 0.2;
      let pY = y + 0.15;

      // 連番
      slide.addText(String(idx + 1).padStart(2, '0'), {
        x: innerX, y: pY, w: innerW, h: 0.2,
        fontSize: 9, color: this.config.colors.primaryDark, fontFace: 'Courier New', bold: true,
        margin: 0
      });
      pY += 0.25;

      // ステップ見出し
      const sTitle = step.title || step.label || (typeof step === 'string' ? step : '');
      const titleParts = this.textProcessor.parseRichText(sTitle, {
        fontSize: isHighDensity ? 12 : 13, bold: true, color: this.config.colors.text.header
      });
      slide.addText(titleParts, {
        x: innerX, y: pY, w: innerW, h: 0.4, valign: 'top', margin: 0
      });
      pY += 0.45;

      // 説明文
      const descText = step.description || step.text || '';
      const descItems = processTextToBullets(descText, isHighDensity ? 9 : 10);
      slide.addText(descItems, {
        x: innerX, y: pY, w: innerW, h: itemH - (pY - y),
        valign: 'top', margin: 0, lineSpacing: (isHighDensity ? 9 : 10) * 1.5
      });
    });

    // --- 4. Key Conclusion (key_message) ---
    if (key_message) {
      const footerY = 5.1;
      const keyMsgY = footerY - 0.8;
      
      // 左ボーダー付きのメッセージ
      slide.addShape(this.pptx.ShapeType.rect, {
        x: baseX, y: keyMsgY, w: 0.04, h: 0.6,
        fill: { color: this.config.colors.primaryDark }
      });
      const keyMsgParts = this.textProcessor.parseRichText(key_message, {
        fontSize: 13, bold: true, color: this.config.colors.text.header
      });
      slide.addText(keyMsgParts, {
        x: baseX + 0.15, y: keyMsgY, w: safeW - 0.2, h: 0.6,
        valign: 'middle', margin: 0
      });
    }

    // --- 5. フッター ---
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
