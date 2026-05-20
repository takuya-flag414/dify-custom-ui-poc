import { Paragraph, TextRun } from 'docx';
import { renderHeading } from './heading';
import { renderRichText } from './text';
import { renderList } from './list';
import { renderTable } from './table';
import { renderImageBlock } from './imageBlock';
import { renderTOC } from './toc';
import { renderCover } from './cover';
import { renderLetterHeader } from './letterHeader';

/**
 * ブロックの種類（heading, rich_text, table, list, cover, chart, svg, toc, letter_header）
 * に応じて適切なWord要素を生成して返す（全機能有効版）
 */
export async function dispatchRenderer(
  block: any,
  pageIndex: number,
  blockIndex: number,
  imageCache: Map<string, string>,
  meta?: any
): Promise<any[] | null> {
  switch (block.type) {
    case 'heading':
      return renderHeading(block, meta);
    case 'rich_text':
      return renderRichText(block, meta);
    case 'list':
      return renderList(block);
    case 'table':
      return renderTable(block);
    case 'cover':
      return renderCover(block);
    case 'letter_header':
      return renderLetterHeader(block);
    case 'page_break':
      return []; // builder.tsのページ境界で自動改ページされるため、ここでは空配列を返却
    case 'chart':
    case 'svg':
      return renderImageBlock(block, pageIndex, blockIndex, imageCache);
    case 'toc':
      return renderTOC(block);
    default:
      console.warn(`Unknown block type: ${block.type}`);
  }

  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `[未実装ブロック: ${block.type}]`,
          color: 'FF0000',
        }),
      ],
    }),
  ];
}
