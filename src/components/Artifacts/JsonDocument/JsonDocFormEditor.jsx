import React from 'react';

const JsonDocFormEditor = ({ blocks, selectedIndex, onUpdateBlock }) => {
    if (selectedIndex === null || !blocks[selectedIndex]) {
        return (
            <div className="doc-form-editor">
                <div className="doc-editor-header">
                    <h3>ブロック編集</h3>
                </div>
                <div className="doc-editor-scroll">
                    <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
                        編集するブロックをプレビューから選択してください
                    </p>
                </div>
            </div>
        );
    }

    const block = blocks[selectedIndex];

    const handleChange = (field, value) => {
        const updatedBlock = { ...block, [field]: value };
        onUpdateBlock(selectedIndex, updatedBlock);
    };

    const renderEditorFields = () => {
        switch (block.type) {
            case 'heading':
                return (
                    <>
                        <div className="doc-editor-field">
                            <label className="doc-editor-label">見出しテキスト</label>
                            <input 
                                className="doc-editor-input"
                                value={block.text || ''}
                                onChange={(e) => handleChange('text', e.target.value)}
                            />
                        </div>
                        <div className="doc-editor-field">
                            <label className="doc-editor-label">レベル (1-3)</label>
                            <div className="doc-editor-item-list">
                                {[1, 2, 3].map(level => (
                                    <div 
                                        key={level}
                                        className={`doc-editor-item ${block.level === level ? 'active' : ''}`}
                                        onClick={() => handleChange('level', level)}
                                    >
                                        H{level} - {level === 1 ? '大見出し' : level === 2 ? '中見出し' : '小見出し'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                );

            case 'rich_text':
                return (
                    <div className="doc-editor-field">
                        <label className="doc-editor-label">本文 (Markdown形式対応)</label>
                        <textarea 
                            className="doc-editor-input doc-editor-textarea"
                            value={block.text || ''}
                            onChange={(e) => handleChange('text', e.target.value)}
                        />
                    </div>
                );

            case 'table':
                return (
                    <>
                        <div className="doc-editor-field">
                            <label className="doc-editor-label">ヘッダー (カンマ区切り)</label>
                            <input 
                                className="doc-editor-input"
                                value={(block.headers || []).join(', ')}
                                onChange={(e) => handleChange('headers', e.target.value.split(',').map(s => s.trim()))}
                            />
                        </div>
                        <div className="doc-editor-field">
                            <label className="doc-editor-label">データ (※簡易編集)</label>
                            <p style={{ fontSize: '12px', color: '#888' }}>
                                現在のPoC版ではテーブルデータの高度な編集は開発中です。
                            </p>
                        </div>
                    </>
                );

            case 'list':
                return (
                    <div className="doc-editor-field">
                        <label className="doc-editor-label">リスト項目 (1行1項目)</label>
                        <textarea 
                            className="doc-editor-input doc-editor-textarea"
                            value={(block.items || []).join('\n')}
                            onChange={(e) => handleChange('items', e.target.value.split('\n'))}
                        />
                    </div>
                );

            case 'chart':
                return (
                    <>
                        <div className="doc-editor-field">
                            <label className="doc-editor-label">グラフの種類</label>
                            <div className="doc-editor-item-list">
                                {['bar', 'line', 'pie'].map(type => (
                                    <div 
                                        key={type}
                                        className={`doc-editor-item ${block.chart_type === type ? 'active' : ''}`}
                                        onClick={() => handleChange('chart_type', type)}
                                    >
                                        {type === 'bar' ? '棒グラフ' : type === 'line' ? '折れ線グラフ' : '円グラフ'}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="doc-editor-field">
                            <label className="doc-editor-label">グラフのタイトル</label>
                            <input 
                                className="doc-editor-input"
                                value={block.title || ''}
                                onChange={(e) => handleChange('title', e.target.value)}
                            />
                        </div>
                        <div className="doc-editor-field">
                            <label className="doc-editor-label">データ (JSON形式)</label>
                            <textarea 
                                className="doc-editor-input doc-editor-textarea"
                                style={{ fontFamily: 'monospace', fontSize: '12px' }}
                                value={JSON.stringify(block.data || [], null, 2)}
                                onChange={(e) => {
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        handleChange('data', parsed);
                                    } catch (err) {
                                        // Ignore parse errors while typing
                                    }
                                }}
                            />
                        </div>
                    </>
                );

            case 'svg':
                return (
                    <div className="doc-editor-field">
                        <label className="doc-editor-label">SVG ソースコード</label>
                        <textarea 
                            className="doc-editor-input doc-editor-textarea"
                            style={{ fontFamily: 'monospace', fontSize: '11px' }}
                            value={block.content || ''}
                            onChange={(e) => handleChange('content', e.target.value)}
                        />
                    </div>
                );

            default:
                return <p>このブロックタイプの編集は未対応です</p>;
        }
    };

    return (
        <div className="doc-form-editor">
            <div className="doc-editor-header">
                <h3>{block.type.toUpperCase()} 編集</h3>
            </div>
            <div className="doc-editor-scroll">
                {renderEditorFields()}
            </div>
        </div>
    );
};

export default JsonDocFormEditor;
