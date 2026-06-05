import pptxgen from 'pptxgenjs';
import { ExportOptions, SlideData } from './types';
import { DynamicSlideRenderer } from './renderers/DynamicSlideRenderer.ts';
import { globalThemeRegistry } from './core/Registry';

/**
 * PPTX変換を行う新しいコアエンジンクラス
 */
export class PptxExportEngine {
  private pptx: pptxgen;
  private options: ExportOptions;

  private getConfig() {
    const theme = globalThemeRegistry.getTheme(this.options.themeName, this.options.palette);
    if (theme) return theme.config;
    
    // 登録されていない新しいテーマ（consulting-classic等）の場合は簡易的なConfigを生成
    const isDark = this.options.themeName === 'tech-startup';
    return {
      colors: {
        primary: isDark ? 'ff007f' : (this.options.themeName === 'consulting-classic' ? '00205B' : '6366F1'),
        bg: { 
          main: isDark ? '0f172a' : 'ffffff',
          dark: isDark ? '000000' : '1e293b'
        },
        text: {
          main: isDark ? 'ffffff' : '000000',
          body: isDark ? 'f1f5f9' : '333333'
        }
      }
    };
  }

  constructor(options: ExportOptions) {
    this.options = options;
    this.pptx = new pptxgen();
    this.pptx.layout = 'LAYOUT_16x9';
    // マスターレイアウト定義 (テーマ固有の設定を使用)
    this.defineMasterLayouts(this.getConfig());
  }

  private defineMasterLayouts(config: any) {
    // 通常コンテンツ用マスター
    this.pptx.defineSlideMaster({
      title: 'MASTER_MODERN_INDIGO_CONTENT',
      background: { color: config.colors.bg.main }
    });

    // タイトルスライド用マスター
    this.pptx.defineSlideMaster({
      title: 'MASTER_MODERN_INDIGO_TITLE',
      background: { color: config.colors.primary }
    });

    // セクションスライド（ダーク背景）用マスター
    this.pptx.defineSlideMaster({
      title: 'MASTER_MODERN_INDIGO_DARK',
      background: { color: config.colors.bg.dark }
    });
  }

  /**
   * エクスポート処理のエントリーポイント
   */
  public async export(slides: SlideData[]) {
    const config = this.getConfig();
    const theme = globalThemeRegistry.getTheme(this.options.themeName, this.options.palette);

    for (let i = 0; i < slides.length; i++) {
      const slideData = slides[i];

      // --- 動的レイアウト (Dynamic Slide) の処理 ---
      if (slideData.blocks && slideData.blocks.length > 0) {
        const dynamicRenderer = new DynamicSlideRenderer(this.pptx, config);
        await dynamicRenderer.render(slideData, i);
        continue; // レガシー処理をスキップ
      }

      // --- レガシー目的特化型 (Fallback) の処理 ---
      if (!theme) {
        console.warn('レガシーレイアウトは登録されたテーマのみ対応しています');
        continue;
      }
      
      const type = slideData.layout_type || slideData.type;
      const RendererClass = theme.registry.getRenderer(type);

      if (RendererClass) {
        const renderer = new RendererClass(this.pptx, theme.config);
        await renderer.render(slideData, i);
      } else {
        console.warn(`未対応のスライドタイプ: ${type} はフォールバックスライドとして出力されます。`);
        this.renderFallbackSlide(type);
      }
    }

    const fileName = this.options.fileName || 'Presentation.pptx';
    await this.pptx.writeFile({ fileName });
  }

  private renderFallbackSlide(type: string) {
    const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
    slide.addText(`[未対応スライド: ${type}]`, {
      x: '10%', y: '40%', w: '80%', h: 1,
      color: 'FF0000', fontSize: 24, align: 'center'
    });
  }
}
