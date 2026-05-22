import { Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType } from 'docx';

/**
 * 簡易的な太字 (**) および <strong> タグのパースを行い、TextRun of 配列に変換する
 * 分割方式を採用し、正規表現ループのバグを排除した堅牢な実装
 */
export function parseRichText(text: string): TextRun[] {
  if (!text) return [];

  // 1. LLMのエスケープ改行 "\\n" を実際の "\n" に置換
  // 2. <strong> タグをマークダウンの ** に統一
  let normalized = text
    .replace(/\\n/g, '\n')
    .replace(/<strong>/g, '**')
    .replace(/<\/strong>/g, '**');

  // その他のHTMLタグ（あれば）を除去
  normalized = normalized.replace(/<[^>]+>/g, '');

  const runs: TextRun[] = [];
  const lines = normalized.split('\n');

  lines.forEach((line, lineIndex) => {
    // 2行目以降は段落内の改行(break)を挿入
    if (lineIndex > 0) {
      runs.push(new TextRun({ break: 1 }));
    }

    if (!line) return;

    const parts = line.split('**');
    parts.forEach((part, index) => {
      if (!part) return;
      
      // 奇数インデックス（1, 3, 5...）は ** で囲まれていた太字部分
      const isBold = index % 2 === 1;
      runs.push(
        new TextRun({
          text: part,
          bold: isBold,
          font: isBold ? { ascii: 'Yu Gothic', eastAsia: '游ゴシック' } : undefined,
        })
      );
    });
  });

  if (runs.length === 0) {
    runs.push(new TextRun({ text }));
  }

  return runs;
}

/**
 * リッチテキストブロックをWordの段落（またはお知らせボックス用の表）に変換する
 */
export function renderRichText(block: any, meta?: any): (Paragraph | Table)[] {
  const textContent = block.text || '';
  const isLetter = meta?.template === 'letter';
  const titleText = block.title || ''; // ブロックに直接定義されているタイトルプロパティを取得

  // バリアント（お知らせボックスなど）のスタイリング再現
  const validVariants = ['notice-box', 'notice-dash', 'notice-side'];
  if (block.variant && validVariants.includes(block.variant)) {
    let borderColor = '0066CC'; // info: 青
    let bgColor = 'F0F8FF';

    if (isLetter) {
      // ビジネスレターの場合は常に白黒基調（黒ボーダー、背景白）
      borderColor = '1A1A1A';
      bgColor = 'FFFFFF';
    } else {
      if (block.variant === 'warning') {
        borderColor = 'FF9900'; // warning: オレンジ
        bgColor = 'FFFDF0';
      } else if (block.variant === 'success') {
        borderColor = '33CC66'; // success: 緑
        bgColor = 'F0FFF4';
      }
    }

    const cellChildren: Paragraph[] = [];

    // 1. タイトルがある場合（中央揃え・太字）
    if (titleText) {
      cellChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: titleText,
              bold: true,
              size: 22, // 11pt相当
              color: isLetter ? '1A1A1A' : borderColor,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 120,
            after: 80,
          },
        })
      );

      // タイトルが存在する場合、自動的に下に区切り水平線を引く
      cellChildren.push(
        new Paragraph({
          border: {
            top: { style: BorderStyle.SINGLE, size: 4, color: isLetter ? 'B0B8C1' : borderColor },
          },
          spacing: { before: 60, after: 120 },
        })
      );
    }

    // 2. 本文がある場合（左揃え・部分的な太字パース対応）
    if (textContent) {
      const bodyRuns = parseRichText(textContent);
      cellChildren.push(
        new Paragraph({
          children: bodyRuns,
          alignment: AlignmentType.LEFT,
          spacing: {
            before: 80,
            after: 120,
          },
        })
      );
    }

    // 全周囲に枠線を引いた1セルテーブルとして表現
    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: cellChildren,
                shading: { fill: bgColor },
                margins: { top: 180, bottom: 180, left: 240, right: 240 },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 16, color: borderColor },
                  bottom: { style: BorderStyle.SINGLE, size: 16, color: borderColor },
                  left: { style: BorderStyle.SINGLE, size: 16, color: borderColor },
                  right: { style: BorderStyle.SINGLE, size: 16, color: borderColor },
                },
              }),
            ],
          }),
        ],
      }),
    ];
  }

  // 通常の段落
  const paragraphs: (Paragraph | Table)[] = [];
  
  if (titleText) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: titleText, bold: true })],
        spacing: { before: 120, after: 60 },
      })
    );
  }

  const runs = parseRichText(textContent);
  paragraphs.push(
    new Paragraph({
      children: runs,
      spacing: { before: 120, after: 120 },
    })
  );

  return paragraphs;
}
