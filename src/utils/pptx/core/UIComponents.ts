import pptxgen from 'pptxgenjs';
import { ThemeConfig } from '../types';
import { TextProcessor } from './TextProcessor';

/**
 * 共通のUIコンポーネント描画を担当するクラス
 */
export class UIComponents {
  private pptx: pptxgen;
  private config: ThemeConfig;
  private textProcessor: TextProcessor;

  constructor(pptx: pptxgen, config: ThemeConfig, textProcessor: TextProcessor) {
    this.pptx = pptx;
    this.config = config;
    this.textProcessor = textProcessor;
  }

  /**
   * スライドヘッダーを描画
   */
  public renderSlideHeader(slide: pptxgen.Slide, title: string): number {
    const titleParts = this.textProcessor.parseRichText(title || 'タイトル', {
      fontSize: this.config.fonts.header, bold: true, color: this.config.colors.text.header
    });
    slide.addText(titleParts, {
      x: this.config.layout.baseX, y: this.config.layout.headerY, w: this.config.layout.safeW, h: 0.6,
      margin: 0
    });
    slide.addShape(this.pptx.ShapeType.rect, {
      x: this.config.layout.baseX, y: this.config.layout.headerBorderY, w: this.config.layout.safeW, h: 0.03,
      fill: { color: this.config.colors.primary }
    });
    return this.config.layout.headerTotalH;
  }

  /**
   * インサイトボックスを描画 (Pull Quote Style)
   */
  public renderInsightBox(slide: pptxgen.Slide, text: string, opts: { x?: number, y: number, w?: number, h?: number }): number {
    const x = opts.x ?? this.config.layout.baseX;
    const w = opts.w ?? this.config.layout.safeW;
    const h = opts.h ?? 0.7; // 少し高さを抑える

    // 左側の境界線 (4px相当 -> 0.05pt)
    slide.addShape(this.pptx.ShapeType.rect, {
      x, y: opts.y, w: 0.04, h,
      fill: { color: this.config.colors.primary }
    });

    const cleanText = this.textProcessor.stripFormatting(text);
    const fontSize = cleanText.length > 80 ? 12 : 14; // フォントサイズを同期

    const kmParts = this.textProcessor.parseRichText(text, {
      fontSize, bold: true, color: this.config.colors.text.header
    });
    slide.addText(kmParts, {
      x: x + 0.15, y: opts.y, w: w - 0.2, h,
      valign: 'middle',
      margin: 0,
      lineSpacing: 22
    });

    return h;
  }

  /**
   * フッター注釈を描画
   */
  public renderFooterAnnotations(slide: pptxgen.Slide, annotations: string[], opts?: { color?: string }) {
    if (!annotations || annotations.length === 0) return;

    // 上部の区切り線
    slide.addShape(this.pptx.ShapeType.rect, {
      x: this.config.layout.baseX, y: this.config.layout.footerY - 0.1, w: this.config.layout.safeW, h: 0.01,
      fill: { color: this.config.colors.border.light }
    });

    const noteText = annotations.map((n: string) => this.textProcessor.stripFormatting(n)).join(' | ');
    slide.addText(noteText, {
      x: this.config.layout.baseX, y: this.config.layout.footerY, w: this.config.layout.safeW, h: 0.3,
      fontSize: this.config.fonts.annotation,
      color: opts?.color || this.config.colors.text.annotation,
      align: 'left', margin: 0,
      fontFace: this.config.fonts.face
    });
  }

  /**
   * カードを描画
   */
  public renderCard(slide: pptxgen.Slide, opts: { x: number, y: number, w: number, h: number, highlighted?: boolean }) {
    slide.addShape(this.pptx.ShapeType.roundRect, {
      x: opts.x, y: opts.y, w: opts.w, h: opts.h,
      line: {
        color: opts.highlighted ? this.config.colors.primary : this.config.colors.border.light,
        width: opts.highlighted ? 1.5 : 1
      },
      fill: { color: opts.highlighted ? this.config.colors.bg.highlightIndigo : this.config.colors.text.white },
      rectRadius: 0.05
    });

    if (opts.highlighted) {
      slide.addShape(this.pptx.ShapeType.rect, {
        x: opts.x, y: opts.y, w: opts.w, h: 0.08,
        fill: { color: this.config.colors.primary }
      });
    }
  }

  /**
   * スライド上部の EYEBROW を描画
   */
  public renderEyebrow(slide: pptxgen.Slide, text: string) {
    slide.addText(text.toUpperCase(), {
      x: this.config.layout.baseX, y: 0.25, w: this.config.layout.safeW, h: 0.2,
      fontSize: 10, color: this.config.colors.primary, bold: true,
      fontFace: this.config.fonts.face
    });
  }
}
