import { Paragraph, TextRun } from 'docx';

/**
 * リストブロックをWordの箇条書きまたは段落リストに変換する
 */
export function renderList(block: any): Paragraph[] {
  const items = block.items || [];
  const ordered = block.ordered || false;

  return items.map((item: any, index: number) => {
    const itemText = typeof item === 'string' ? item : (item?.text || '');
    return new Paragraph({
      // 箇条書き（Bullet）の場合は docx の組込 bullet 属性を使用
      bullet: ordered ? undefined : { level: 0 },
      // 番号付きリストの場合は docx の単純化のためテキストの先頭に数値を付与
      children: [
        new TextRun({
          text: ordered ? `${index + 1}. ${itemText}` : itemText,
        }),
      ],
      spacing: {
        before: 60,
        after: 60,
      },
      indent: {
        left: 360, // リストの左側インデント (18pt)
      },
    });
  });
}
