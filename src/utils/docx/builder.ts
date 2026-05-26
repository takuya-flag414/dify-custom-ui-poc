import { Document, Paragraph, PageBreak, BorderStyle, Table } from 'docx';
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
          // 直前の最終要素が Table で、今回追加する最初の要素も Table の場合、
          // Wordの自動テーブル結合を回避するために空の段落（スペーサー段落）を挟み込む
          if (
            documentChildren.length > 0 &&
            documentChildren[documentChildren.length - 1] instanceof Table &&
            renderedElements[0] instanceof Table
          ) {
            documentChildren.push(
              new Paragraph({
                spacing: { before: 120, after: 120 },
              })
            );
          }
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
              spacing: { line: 384, after: 120 }, // 1.6倍の行間、段落後の余白
            },
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              size: {
                width: 11906, // A4 width (210mm)
                height: 16838, // A4 height (297mm)
              },
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
