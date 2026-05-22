import { Paragraph, HeadingLevel, TextRun, BorderStyle, UnderlineType } from 'docx';

/**
 * 見出しブロックを Word のネイティブ見出し要素または書式付き段落に変換する
 */
export function renderHeading(block: any, meta?: any): Paragraph[] {
  const isLetter = meta?.template === 'letter';

  if (isLetter) {
    // ビジネスレターの場合：白黒基調、見出しレベルに応じたサイズ指定
    // Wordの組み込み見出しスタイルの強制適用を避けるため、カスタム段落として構成
    const fontSize = block.level === 2 ? 24 : 20; // 12pt (size:24) または 10pt (size:20)

    // レター用見出し2（H2）の下に段落幅の下線を引く（UIの再現）
    const border = block.level === 2 ? {
      bottom: { style: BorderStyle.SINGLE, size: 12, color: '1A1A1A' } // 1.5ptの黒線
    } : undefined;

    return [
      new Paragraph({
        children: [
          new TextRun({
            text: block.text || '',
            bold: true,
            size: fontSize,
            color: '1A1A1A', // 黒
          }),
        ],
        border: border,
        spacing: {
          before: 240, // 段落前の余白 (12pt)
          after: 120,  // 段落後の余白 (6pt)
        },
        keepNext: true, // 見出しの孤立防止
      }),
    ];
  }

  // レポートの場合：Document側で定義したグローバルスタイル（Heading1, Heading2等）を使用
  const levelMap = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5,
    6: HeadingLevel.HEADING_6,
  };

  const headingLevel = levelMap[block.level] || HeadingLevel.HEADING_2;

  return [
    new Paragraph({
      text: block.text || '',
      heading: headingLevel,
    }),
  ];
}
