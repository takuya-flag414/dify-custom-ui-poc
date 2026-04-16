import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SLIDE_TYPES } from '../../utils/slideTypeMapper';
import './PptxStructureView.css';

/**
 * EditableInput コンポーネント
 * 短いテキスト用のインライン編集フィールド（input type="text"）
 */
const EditableInput = ({ value, onChange, placeholder = '', className = '', isEdited = false }) => (
    <input
        type="text"
        className={`editable-input ${className} ${isEdited ? 'field-edited' : ''}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
    />
);

/**
 * EditableTextarea コンポーネント
 * 長いテキスト用のインライン編集フィールド（textarea、高さ自動調整）
 */
const EditableTextarea = ({ value, onChange, placeholder = '', className = '', isEdited = false }) => {
    const ref = useRef(null);

    // 高さ自動調整
    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = `${ref.current.scrollHeight}px`;
        }
    }, [value]);

    return (
        <textarea
            ref={ref}
            className={`editable-textarea ${className} ${isEdited ? 'field-edited' : ''}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={2}
        />
    );
};

/**
 * DataField コンポーネント
 * ラベル付きのブロックでスライドデータを表示する（編集可能）
 */
const DataField = ({ label, icon, value, isAiGenerated = false, children, editable = false, onChange, multiline = false, placeholder = '', isEdited = false }) => (
    <div className="data-field">
        <label className="field-label">
            {icon && <span>{icon}</span>}
            {label}
            {isEdited && <span className="edited-badge">編集済み</span>}
        </label>
        <div className={`field-value-box ${isAiGenerated ? 'ai-highlighted' : ''} ${editable ? 'editable-box' : ''}`}>
            {editable && onChange ? (
                multiline ? (
                    <EditableTextarea value={value} onChange={onChange} placeholder={placeholder} isEdited={isEdited} />
                ) : (
                    <EditableInput value={value} onChange={onChange} placeholder={placeholder} isEdited={isEdited} />
                )
            ) : (
                value || children
            )}
            {/* children は配列やテーブルなど、カスタムUIで使う */}
            {editable && children}
        </div>
    </div>
);

/**
 * EditableListField コンポーネント
 * 配列データ（箇条書き・アジェンダ等）のインライン編集UI
 */
const EditableListField = ({ label, icon, items, onUpdateItem, onAddItem, onRemoveItem, ordered = false, placeholder = '項目を入力...' }) => (
    <DataField label={label} icon={icon} editable>
        <div className="editable-list">
            {items.map((item, i) => (
                <div key={i} className="editable-list-item">
                    <span className="list-item-marker">{ordered ? `${i + 1}.` : '•'}</span>
                    <input
                        type="text"
                        className="editable-input list-input"
                        value={item}
                        onChange={(e) => onUpdateItem(i, e.target.value)}
                        placeholder={placeholder}
                    />
                    <button
                        className="item-remove-btn"
                        onClick={() => onRemoveItem(i)}
                        title="この項目を削除"
                        disabled={items.length <= 1}
                    >×</button>
                </div>
            ))}
            <button className="item-add-btn" onClick={onAddItem}>
                ＋ 項目を追加
            </button>
        </div>
    </DataField>
);

/**
 * EditableTableField コンポーネント
 * テーブルデータのExcel風グリッド編集UI
 */
const EditableTableField = ({ label, icon, headers, rows, onUpdateCell, onAddRow, onAddColumn, onRemoveRow, onRemoveColumn }) => (
    <DataField label={label} icon={icon} editable>
        <div className="editable-table-wrapper">
            <table className="data-grid-preview editable-grid">
                <thead>
                    <tr>
                        <th className="row-action-cell"></th>
                        {headers.map((h, i) => (
                            <th key={i}>
                                <div className="th-edit-wrapper">
                                    <input
                                        type="text"
                                        className="editable-input cell-input header-input"
                                        value={h}
                                        onChange={(e) => onUpdateCell(-1, i, e.target.value)}
                                    />
                                    {headers.length > 1 && (
                                        <button className="col-remove-btn" onClick={() => onRemoveColumn(i)} title="列を削除">×</button>
                                    )}
                                </div>
                            </th>
                        ))}
                        <th className="col-add-cell">
                            <button className="table-add-btn" onClick={onAddColumn} title="列を追加">＋</button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows && rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                            <td className="row-action-cell">
                                <button className="row-remove-btn" onClick={() => onRemoveRow(rIdx)} title="行を削除">×</button>
                            </td>
                            {row.map((cell, cIdx) => (
                                <td key={cIdx}>
                                    <input
                                        type="text"
                                        className="editable-input cell-input"
                                        value={cell}
                                        onChange={(e) => onUpdateCell(rIdx, cIdx, e.target.value)}
                                    />
                                </td>
                            ))}
                            <td className="col-add-cell"></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button className="item-add-btn table-row-add" onClick={onAddRow}>
                ＋ 行を追加
            </button>
        </div>
    </DataField>
);


/**
 * SlideActionBar コンポーネント
 * スライドの移動・削除操作ボタン
 */
const SlideActionBar = ({ index, totalSlides, onMoveUp, onMoveDown, onRemove }) => (
    <div className="slide-action-bar">
        <button
            className="slide-action-btn"
            onClick={onMoveUp}
            disabled={index === 0}
            title="上に移動"
        >↑</button>
        <button
            className="slide-action-btn"
            onClick={onMoveDown}
            disabled={index === totalSlides - 1}
            title="下に移動"
        >↓</button>
        <button
            className="slide-action-btn danger"
            onClick={onRemove}
            disabled={totalSlides <= 1}
            title="スライドを削除"
        >🗑️</button>
    </div>
);

/**
 * AddSlideButton コンポーネント
 * スライド間に表示される「＋ スライドを追加」ボタン
 */
