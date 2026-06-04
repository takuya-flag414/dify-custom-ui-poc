import { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle, AlignmentType } from 'docx';
import { createCoverViewModel } from '../../document/coverViewModel';

/**
 * 表紙ブロックをWordの編集可能なネイティブ要素（中央揃え・水平罫線の王道ビジネス仕様）に変換する
 */
export function renderCover(block: any): (Table | Paragraph)[] {
  const vm = createCoverViewModel(block?.meta);

  // 統一フォント設定 (半角英数は Yu Gothic, 日本語は 游ゴシック)
  const fontSetting = { ascii: 'Yu Gothic', eastAsia: '游ゴシック' };
  const elements: (Table | Paragraph)[] = [];

  // ① 組織名 (右寄せ / 9pt / #888888 / 大文字) または タイトルまでの上部余白
  elements.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: vm.org ? [
        new TextRun({
          text: vm.org.toUpperCase(),
          size: 18, // 9pt
          color: '888888',
          bold: true,
          font: fontSetting,
        }),
      ] : [],
      spacing: { before: 1200, after: 2400 }, // タイトルブロックまでの上部空間
    })
  );

  // ② 上境界仕切り線 (薄いグレーの細線 0.75pt)
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: 'B0B8C1' },
      },
      spacing: { after: 200 },
    })
  );

  // ③ 年度 & 分類ラベル (11pt / プライマリ色濃紺 #1E3A8A / 太字)
  if (vm.badgeText) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: vm.badgeText.toUpperCase(),
            size: 22, // 11pt
            color: '1E3A8A',
            bold: true,
            font: fontSetting,
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }

  // ④ メインタイトル (28pt / #1A1A1A / 太字)
  const titleSpacingAfter = vm.subtitle ? 200 : 0;
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: vm.title,
          size: 56, // 28pt
          color: '1A1A1A',
          bold: true,
          font: fontSetting,
        }),
      ],
      spacing: { after: titleSpacingAfter },
    })
  );

  // ⑤ サブタイトル (12pt / #555555 / 斜体)
  if (vm.subtitle) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: vm.subtitle,
            size: 24, // 12pt
            color: '555555',
            font: fontSetting,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // ⑥ 下境界仕切り線 (テーマカラーの太線 3.0pt = size 24)
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: {
        top: { style: BorderStyle.SINGLE, size: 24, color: '1E3A8A' },
      },
      spacing: { after: 3200 }, // フッターまでの下部空間 (1ページに収まるよう調整)
    })
  );

  // ⑦ フッター情報 (中央寄せの2列テーブル / 枠線なし)
  if (vm.hasFooter) {
    const footerRows: TableRow[] = [];

    if (vm.date) {
      footerRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ 
                      text: '発行日：', 
                      bold: true, 
                      size: 18, // 9pt
                      color: '888888', 
                      font: fontSetting,
                    })
                  ],
                }),
              ],
              width: { size: 2000, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({ 
                      text: vm.date, 
                      size: 18, // 9pt
                      color: '1A1A1A', 
                      font: fontSetting,
                    })
                  ],
                }),
              ],
              width: { size: 3000, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            }),
          ],
        })
      );
    }

    if (vm.author) {
      footerRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ 
                      text: '発行者：', 
                      bold: true, 
                      size: 18, // 9pt
                      color: '888888', 
                      font: fontSetting,
                    })
                  ],
                }),
              ],
              width: { size: 2000, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({ 
                      text: vm.author, 
                      size: 18, // 9pt
                      color: '1A1A1A', 
                      font: fontSetting,
                    })
                  ],
                }),
              ],
              width: { size: 3000, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            }),
          ],
        })
      );
    }

    const footerTable = new Table({
      alignment: AlignmentType.CENTER,
      width: { size: 5000, type: WidthType.DXA },
      rows: footerRows,
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
    });

    elements.push(footerTable);
  }

  return elements;
}
