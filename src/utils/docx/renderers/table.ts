import { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle } from 'docx';
import { parseRichText } from './text';

/**
 * 表ブロックをWordのネイティブテーブル要素に変換する
 */
export function renderTable(block: any): Table[] {
  const rows = block.rows || [];
  const headerRow = block.headers || [];
  const tableRows: TableRow[] = [];

  // 1. ヘッダー行の作成
  if (headerRow.length > 0) {
    const cells = headerRow.map((cell: any) => {
      let cellText = '';
      if (typeof cell === 'string') {
        cellText = cell;
      } else if (cell && typeof cell === 'object') {
        cellText = cell.text || '';
      }

      return new TableCell({
        children: [
          new Paragraph({
            children: parseRichText(cellText).map(run => {
              run.bold = true;
              run.font = { ascii: 'Yu Gothic', eastAsia: '游ゴシック' }; // ヘッダーはゴシック体
              return run;
            }),
          }),
        ],
        shading: { fill: 'F8FAFC' }, // ヘッダー背景色（薄いグレーブルー）
        margins: { top: 100, bottom: 100, left: 150, right: 150 },
      });
    });

    if (cells.length > 0) {
      tableRows.push(new TableRow({ children: cells, tableHeader: true }));
    }
  }

  // 2. データ行の作成
  rows.forEach((row: any) => {
    // row が配列（["セル1", "セル2"]）か、オブジェクト（row.cells）かでフォールバック
    let cellsData: any[] = [];
    if (Array.isArray(row)) {
      cellsData = row;
    } else if (row && Array.isArray(row.cells)) {
      cellsData = row.cells;
    }

    const cells = cellsData.map((cell: any) => {
      let cellText = '';
      let colSpan: number | undefined = undefined;

      if (typeof cell === 'string') {
        cellText = cell;
      } else if (cell && typeof cell === 'object') {
        cellText = cell.text || '';
        colSpan = cell.colSpan;
      }

      return new TableCell({
        children: [
          new Paragraph({
            children: parseRichText(cellText),
          }),
        ],
        margins: { top: 100, bottom: 100, left: 150, right: 150 },
        columnSpan: colSpan && colSpan > 1 ? colSpan : undefined,
      });
    });

    // セルが1つ以上存在する場合のみ行を追加（Wordの破損防止）
    if (cells.length > 0) {
      tableRows.push(new TableRow({ children: cells }));
    }
  });

  // テーブル全体にデータが全く無い場合は、空のテーブルを作らずダミーテキストを返す（破損防止）
  if (tableRows.length === 0) {
    return [];
  }

  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
      // 表の境界線（グレーの罫線 #B0B8C1 に統一）
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'B0B8C1' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'B0B8C1' },
        left: { style: BorderStyle.SINGLE, size: 4, color: 'B0B8C1' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'B0B8C1' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'B0B8C1' },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'B0B8C1' },
      },
    }),
  ];
}
