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

    // 安全なデータ取得
    const headers = Array.isArray(rawHeaders) ? rawHeaders.slice(0, MAX_COLUMNS) : [];
    const rows = Array.isArray(rawRows) ? rawRows.slice(0, MAX_ROWS).map(row =>
        Array.isArray(row) ? row.slice(0, MAX_COLUMNS) : []
    ) : [];

    // テーブルコンポーネント
    const TableComponent = () => (
        <div style={{ 
            overflowX: 'auto', 
            borderRadius: '8px', 
            border: '1px solid var(--slide-border, #e2e8f0)',
            background: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.4cqi' }}>
                <thead style={{ background: 'var(--slide-primary, #6366f1)', color: '#ffffff' }}>
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i} style={{ 
                                padding: '1.2cqi 1.5cqi', 
                                textAlign: 'left', 
                                fontWeight: 700,
                                letterSpacing: '0.02em'
                            }}>
                                <SlideMarkdown content={h} />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, ri) => (
                        <tr key={ri} style={{ 
                            borderBottom: '1px solid var(--slide-border, #e2e8f0)',
                            background: ri % 2 === 0 ? '#ffffff' : '#f8fafc'
                        }}>
                            {row.map((cell, ci) => (
                                <td key={ci} style={{ 
                                    padding: '1cqi 1.5cqi', 
                                    color: 'var(--slide-body, #1e293b)',
                                    lineHeight: 1.4
                                }}>
                                    <SlideMarkdown content={cell} />
                                </td>
                            ))}
                        </tr>
                    ))}
                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={headers.length || 1} style={{ padding: '4cqi', textAlign: 'center', color: 'var(--slide-muted)' }}>
                                データがありません
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const isTwoColumn = layout_variation === 'two-column';
    // default またはその他の場合は bottom-desc を標準とする
    const isBottomDesc = !isTwoColumn;

    return (
        <div className="json-slide-layout indigo-style" style={{ display: 'flex', flexDirection: 'column' }}>
            <motion.div 
                className="indigo-slide-header"
                style={{ marginBottom: '2.5cqi', borderBottom: '2.5px solid var(--slide-primary, #6366f1)', paddingBottom: '1.2cqi', flexShrink: 0 }}
                {...(!isStatic && { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } })}
            >
                <h2 style={{ fontSize: '2.8cqi', margin: 0, color: 'var(--slide-heading, #0f172a)', fontWeight: 700 }}>
                    <SlideMarkdown content={title || 'データ一覧'} />
                </h2>
            </motion.div>

            <div className="indigo-slide-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {isTwoColumn ? (
                    <div style={{ display: 'flex', gap: '4cqi', flex: 1, alignItems: 'center' }}>
                        {description && (
                            <div style={{ flex: 0.8, fontSize: '1.6cqi', color: 'var(--slide-body, #1e293b)', lineHeight: 1.6 }}>
                                <SlideMarkdown content={description} />
                            </div>
                        )}
                        <div style={{ flex: 1.2 }}>
                            <TableComponent />
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5cqi', flex: 1 }}>
                        <div style={{ flex: isBottomDesc ? 0 : 1 }}>
                            <TableComponent />
                        </div>
                        {description && (
                            <div style={{ 
                                fontSize: '1.6cqi', 
                                color: 'var(--slide-body, #1e293b)', 
                                lineHeight: 1.6,
                                padding: '1.5cqi 2cqi',
                                background: 'var(--slide-bg-accent, #f1f5f9)',
                                borderRadius: '8px',
                                borderLeft: '4px solid var(--slide-primary, #6366f1)'
                            }}>
                                <SlideMarkdown content={description} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {annotations.length > 0 && (
                <div style={{ 
                    fontSize: '1.1cqi', 
                    color: 'var(--slide-muted, #94a3b8)', 
                    marginTop: '2cqi', 
                    paddingTop: '1cqi', 
                    borderTop: '1px solid var(--slide-border, #e2e8f0)' 
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
