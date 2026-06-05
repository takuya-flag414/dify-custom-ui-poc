// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/TableSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

const MAX_COLUMNS = 8;
const MAX_ROWS = 12;

const TableSlide = ({ content, isStatic = false }) => {
    const {
        title,
        headers: rawHeaders = [],
        rows: rawRows = [],
        description,
        layout_variation = 'default',
        annotations = []
    } = content || {};

    const headers = Array.isArray(rawHeaders) ? rawHeaders.slice(0, MAX_COLUMNS) : [];
    const rows = Array.isArray(rawRows) ? rawRows.slice(0, MAX_ROWS).map(row =>
        Array.isArray(row) ? row.slice(0, MAX_COLUMNS) : []
    ) : [];

    // 極限まで削ぎ落としたミニマリスト・テーブルコンポーネント
    const TableComponent = () => (
        <div className="w-full overflow-hidden">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'auto' }}>
                <thead>
                    <tr>
                        {headers.map((header, idx) => (
                            <th key={idx} style={{
                                padding: '1cqi 1.5cqi',
                                borderTop: '2px solid var(--slide-primary)',
                                borderBottom: '1px solid var(--slide-heading)',
                                fontSize: '1.2cqi',
                                color: '#64748B',
                                fontWeight: 800,
                                letterSpacing: '0.05em',
                                verticalAlign: 'bottom',
                                whiteSpace: 'nowrap' // ヘッダーの意図しない改行を防ぐ
                            }}>
                                <SlideMarkdown content={header} inline />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <motion.tr
                            key={rowIndex}
                            initial={!isStatic ? { opacity: 0, y: 5 } : {}}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 + (rowIndex * 0.05) }}
                            style={{
                                borderBottom: rowIndex === rows.length - 1 ? '2px solid #CBD5E1' : '1px solid #E2E8F0'
                            }}
                        >
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex} style={{
                                    padding: '1.4cqi 1.5cqi',
                                    fontSize: '1.4cqi',
                                    color: 'var(--slide-body)',
                                    lineHeight: 1.5,
                                    verticalAlign: 'top',
                                    // 1列目（項目名など）は原則折り返さずシャープに見せる
                                    whiteSpace: cellIndex === 0 ? 'nowrap' : 'normal'
                                }}>
                                    <SlideMarkdown content={cell} inline />
                                </td>
                            ))}
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    // 示唆（Description）コンポーネント
    const DescriptionComponent = () => (
        <motion.div
            style={{
                borderLeft: '4px solid var(--slide-primary)',
                paddingLeft: '1.5cqi',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}
            initial={!isStatic ? { opacity: 0, x: layout_variation === 'two-column' ? -15 : 0 } : {}}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
        >
            <div style={{
                fontSize: '1.5cqi',
                color: 'var(--slide-body)',
                lineHeight: 1.7,
                fontWeight: 500
            }}>
                <SlideMarkdown content={description} />
            </div>
        </motion.div>
    );

    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col">
            {/* ヘッダー */}
            <motion.div
                className="indigo-slide-header"
                style={{
                    marginBottom: '2cqi',
                    borderBottom: '2.5px solid var(--slide-primary)',
                    paddingBottom: '1.2cqi'
                }}
                {...(!isStatic && { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } })}
            >
                <h2 style={{ fontSize: '2.6cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    <SlideMarkdown content={title || 'Data Table'} />
                </h2>
            </motion.div>

            {/* レイアウト分岐 */}
            <div className="flex-1 flex mt-[1cqi]">
                {layout_variation === 'two-column' ? (
                    // 2カラムレイアウト: 比率を 3:9 にしてテーブルの幅を確保
                    <div className="w-full flex items-start gap-[4cqi]">
                        {description && (
                            <div className="flex-[3] flex flex-col pt-[1cqi]">
                                <h3 style={{ fontSize: '1.2cqi', color: 'var(--slide-muted)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '1.2cqi', textTransform: 'uppercase' }}>
                                    Key Takeaway
                                </h3>
                                <DescriptionComponent />
                            </div>
                        )}
                        <div className="flex-[9] min-w-0">
                            <TableComponent />
                        </div>
                    </div>
                ) : (
                    // デフォルトレイアウト: 縦積み（幅を少し絞って間延びを防ぐ）
                    <div className="w-full flex flex-col items-center gap-[3.5cqi]">
                        <div className="w-full max-w-[95%]">
                            <TableComponent />
                        </div>
                        {description && (
                            <div className="w-full max-w-[95%]">
                                <DescriptionComponent />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 注釈 */}
            {annotations?.length > 0 && (
                <div style={{
                    fontSize: '1.1cqi',
                    color: '#64748B',
                    marginTop: 'auto',
                    paddingTop: '1cqi',
                    borderTop: '1px solid var(--slide-border)'
                }}>
                    {annotations.map((note, idx) => (
                        <React.Fragment key={idx}>
                            <SlideMarkdown content={note} inline />
                            {idx < annotations.length - 1 && <span style={{ margin: '0 0.8cqi', opacity: 0.5 }}>|</span>}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TableSlide;