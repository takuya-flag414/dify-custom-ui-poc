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
}
