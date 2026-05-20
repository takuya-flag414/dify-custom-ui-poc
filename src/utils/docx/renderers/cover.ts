import { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle, AlignmentType } from 'docx';

/**
 * 表紙ブロックをWordの編集可能なネイティブ要素（中央揃え・水平罫線の王道ビジネス仕様）に変換する
 */
export function renderCover(block: any): (Table | Paragraph)[] {
  const meta = block.meta || {};
  const title = meta.title || '無題のドキュメント';
  const subtitle = meta.subtitle || '';
  const author = meta.author || '';
  const date = meta.date || '';
  const org = meta.org || 'SEIHOKU INDUSTRIES';
  const label = meta.label || 'MONTHLY REPORT';
  const year = meta.year || '2026';

  // 将来のビジネスレター用追加項目 (受け取るが、現在は要素に追加しない)
  const recipient = meta.recipient || '';
  const senderDetails = meta.senderDetails || '';
  const refNo = meta.refNo || '';
  const salutation = meta.salutation || '';
  const complimentaryClose = meta.complimentaryClose || '';

  // 統一フォント設定 (半角英数は Yu Gothic, 日本語は 游ゴシック)
  const fontSetting = { ascii: 'Yu Gothic', eastAsia: '游ゴシック' };
  const elements: (Table | Paragraph)[] = [];

  // ① 組織名 (右寄せ / 9pt / #888888 / 大文字)
  elements.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: org.toUpperCase(),
          size: 18, // 9pt
          color: '888888',
          bold: true,
          font: fontSetting,
        }),
      ],
      spacing: { after: 2400 }, // タイトルブロックまでの上部空間 (約4.2cm)
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
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${year} / ${label.toUpperCase()}`,
          size: 22, // 11pt
          color: '1E3A8A',
          bold: true,
          font: fontSetting,
        }),
      ],
      spacing: { after: 400 },
    })
  );

  // ④ メインタイトル (28pt / #1A1A1A / 太字)
  const titleSpacingAfter = subtitle ? 200 : 0;
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: title,
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
  if (subtitle) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: subtitle,
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
      spacing: { after: 4500 }, // フッターまでの下部空間 (約8.0cm)
    })
  );

  // ⑦ フッター情報 (中央寄せの2列テーブル / 枠線なし)
  if (date || author) {
    const footerRows: TableRow[] = [];

    if (date) {
      footerRows.push(
        new TableRow({
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
                      text: date, 
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

    if (author) {
      footerRows.push(
        new TableRow({
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
                      text: author, 
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
