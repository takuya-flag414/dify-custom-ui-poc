import { BaseRenderer } from '../../../core/BaseRenderer';
import { SlideData } from '../../../types';

/**
 * QuoteSlideRenderer - 引用スライド (Editorial Pull-Quote)
 * 
 * デザイン意図: 
 * 左側の太いアクセントバーと、インパクトのあるタイポグラフィの組み合わせ。
 * コンテンツ全体が垂直方向の中央に配置される「抜け感」を重視したレイアウト。
 */
export class QuoteSlideRenderer extends BaseRenderer {
  public async render(slideData: SlideData, index: number): Promise<void> {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    const content = slideData.content || {} as any;
    const { quote, author, role, annotations = [] } = content;

    // --- 1. 定数定義 (JSXのcqiをインチ/PTに変換) ---
    const slideW = 10.0;
    const slideH = 5.625;
    
    // JSX: px-[6cqi] -> 0.6インチ
    const marginX = 0.6;
    // JSX: borderLeft 6px -> 約0.08インチ
    const borderW = 0.08;
    // JSX: paddingLeft 4cqi -> 0.4インチ
    const gapAfterBorder = 0.4;
    
    const contentX = marginX + borderW + gapAfterBorder;
    const contentW = slideW - contentX - marginX;

    // --- 2. テキストスタイルの設定 (JSXスタイルをエミュレート) ---
    // Quote: 3.6cqi -> 26pt (インパクト重視で調整)
    const quoteFontSize = 26;
    const quoteLineHeight = 1.3;
    const quoteLineSpacing = quoteFontSize * quoteLineHeight;
    
    const quoteParts = this.textProcessor.parseRichText(quote || 'メッセージをここに入力してください。', {
      fontSize: quoteFontSize,
      bold: true,
      color: this.config.colors.text.header,
      fontFace: this.config.fonts.face,
      letterSpacing: -0.5 // JSX: -0.02em (詰まり気味のモダンな組み)
    });

    // Author: 1.6cqi -> 12pt
    const authorFontSize = 12;
    const authorParts = this.textProcessor.parseRichText(author || '', {
      fontSize: authorFontSize,
      bold: true,
      color: this.config.colors.text.header,
      fontFace: this.config.fonts.face
    });

    // Role: 1.2cqi -> 9pt
    const roleFontSize = 9;
    const roleText = (role || '').toUpperCase();

    // --- 3. 動的な高さ計算 (垂直中央揃えのため) ---
    // 引用文の高さ推定 (日本語混在を考慮し、1行あたりの文字数を安全に見積もる)
    const charsPerLine = Math.floor(contentW / (quoteFontSize / 72)); 
    const estimatedLines = Math.max(1, Math.ceil((quote || '').length / (charsPerLine * 0.8))); // 0.8は余裕係数
    const hQuote = (estimatedLines * quoteLineSpacing) / 72;

    const hasFooter = !!(author || role);
    const spacingQuoteToFooter = 0.3; // JSX: marginBottom 3cqi -> 0.3インチ
    const hFooterDivider = 0.01;
    const hAuthor = author ? (authorFontSize * 1.5) / 72 : 0;
    const hRole = role ? (roleFontSize * 1.5) / 72 : 0;
    const footerPaddingTop = 0.15; // JSX: paddingTop 1.5cqi -> 0.15インチ
    
    const hFooterSection = hasFooter ? (hFooterDivider + footerPaddingTop + hAuthor + hRole) : 0;
    const totalContentH = hQuote + (hasFooter ? spacingQuoteToFooter : 0) + hFooterSection;
    
    // JSX: flex-col justify-center
    const startY = (slideH - totalContentH) / 2;

    // --- 4. 描画実行 ---

    // A. アクセントボーダー (コンテンツ全体の高さに追従)
    slide.addShape(this.pptx.ShapeType.rect, {
      x: marginX,
      y: startY,
      w: borderW,
      h: totalContentH,
      fill: { color: this.config.colors.primary }
    });

    // B. 引用メッセージ
    slide.addText(quoteParts, {
      x: contentX,
      y: startY,
      w: contentW,
      h: hQuote,
      valign: 'top',
      margin: 0,
      lineSpacing: quoteLineSpacing
    });

    // C. 著者セクション
    if (hasFooter) {
      const footerY = startY + hQuote + spacingQuoteToFooter;

      // 区切り線 (JSX: borderTop, minWidth: 30%)
      slide.addShape(this.pptx.ShapeType.rect, {
        x: contentX,
        y: footerY,
        w: contentW * 0.35, // 35%幅で再現
        h: hFooterDivider,
        fill: { color: this.config.colors.border.light }
      });

      let currentY = footerY + footerPaddingTop;

      if (author) {
        slide.addText(authorParts, {
          x: contentX,
          y: currentY,
          w: contentW,
          h: hAuthor,
          valign: 'top',
          margin: 0
        });
        currentY += hAuthor;
      }

      if (role) {
        slide.addText(roleText, {
          x: contentX,
          y: currentY,
          w: contentW,
          h: hRole,
          fontSize: roleFontSize,
          color: this.config.colors.text.muted,
          bold: true,
          fontFace: this.config.fonts.face,
          charSpacing: 1.0, // JSX: letterSpacing 0.1em (広め)
          valign: 'top',
          margin: 0
        });
      }
    }

    // D. 注釈 (Annotations) - 基底クラスのヘルパーを使用
    if (annotations && annotations.length > 0) {
      this.ui.renderFooterAnnotations(slide, annotations);
    }
  }
}
