import React from 'react';

interface Props {
    headers: string[];
    rows: string[][];
    emphasis_row?: number;
}

export const SlideTable: React.FC<Props> = ({ headers, rows, emphasis_row }) => {
    return (
        <div className="slide-block slide-table-wrapper">
            <table className="slide-table">
                <thead>
                    <tr>
                        {headers.map((h, i) => <th key={i}>{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className={i === emphasis_row ? 'row-emphasis' : ''}>
                            {row.map((cell, j) => <td key={j}>{cell}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
