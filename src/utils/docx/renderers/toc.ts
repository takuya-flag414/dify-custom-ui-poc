import { Paragraph, TextRun, Tab, HeadingLevel, TabStopType, AlignmentType, BorderStyle } from 'docx';

/**
 * 目次ブロックをWordのドットリーダー付き右揃え段落に変換する
 */
export function renderTOC(block: any): Paragraph[] {
  const entries = block.entries || [];
  const paragraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '目次',
          size: 32, // 16pt
          bold: true,
          font: { ascii: 'Yu Gothic', eastAsia: '游ゴシック' },
        })
      ],
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: '1E3A8A' },
      },
      spacing: { before: 240, after: 240 },
    }),
  ];

  entries.forEach((entry: any) => {
    // 見出しレベルに応じた字下げ（左インデント）を設定 (H1: 0, H2: 360, H3: 720)
    const indentLeft = Math.max(0, (entry.level - 1) * 360);

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: entry.text || '' }),
          new TextRun({
            children: [new Tab()], // ドットリーダーのためのタブ文字
          }),
          new TextRun({ text: String(entry.page || 1) }),
        ],
        // 右端（7200 dxa = 約12.7cm）にタブストップを設定し、ドットリーダーを指定
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: 7200,
            leader: 'dot' as any,
          },
        ],
        indent: { left: indentLeft },
        spacing: { before: 100, after: 100 },
      })
    );
  });

  return paragraphs;
}
