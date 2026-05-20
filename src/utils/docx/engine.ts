import { saveAs } from 'file-saver';
import { Packer } from 'docx';
import { DocxExportOptions } from './types';
import { DocxBuilder } from './builder';
import { captureElementById } from './imageCapture';

/**
 * DOCXエクスポートの制御エンジンクラス
 */
export class DocxExportEngine {
  private options: DocxExportOptions;

  constructor(options: DocxExportOptions = {}) {
    this.options = options;
  }

  /**
   * エクスポート処理を実行し、ファイルを保存する
   * @param pages usePaginationから得られた各ページのブロックの2次元配列
   * @param title ドキュメントタイトル
   * @param meta 表紙用などのメタデータ
   */
  public async export(pages: any[][], title: string, meta?: any): Promise<void> {
    try {
      // 1. 画像キャプチャキャッシュの構築
      const imageCache = new Map<string, string>();
      
      // 画像キャプチャを必要とするブロックタイプ
      const imageTypes = ['chart', 'svg'];

      // 各ページのブロックをスキャン
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const pageBlocks = pages[pageIndex];
        for (let blockIndex = 0; blockIndex < pageBlocks.length; blockIndex++) {
          const block = pageBlocks[blockIndex];
          
          if (imageTypes.includes(block.type)) {
            // React側と一対一で対応するDOM IDを組み立て
            const elementId = `json-doc-block-${pageIndex}-${blockIndex}`;
            
            // DOMから非同期で画像をキャプチャ
            const dataUrl = await captureElementById(elementId);
            if (dataUrl) {
              imageCache.set(elementId, dataUrl);
            } else {
              console.warn(`Could not capture image for block ${block.type} at page ${pageIndex}, index ${blockIndex}`);
            }
          }
        }
      }

      // 2. ドキュメント構築 (画像キャッシュをビルダーに渡す)
      const builder = new DocxBuilder();
      const doc = await builder.build(pages, title, imageCache, meta);

      // 3. Packerを使用してBlobを生成
      const blob = await Packer.toBlob(doc);
      
      // 4. ファイル保存（禁則文字の除外処理を含む）
      const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_') || 'document';
      const fileName = this.options.fileName || `${safeTitle}.docx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Failed to export DOCX:', error);
      throw error;
    }
  }
}
