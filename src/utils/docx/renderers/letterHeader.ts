import { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle, AlignmentType } from 'docx';

/**
 * ビジネスレター（警告書など）のヘッダーブロックをWordの編集可能なネイティブ要素（宛名左寄せ・差出人右寄せ・件名中央揃え）に変換する
 */
export function renderLetterHeader(block: any): (Table | Paragraph)[] {
  const meta = block.meta || {};
  const title = meta.title || '無題のドキュメント';
  const date = meta.date || '';
  const refNo = meta.refNo || '';
  const recipient = meta.recipient || null;
  const sender = meta.sender || null;

  const fontSetting = { ascii: 'Yu Gothic', eastAsia: '游ゴシック' };
  const elements: (Table | Paragraph)[] = [];

  // ① 文書番号と日付（右寄せ段落）
  if (refNo) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: refNo,
            size: 19, // 9.5pt
            color: '333333',
            font: fontSetting,
          }),
        ],
        spacing: { after: 60 },
      })
    );
  }

  if (date) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: date,
            size: 19, // 9.5pt
            color: '333333',
            font: fontSetting,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // ② 宛名（左）と差出人（右）のテーブル配置 (ボーダー非表示)
  const addressRows: TableRow[] = [];
  const recipientParagraphs: Paragraph[] = [];
  const senderParagraphs: Paragraph[] = [];

  // 宛名情報の生成
  if (recipient) {
    if (typeof recipient === 'string') {
      recipientParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: recipient,
              size: 20, // 10pt
              font: fontSetting,
            }),
          ],
        })
      );
    } else {
      if (recipient.postal) {
        recipientParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: recipient.postal,
                size: 20, // 10pt
                font: fontSetting,
              }),
            ],
            spacing: { after: 40 },
          })
        );
      }
      if (recipient.address) {
        recipientParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: recipient.address,
                size: 20, // 10pt
                font: fontSetting,
              }),
            ],
            spacing: { after: 40 },
          })
        );
      }
      if (recipient.company) {
        recipientParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: recipient.company,
                size: 20, // 10pt
                font: fontSetting,
              }),
            ],
            spacing: { after: 80 },
          })
        );
      }
      if (recipient.name) {
        recipientParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: recipient.name,
                size: 22, // 11pt
                bold: true,
                underline: {
                  type: 'single' as any,
                  color: '1A1A1A',
                },
                font: fontSetting,
              }),
            ],
          })
        );
      }
    }
  }

  // 差出人情報の生成
  if (sender) {
    if (typeof sender === 'string') {
      senderParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: sender,
              size: 20, // 10pt
              font: fontSetting,
            }),
          ],
        })
      );
    } else {
      if (sender.postal) {
        senderParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: sender.postal,
                size: 20, // 10pt
                font: fontSetting,
              }),
            ],
            spacing: { after: 40 },
          })
        );
      }
      if (sender.address) {
        senderParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: sender.address,
                size: 20, // 10pt
                font: fontSetting,
              }),
            ],
            spacing: { after: 40 },
          })
        );
      }
      if (sender.company) {
        senderParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: sender.company,
                size: 20, // 10pt
                bold: true,
                font: fontSetting,
              }),
            ],
            spacing: { after: 40 },
          })
        );
      }
      if (sender.department) {
        senderParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: sender.department,
                size: 20, // 10pt
                font: fontSetting,
              }),
            ],
          })
        );
      }
    }
  }

  // 宛名段落を順に追加
  if (recipientParagraphs.length > 0) {
    elements.push(...recipientParagraphs);
  }

  // 宛名と差出人の間の段落空間
  elements.push(
    new Paragraph({
      spacing: { after: 240 },
    })
  );

  // 差出人段落を順に追加
  if (senderParagraphs.length > 0) {
    elements.push(...senderParagraphs);
  }

  // 差し込みのスペース
  elements.push(
    new Paragraph({
      spacing: { after: 360 },
    })
  );

  // ③ 件名（テーブルを使って幅を80%に制限し、中央の短い下線を実現）
  elements.push(
    new Table({
      alignment: AlignmentType.CENTER,
      width: { size: 80, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: title,
                      size: 30, // 15pt
                      bold: true,
                      color: '1A1A1A',
                      font: fontSetting,
                    }),
                  ],
                }),
              ],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.SINGLE, size: 12, color: '1A1A1A' }, // 1.5pt 黒の美しい下線
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              margins: { top: 120, bottom: 120, left: 120, right: 120 },
            }),
          ],
        }),
      ],
    })
  );

  // 件名の後の余白段落を追加 (以前の after: 480 相当の空間を確保)
  elements.push(
    new Paragraph({
      spacing: { before: 240, after: 240 },
    })
  );

  return elements;
}
