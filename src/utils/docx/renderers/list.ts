import { Paragraph, TextRun } from 'docx';
import { parseRichText } from './text';

/**
 * リストブロックをWordの箇条書きまたは段落リストに変換する
 */
export function renderList(block: any): Paragraph[] {
  const items = block.items || [];
  const ordered = block.ordered || false;

  return items.map((item: any, index: number) => {
    const itemText = typeof item === 'string' ? item : (item?.text || '');
    const runs = parseRichText(itemText);
    
    if (ordered) {
      runs.unshift(new TextRun({ text: `${index + 1}. ` }));
    }

    return new Paragraph({
      // 箇条書き（Bullet）の場合は docx の組込 bullet 属性を使用
      bullet: ordered ? undefined : { level: 0 },
      children: runs,
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
