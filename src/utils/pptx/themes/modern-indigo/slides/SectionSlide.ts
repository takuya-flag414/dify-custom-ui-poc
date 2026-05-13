import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

/**
 * SectionSlideRenderer - セクション区切り (Monumental Typography)
 * 
 * デザイン意図: 
 * 圧倒的なタイポグラフィの強弱により、プレゼンテーションの「節目」を印象付ける。
 * ダーク背景、等幅フォント、極太の見出しを組み合わせたモダンな設計。
 */
export class SectionSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_DARK' });
    // 背景色をパレット連動のダークカラーに強制設定
    slide.background = { color: this.config.colors.bg.dark };

    const content = slideData.content || {} as any;
    const { title, subtitle, section_number, annotations = [] } = content;
    const subText = subtitle || section_number;

    // --- 1. 定数定義 (JSXのcqiをインチ/PTに変換) ---
    const slideW = 10.0;
    const slideH = 5.625;
    
    // JSX: px-[8cqi] -> 0.8インチ
    const marginX = 0.8;
    const contentW = slideW - (marginX * 2);

    // --- 2. テキストスタイルの設定 ---
    
    // Subtext (Monospace): 1.8cqi -> 14pt
    const subFontSize = 14;
    const subFontSpacing = 5.0; // JSX: 0.2em (さらに広め)
    const subFontLines = 1.4;
    
    // Title: 5.4cqi -> 52pt (圧倒的なインパクト)
    const titleFontSize = 52;
    const titleLineHeight = 1.1; 
    const titleLineSpacing = titleFontSize * titleLineHeight;

    const titleParts = this.textProcessor.parseRichText(title || 'SECTION TITLE', {
      fontSize: titleFontSize,
      bold: true,
      color: this.config.colors.text.white, // Slate-50
      fontFace: this.config.fonts.face,
      letterSpacing: -0.8 // JSX: -0.02em (巨大文字を引き締める)
    });

    // --- 3. 動的な高さ計算 ---
    
    const hSub = subText ? (subFontSize * subFontLines) / 72 : 0;
    const spacingSubToLine = 0.2; // JSX: 2cqi
    const hLine = 0.01;
    const spacingLineToTitle = 0.3; // JSX: 3cqi
    
    // タイトルの高さ推定
    const charsPerLine = Math.floor(contentW / (titleFontSize / 72 * 0.8)); // CJK混在を考慮
    const estimatedTitleLines = Math.max(1, Math.ceil((title || '').length / charsPerLine));
    const hTitle = (estimatedTitleLines * titleLineSpacing) / 72;

    const totalContentH = hSub + (subText ? spacingSubToLine : 0) + hLine + spacingLineToTitle + hTitle;
    
    // 垂直中央配置
    let currentY = (slideH - totalContentH) / 2;

    // --- 4. 描画実行 ---

    // A. サブタイトル / セクション番号
    if (subText) {
      slide.addText(subText.toString().toUpperCase(), {
        x: marginX,
        y: currentY,
        w: contentW,
        h: hSub,
        fontSize: subFontSize,
        color: this.config.colors.status.warning, // Accentカラー (オレンジ系など)
        bold: true,
        fontFace: 'Consolas', 
        charSpacing: subFontSpacing,
        align: 'left',
        margin: 0
      });
      currentY += hSub + spacingSubToLine;
    }

    // B. セパレーターライン (短く太く)
    const lineWidth = 1.4; // 100px相当 (1.4インチ)
    slide.addShape(this.pptx.ShapeType.rect, {
      x: marginX,
      y: currentY,
      w: lineWidth,
      h: 0.03, // 2px相当
      fill: { color: this.config.colors.primary }
    });
    currentY += 0.03 + spacingLineToTitle;

    // C. メインタイトル
    slide.addText(titleParts, {
      x: marginX,
      y: currentY,
      w: contentW,
      h: hTitle,
      valign: 'top',
      margin: 0,
      lineSpacing: titleLineSpacing
    });

    // D. 注釈 (ダークモード用)
    if (annotations && annotations.length > 0) {
      const footerY = slideH - 0.5; // 下部固定
      const annotationText = annotations.join('  |  ');
      slide.addText(annotationText, {
        x: marginX,
        y: footerY,
        w: contentW,
        h: 0.3,
        fontSize: 9,
        color: this.config.colors.text.white,
        transparency: 50, // 半透明
        align: 'left',
        fontFace: this.config.fonts.face,
        margin: 0
      });
    }
  }
}