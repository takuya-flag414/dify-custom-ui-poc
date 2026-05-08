// src/components/Artifacts/JsonSlide/SlideFormEditor.jsx
// layout_type に応じてフォームフィールドを動的に切り替えるコンポーネント
import React, { useCallback } from 'react';
import { getAvailableThemeIds } from './config/themeRegistry';
import { IS_DEV_MODE } from '../../../config/devMode';

// ======================================
// 汎用フォームパーツ
// ======================================

/** テキスト入力（シングルライン） */
const TextInput = ({ label, value, onChange, placeholder = '', required = false }) => {
    const hasError = required && !value?.trim();
    return (
        <div className="form-field">
            <label className="form-field-label">
                {label}{required && ' *'}
                <span className="markdown-hint"> (Markdown可)</span>
            </label>
            <input
                type="text"
                className={`form-field-input${hasError ? ' has-error' : ''}`}
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder || label}
            />
            {hasError && <span className="form-field-error-msg">必須項目です</span>}
        </div>
    );
};

/** テキストエリア（複数行） */
const TextareaInput = ({ label, value, onChange, rows = 3, placeholder = '' }) => (
    <div className="form-field">
        <label className="form-field-label">
            {label}
            <span className="markdown-hint"> (Markdown可)</span>
        </label>
        <textarea
            className="form-field-textarea"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder || label}
        />
    </div>
);

