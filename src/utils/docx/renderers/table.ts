import { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle } from 'docx';

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
            children: [new TextRun({ text: cellText, bold: true })],
          }),
        ],
        shading: { fill: 'F2F2F2' }, // ヘッダー背景色（薄いグレー）
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
            children: [new TextRun({ text: cellText })],
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
      // 表の境界線（細いグレーの罫線）
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'D3D3D3' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D3D3D3' },
        left: { style: BorderStyle.SINGLE, size: 4, color: 'D3D3D3' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'D3D3D3' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E0E0E0' },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E0E0E0' },
      },
    }),
  ];
}
