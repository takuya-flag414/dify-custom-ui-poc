import { Document, Paragraph, PageBreak } from 'docx';
import { dispatchRenderer } from './renderers/index';

/**
 * Wordドキュメントを組み立てるビルダー
 */
export class DocxBuilder {
  /**
   * ページ配列からWordドキュメントを構築する
   * @param pages ページの2次元配列
   * @param title タイトル
   * @param imageCache 画像キャッシュ
   * @param meta メタデータ
   */
  public async build(
    pages: any[][],
    title: string,
    imageCache: Map<string, string>,
    meta?: any
  ): Promise<Document> {
    const documentChildren: any[] = [];

    // 各ページごとにループ処理
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const pageBlocks = pages[pageIndex];

      for (let blockIndex = 0; blockIndex < pageBlocks.length; blockIndex++) {
        const block = pageBlocks[blockIndex];
        
        // 各ブロックタイプに応じたレンダラーを実行
        const renderedElements = await dispatchRenderer(block, pageIndex, blockIndex, imageCache, meta);
        if (renderedElements) {
          documentChildren.push(...renderedElements);
        }
      }

      // ページの末尾で改ページ（PageBreak）を挿入 (最終ページは除く)
      if (pageIndex < pages.length - 1) {
        documentChildren.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
      }
    }

    // 全ページ共通の標準余白（1440 dxa = 2.54cm）を設定したドキュメントオブジェクトを返却
    return new Document({
      creator: 'Dify Custom UI',
      title: title,
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,
                bottom: 1440,
                left: 1440,
                right: 1440,
              },
            },
          },
          children: documentChildren,
        },
      ],
    });
  }
}
