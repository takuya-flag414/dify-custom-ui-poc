import { ThemeConfig } from '../types';

/**
 * テキスト処理（Markdown/HTML解析）を担当するクラス
 */
export class TextProcessor {
  private config: ThemeConfig;

  constructor(config: ThemeConfig) {
    this.config = config;
  }

  /**
   * Markdown記法とHTMLタグの両方を除去する
   */
  public stripFormatting(text: string): string {
    if (!text) return "";
    return text
      .replace(/\\n|¥n|<br\s*\/?>/g, '\n')          // 文字列としての改行を実際の改行に変換
      .replace(/<span[^>]*>(.*?)<\/span>/g, '$1')   // spanタグの中身だけ残す
      .replace(/<[^>]*>/g, "")                      // その他のHTMLタグを除去
      .replace(/\*\*(.*?)\*\*/g, "$1")               // 太字
      .replace(/__(.*?)__/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")                  // 斜体
      .replace(/_(.*?)_/g, "$1")
      .replace(/~~(.*?)~~/g, "$1")                  // 打ち消し線
      .replace(/`(.*?)`/g, "$1")                    // インラインコード
      .replace(/[#>]/g, "");                        // その他記号
  }

  /**
   * テキスト内の基本的なHTMLタグやMarkdownを解析し、PptxGenJSのテキストオブジェクト配列に変換する
   * @param text 対象テキスト
   * @param baseOptions ベースとなるオプション
   * @param ignoreColor 色指定を無視するかどうか
   */
  public parseRichText(text: string, baseOptions: any = {}, ignoreColor: boolean = false): any[] {
    if (!text) return [];

    // 改行コードの正規化
    let processed = text.replace(/\\n|¥n|<br\s*\/?>/g, '\n');

    // ベースオプションの統合設定
    const currentBaseOptions = {
      fontFace: this.config.fonts.face,
      fontSize: this.config.fonts.body,
      color: this.config.colors.text.body,
      ...baseOptions
    };

    // 見出し記法のチェック
    const headingMatch = processed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      processed = headingMatch[2];
      currentBaseOptions.bold = true;
      const baseSize = baseOptions.fontSize || this.config.fonts.body;
      currentBaseOptions.fontSize = Math.max(baseSize, baseSize + (4 - level) * 4);
      if (!ignoreColor) {
        currentBaseOptions.color = this.config.colors.text.header;
      }
    }

    const regex = /(<span[^>]*>.*?<\/span>|\*\*.*?\*\*)/g;
    const parts: any[] = [];
    const segments = processed.split(regex);

    segments.forEach(segment => {
      if (!segment) return;

      if (segment.startsWith('<span')) {
        const tagMatch = segment.match(/<span([^>]*)>(.*?)<\/span>/);
        if (tagMatch) {
          const attributes = tagMatch[1];
          const content = tagMatch[2];
          const options = { ...currentBaseOptions };

          if (!ignoreColor) {
            if (attributes.includes('text-primary') || attributes.includes('--slide-primary')) {
              options.color = this.config.colors.primary;
            } else {
              const colorMatch = attributes.match(/color:\s*#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})/);
              if (colorMatch) {
                let hex = colorMatch[1];
                if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
                options.color = hex.toUpperCase();
              }
            }
          }

          if (attributes.includes('text-decoration: underline') || attributes.includes('underline')) {
            options.underline = true;
          }

          if (attributes.includes('font-weight: bold') || attributes.includes('bold')) {
            options.bold = true;
          }

          parts.push({
            text: this.stripFormatting(content),
            options: options
          });
        } else {
          parts.push({ text: this.stripFormatting(segment), options: currentBaseOptions });
        }
      } else if (segment.startsWith('**')) {
        const content = segment.replace(/\*\*(.*?)\*\*/, '$1');
        parts.push({
          text: this.stripFormatting(content),
          options: { ...currentBaseOptions, bold: true }
        });
      } else {
        parts.push({
          text: this.stripFormatting(segment),
          options: currentBaseOptions
        });
      }
    });

    return parts;
  }
}
