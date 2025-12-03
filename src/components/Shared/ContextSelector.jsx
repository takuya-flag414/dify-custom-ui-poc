// src/components/Shared/ContextSelector.jsx
import React, { useState } from 'react';
// FileIcon等は必要に応じてインポート

/**
 * ContextSelector
 * 検索設定（RAG有効化、Web検索モード、ドメインフィルタ）を一元管理するUI
 * CSS: src/index.css に準拠
 */
const ContextSelector = ({ settings, onSettingsChange }) => {
    // Mode: 'list' | 'wizard' (ドメイン追加ウィザード用)
    const [uiMode, setUiMode] = useState('list');

    // Wizard States
    const [urlInput, setUrlInput] = useState('');
    const [filterType, setFilterType] = useState('allow'); // 'allow' | 'deny'
    const [errorMsg, setErrorMsg] = useState('');

    // Manual Input State
    const [manualInput, setManualInput] = useState('');

    // --- Helpers ---
    const updateSetting = (key, value) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    const filters = settings.domainFilters || [];

    // --- List Mode Logic ---
    const handleManualKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(manualInput);
            setManualInput('');
        } else if (e.key === 'Backspace' && !manualInput && filters.length > 0) {
            removeTag(filters.length - 1);
        }
    };

    const addTag = (val) => {
        const trimmed = val.trim();
        if (!trimmed) return;
        if (!filters.includes(trimmed)) {
            updateSetting('domainFilters', [...filters, trimmed]);
        }
    };

    const removeTag = (index) => {
        updateSetting('domainFilters', filters.filter((_, i) => i !== index));
    };

    // --- Wizard Logic ---
    const handleUrlAdd = () => {
        setErrorMsg('');
        if (!urlInput.trim()) return;

        try {
            const rawUrl = urlInput.trim();
            const safeUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
            const urlObj = new URL(safeUrl);
            let hostname = urlObj.hostname;
            hostname = hostname.replace(/^www\./, '');

            const finalTag = filterType === 'deny' ? `-${hostname}` : hostname;
            addTag(finalTag);

            setUrlInput('');
            setUiMode('list');
        } catch (e) {
            setErrorMsg('正しいURLを入力してください (例: https://example.com)');
        }
    };

    // --- RENDER: Wizard View (ドメイン追加画面) ---
    if (uiMode === 'wizard') {
        return (
            <div className="domain-wizard-container">
                <div className="wizard-header">
                    <button onClick={() => setUiMode('list')} className="wizard-back-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        戻る
                    </button>
                    <span className="wizard-title">サイトを追加</span>
                    <div style={{ width: 32 }}></div> {/* Spacer for alignment */}
                </div>

                <div className="segmented-control" style={{ marginBottom: '16px' }}>
                    <div
                        className={`segmented-option ${filterType === 'allow' ? 'selected' : ''}`}
                        onClick={() => setFilterType('allow')}
                    >
                        検索対象
                    </div>
                    <div
                        className={`segmented-option ${filterType === 'deny' ? 'selected deny-mode' : ''}`}
                        onClick={() => setFilterType('deny')}
                    >
                        除外対象
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="wizard-label">URL / リンク</label>
                    <input
                        className="wizard-input"
                        placeholder="https://example.com/article..."
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        autoFocus
                    />
                    {errorMsg && <p style={{ fontSize: '11px', color: 'var(--color-error)', marginTop: '4px' }}>{errorMsg}</p>}
                    <p className="wizard-description">
                        URLからドメインを自動抽出し、サイト全体を対象にします。
                    </p>
                </div>

                <button
                    className="btn-primary-action"
                    onClick={handleUrlAdd}
                    disabled={!urlInput}
                >
                    リストに追加
                </button>
            </div>
        );
    }

    // --- RENDER: Main View ---
    return (
        <div className="context-selector-panel">

            {/* 1. Internal Knowledge (RAG) Switch */}
            <div
                className={`rag-switch-card ${settings.ragEnabled ? 'active' : ''}`}
                onClick={() => updateSetting('ragEnabled', !settings.ragEnabled)}
            >
                <div className="rag-content">
                    <div className="rag-icon-badge">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                    </div>
                    <div className="rag-text-group">
                        <span className="rag-title">社内ナレッジを参照</span>
                        <span className="rag-desc">社内ドキュメントや規定を検索します</span>
                    </div>
                </div>
                {/* Visual Toggle Input */}
                <input
                    type="checkbox"
                    className="toggle-input"
                    checked={settings.ragEnabled}
                    readOnly
                />
            </div>

            <hr className="context-divider" />

            {/* 2. Web Search Mode (Segmented Control) */}
            <div>
                <div className="context-section-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    Web検索設定
                </div>

                <div className="segmented-control">
                    <div
                        className={`segmented-option ${settings.webMode === 'auto' ? 'selected' : ''}`}
                        onClick={() => updateSetting('webMode', 'auto')}
                    >
                        Auto (AI判断)
                    </div>
                    <div
                        className={`segmented-option ${settings.webMode === 'force' ? 'selected' : ''}`}
                        onClick={() => updateSetting('webMode', 'force')}
                    >
                        Force (強制)
                    </div>
                    <div
                        className={`segmented-option ${settings.webMode === 'off' ? 'selected' : ''}`}
                        onClick={() => updateSetting('webMode', 'off')}
                    >
                        Off (無効)
                    </div>
                </div>
            </div>

            {/* 3. Domain Filter (Disabled when Web Search is Off) */}
            <div className={`domain-filter-area ${settings.webMode === 'off' ? 'disabled' : ''}`}>
                {filters.length === 0 ? (
                    <div className="domain-add-btn-row" onClick={() => setUiMode('wizard')}>
                        <div className="domain-add-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </div>
                        <div className="domain-add-text">
                            <span className="domain-add-title">検索対象サイトを追加...</span>
                            <span className="domain-add-desc">指定がない場合はWeb全体を検索</span>
                        </div>
                    </div>
                ) : (
                    <div className="domain-tag-container" style={{ marginTop: '8px' }}>
                        {filters.map((filter, index) => {
                            const isDeny = filter.startsWith('-');
                            return (
                                <span key={index} className={`domain-tag ${isDeny ? 'deny' : 'allow'}`}>
                                    {isDeny ? (
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                    ) : (
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                    )}
                                    <span style={{ paddingTop: '1px' }}>{filter.replace(/^-/, '')}</span>
                                    <button onClick={() => removeTag(index)} className="domain-tag-close">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                </span>
                            );
                        })}
                        <input
                            className="domain-input"
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            onKeyDown={handleManualKeyDown}
                            placeholder="入力してEnter..."
                        />
                    </div>
                )}

                {filters.length > 0 && (
                    <button className="text-link" onClick={() => setUiMode('wizard')}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                        URLから一括追加
                    </button>
                )}
            </div>
        </div>
    );
};

export default ContextSelector;