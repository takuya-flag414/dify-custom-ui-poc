import { Document, Paragraph, PageBreak, BorderStyle } from 'docx';
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
      styles: {
        paragraphStyles: [
          {
            id: 'Heading1',
            name: 'Heading 1',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: {
              font: { ascii: 'Yu Gothic', eastAsia: '游ゴシック' },
              size: 40, // 20pt
              bold: true,
              color: '000000',
            },
            paragraph: {
              spacing: { before: 360, after: 180 },
              keepNext: true,
            },
          },
          {
            id: 'Heading2',
            name: 'Heading 2',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: {
              font: { ascii: 'Yu Gothic', eastAsia: '游ゴシック' },
              size: 28, // 14pt
              bold: true,
              color: '000000',
            },
            paragraph: {
              spacing: { before: 480, after: 240 },
              keepNext: true,
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 12, color: '1E3A8A' }, // 1.5ptの下線
              },
            },
          },
          {
            id: 'Heading3',
            name: 'Heading 3',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: {
              font: { ascii: 'Yu Gothic', eastAsia: '游ゴシック' },
              size: 23, // 11.5pt
              bold: true,
              color: '000000',
            },
            paragraph: {
              spacing: { before: 320, after: 160 },
              keepNext: true,
            },
          },
          {
            id: 'Normal',
            name: 'Normal',
            quickFormat: true,
            run: {
              font: { ascii: 'Yu Mincho', eastAsia: '游明朝' }, // 本文は明朝体
              size: 21, // 10.5pt
              color: '1A1A1A',
            },
            paragraph: {
              lineSpacing: { line: 384 }, // 1.6倍
              spacing: { after: 120 },
            },
          },
        ],
      },
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
