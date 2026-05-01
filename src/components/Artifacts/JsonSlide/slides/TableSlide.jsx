// src/components/Artifacts/JsonSlide/slides/TableSlide.jsx
// 表スライド: 比較表やデータ一覧を表示するレイアウト
// レイアウト崩壊防止: table-layout: fixed, セル省略, 列8/行10制限
import React from 'react';

// レイアウト崩壊防止のためのハード制限
const MAX_COLUMNS = 8;
const MAX_ROWS = 10;

/**
 * TableSlide - タイトル + テーブル
 * @param {Object} content - { title, headers, rows }
 * @param {boolean} isStatic - アニメーション無効化
 */
const TableSlide = ({ content, isStatic = false }) => {
    const { title, headers: rawHeaders, rows: rawRows } = content || {};

    // 安全なデータ取得（Null安全 + 制限適用）
    const headers = Array.isArray(rawHeaders) ? rawHeaders.slice(0, MAX_COLUMNS) : [];
    const rows = Array.isArray(rawRows) ? rawRows.slice(0, MAX_ROWS).map(row =>
        Array.isArray(row) ? row.slice(0, MAX_COLUMNS) : []
    ) : [];

    // ヘッダーも行もない場合はフォールバック
    if (headers.length === 0 && rows.length === 0) {
        return (
            <div className="json-slide-layout json-slide-content">
                <div className="content-slide-header">
                    <h2 className="slide-section-title">{title || 'テーブル'}</h2>
                    <div className="slide-title-underline" />
                </div>
                <div className="content-slide-body">
                    <p className="slide-body-text">表データがありません</p>
                </div>
            </div>
        );
    }

    return (
        <div className="json-slide-layout json-slide-table">
            {/* ヘッダー */}
            <div className="content-slide-header">
                <h2 className="slide-section-title">{title || 'テーブル'}</h2>
                <div className="slide-title-underline" />
            </div>

            {/* テーブル本体（スクロール可能なコンテナ） */}
            <div className="table-slide-body">
                <table className="slide-table">
                    {headers.length > 0 && (
                        <thead>
                            <tr>
                                {headers.map((header, idx) => (
                                    <th key={idx} className="slide-table-th">
                                        {header ?? ''}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                    )}
                    <tbody>
                        {rows.map((row, rowIdx) => (
                            <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'even-row' : 'odd-row'}>
                                {row.map((cell, cellIdx) => (
                                    <td key={cellIdx} className="slide-table-td">
                                        {cell ?? ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TableSlide;
