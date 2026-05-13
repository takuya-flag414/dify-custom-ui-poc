import pptxgen from 'pptxgenjs';
import { ExportOptions, SlideData } from './types';
import { globalThemeRegistry } from './core/Registry';

/**
 * PPTX変換を行う新しいコアエンジンクラス
 */
export class PptxExportEngine {
  private pptx: pptxgen;
  private options: ExportOptions;

  constructor(options: ExportOptions) {
    this.options = options;

    const theme = globalThemeRegistry.getTheme(options.themeName, options.palette);
    if (!theme) {
      throw new Error(`対象外テーマエラー: 現在のテーマ「${options.themeName}」はエクスポートに対応していません。`);
    }

    this.pptx = new pptxgen();
    this.pptx.layout = 'LAYOUT_16x9';

    // マスターレイアウト定義 (テーマ固有の設定を使用)
    this.defineMasterLayouts(theme.config);
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
    const theme = globalThemeRegistry.getTheme(this.options.themeName, this.options.palette);
    if (!theme) return;

    for (let i = 0; i < slides.length; i++) {
      const slideData = slides[i];
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
