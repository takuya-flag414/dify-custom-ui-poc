import pptxgen from 'pptxgenjs';
import { ThemeConfig, SlideData } from '../types';
import { TextProcessor } from './TextProcessor';
import { UIComponents } from './UIComponents';

/**
 * すべてのスライドレンダラーの基底クラス
 */
export abstract class BaseRenderer {
  protected pptx: pptxgen;
  protected config: ThemeConfig;
  protected textProcessor: TextProcessor;
  protected ui: UIComponents;

  constructor(pptx: pptxgen, config: ThemeConfig) {
    this.pptx = pptx;
    this.config = config;
    this.textProcessor = new TextProcessor(config);
    this.ui = new UIComponents(pptx, config, this.textProcessor);
  }

  /**
   * スライドをレンダリングする抽象メソッド
   */
  public abstract render(slideData: SlideData, index: number): Promise<void>;

  /**
   * 指定したDOM要素（またはその中の特定の子要素）を高解像度で画像化する
   * (ブラウザ環境での実行を想定)
   */
  protected async captureElementAsImage(elementId: string, subSelector?: string): Promise<string | null> {
    // 実行環境がブラウザでない場合は null を返す
    if (typeof window === 'undefined') return null;

    try {
      const { toPng } = await import('html-to-image');
      const parent = document.getElementById(elementId);
      if (!parent) return null;

      const element = subSelector ? (parent.querySelector(subSelector) as HTMLElement) : parent;
      if (!element) return null;

      const dataUrl = await toPng(element, { pixelRatio: 3, cacheBust: true });
      return dataUrl;
    } catch (error) {
      console.error(`DOM要素の画像化に失敗しました:`, error);
      return null;
    }
  }

  /**
   * 汎用グリッド計算
   */
  protected calculateColumns(
    totalW: number, cols: number, gap: number, startX = this.config.layout.baseX
  ): { x: number; w: number }[] {
    const colW = (totalW - gap * (cols - 1)) / cols;
    return Array.from({ length: cols }, (_, i) => ({
      x: startX + i * (colW + gap),
      w: colW
    }));
  }

  /**
   * 情報密度スコアからフォントサイズを動的に計算する
   */
  protected calcDensityFontSize(
    score: number,
    base: number,
    thresholds: [number, number][] = [
      [50, 0.65], [35, 0.75], [20, 0.85], [0, 0.95]
    ]
  ): number {
    for (const [threshold, factor] of thresholds) {
      if (score > threshold) return Math.round(base * factor);
    }
    return base;
  }

  /**
   * Markdown形式のテキストを箇条書きアイテム配列に変換
   */
  protected parseMarkdownList(text: string, opts?: { fontSize?: number }) {
    if (!text) return [];
    const fontSize = opts?.fontSize || this.config.fonts.bodySmall;

    return text.split('\n').filter(l => l.trim()).map(line => {
      const trimmed = line.trim();
      const isBullet = trimmed.startsWith('-') || trimmed.startsWith('*');
      const cleanText = isBullet ? trimmed.replace(/^[-*]\s*/, '') : trimmed;

      return {
        text: this.textProcessor.stripFormatting(cleanText),
        options: {
          bullet: isBullet,
          fontSize: fontSize,
          color: this.config.colors.text.body,
          lineSpacing: 22,
          fontFace: this.config.fonts.face
        }
      };
    });
  }

  /**
   * テキストブロックをレンダリングする (箇条書き・折り返し・重なり解消版)
   */
  protected renderTextBlock(
    slide: any,
    text: string,
    opts: { x: number, y: number, w: number, h: number, fontSize: number, lineSpacing?: number, color?: string, align?: string, valign?: string }
  ) {
    if (!text) return 0;

    const lines = text.replace(/\\n|¥n|<br\s*\/?>/g, '\n').split('\n');
    let currentY = opts.y;
    const spacing = opts.lineSpacing || opts.fontSize * 1.5;
    const lineH = spacing / 72;

    // 行の種類ごとにグループ化して描画する
    // (PptxGenJS は 1つの addText 内で bullet の有無を切り替えるのが難しいため)
    let currentGroup: { isBullet: boolean, indentLevel: number, segments: any[] } | null = null;

    const flushGroup = () => {
      if (!currentGroup || currentGroup.segments.length === 0) return;

      slide.addText(currentGroup.segments, {
        x: opts.x,
        y: currentY,
        w: opts.w,
        h: opts.h - (currentY - opts.y), // 残りの高さ
        fontSize: opts.fontSize,
        color: opts.color || this.config.colors.text.body,
        align: opts.align || 'left',
        valign: opts.valign || 'top',
        bullet: currentGroup.isBullet ? { code: '2022' } : false,
        indentLevel: currentGroup.indentLevel,
        lineSpacing: spacing,
        margin: 0,
      });

      // 高さの推定 (簡易計算: セグメント内の \n の数 + 概算の折り返し行数)
      const newlineCount = currentGroup.segments.filter(s => s.text === '\n').length + 1;
      // 実際には折り返しを正確に取るのは難しいため、少し余裕を持って Y を進める
      currentY += newlineCount * lineH;
      currentGroup = null;
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushGroup();
        currentY += lineH; // 空行
        return;
      }

      const bulletMatch = trimmed.match(/^([-*]{1,3})\s+(.*)/);
      const isBullet = !!bulletMatch;
      const content = isBullet ? bulletMatch[2] : trimmed;
      const indentLevel = isBullet ? Math.min(bulletMatch[1].length - 1, 3) : 0;

      // グループの切り替わり判定 (箇条書きの有無やインデントが変わったら別の addText にする)
      if (currentGroup && (currentGroup.isBullet !== isBullet || currentGroup.indentLevel !== indentLevel)) {
        flushGroup();
      }

      if (!currentGroup) {
        currentGroup = { isBullet, indentLevel, segments: [] };
      }

      // 同じグループ内の2行目以降なら改行を挿入
      if (currentGroup.segments.length > 0) {
        currentGroup.segments.push({ text: '\n' });
      }

      const segments = this.textProcessor.parseRichText(content, {
        color: opts.color || this.config.colors.text.body,
        fontSize: opts.fontSize,
      });

      currentGroup.segments.push(...segments);
    });

    flushGroup();
    return currentY - opts.y;
  }

  /**
   * 単一行または単純なテキスト解析用
   */
  protected processTextLines(text: string, fontSize: number, opts: { enableIndent?: boolean } = {}): any[] {
    if (!text) return [];
    const items: any[] = [];
    const lines = text.replace(/\\n|¥n|<br\s*\/?>/g, '\n').split('\n').filter(l => l.trim().length > 0);

    lines.forEach((line) => {
      const trimmed = line.trim();
      const bulletMatch = trimmed.match(/^([-*]{1,3})\s+(.*)/);
      const isBullet = !!bulletMatch;
      const content = isBullet ? bulletMatch[2] : trimmed;
      
      const segments = this.textProcessor.parseRichText(content, { color: this.config.colors.text.body, fontSize });

      segments.forEach((seg: any, i: number) => {
        seg.options = {
          ...seg.options,
          bullet: (i === 0 && isBullet) ? { code: '2022' } : undefined,
          breakLine: i === 0 && items.length > 0,
        };
      });
      items.push(...segments);
    });
    return items;
  }
}