/** セレクトボックス */
const SelectInput = ({ label, value, onChange, options }) => (
    <div className="form-field">
        <label className="form-field-label">{label}</label>
        <select
            className="form-field-select"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

/** 削除アイコン（SVG） */
const DeleteIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

/** 追加アイコン（SVG） */
const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

/** セクション区切り */
const SectionDivider = ({ title }) => (
    <>
        <div className="form-section-divider" />
        {title && <p className="form-section-title">{title}</p>}
    </>
);

// ======================================
// 箇条書きリストエディタ（content_slide / split_slide 等）
// ======================================

// ======================================
// アジェンダ / タイムライン / ステップ系リストエディタ
// ======================================
const ItemListEditor = ({ label, items, onChange, fields }) => {
    // fields: [{ key, label, placeholder, type }]
    const safeItems = Array.isArray(items) ? items : [];

    const handleChange = useCallback((idx, key, val) => {
        const next = safeItems.map((item, i) =>
            i === idx ? { ...item, [key]: val } : item
        );
        onChange(next);
    }, [safeItems, onChange]);

    const handleAdd = useCallback(() => {
        const empty = {};
        fields.forEach(f => { empty[f.key] = ''; });
        onChange([...safeItems, empty]);
    }, [safeItems, onChange, fields]);

    const handleChildDelete = useCallback((idx) => {
        onChange(safeItems.filter((_, i) => i !== idx));
    }, [safeItems, onChange]);

    return (
        <div className="form-field">
            <label className="form-field-label">
                {label}
                <span className="markdown-hint"> (Markdown可)</span>
            </label>
            <div className="list-editor">
                {safeItems.map((item, idx) => (
                    <div key={idx} className="list-editor-item">
                        <span className="list-editor-item-number">{idx + 1}</span>
                        <div className="list-editor-item-inputs">
                            {fields.map(f => {
                                if (f.type === 'textarea') {
                                    return (
                                        <textarea
                                            key={f.key}
                                            className="form-field-textarea"
                                            value={item?.[f.key] || ''}
                                            onChange={e => handleChange(idx, f.key, e.target.value)}
                                            placeholder={f.placeholder || f.label}
                                            rows={2}
                                        />
                                    );
                                } else if (f.type === 'select') {
                                    return (
                                        <div key={f.key} className="form-field-item-select-wrapper">
                                            <span style={{ fontSize: 10, opacity: 0.6, marginBottom: 2, display: 'block' }}>{f.label}</span>
                                            <select
                                                className="form-field-select"
                                                style={{ padding: '4px 8px', fontSize: 12, height: 'auto' }}
                                                value={item?.[f.key] || ''}
                                                onChange={e => handleChange(idx, f.key, e.target.value)}
                                            >
                                                {(f.options || []).map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <input
                                            key={f.key}
                                            type="text"
                                            className="form-field-input"
                                            value={item?.[f.key] || ''}
                                            onChange={e => handleChange(idx, f.key, e.target.value)}
                                            placeholder={f.placeholder || f.label}
                                        />
                                    );
                                }
                            })}
                        </div>
                        <button
                            type="button"
                            className="list-editor-delete-btn"
                            onClick={() => handleChildDelete(idx)}
                            title="削除"
                        >
                            <DeleteIcon />
                        </button>
                    </div>
                ))}
                <button type="button" className="list-editor-add-btn" onClick={handleAdd}>
                    <PlusIcon /> 追加
                </button>
            </div>
        </div>
    );
};

// ======================================
// グラフデータエディタ（chart_slide）
// ======================================
const ChartDataEditor = ({ data, onChange }) => {
    const safeData = Array.isArray(data) ? data : [];

    const handleChange = useCallback((idx, key, val) => {
        const next = safeData.map((item, i) =>
            i === idx ? { ...item, [key]: key === 'value' ? val : val } : item
        );
        onChange(next);
    }, [safeData, onChange]);

    const handleAdd = useCallback(() => {
        onChange([...safeData, { label: '', value: 0 }]);
    }, [safeData, onChange]);

    const handleDelete = useCallback((idx) => {
        onChange(safeData.filter((_, i) => i !== idx));
    }, [safeData, onChange]);

    // 数値入力バリデーション
    const handleValueChange = (idx, raw) => {
        const num = parseFloat(raw);
        handleChange(idx, 'value', isNaN(num) ? 0 : num);
    };

    return (
        <div className="form-field">
            <label className="form-field-label">グラフデータ</label>
            <div className="chart-data-editor">
                <div className="chart-data-header-row">
                    <span className="chart-data-header-cell">ラベル</span>
                    <span className="chart-data-header-cell">数値</span>
                    <span className="chart-data-header-cell" />
                </div>
                {safeData.map((item, idx) => (
                    <div key={idx} className="chart-data-row">
                        <input
                            type="text"
                            className="form-field-input"
                            value={item?.label || ''}
                            onChange={e => handleChange(idx, 'label', e.target.value)}
                            placeholder="ラベル"
                        />
                        <input
                            type="number"
                            className="form-field-input chart-data-value-input"
                            value={item?.value ?? 0}
                            onChange={e => handleValueChange(idx, e.target.value)}
                            placeholder="0"
                        />
                        <button
                            type="button"
                            className="list-editor-delete-btn"
                            onClick={() => handleDelete(idx)}
                            title="削除"
                        >
                            <DeleteIcon />
                        </button>
                    </div>
                ))}
                <button type="button" className="list-editor-add-btn" onClick={handleAdd}>
                    <PlusIcon /> データを追加
                </button>
            </div>
        </div>
    );
};

// ======================================
// layout_type 別フォーム定義
// ======================================

const CHART_TYPES = [
    { value: 'bar', label: '棒グラフ' },
    { value: 'line', label: '折れ線グラフ' },
    { value: 'pie', label: '円グラフ' },
];

const THEMES = getAvailableThemeIds().map(themeId => ({
    value: themeId,
    label: themeId // 本来は displayName があると良いが、レジストリから取得するように後で調整可能
}));

// ======================================
// SlideFormEditor - メインエクスポート
// ======================================

/**
 * SlideFormEditor
 * @param {Object} slide - { id, layout_type, content }
 * @param {string} globalTheme - プレゼン全体のテーマ
 * @param {function} onSlideChange - (updatedSlide) => void
 * @param {function} onThemeChange - (theme) => void
 */
const SlideFormEditor = ({ slide, globalTheme, onSlideChange, onThemeChange }) => {
    if (!slide) {
        return <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, padding: 8 }}>スライドを選択してください</p>;
    }

    const { layout_type, content = {} } = slide;

    // コンテンツの特定フィールドを更新するヘルパー
    const updateContent = useCallback((key, value) => {
        onSlideChange({ ...slide, content: { ...content, [key]: value } });
    }, [slide, content, onSlideChange]);

    // ======================================
    // layout_type 別フォームレンダリング
    // ======================================

    const renderForm = () => {
        switch (layout_type) {

            // ---- タイトルスライド ----
            case 'title_slide':
                return (
                    <>
                        <TextInput label="タイトル" value={content.title} onChange={v => updateContent('title', v)} required />
                        <TextareaInput label="サブタイトル" value={content.subtitle} onChange={v => updateContent('subtitle', v)} rows={2} />
                        
                        <SectionDivider title="装飾・ブランド" />
                        <TextInput label="ロゴテキスト" value={content.logo_text} onChange={v => updateContent('logo_text', v)} placeholder="例: PRESENTATION" />
                        <TextInput label="眉題 (Eyebrow)" value={content.eyebrow} onChange={v => updateContent('eyebrow', v)} placeholder="例: 2024 Strategy" />
                        
                        <SectionDivider title="メタ情報" />
                        <TextInput label="著者・発表者" value={content.author} onChange={v => updateContent('author', v)} placeholder="氏名 / 組織名" />
                        <TextInput label="日付" value={content.date} onChange={v => updateContent('date', v)} placeholder="YYYY年MM月DD日" />
                    </>
                );

            // ---- コンテンツスライド ----
            case 'content_slide':
                return (
                    <>
                        <TextInput label="タイトル" value={content.title} onChange={v => updateContent('title', v)} required />
                        
                        <SectionDivider title="要約 / キーメッセージ" />
                        <TextareaInput 
                            label="キーメッセージ（スライド上部に強調表示）" 
                            value={content.key_message} 
                            onChange={v => updateContent('key_message', v)} 
                            rows={2} 
                            placeholder="このスライドで最も伝えたい結論を入力してください"
                        />

                        <SectionDivider title="レイアウト設定" />
                        <SelectInput
                            label="箇条書きの列数"
                            value={content.layout_variation || 'one-column'}
                            onChange={v => updateContent('layout_variation', v)}
                            options={[
                                { value: 'one-column', label: '1列 (標準)' },
                                { value: 'two-column', label: '2列 (高密度)' },
                            ]}
                        />

                        <SectionDivider title="詳細内容" />
                        <TextareaInput 
                            label="本文（箇条書き可）" 
                            value={content.body_text} 
                            onChange={v => updateContent('body_text', v)} 
                            rows={6} 
                            placeholder="- 項目1&#10;- 項目2"
                        />

                        <SectionDivider title="注釈 (フッター)" />
                        <TextareaInput 
                            label="注釈テキスト" 
                            value={Array.isArray(content.annotations) ? content.annotations.join('\n') : content.annotations} 
                            onChange={v => updateContent('annotations', v.split('\n'))} 
                            rows={2}
                        />
                    </>
                );

            // ---- セクションスライド ----
            case 'section_slide':
                return (
                    <>
                        <TextInput label="セクションタイトル" value={content.title} onChange={v => updateContent('title', v)} required />
                        <TextareaInput label="サブタイトル" value={content.subtitle} onChange={v => updateContent('subtitle', v)} rows={2} />
                        
                        <SectionDivider title="注釈 (フッター)" />
                        <TextareaInput 
                            label="注釈テキスト" 
                            value={Array.isArray(content.annotations) ? content.annotations.join('\n') : content.annotations} 
                            onChange={v => updateContent('annotations', v.split('\n'))} 
                            rows={2}
                        />
                    </>
                );

            // ---- 引用スライド ----
            case 'quote_slide':
                return (
                    <>
                        <SectionDivider title="メッセージ / 引用文" />
                        <TextareaInput label="本文" value={content.quote} onChange={v => updateContent('quote', v)} rows={4} required placeholder="このスライドで最も伝えたいメッセージを入力してください" />
                        
                        <SectionDivider title="発言者 / 出典情報" />
                        <TextInput label="氏名 / 出典名" value={content.author} onChange={v => updateContent('author', v)} placeholder="例: スティーブ・ジョブズ" />
                        <TextInput label="役職 / 肩書き" value={content.role} onChange={v => updateContent('role', v)} placeholder="例: Apple 共同創業者" />

                        <SectionDivider title="注釈 (フッター)" />
                        <TextareaInput 
                            label="注釈テキスト" 
                            value={Array.isArray(content.annotations) ? content.annotations.join('\n') : content.annotations} 
                            onChange={v => updateContent('annotations', v.split('\n'))} 
                            rows={2}
                        />
                    </>
                );

            // ---- 分割スライド ----
            case 'split_slide':
                return (
                    <>
                        <TextInput label="全体タイトル" value={content.title} onChange={v => updateContent('title', v)} required />
                        
                        <SectionDivider title="中央セパレーター" />
                        <TextInput label="対比アイコン / 文字" value={content.comparison_icon} onChange={v => updateContent('comparison_icon', v)} placeholder="例: VS, →, ⇔" />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <SectionDivider title="左セクション" />
                                <TextInput label="タイトル" value={content.left_title || content.left_label} onChange={v => updateContent('left_title', v)} placeholder="現状 / 課題" />
                                <TextareaInput label="本文（箇条書き可）" value={content.left_text || content.left_body} onChange={v => updateContent('left_text', v)} rows={6} />
                            </div>
                            <div>
                                <SectionDivider title="右セクション" />
                                <TextInput label="タイトル" value={content.right_title || content.right_label} onChange={v => updateContent('right_title', v)} placeholder="解決策 / 理想" />
                                <TextareaInput label="本文（箇条書き可）" value={content.right_text || content.right_body} onChange={v => updateContent('right_text', v)} rows={6} />
                            </div>
                        </div>

                        <SectionDivider title="注釈 (フッター)" />
                        <TextareaInput 
                            label="注釈テキスト" 
                            value={Array.isArray(content.annotations) ? content.annotations.join('\n') : content.annotations} 
                            onChange={v => updateContent('annotations', v.split('\n'))} 
                            rows={2}
                        />
                    </>
                );

            // ---- アジェンダスライド ----
            case 'agenda_slide':
                return (
                    <>
                        <TextInput label="タイトル" value={content.title} onChange={v => updateContent('title', v)} required />
                        <TextareaInput label="リード文 / 導入テキスト" value={content.lead_text} onChange={v => updateContent('lead_text', v)} rows={2} placeholder="アジェンダの概要や目的を入力してください" />
                        
                        <SectionDivider title="アジェンダ項目" />
                        <ItemListEditor
                            label="項目リスト"
                            items={content.items}
                            onChange={v => updateContent('items', v)}
                            fields={[
                                { key: 'label', label: '項目名', placeholder: 'アジェンダ項目' },
                                { key: 'description', label: '説明（任意）', placeholder: '説明テキスト', type: 'textarea' },
                            ]}
                        />

                        <SectionDivider title="注釈 (フッター)" />
                        <TextareaInput 
                            label="注釈テキスト" 
                            value={Array.isArray(content.annotations) ? content.annotations.join('\n') : content.annotations} 
                            onChange={v => updateContent('annotations', v.split('\n'))} 
                            rows={2}
                        />
                    </>
                );

            // ---- チャートスライド ----
            case 'chart_slide':
                return (
                    <>
                        <TextInput label="タイトル" value={content.title} onChange={v => updateContent('title', v)} required />
                        <SelectInput
                            label="グラフの種類"
                            value={content.chart_type || 'bar'}
                            onChange={v => updateContent('chart_type', v)}
                            options={CHART_TYPES}
                        />
                        <SectionDivider title="レイアウト設定" />
                        <SelectInput
                            label="レイアウト形式"
                            value={content.layout_variation || 'bottom-desc'}
                            onChange={v => updateContent('layout_variation', v)}
                            options={[
                                { value: 'two-column', label: '2カラム（左インサイト）' },
                                { value: 'bottom-desc', label: '下部インサイト' },
                            ]}
                        />
                        <TextInput label="キーメッセージ（インサイト）" value={content.key_message} onChange={v => updateContent('key_message', v)} placeholder="このデータから何が言えるか" />
                        <TextareaInput label="補足分析テキスト" value={content.body_text} onChange={v => updateContent('body_text', v)} rows={3} />
                        <SectionDivider title="データポイント" />
                        <ChartDataEditor data={content.data} onChange={v => updateContent('data', v)} />

                        <SectionDivider title="注釈 (フッター)" />
                        <TextareaInput 
                            label="注釈テキスト" 
                            value={Array.isArray(content.annotations) ? content.annotations.join('\n') : content.annotations} 
                            onChange={v => updateContent('annotations', v.split('\n'))} 
                            rows={2}
                        />
                    </>
                );

            // ---- 統計スライド ----
            case 'stats_slide':
                return (
                    <>
                        <TextInput label="タイトル" value={content.title} onChange={v => updateContent('title', v)} required />
                        
                        <SectionDivider title="レイアウト設定" />
                        <SelectInput
                            label="レイアウト形式"
                            value={content.layout_variation || 'default'}
                            onChange={v => updateContent('layout_variation', v)}
                            options={[
                                { value: 'default', label: '標準（フルワイド）' },
                                { value: 'two-column', label: '2カラム（左説明）' },
                            ]}
                        />
                        <TextareaInput 
                            label="説明文（補足テキスト）" 
                            value={content.body_text || content.description} 
                            onChange={v => updateContent('body_text', v)} 
                            rows={4} 
                            placeholder="主要な指標に関する背景や分析を入力してください"
                        />

                        <SectionDivider title="統計カード" />
                        <ItemListEditor
                            label="統計項目"
                            items={content.stats}
                            onChange={v => updateContent('stats', v)}
                            fields={[
                                { key: 'label', label: '指標名', placeholder: '例: 顧客満足度' },
                                { key: 'value', label: '値', placeholder: '例: 98' },
                                { key: 'unit', label: '単位', placeholder: '例: %' },
                                { key: 'subtext', label: '補足テキスト', placeholder: '例: 過去最高を更新' },
                            ]}
                        />

                        <SectionDivider title="注釈 (フッター)" />
                        <TextareaInput 
                            label="注釈テキスト" 
                            value={Array.isArray(content.annotations) ? content.annotations.join('\n') : content.annotations} 
                            onChange={v => updateContent('annotations', v.split('\n'))} 
                            rows={2}
                        />
                    </>
                );

            // ---- テーブルスライド ----
            case 'table_slide':
                return (
                    <>
                        <TextInput label="タイトル" value={content.title} onChange={v => updateContent('title', v)} required />
                        
                        <SectionDivider title="レイアウト設定" />
                        <SelectInput
                            label="レイアウト形式"
                            value={content.layout_variation || 'bottom-desc'}
                            onChange={v => updateContent('layout_variation', v)}
                            options={[
                                { value: 'two-column', label: '2カラム（左説明）' },
                                { value: 'bottom-desc', label: '下部説明' },
                            ]}
                        />
                        <TextareaInput 
                            label="説明文（補足テキスト）" 
                            value={content.body_text || content.description} 
                            onChange={v => updateContent('body_text', v)} 
                            rows={4} 
                            placeholder="表の内容に関する説明や、主要なポイントを入力してください"
                        />

                        <SectionDivider title="ヘッダー列（Markdown不可）" />
                        <TextInput label="列タイトル（カンマ区切り）" value={Array.isArray(content.headers) ? content.headers.join(', ') : content.headers} onChange={v => updateContent('headers', v.split(',').map(s => s.trim()))} />
                        <SectionDivider title="行データ（カンマ区切り）" />
                        <ItemListEditor
                            label="行"
                            items={(content.rows || []).map(r => ({ row: Array.isArray(r) ? r.join(', ') : r }))}
                            onChange={v => updateContent('rows', v.map(r => (r.row || '').split(',').map(s => s.trim())))}
                            fields={[
                                { key: 'row', label: 'セル（カンマ区切り）', placeholder: '値1, 値2, 値3' },
                            ]}
                        />

                        <SectionDivider title="注釈 (フッター)" />
                        <TextareaInput 
                            label="注釈テキスト" 
                            value={Array.isArray(content.annotations) ? content.annotations.join('\n') : content.annotations} 
                            onChange={v => updateContent('annotations', v.split('\n'))} 
                            rows={2}
                        />
                    </>
                );

            // ---- タイムラインスライド ----
            case 'timeline_slide':
                return (
                    <>
                        <TextInput label="タイトル" value={content.title} onChange={v => updateContent('title', v)} required />
                        
                        <SectionDivider title="レイアウト設定" />
                        <SelectInput
                            label="表示方向"
                            value={content.layout_variation || 'vertical'}
                            onChange={v => updateContent('layout_variation', v)}
                            options={[
                                { value: 'vertical', label: '垂直 (リスト形式)' },
                                { value: 'horizontal', label: '水平 (ロードマップ形式)' },
                            ]}
                        />

                        <SectionDivider title="イベント項目" />
                        <ItemListEditor 
                            label="タイムラインイベント" 
                            items={(content.events || []).map(e => ({
                                ...e,
                                label: e.label || e.year || e.step || ''
                            }))} 
                            onChange={v => updateContent('events', v)} 
                            fields={[
                                { key: 'label', label: '時期/ステップ', placeholder: '例: 2024年4月' },
                                { key: 'title', label: 'イベント名', placeholder: '例: サービス開始' },
                                { key: 'description', label: '詳細説明', type: 'textarea', placeholder: '具体的な内容を入力...' },
                            ]}
                        />

                        <SectionDivider title="注釈 (フッター)" />
                        <TextareaInput 
                            label="注釈テキスト" 
                            value={Array.isArray(content.annotations) ? content.annotations.join('\n') : content.annotations} 
                            onChange={v => updateContent('annotations', v.split('\n'))} 
                            rows={2}
                        />
                    </>
                );

            // ---- KPIダッシュボードスライド ----
            case 'kpi_dashboard_slide':
                return (
                    <>
                        <TextInput label="タイトル" value={content.title} onChange={v => updateContent('title', v)} required />
                        
                        <SectionDivider title="主要指標 (サマリー)" />
                        <ItemListEditor
                            label="サマリーKPI"
                            items={content.summary_kpis || (content.detail_kpis ? [] : (content.kpis || []).slice(0, 2))}
                            onChange={v => updateContent('summary_kpis', v)}
                            fields={[
                                { key: 'label', label: '指標名', placeholder: '例: 売上高' },
                                { key: 'value', label: '値', placeholder: '例: 1,200' },
                                { key: 'unit', label: '単位', placeholder: '例: 億円' },
                                { key: 'change', label: '前年比', placeholder: '例: +5.2%' },
                                { 
                                    key: 'trend', 
                                    label: '傾向', 
                                    type: 'select',
                                    options: [
                                        { value: 'up', label: '▲ 上昇' },
                                        { value: 'down', label: '▼ 下落' },
                                        { value: 'flat', label: '→ 横ばい' },
                                    ]
                                },
                            ]}
                        />

                        <SectionDivider title="分析インサイト" />
                        <TextareaInput 
                            label="補足分析テキスト" 
                            value={content.body_text} 
                            onChange={v => updateContent('body_text', v)} 
                            placeholder="KPIデータに対する考察やまとめ"
                            rows={3}
                        />

                        <SectionDivider title="詳細指標 (グリッド)" />
                        <ItemListEditor
                            label="詳細KPI"
                            items={content.detail_kpis || (content.summary_kpis ? [] : (content.kpis || []).slice(2, 8))}
                            onChange={v => updateContent('detail_kpis', v)}
                            fields={[
                                { key: 'label', label: '指標名', placeholder: '例: 海外比率' },
                                { key: 'value', label: '値', placeholder: '例: 45.2' },
                                { key: 'unit', label: '単位', placeholder: '例: %' },
                                { key: 'change', label: '前年比', placeholder: '例: +1.2pt' },
                                { 
                                    key: 'trend', 
                                    label: '傾向', 
                                    type: 'select',
                                    options: [
                                        { value: 'up', label: '▲ 上昇' },
                                        { value: 'down', label: '▼ 下落' },
                                        { value: 'flat', label: '→ 横ばい' },
                                    ]
                                },
                            ]}
                        />

                        <SectionDivider title="注釈 (フッター)" />
                        <TextareaInput 
                            label="注釈テキスト" 
                            value={Array.isArray(content.annotations) ? content.annotations.join('\n') : content.annotations} 
                            onChange={v => updateContent('annotations', v.split('\n'))} 
                            rows={2}
                        />
                    </>
                );

            // ---- プロセスフロースライド ----
            case 'process_flow_slide':
                return (
                    <>
                        <TextInput label="タイトル" value={content.title} onChange={v => updateContent('title', v)} required />
                        <TextInput label="キーメッセージ (インサイト)" value={content.key_message} onChange={v => updateContent('key_message', v)} placeholder="プロセス全体の要約や最も重要な点" />
                        <TextareaInput label="補足分析テキスト" value={content.body_text} onChange={v => updateContent('body_text', v)} rows={3} placeholder="プロセス全体の補足やポイントを入力してください" />
                        <SectionDivider title="ステップ" />
                        <ItemListEditor
                            label="プロセスステップ"
                            items={content.process_steps}
                            onChange={v => updateContent('process_steps', v)}
                            fields={[
                                { key: 'title', label: 'ステップ名', placeholder: 'ステップタイトル' },
                                { key: 'description', label: '説明（任意）', placeholder: 'ステップの説明', type: 'textarea' },
                            ]}
                        />
                        <SectionDivider title="注釈 (フッター)" />
                        <TextareaInput 
                            label="注釈テキスト" 
                            value={Array.isArray(content.annotations) ? content.annotations.join('\n') : content.annotations} 
                            onChange={v => updateContent('annotations', v.split('\n'))} 
                            rows={2}
                        />
                    </>
                );

            // ---- 画像+コンテンツスライド ----
            case 'image_content_slide':
                return (
                    <>
                        <TextInput label="タイトル" value={content.title} onChange={v => updateContent('title', v)} required />
                        
                        <SectionDivider title="レイアウト設定" />
                        <SelectInput
                            label="画像配置"
                            value={content.layout_variation || 'image-left'}
                            onChange={v => updateContent('layout_variation', v)}
                            options={[
                                { value: 'image-left', label: '画像左 / テキスト右' },
                                { value: 'image-right', label: 'テキスト左 / 画像右' },
                            ]}
                        />

                        <SectionDivider title="画像" />
                        <TextInput label="画像URL" value={content.image_url} onChange={v => updateContent('image_url', v)} placeholder="https://..." />
                        <TextInput label="画像の説明文（alt）" value={content.image_alt} onChange={v => updateContent('image_alt', v)} />
                        <TextInput label="画像のキャプション / 出典" value={content.image_caption} onChange={v => updateContent('image_caption', v)} placeholder="例: 出典: ○○白書 2024" />

                        <SectionDivider title="テキストコンテンツ" />
                        <TextareaInput label="本文（箇条書き可）" value={content.body_text} onChange={v => updateContent('body_text', v)} rows={6} />

                        <SectionDivider title="注釈 (フッター)" />
                        <TextareaInput 
                            label="注釈テキスト" 
                            value={Array.isArray(content.annotations) ? content.annotations.join('\n') : content.annotations} 
                            onChange={v => updateContent('annotations', v.split('\n'))} 
                            rows={2}
                        />
                    </>
                );

            // ---- プロフィールスライド ----
            case 'profile_slide':
                return (
                    <>
                        <SectionDivider title="基本情報" />
                        <TextInput label="氏名" value={content.name} onChange={v => updateContent('name', v)} required />
                        <TextInput label="役職 / 肩書き" value={content.role} onChange={v => updateContent('role', v)} />
                        
                        <SectionDivider title="画像設定" />
                        <TextInput label="プロフィール画像URL" value={content.image_url} onChange={v => updateContent('image_url', v)} placeholder="https://example.com/photo.jpg" />

                        <SectionDivider title="詳細・略歴" />
                        <TextareaInput label="略歴 / 自己紹介（箇条書き可）" value={content.bio} onChange={v => updateContent('bio', v)} rows={8} />

                        <SectionDivider title="注釈 (フッター)" />
                        <TextareaInput 
                            label="注釈テキスト" 
                            value={Array.isArray(content.annotations) ? content.annotations.join('\n') : content.annotations} 
                            onChange={v => updateContent('annotations', v.split('\n'))} 
                            rows={2}
                        />
                    </>
                );

            // ---- デフォルト（未対応のtype） ----
            default:
                return (
                    <>
                        <TextInput label="タイトル" value={content.title} onChange={v => updateContent('title', v)} />
                        <TextareaInput label="本文テキスト" value={content.body_text} onChange={v => updateContent('body_text', v)} rows={4} />
                    </>
                );
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* layout_type バッジ */}
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 16,
                padding: '4px 10px',
                background: 'rgba(0,122,255,0.08)',
                borderRadius: 6,
                alignSelf: 'flex-start',
            }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#007aff', letterSpacing: '0.04em' }}>
                    {layout_type}
                </span>
            </div>

            {/* スライド固有フォーム */}
            {renderForm()}

            {/* テーマ変更（全スライド共通） */}
            {IS_DEV_MODE && (
                <>
                    <SectionDivider title="プレゼン設定（全スライド共通）" />
                    <SelectInput
                        label="テーマ"
                        value={globalTheme}
                        onChange={onThemeChange}
                        options={THEMES}
                    />
                </>
            )}
        </div>
    );
};

export default SlideFormEditor;
