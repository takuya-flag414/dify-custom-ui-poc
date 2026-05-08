// src/components/Artifacts/JsonSlide/slides/TableSlide.jsx
// 表スライド: コーポレート・プロフェッショナルなテーブル表示（マルチレイアウト対応）
import React from 'react';
import { motion } from 'framer-motion';

// レイアウト崩壊防止のためのハード制限
const MAX_COLUMNS = 8;
const MAX_ROWS = 10;

/**
 * TableSlide - タイトル + テーブル (+ 説明文)
 * @param {Object} content - { title, headers, rows, description, layout_variation }
 * @param {boolean} isStatic - アニメーション無効化
 */
const TableSlide = ({ content, isStatic = false }) => {
    const { 
        title, 
        headers: rawHeaders, 
        rows: rawRows, 
        description, 
        layout_variation = 'default' 
    } = content || {};

    // 安全なデータ取得（Null安全 + 制限適用）
    const headers = Array.isArray(rawHeaders) ? rawHeaders.slice(0, MAX_COLUMNS) : [];
    const rows = Array.isArray(rawRows) ? rawRows.slice(0, MAX_ROWS).map(row =>
        Array.isArray(row) ? row.slice(0, MAX_COLUMNS) : []
    ) : [];

    if (headers.length === 0 && rows.length === 0) {
        return (
            <div className="json-slide-layout json-slide-table corporate-style">
                <div className="agenda-corporate-header">
                    <div className="agenda-accent-bar" />
                    <h2 className="agenda-corporate-title">{title || 'テーブル'}</h2>
                </div>
                <div className="table-corporate-wrapper">
                    <p className="slide-body-text" style={{ padding: '4cqi', textAlign: 'center' }}>
                        表データがありません
                    </p>
                </div>
            </div>
        );
    }

    // テーブルコンポーネントを共通化
    const TableComponent = () => (
        <div className="table-corporate-wrapper">
            <div className="table-corporate-scrollbox">
                <table className="table-corporate-main">
                    {headers.length > 0 && (
                        <thead className="table-corporate-thead">
                            <tr>
                                {headers.map((header, idx) => (
                                    <th key={idx}>{header ?? ''}</th>
                                ))}
                            </tr>
                        </thead>
                    )}
                    <tbody className="table-corporate-tbody">
                        {rows.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                                {row.map((cell, cellIdx) => (
                                    <td key={cellIdx}>{cell ?? ''}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="json-slide-layout json-slide-table corporate-style">
            {/* ヘッダー */}
            <motion.div 
                className="agenda-corporate-header"
                {...(!isStatic && {
                    initial: { opacity: 0, x: -20 },
                    animate: { opacity: 1, x: 0 },
                    transition: { duration: 0.5 }
                })}
            >
                <div className="agenda-accent-bar" />
                <h2 className="agenda-corporate-title">{title || 'テーブル'}</h2>
            </motion.div>

            {/* ボディエリア */}
            <motion.div 
                className="table-corporate-body-area"
                {...(!isStatic && {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: 0.2, duration: 0.5 }
                })}
            >
                {layout_variation === 'two-column' ? (
                    /* 2カラムレイアウト */
                    <div className="table-corporate-layout-two-column">
                        {description && (
                            <div className="table-corporate-desc-pane">
                                {description}
                            </div>
                        )}
                        <div className="table-corporate-table-pane">
                            <TableComponent />
                        </div>
                    </div>
                ) : (
                    /* 標準 または 下部説明レイアウト */
                    <>
                        <TableComponent />
                        {layout_variation === 'bottom-desc' && description && (
                            <div className="table-corporate-desc-bottom">
                                {description}
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default TableSlide;
