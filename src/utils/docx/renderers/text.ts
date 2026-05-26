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
    const variant = block.variant;
    const isLetter = meta?.template === 'letter';

    // デフォルトのボーダー色と背景色（CSSの定義に準拠）
    let borderColor = '1A1A1A'; // 標準は黒（#1A1A1A）
    let bgColor = 'FFFFFF';    // 標準は白

    // 各バリアントに応じたパラメータの調整
    let isCenter = false;
    let cellMargins = { top: 160, bottom: 160, left: 280, right: 280 }; // 1pt = 20 dxa. notice-box: 8pt/14pt -> 160/280 dxa
    let cellBorders: any = {
      top: { style: BorderStyle.SINGLE, size: 12, color: borderColor }, // 1.5pt
      bottom: { style: BorderStyle.SINGLE, size: 12, color: borderColor },
      left: { style: BorderStyle.SINGLE, size: 12, color: borderColor },
      right: { style: BorderStyle.SINGLE, size: 12, color: borderColor },
    };

    if (variant === 'notice-box') {
      isCenter = true; // タイトルは中央寄せ
      borderColor = '1A1A1A';
      bgColor = 'FFFFFF';
      cellBorders = {
        top: { style: BorderStyle.SINGLE, size: 12, color: borderColor },
        bottom: { style: BorderStyle.SINGLE, size: 12, color: borderColor },
        left: { style: BorderStyle.SINGLE, size: 12, color: borderColor },
        right: { style: BorderStyle.SINGLE, size: 12, color: borderColor },
      };
    } else if (variant === 'notice-dash') {
      isCenter = false; // タイトルは左寄せ
      borderColor = '1A1A1A';
      bgColor = 'FFFFFF';
      cellMargins = { top: 140, bottom: 140, left: 280, right: 280 }; // 7pt/14pt -> 140/280 dxa
      cellBorders = {
        top: { style: BorderStyle.DASHED, size: 8, color: borderColor }, // 1pt
        bottom: { style: BorderStyle.DASHED, size: 8, color: borderColor },
        left: { style: BorderStyle.DASHED, size: 8, color: borderColor },
        right: { style: BorderStyle.DASHED, size: 8, color: borderColor },
      };
    } else if (variant === 'notice-side') {
      isCenter = false; // タイトルは左寄せ
      borderColor = isLetter ? '1A1A1A' : '1E3A8A'; // 非レター時はプライマリーカラーのネイビー
      bgColor = 'FFFFFF';
      cellMargins = { top: 60, bottom: 60, left: 240, right: 0 }; // 3pt/12pt/0pt -> 60/240/0 dxa
      cellBorders = {
        top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        left: { style: BorderStyle.SINGLE, size: 24, color: borderColor }, // 左側のみ3pt
        right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      };
    }

    const cellChildren: Paragraph[] = [];

    // 1. タイトルがある場合（フォントサイズ9pt相当=18）
    if (titleText) {
      cellChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: titleText,
              bold: true,
              size: 18, // 9pt
              color: isLetter ? '1A1A1A' : (variant === 'notice-side' ? '1A1A1A' : borderColor),
            }),
          ],
          alignment: isCenter ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: {
            before: 60,
            after: variant === 'notice-box' ? 60 : 120,
          },
        })
      );

      // notice-box の場合のみ、タイトルの下に細い水平区切り線を引く
      if (variant === 'notice-box') {
        cellChildren.push(
          new Paragraph({
            border: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'B0B8C1' }, // 0.5pt相当の細い線
            },
            spacing: { before: 40, after: 120 },
          })
        );
      }
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

    // 各バリアントに応じた設定で1セルのテーブルとして表現
    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: cellChildren,
                shading: { fill: bgColor },
                margins: cellMargins,
                borders: cellBorders,
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
