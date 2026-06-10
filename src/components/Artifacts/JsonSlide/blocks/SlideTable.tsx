import React from 'react';

interface Props {
    headers: string[];
    rows: string[][];
    emphasis_row?: number;
    emphasis_cells?: [number, number][]; // [[row_idx, col_idx], ...] の座標配列
    emphasis_box?: {
        start_row: number;
        end_row: number;
        start_col: number;
        end_col: number;
    }; // グルーピング強調用のボックス座標
}

export const SlideTable: React.FC<Props> = ({ 
    headers, 
    rows, 
    emphasis_row, 
    emphasis_cells = [], 
    emphasis_box 
}) => {
    // 各セルのスタイル（個別強調・グルーピング外枠線）を動的に計算するヘルパー
    const getCellStyle = (rowIdx: number, colIdx: number): React.CSSProperties => {
        const style: React.CSSProperties = {};
        
        // 1. 個別セルの強調判定 (フォントを太字にし、極薄いプライマリ色を背景に適用)
        const isCellHighlighted = emphasis_cells?.some(
            coords => Array.isArray(coords) && coords[0] === rowIdx && coords[1] === colIdx
        );
        if (isCellHighlighted) {
            style.fontWeight = 'bold';
            style.backgroundColor = 'var(--bg-table-highlight-cell, rgba(0, 32, 91, 0.05))';
        }
        
        // 2. コールアウト枠線（グルーピング）の判定
        if (emphasis_box) {
            const { start_row, end_row, start_col, end_col } = emphasis_box;
            const isInBox = rowIdx >= start_row && rowIdx <= end_row && colIdx >= start_col && colIdx <= end_col;
            
            if (isInBox) {
                // ボックス内セルの共通背景色 (非常に薄いアクセント色)
                style.backgroundColor = 'var(--bg-table-highlight-box, rgba(225, 29, 72, 0.04))';
                
                // コールアウト枠の境界線を適用 (太さ3pxのアクセントカラー赤系)
                const borderStyle = '3px solid var(--accent-color, #e11d48)';
                if (rowIdx === start_row) style.borderTop = borderStyle;
                if (rowIdx === end_row) style.borderBottom = borderStyle;
                if (colIdx === start_col) style.borderLeft = borderStyle;
                if (colIdx === end_col) style.borderRight = borderStyle;
            }
        }
        
        return style;
    };

    return (
        <div className="slide-block slide-table-wrapper">
            <table className="slide-table">
                <thead>
                    <tr>
                        {headers.map((h, i) => <th key={i}>{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => {
                        const isRowEmphasized = i === emphasis_row;
                        return (
                            <tr key={i} className={isRowEmphasized ? 'row-emphasis' : ''}>
                                {row.map((cell, j) => {
                                    const cellStyle = getCellStyle(i, j);
                                    return (
                                        <td 
                                            key={j} 
                                            style={cellStyle}
                                            className={cellStyle.backgroundColor ? 'has-highlight-bg' : ''}
                                        >
                                            {cell}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