const AddSlideButton = ({ onAdd }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // メニュー外クリックで閉じる
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    return (
        <div className="add-slide-section" ref={menuRef}>
            <div className="add-slide-line"></div>
            <button className="add-slide-btn" onClick={() => setIsOpen(!isOpen)}>
                ＋ スライドを追加
            </button>
            <div className="add-slide-line"></div>
            {isOpen && (
                <div className="slide-type-menu mat-popover">
                    {SLIDE_TYPES.map(st => (
                        <button
                            key={st.value}
                            className="slide-type-option"
                            onClick={() => { onAdd(st.value); setIsOpen(false); }}
                        >
                            {st.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};


/**
 * SlideDataSection コンポーネント
 * 1枚のスライドの入力データを表示・編集する
 */
const SlideDataSection = ({ slide, index, totalSlides, onUpdate, originalSlide }) => {
    const isEditable = !!onUpdate;

    // フィールドの編集済み判定ヘルパー
    const isFieldEdited = useCallback((fieldPath) => {
        if (!originalSlide) return false;
        const parts = fieldPath.split('.');
        let origVal = originalSlide;
        let currVal = slide;
        for (const part of parts) {
            origVal = origVal?.[part];
            currVal = currVal?.[part];
        }
        return origVal !== undefined && currVal !== origVal;
    }, [originalSlide, slide]);

    // スライドタイプ変更ハンドラ
    const handleTypeChange = (e) => {
        if (onUpdate) {
            onUpdate.changeSlideType(index, e.target.value);
        }
    };

    return (
        <div className="slide-data-section mat-hud">
            <div className="section-label">
                <span>SLIDE {index + 1}</span>
                <div className="section-label-right">
                    {isEditable ? (
                        <select
                            className="slide-type-select"
                            value={slide.type}
                            onChange={handleTypeChange}
                        >
                            {SLIDE_TYPES.map(st => (
                                <option key={st.value} value={st.value}>{st.label}</option>
                            ))}
                        </select>
                    ) : (
                        <span className="section-type-badge">{slide.type.toUpperCase()}</span>
                    )}
                    {isEditable && (
                        <SlideActionBar
                            index={index}
                            totalSlides={totalSlides}
                            onMoveUp={() => onUpdate.moveSlide(index, index - 1)}
                            onMoveDown={() => onUpdate.moveSlide(index, index + 1)}
                            onRemove={() => {
                                if (window.confirm(`スライド ${index + 1}「${slide.title || '(タイトルなし)'}」を削除しますか？`)) {
                                    onUpdate.removeSlide(index);
                                }
                            }}
                        />
                    )}
                </div>
            </div>

            {/* スライドタイトル */}
            <DataField
                label="タイトル"
                icon="📝"
                value={slide.title || ''}
                isAiGenerated={!isEditable}
                editable={isEditable}
                onChange={isEditable ? (v) => onUpdate.updateSlideField(index, 'title', v) : undefined}
                placeholder="(タイトルなし)"
                isEdited={isFieldEdited('title')}
            />

            {/* Kicker（表紙のみ） */}
            {(slide.kicker !== undefined || slide.type === 'title') && isEditable && (
                <DataField
                    label="キッカー"
                    icon="🏷️"
                    value={slide.kicker || ''}
                    editable
                    onChange={(v) => onUpdate.updateSlideField(index, 'kicker', v)}
                    placeholder="CONFIDENTIAL"
                    isEdited={isFieldEdited('kicker')}
                />
            )}
            {slide.kicker && !isEditable && (
                <DataField label="キッカー" icon="🏷️" value={slide.kicker} />
            )}

            {/* サブタイトル */}
            {(slide.subtitle !== undefined || (isEditable && ['title', 'section'].includes(slide.type))) && (
                <DataField
                    label="サブタイトル"
                    icon="ℹ️"
                    value={slide.subtitle || ''}
                    editable={isEditable}
                    onChange={isEditable ? (v) => onUpdate.updateSlideField(index, 'subtitle', v) : undefined}
                    placeholder="サブタイトル"
                    isEdited={isFieldEdited('subtitle')}
                />
            )}

            {/* リード文 */}
            {(slide.lead !== undefined || isEditable) && (
                <DataField
                    label="リード文"
                    icon="💬"
                    value={slide.lead || ''}
                    editable={isEditable}
                    multiline
                    onChange={isEditable ? (v) => onUpdate.updateSlideField(index, 'lead', v) : undefined}
                    placeholder="スライドの導入文..."
                    isEdited={isFieldEdited('lead')}
                />
            )}

            {/* ===== タイプ別コンテンツ（編集対応版） ===== */}

            {/* bullet / summary */}
            {(slide.type === 'bullet' || slide.type === 'summary') && (
                <>
                    {slide.bullets && (
                        isEditable ? (
                            <EditableListField
                                label="箇条書きリスト"
                                icon="•"
                                items={slide.bullets}
                                onUpdateItem={(i, v) => onUpdate.updateArrayItem(index, 'bullets', i, v)}
                                onAddItem={() => onUpdate.addArrayItem(index, 'bullets', '')}
                                onRemoveItem={(i) => onUpdate.removeArrayItem(index, 'bullets', i)}
                            />
                        ) : (
                            <DataField label="箇条書きリスト" icon="•">
                                <ul className="pptx-preview-list">
                                    {slide.bullets.map((b, i) => <li key={i}>{b}</li>)}
                                </ul>
                            </DataField>
                        )
                    )}
                    {slide.summaryPoints && (
                        isEditable ? (
                            <EditableListField
                                label="要約ポイント"
                                icon="💡"
                                items={slide.summaryPoints}
                                onUpdateItem={(i, v) => onUpdate.updateArrayItem(index, 'summaryPoints', i, v)}
                                onAddItem={() => onUpdate.addArrayItem(index, 'summaryPoints', '')}
                                onRemoveItem={(i) => onUpdate.removeArrayItem(index, 'summaryPoints', i)}
                            />
                        ) : (
                            <DataField label="要約ポイント" icon="💡">
                                <ul className="pptx-preview-list">
                                    {slide.summaryPoints.map((sp, i) => <li key={`sp-${i}`}>{sp}</li>)}
                                </ul>
                            </DataField>
                        )
                    )}
                </>
            )}

            {/* agenda */}
            {slide.type === 'agenda' && slide.items && (
                isEditable ? (
                    <EditableListField
                        label="アジェンダ項目"
                        icon="📋"
                        items={slide.items}
                        ordered
                        onUpdateItem={(i, v) => onUpdate.updateArrayItem(index, 'items', i, v)}
                        onAddItem={() => onUpdate.addArrayItem(index, 'items', '')}
                        onRemoveItem={(i) => onUpdate.removeArrayItem(index, 'items', i)}
                    />
                ) : (
                    <DataField label="アジェンダ項目" icon="📋">
                        <ol className="pptx-preview-list">
                            {slide.items.map((item, i) => <li key={i}>{item}</li>)}
                        </ol>
                    </DataField>
                )
            )}

            {/* table */}
            {slide.type === 'table' && slide.headers && (
                isEditable ? (
                    <EditableTableField
                        label="テーブルデータ"
                        icon="📅"
                        headers={slide.headers}
                        rows={slide.rows || []}
                        onUpdateCell={(rIdx, cIdx, v) => onUpdate.updateTableCell(index, rIdx, cIdx, v)}
                        onAddRow={() => onUpdate.addTableRow(index)}
                        onAddColumn={() => onUpdate.addTableColumn(index)}
                        onRemoveRow={(rIdx) => onUpdate.removeTableRow(index, rIdx)}
                        onRemoveColumn={(cIdx) => onUpdate.removeTableColumn(index, cIdx)}
                    />
                ) : (
                    <DataField label="テーブルデータ" icon="📅">
                        <table className="data-grid-preview">
                            <thead>
                                <tr>{slide.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {slide.rows && slide.rows.map((row, rIdx) => (
                                    <tr key={rIdx}>{row.map((cell, cIdx) => <td key={cIdx}>{cell}</td>)}</tr>
                                ))}
                            </tbody>
                        </table>
                    </DataField>
                )
            )}

            {/* chart-placeholder */}
            {slide.type === 'chart-placeholder' && (
                <DataField label="グラフ構成データ" icon="📊" editable={isEditable}>
                    <div className="chart-data-summary">
                        {isEditable ? (
                            <>
                                <div className="chart-edit-row">
                                    <label className="chart-edit-label">種類:</label>
                                    <select
                                        className="slide-type-select chart-type-select"
                                        value={slide.chartType || 'bar'}
                                        onChange={(e) => onUpdate.updateSlideField(index, 'chartType', e.target.value)}
                                    >
                                        <option value="bar">棒グラフ (Bar)</option>
                                        <option value="line">折れ線 (Line)</option>
                                        <option value="pie">円グラフ (Pie)</option>
                                        <option value="doughnut">ドーナツ (Doughnut)</option>
                                        <option value="stacked-bar">積み上げ棒 (Stacked Bar)</option>
                                        <option value="horizontal-bar">横棒 (Horizontal Bar)</option>
                                    </select>
                                </div>
                                <div className="chart-edit-row">
                                    <label className="chart-edit-label">タイトル:</label>
                                    <input
                                        type="text"
                                        className="editable-input"
                                        value={slide.chartTitle || ''}
                                        onChange={(e) => onUpdate.updateSlideField(index, 'chartTitle', e.target.value)}
                                    />
                                </div>
                                {/* カテゴリ・系列のテーブル編集 */}
                                <EditableTableField
                                    label="データ系列"
                                    icon=""
                                    headers={['系列 / カテゴリ', ...(slide.categories || [])]}
                                    rows={(slide.series || []).map(s => [s.name, ...(s.values || []).map(String)])}
                                    onUpdateCell={(rIdx, cIdx, v) => {
                                        if (rIdx === -1) {
                                            // ヘッダー行 → カテゴリ更新
                                            if (cIdx === 0) return; // 最初のヘッダーは固定
                                            const cats = [...(slide.categories || [])];
                                            cats[cIdx - 1] = v;
                                            onUpdate.updateSlideField(index, 'categories', cats);
                                        } else {
                                            // データ行
                                            const series = JSON.parse(JSON.stringify(slide.series || []));
                                            if (cIdx === 0) {
                                                series[rIdx].name = v;
                                            } else {
                                                if (!series[rIdx].values) series[rIdx].values = [];
                                                series[rIdx].values[cIdx - 1] = isNaN(Number(v)) ? v : Number(v);
                                            }
                                            onUpdate.updateSlideField(index, 'series', series);
                                        }
                                    }}
                                    onAddRow={() => {
                                        const series = [...(slide.series || [])];
                                        series.push({ name: `系列${series.length + 1}`, values: new Array((slide.categories || []).length).fill(0) });
                                        onUpdate.updateSlideField(index, 'series', series);
                                    }}
                                    onAddColumn={() => {
                                        const cats = [...(slide.categories || [])];
                                        cats.push(`カテゴリ${cats.length + 1}`);
                                        onUpdate.updateSlideField(index, 'categories', cats);
                                        const series = JSON.parse(JSON.stringify(slide.series || []));
                                        series.forEach(s => { if (!s.values) s.values = []; s.values.push(0); });
                                        onUpdate.updateSlideField(index, 'series', series);
                                    }}
                                    onRemoveRow={(rIdx) => {
                                        const series = [...(slide.series || [])];
                                        series.splice(rIdx, 1);
                                        onUpdate.updateSlideField(index, 'series', series);
                                    }}
                                    onRemoveColumn={(cIdx) => {
                                        if (cIdx === 0) return;
                                        const cats = [...(slide.categories || [])];
                                        cats.splice(cIdx - 1, 1);
                                        onUpdate.updateSlideField(index, 'categories', cats);
                                        const series = JSON.parse(JSON.stringify(slide.series || []));
                                        series.forEach(s => { if (s.values) s.values.splice(cIdx - 1, 1); });
                                        onUpdate.updateSlideField(index, 'series', series);
                                    }}
                                />
                            </>
                        ) : (
                            <>
                                <div className="chart-info-tag">種類: {slide.chartType}</div>
                                <div className="chart-info-tag">タイトル: {slide.chartTitle}</div>
                                <table className="data-grid-preview" style={{ marginTop: '8px' }}>
                                    <thead>
                                        <tr>
                                            <th>系列 / カテゴリ</th>
                                            {slide.categories?.map((cat, i) => (
                                                <th key={i} style={{ textAlign: 'right' }}>{cat}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {slide.series?.map((s, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 'bold' }}>{s.name}</td>
                                                {s.values?.map((v, j) => (
                                                    <td key={j} style={{ textAlign: 'right' }}>{v}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                </DataField>
            )}

            {/* two-column */}
            {slide.type === 'two-column' && (
                <div style={{ display: 'flex', gap: '16px' }}>
                    {['left', 'right'].map((side) => {
                        const colData = slide[side];
                        const sideLabel = side === 'left' ? '左' : '右';
                        const sideIcon = side === 'left' ? '⬅️' : '➡️';
                        if (!colData && !isEditable) return null;
                        const data = colData || { heading: '', bodyPoints: [''] };
                        return (
                            <div key={side} style={{ flex: 1 }}>
                                {isEditable ? (
                                    <>
                                        <DataField
                                            label={`${sideLabel}カラム見出し`}
                                            icon={sideIcon}
                                            value={data.heading || ''}
                                            editable
                                            onChange={(v) => onUpdate.updateSlideField(index, `${side}.heading`, v)}
                                            placeholder={`${sideLabel}カラムの見出し`}
                                        />
                                        <EditableListField
                                            label={`${sideLabel}カラム項目`}
                                            icon=""
                                            items={data.bodyPoints || ['']}
                                            onUpdateItem={(i, v) => {
                                                const pts = [...(data.bodyPoints || [])];
                                                pts[i] = v;
                                                onUpdate.updateSlideField(index, `${side}.bodyPoints`, pts);
                                            }}
                                            onAddItem={() => {
                                                const pts = [...(data.bodyPoints || [])];
                                                pts.push('');
                                                onUpdate.updateSlideField(index, `${side}.bodyPoints`, pts);
                                            }}
                                            onRemoveItem={(i) => {
                                                const pts = [...(data.bodyPoints || [])];
                                                pts.splice(i, 1);
                                                onUpdate.updateSlideField(index, `${side}.bodyPoints`, pts);
                                            }}
                                        />
                                    </>
                                ) : (
                                    <DataField label={`${sideLabel}カラム: ${data.heading || ''}`} icon={sideIcon}>
                                        <ul className="pptx-preview-list">
                                            {data.bodyPoints?.map((bp, i) => <li key={i}>{bp}</li>)}
                                        </ul>
                                    </DataField>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ===== 新規タイプ ===== */}

            {/* toc-list: 目次一覧 */}
            {slide.type === 'toc-list' && slide.items && (
                isEditable ? (
                    <DataField label="目次項目" icon="📑" editable>
                        <div className="editable-list">
                            {slide.items.map((item, i) => (
                                <div key={i} className="editable-list-item toc-edit-item">
                                    <input
                                        type="text"
                                        className="editable-input toc-index-input"
                                        value={item.index || ''}
                                        onChange={(e) => {
                                            const items = JSON.parse(JSON.stringify(slide.items));
                                            items[i].index = e.target.value;
                                            onUpdate.updateSlideField(index, 'items', items);
                                        }}
                                        placeholder="番号"
                                        style={{ width: '50px', textAlign: 'center' }}
                                    />
                                    <input
                                        type="text"
                                        className="editable-input list-input"
                                        value={item.label || ''}
                                        onChange={(e) => {
                                            const items = JSON.parse(JSON.stringify(slide.items));
                                            items[i].label = e.target.value;
                                            onUpdate.updateSlideField(index, 'items', items);
                                        }}
                                        placeholder="項目名"
                                    />
                                    <input
                                        type="text"
                                        className="editable-input toc-page-input"
                                        value={item.page || ''}
                                        onChange={(e) => {
                                            const items = JSON.parse(JSON.stringify(slide.items));
                                            items[i].page = e.target.value;
                                            onUpdate.updateSlideField(index, 'items', items);
                                        }}
                                        placeholder="P."
                                        style={{ width: '50px', textAlign: 'right' }}
                                    />
                                    <button
                                        className="item-remove-btn"
                                        onClick={() => {
                                            const items = JSON.parse(JSON.stringify(slide.items));
                                            items.splice(i, 1);
                                            onUpdate.updateSlideField(index, 'items', items);
                                        }}
                                        disabled={slide.items.length <= 1}
                                    >×</button>
                                </div>
                            ))}
                            <button className="item-add-btn" onClick={() => {
                                const items = JSON.parse(JSON.stringify(slide.items));
                                items.push({ index: String(items.length + 1).padStart(2, '0'), label: '', page: '' });
                                onUpdate.updateSlideField(index, 'items', items);
                            }}>＋ 項目を追加</button>
                        </div>
                    </DataField>
                ) : (
                    <DataField label="目次項目" icon="📑">
                        <table className="data-grid-preview">
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}>番号</th>
                                    <th>項目名</th>
                                    <th style={{ width: '80px', textAlign: 'right' }}>ページ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slide.items.map((item, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 'bold', color: 'var(--sys-color-primary)' }}>{item.index}</td>
                                        <td>{item.label}</td>
                                        <td style={{ textAlign: 'right', color: '#86868b' }}>{item.page}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </DataField>
                )
            )}

            {/* numbered-points: 番号付き説明 */}
            {slide.type === 'numbered-points' && slide.points && (
                isEditable ? (
                    <DataField label="番号付き項目" icon="🔢" editable>
                        <div className="editable-list">
                            {slide.points.map((pt, i) => (
                                <div key={i} className="numbered-point-edit-item">
                                    <div className="np-number-edit">{pt.number || String(i + 1)}</div>
                                    <div className="np-content-edit">
                                        <input
                                            type="text"
                                            className="editable-input"
                                            value={pt.title || ''}
                                            onChange={(e) => {
                                                const points = JSON.parse(JSON.stringify(slide.points));
                                                points[i].title = e.target.value;
                                                onUpdate.updateSlideField(index, 'points', points);
                                            }}
                                            placeholder="タイトル"
                                        />
                                        <EditableTextarea
                                            value={pt.description || ''}
                                            onChange={(v) => {
                                                const points = JSON.parse(JSON.stringify(slide.points));
                                                points[i].description = v;
                                                onUpdate.updateSlideField(index, 'points', points);
                                            }}
                                            placeholder="説明文..."
                                        />
                                    </div>
                                    <button
                                        className="item-remove-btn"
                                        onClick={() => {
                                            const points = JSON.parse(JSON.stringify(slide.points));
                                            points.splice(i, 1);
                                            onUpdate.updateSlideField(index, 'points', points);
                                        }}
                                        disabled={slide.points.length <= 1}
                                    >×</button>
                                </div>
                            ))}
                            <button className="item-add-btn" onClick={() => {
                                const points = JSON.parse(JSON.stringify(slide.points));
                                points.push({ number: String(points.length + 1), title: '', description: '' });
                                onUpdate.updateSlideField(index, 'points', points);
                            }}>＋ 項目を追加</button>
                        </div>
                    </DataField>
                ) : (
                    <DataField label="番号付き項目" icon="🔢">
                        <div className="numbered-points-list">
                            {slide.points.map((pt, i) => (
                                <div key={i} className="numbered-point-item">
                                    <div className="np-number">{pt.number || String(i + 1)}</div>
                                    <div className="np-content">
                                        <div className="np-title">{pt.title}</div>
                                        <div className="np-desc">{pt.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </DataField>
                )
            )}

            {/* feature-cards: 特長カード */}
            {slide.type === 'feature-cards' && slide.cards && (
                isEditable ? (
                    <DataField label="特長カード" icon="✨" editable>
                        <div className="editable-list">
                            {slide.cards.map((card, i) => (
                                <div key={i} className="feature-card-edit-item">
                                    <div className="fc-edit-fields">
                                        <input
                                            type="text"
                                            className="editable-input"
                                            value={card.iconHint || ''}
                                            onChange={(e) => {
                                                const cards = JSON.parse(JSON.stringify(slide.cards));
                                                cards[i].iconHint = e.target.value;
                                                onUpdate.updateSlideField(index, 'cards', cards);
                                            }}
                                            placeholder="アイコンヒント"
                                            style={{ width: '100px' }}
                                        />
                                        <input
                                            type="text"
                                            className="editable-input"
                                            value={card.title || ''}
                                            onChange={(e) => {
                                                const cards = JSON.parse(JSON.stringify(slide.cards));
                                                cards[i].title = e.target.value;
                                                onUpdate.updateSlideField(index, 'cards', cards);
                                            }}
                                            placeholder="タイトル"
                                        />
                                        <EditableTextarea
                                            value={card.description || ''}
                                            onChange={(v) => {
                                                const cards = JSON.parse(JSON.stringify(slide.cards));
                                                cards[i].description = v;
                                                onUpdate.updateSlideField(index, 'cards', cards);
                                            }}
                                            placeholder="説明文..."
                                        />
                                    </div>
                                    <button
                                        className="item-remove-btn"
                                        onClick={() => {
                                            const cards = JSON.parse(JSON.stringify(slide.cards));
                                            cards.splice(i, 1);
                                            onUpdate.updateSlideField(index, 'cards', cards);
                                        }}
                                        disabled={slide.cards.length <= 1}
                                    >×</button>
                                </div>
                            ))}
                            <button className="item-add-btn" onClick={() => {
                                const cards = JSON.parse(JSON.stringify(slide.cards));
                                cards.push({ title: '', description: '', iconHint: '' });
                                onUpdate.updateSlideField(index, 'cards', cards);
                            }}>＋ カードを追加</button>
                        </div>
                    </DataField>
                ) : (
                    <DataField label="特長カード" icon="✨">
                        <div className="feature-cards-grid">
                            {slide.cards.map((card, i) => (
                                <div key={i} className="feature-card-item">
                                    {card.iconHint && <div className="fc-icon-hint">{card.iconHint}</div>}
                                    <div className="fc-title">{card.title}</div>
                                    <div className="fc-desc">{card.description}</div>
                                    {card.caption && <div className="fc-caption">{card.caption}</div>}
                                </div>
                            ))}
                        </div>
                    </DataField>
                )
            )}

            {/* pricing-table: 料金プラン比較 */}
            {slide.type === 'pricing-table' && slide.plans && (
                isEditable ? (
                    <>
                        <DataField label="料金プラン" icon="💰" editable>
                            <div className="editable-list">
                                {slide.plans.map((plan, i) => (
                                    <div key={i} className="pricing-plan-edit-item">
                                        <input
                                            type="text"
                                            className="editable-input"
                                            value={plan.name || ''}
                                            onChange={(e) => {
                                                const plans = JSON.parse(JSON.stringify(slide.plans));
                                                plans[i].name = e.target.value;
                                                onUpdate.updateSlideField(index, 'plans', plans);
                                            }}
                                            placeholder="プラン名"
                                        />
                                        <input
                                            type="text"
                                            className="editable-input"
                                            value={plan.price || ''}
                                            onChange={(e) => {
                                                const plans = JSON.parse(JSON.stringify(slide.plans));
                                                plans[i].price = e.target.value;
                                                onUpdate.updateSlideField(index, 'plans', plans);
                                            }}
                                            placeholder="価格"
                                            style={{ width: '100px' }}
                                        />
                                        <label className="highlight-check">
                                            <input
                                                type="checkbox"
                                                checked={!!plan.highlight}
                                                onChange={(e) => {
                                                    const plans = JSON.parse(JSON.stringify(slide.plans));
                                                    plans[i].highlight = e.target.checked;
                                                    onUpdate.updateSlideField(index, 'plans', plans);
                                                }}
                                            /> 推奨
                                        </label>
                                        <button
                                            className="item-remove-btn"
                                            onClick={() => {
                                                const plans = JSON.parse(JSON.stringify(slide.plans));
                                                plans.splice(i, 1);
                                                onUpdate.updateSlideField(index, 'plans', plans);
                                            }}
                                            disabled={slide.plans.length <= 1}
                                        >×</button>
                                    </div>
                                ))}
                                <button className="item-add-btn" onClick={() => {
                                    const plans = JSON.parse(JSON.stringify(slide.plans));
                                    plans.push({ name: '', price: '', highlight: false });
                                    onUpdate.updateSlideField(index, 'plans', plans);
                                }}>＋ プランを追加</button>
                            </div>
                        </DataField>
                        {/* 機能比較の行編集はシンプルなリスト形式 */}
                        {slide.featureRows && (
                            <DataField label="機能比較" icon="📋" editable>
                                <div className="editable-list">
                                    {slide.featureRows.map((row, rIdx) => (
                                        <div key={rIdx} className="feature-row-edit-item">
                                            <input
                                                type="text"
                                                className="editable-input"
                                                value={row.label || ''}
                                                onChange={(e) => {
                                                    const featureRows = JSON.parse(JSON.stringify(slide.featureRows));
                                                    featureRows[rIdx].label = e.target.value;
                                                    onUpdate.updateSlideField(index, 'featureRows', featureRows);
                                                }}
                                                placeholder="機能名"
                                            />
                                            {row.values?.map((v, vIdx) => (
                                                <input
                                                    key={vIdx}
                                                    type="text"
                                                    className="editable-input"
                                                    value={v}
                                                    onChange={(e) => {
                                                        const featureRows = JSON.parse(JSON.stringify(slide.featureRows));
                                                        featureRows[rIdx].values[vIdx] = e.target.value;
                                                        onUpdate.updateSlideField(index, 'featureRows', featureRows);
                                                    }}
                                                    placeholder="○ / ×"
                                                    style={{ width: '60px', textAlign: 'center' }}
                                                />
                                            ))}
                                            <button
                                                className="item-remove-btn"
                                                onClick={() => {
                                                    const featureRows = JSON.parse(JSON.stringify(slide.featureRows));
                                                    featureRows.splice(rIdx, 1);
                                                    onUpdate.updateSlideField(index, 'featureRows', featureRows);
                                                }}
                                            >×</button>
                                        </div>
                                    ))}
                                    <button className="item-add-btn" onClick={() => {
                                        const featureRows = JSON.parse(JSON.stringify(slide.featureRows));
                                        featureRows.push({ label: '', values: new Array(slide.plans.length).fill('') });
                                        onUpdate.updateSlideField(index, 'featureRows', featureRows);
                                    }}>＋ 機能行を追加</button>
                                </div>
                            </DataField>
                        )}
                    </>
                ) : (
                    <>
                        <DataField label="料金プラン" icon="💰">
                            <div className="pricing-plans-row">
                                {slide.plans.map((plan, i) => (
                                    <div key={i} className={`pricing-plan-badge ${plan.highlight ? 'highlight' : ''}`}>
                                        <div className="pp-name">{plan.name}</div>
                                        <div className="pp-price">{plan.price}</div>
                                    </div>
                                ))}
                            </div>
                        </DataField>
                        {slide.featureRows && (
                            <DataField label="機能比較" icon="📋">
                                <table className="data-grid-preview">
                                    <thead>
                                        <tr>
                                            <th>機能</th>
                                            {slide.plans.map((plan, i) => (
                                                <th key={i} style={{ textAlign: 'center' }}>{plan.name}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {slide.featureRows.map((row, rIdx) => (
                                            <tr key={rIdx}>
                                                <td style={{ fontWeight: 'bold' }}>{row.label}</td>
                                                {row.values?.map((v, vIdx) => (
                                                    <td key={vIdx} style={{ textAlign: 'center' }}>{v}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </DataField>
                        )}
                    </>
                )
            )}

            {/* chart-analysis: グラフ分析（読み取り専用のまま — 編集はchart-placeholder側で対応） */}
            {slide.type === 'chart-analysis' && (
                <>
                    {slide.charts?.map((chart, ci) => (
                        <DataField key={ci} label={`グラフ ${ci + 1}: ${chart.chartTitle || ''}`} icon="📊">
                            <div className="chart-data-summary">
                                <div className="chart-info-tag">種類: {chart.chartType}</div>
                                <table className="data-grid-preview" style={{ marginTop: '8px' }}>
                                    <thead>
                                        <tr>
                                            <th>系列 / カテゴリ</th>
                                            {chart.categories?.map((cat, i) => (
                                                <th key={i} style={{ textAlign: 'right' }}>{cat}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chart.series?.map((s, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 'bold' }}>{s.name}</td>
                                                {s.values?.map((v, j) => (
                                                    <td key={j} style={{ textAlign: 'right' }}>{v}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </DataField>
                    ))}
                    {slide.insights && slide.insights.length > 0 && (
                        isEditable ? (
                            <EditableListField
                                label="分析の要点"
                                icon="🔍"
                                items={slide.insights}
                                onUpdateItem={(i, v) => onUpdate.updateArrayItem(index, 'insights', i, v)}
                                onAddItem={() => onUpdate.addArrayItem(index, 'insights', '')}
                                onRemoveItem={(i) => onUpdate.removeArrayItem(index, 'insights', i)}
                            />
                        ) : (
                            <DataField label="分析の要点" icon="🔍">
                                <ul className="pptx-preview-list">
                                    {slide.insights.map((ins, i) => <li key={i}>{ins}</li>)}
                                </ul>
                            </DataField>
                        )
                    )}
                </>
            )}

            {/* profile-fact-sheet: 会社概要・人物紹介 */}
            {slide.type === 'profile-fact-sheet' && (
                <>
                    {slide.facts && (
                        isEditable ? (
                            <DataField label="基本情報" icon="🏢" editable>
                                <div className="editable-list">
                                    {slide.facts.map((fact, i) => (
                                        <div key={i} className="fact-edit-item">
                                            <input
                                                type="text"
                                                className="editable-input"
                                                value={fact.label || ''}
                                                onChange={(e) => {
                                                    const facts = JSON.parse(JSON.stringify(slide.facts));
                                                    facts[i].label = e.target.value;
                                                    onUpdate.updateSlideField(index, 'facts', facts);
                                                }}
                                                placeholder="ラベル"
                                                style={{ width: '120px' }}
                                            />
                                            <input
                                                type="text"
                                                className="editable-input list-input"
                                                value={fact.value || ''}
                                                onChange={(e) => {
                                                    const facts = JSON.parse(JSON.stringify(slide.facts));
                                                    facts[i].value = e.target.value;
                                                    onUpdate.updateSlideField(index, 'facts', facts);
                                                }}
                                                placeholder="内容"
                                            />
                                            <button
                                                className="item-remove-btn"
                                                onClick={() => {
                                                    const facts = JSON.parse(JSON.stringify(slide.facts));
                                                    facts.splice(i, 1);
                                                    onUpdate.updateSlideField(index, 'facts', facts);
                                                }}
                                                disabled={slide.facts.length <= 1}
                                            >×</button>
                                        </div>
                                    ))}
                                    <button className="item-add-btn" onClick={() => {
                                        const facts = JSON.parse(JSON.stringify(slide.facts));
                                        facts.push({ label: '', value: '' });
                                        onUpdate.updateSlideField(index, 'facts', facts);
                                    }}>＋ 項目を追加</button>
                                </div>
                            </DataField>
                        ) : (
                            <DataField label="基本情報" icon="🏢">
                                <table className="data-grid-preview">
                                    <tbody>
                                        {slide.facts.map((fact, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 'bold', width: '30%', color: '#86868b' }}>{fact.label}</td>
                                                <td>{fact.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </DataField>
                        )
                    )}
                    {slide.profile && (
                        isEditable ? (
                            <DataField label="プロフィール" icon="👤" editable>
                                <div className="profile-edit-fields">
                                    <EditableInput value={slide.profile.name} onChange={(v) => onUpdate.updateSlideField(index, 'profile.name', v)} placeholder="名前" />
                                    <EditableInput value={slide.profile.role} onChange={(v) => onUpdate.updateSlideField(index, 'profile.role', v)} placeholder="役職" />
                                    <EditableTextarea value={slide.profile.bio} onChange={(v) => onUpdate.updateSlideField(index, 'profile.bio', v)} placeholder="経歴・略歴..." />
                                </div>
                            </DataField>
                        ) : (
                            <DataField label="プロフィール" icon="👤">
                                <div className="profile-card-preview">
                                    <div className="profile-name">{slide.profile.name}</div>
                                    <div className="profile-role">{slide.profile.role}</div>
                                    <div className="profile-bio">{slide.profile.bio}</div>
                                    {slide.profile.imageNote && (
                                        <div className="profile-image-note">{slide.profile.imageNote}</div>
                                    )}
                                </div>
                            </DataField>
                        )
                    )}
                </>
            )}

            {/* ===== 共通フィールド ===== */}
            {(slide.insight !== undefined || isEditable) && slide.type !== 'chart-placeholder' && (
                <DataField
                    label="スライドの洞察"
                    icon="✨"
                    value={slide.insight || ''}
                    editable={isEditable}
                    multiline
                    onChange={isEditable ? (v) => onUpdate.updateSlideField(index, 'insight', v) : undefined}
                    placeholder="洞察やインサイト..."
                    isEdited={isFieldEdited('insight')}
                >
                    {!isEditable && slide.insight && <div className="insight-box">{slide.insight}</div>}
                </DataField>
            )}
            {(slide.footerNote !== undefined || isEditable) && (
                <DataField
                    label="フッター注記"
                    icon="📌"
                    value={slide.footerNote || ''}
                    editable={isEditable}
                    onChange={isEditable ? (v) => onUpdate.updateSlideField(index, 'footerNote', v) : undefined}
                    placeholder="フッターに表示する注記"
                    isEdited={isFieldEdited('footerNote')}
                >
                    {!isEditable && slide.footerNote && <div className="notes-box">{slide.footerNote}</div>}
                </DataField>
            )}
            {(slide.speakerNotes !== undefined || isEditable) && (
                <DataField
                    label="スピーカーノート"
                    icon="🎤"
                    value={slide.speakerNotes || ''}
                    editable={isEditable}
                    multiline
                    onChange={isEditable ? (v) => onUpdate.updateSlideField(index, 'speakerNotes', v) : undefined}
                    placeholder="発表者用のメモ..."
                    isEdited={isFieldEdited('speakerNotes')}
                >
                    {!isEditable && slide.speakerNotes && <div className="notes-box">{slide.speakerNotes}</div>}
                </DataField>
            )}
        </div>
    );
};

/**
 * ThemeInfoSection コンポーネント
 * LLMが指定したカラースウォッチとフォント情報を表示・編集する
 */
const ThemeInfoSection = ({ theme, onUpdate }) => {
    if (!theme || Object.keys(theme).length === 0) return null;

    const isEditable = !!onUpdate;
    // '#'プレフィックスをCSS背景用に保証するヘルパー
    const getHex = (color) => color ? (color.startsWith('#') ? color : `#${color}`) : '#CCCCCC';

    const colors = [
        { label: 'Primary', key: 'primaryColor', color: theme.primaryColor },
        { label: 'Secondary', key: 'secondaryColor', color: theme.secondaryColor },
        { label: 'Accent', key: 'accentColor', color: theme.accentColor },
        { label: 'Background', key: 'backgroundColor', color: theme.backgroundColor },
        { label: 'Text', key: 'textColor', color: theme.textColor },
        { label: 'Muted', key: 'mutedTextColor', color: theme.mutedTextColor },
    ].filter(c => c.color);

    return (
        <div className="pptx-theme-section">
            <div className="pptx-theme-title">
                🎨 テーマ構成: {theme.name || 'カスタムテーマ'}
            </div>
            {colors.length > 0 && (
                <div className="theme-swatches">
                    {colors.map(c => (
                        <div key={c.key} className={`color-swatch-wrapper ${isEditable ? 'clickable' : ''}`}>
                            <div
                                className="color-swatch"
                                style={{ backgroundColor: getHex(c.color), cursor: isEditable ? 'pointer' : 'default' }}
                                onClick={() => {
                                    if (!isEditable) return;
                                    // ネイティブカラーピッカーを起動
                                    const input = document.createElement('input');
                                    input.type = 'color';
                                    input.value = getHex(c.color);
                                    input.addEventListener('input', (e) => {
                                        onUpdate.updateThemeColor(c.key, e.target.value);
                                    });
                                    input.click();
                                }}
                            ></div>
                            <div className="color-label">
                                <span>{c.label}</span>
                                <span className="color-hex">{getHex(c.color).toUpperCase()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="font-info">
                {theme.fontFamilyHeading && <div>見出しフォント: <span className="font-badge">{theme.fontFamilyHeading}</span></div>}
                {theme.fontFamilyBody && <div>本文フォント: <span className="font-badge">{theme.fontFamilyBody}</span></div>}
            </div>
        </div>
    );
};

/**
 * PptxStructureView コンポーネント
 * PPTXデータの構造的なフォーム風ビューをレンダリングする（編集対応版）
 */
const PptxStructureView = ({ pptxSpec, onUpdate = null, originalSpec = null }) => {
    const { documentTitle, presentation = {}, slides = [], theme = {} } = pptxSpec || {};
    const isEditable = !!onUpdate;

    if (!slides || slides.length === 0) {
        return (
            <div className="pptx-structure-view empty mat-hud">
                <p>スライドデータがありません。</p>
            </div>
        );
    }

    return (
        <div className="pptx-structure-view">
            {/* メタデータヘッダー */}
            <div className="pptx-preview-header">
                <div className="pptx-preview-title">
                    <span>✨</span> AI プレゼンテーション構成案
                    {isEditable && <span className="edit-mode-badge">編集可能</span>}
                </div>
                <div className="pptx-preview-meta">
                    {isEditable ? (
                        <>
                            <EditableInput
                                value={documentTitle || ''}
                                onChange={(v) => onUpdate.updateMetaData('documentTitle', v)}
                                placeholder="プレゼンテーションタイトル"
                                className="meta-title-input"
                            />
                            <div className="meta-field-row">
                                <strong>ターゲット読者:</strong>
                                <EditableInput
                                    value={presentation.audience || ''}
                                    onChange={(v) => onUpdate.updateMetaData('presentation.audience', v)}
                                    placeholder="対象者"
                                    className="meta-field-input"
                                />
                            </div>
                            <div className="meta-field-row">
                                <strong>目的:</strong>
                                <EditableInput
                                    value={presentation.purpose || ''}
                                    onChange={(v) => onUpdate.updateMetaData('presentation.purpose', v)}
                                    placeholder="プレゼンの目的"
                                    className="meta-field-input"
                                />
                            </div>
                            <div className="meta-field-row">
                                <strong>トーン:</strong>
                                <EditableInput
                                    value={presentation.tone || ''}
                                    onChange={(v) => onUpdate.updateMetaData('presentation.tone', v)}
                                    placeholder="プロフェッショナル、カジュアル等"
                                    className="meta-field-input"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <h2>{documentTitle || '名称未設定のプレゼンテーション'}</h2>
                            {presentation.audience && <div><strong>ターゲット読者:</strong> {presentation.audience}</div>}
                            {presentation.purpose && <div><strong>目的:</strong> {presentation.purpose}</div>}
                            {presentation.tone && <div><strong>トーン:</strong> {presentation.tone}</div>}
                        </>
                    )}
                    <div className="pptx-meta-pills">
                        <span className="pill">全 {slides.length} スライド</span>
                        <span className="pill">レイアウト: {presentation.layout === 'LAYOUT_STANDARD' ? '4:3' : '16:9'}</span>
                        {presentation.includeCover && <span className="pill">表紙あり</span>}
                        {presentation.includeAgenda && <span className="pill">アジェンダあり</span>}
                    </div>
                </div>

                {/* テーマプレビューセクション */}
                <ThemeInfoSection theme={theme} onUpdate={isEditable ? onUpdate : null} />
            </div>

            {/* スライド入力セクション */}
            <div className="pptx-preview-slides">
                {/* 最初のスライドの前に追加ボタン */}
                {isEditable && (
                    <AddSlideButton onAdd={(type) => onUpdate.addSlide(0, type)} />
                )}
                {slides.map((slide, index) => (
                    <React.Fragment key={index}>
                        <SlideDataSection
                            slide={slide}
                            index={index}
                            totalSlides={slides.length}
                            onUpdate={isEditable ? onUpdate : null}
                            originalSlide={originalSpec?.slides?.[index]}
                        />
                        {/* スライド間に追加ボタン */}
                        {isEditable && (
                            <AddSlideButton onAdd={(type) => onUpdate.addSlide(index + 1, type)} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* フッター */}
            <div className="pptx-preview-footer">
                <p>
                    {isEditable ? (
                        <>
                            このビューでスライド構成を直接編集できます。<br/>
                            変更はビジュアルプレビューにリアルタイム反映されます。<br/>
                            上部の「PPTXをダウンロード」で編集済みファイルを出力します。
                        </>
                    ) : (
                        <>
                            このプレビューは生成されるスライドの<strong>入力構成情報</strong>を表示しています。<br/>
                            上部の「PPTXをダウンロード」ボタンをクリックすると、<br/>
                            ネイティブなPowerPoint形式（.pptx）としてダウンロードが開始されます。
                        </>
                    )}
                </p>
            </div>
        </div>
    );
};

export default PptxStructureView;
