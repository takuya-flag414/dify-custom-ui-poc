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

    // --- 3. 空間配分アルゴリズムによるプロセス配置計算 ---
    const count = activeSteps.length;
    const getCols = (n: number) => {
      if (n === 1) return 1;
      if (n === 2 || n === 4) return 2;
      if (n === 3 || n === 5 || n === 6) return 3;
      return 4;
    };
    const cols = getCols(count);
    const rows = Math.ceil(count / cols);
    const hasKey = !!key_message;
    
    const SAFE_BOTTOM = 5.0;
    const AVAILABLE_H = SAFE_BOTTOM - currentY;
    
    // key_message用の空間を先に確保
    const keyMsgH = hasKey ? 0.6 : 0;
    const keyMsgMargin = hasKey ? 0.3 : 0;
    
    // グリッドが使える残りの高さ
    const availableGridH = AVAILABLE_H - keyMsgH - keyMsgMargin;
    const gapX = 0.4;
    const gapY = 0.3; // 行間は固定
    const totalGapsH = Math.max(0, (rows - 1) * gapY);
    
    // 1アイテムあたりの最大高さを算出（上限1.8）
    let itemH = rows > 0 ? Math.min((availableGridH - totalGapsH) / rows, 1.8) : 0;
    
    // 圧縮判定
    const isCompressed = itemH < 1.1;
    const titleFontSize = isCompressed ? 11 : 13;
    const descFontSize = isCompressed ? 9 : 10;
    const itemW = (safeW - (cols - 1) * gapX) / cols;

    let maxGridY = currentY;

    activeSteps.forEach((step: any, idx: number) => {
      const cIdx = idx % cols;
      const rIdx = Math.floor(idx / cols);
      const x = baseX + cIdx * (itemW + gapX);
      const y = currentY + rIdx * (itemH + gapY);
      
      const bottomY = y + itemH;
      if (bottomY > maxGridY) maxGridY = bottomY;

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
      pY += 0.2; // 少し詰める

      // ステップ見出し
      const sTitle = step.title || step.label || (typeof step === 'string' ? step : '');
      const titleParts = this.textProcessor.parseRichText(sTitle, {
        fontSize: titleFontSize, bold: true, color: this.config.colors.text.header
      });
      slide.addText(titleParts, {
        x: innerX, y: pY, w: innerW, h: 0.35, valign: 'top', margin: 0
      });
      pY += 0.35;

      // 説明文 (改行バグ回避版)
      const descText = step.description || step.text || '';
      this.renderTextBlock(slide, descText, {
        x: innerX,
        y: pY,
        w: innerW,
        h: itemH - (pY - y) - 0.05,
        fontSize: descFontSize,
        lineSpacing: descFontSize * 1.3,
        valign: 'top'
      });
    });

    // --- 4. Key Conclusion (key_message) ---
    if (key_message) {
      // グリッドの下に配置
      const keyMsgHeight = 0.6;
      let keyMsgY = maxGridY + 0.3; 
      
      // 左ボーダー付きのメッセージ
      slide.addShape(this.pptx.ShapeType.rect, {
        x: baseX, y: keyMsgY, w: 0.04, h: keyMsgHeight,
        fill: { color: this.config.colors.primaryDark }
      });
      this.renderTextBlock(slide, key_message, {
        x: baseX + 0.15,
        y: keyMsgY,
        w: safeW - 0.2,
        h: keyMsgHeight,
        fontSize: 13,
        color: this.config.colors.text.header,
        valign: 'middle'
      });
    }

    // --- 5. フッター ---
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
