// src/components/DomainTagger.jsx
import React, { useState } from 'react';

const DomainTagger = ({ filters, setFilters, forceSearch, setForceSearch }) => {
    // Mode: 'list' | 'wizard'
    const [mode, setMode] = useState('list');

    // Wizard States
    const [urlInput, setUrlInput] = useState('');
    const [filterType, setFilterType] = useState('allow'); // 'allow' | 'deny'
    const [errorMsg, setErrorMsg] = useState('');

    // Manual Input State (List Mode)
    const [manualInput, setManualInput] = useState('');

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
            setFilters([...filters, trimmed]);
        }
    };

    const removeTag = (index) => {
        setFilters(filters.filter((_, i) => i !== index));
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

            // Reset & Back
            setUrlInput('');
            setMode('list');
        } catch (e) {
            setErrorMsg('正しいURLを入力してください (例: https://example.com)');
        }
    };

    // ★ RENDER: Wizard View
    if (mode === 'wizard') {
        return (
            <div className="domain-wizard-container">
                <div className="wizard-header">
                    <button onClick={() => setMode('list')} className="wizard-back-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        戻る
                    </button>
                    <span className="wizard-title">サイトを追加</span>
                    <div className="w-8"></div>
                </div>

                <div className="segmented-control mb-4">
                    <div
                        className={`segmented-option ${filterType === 'allow' ? 'selected' : ''}`}
                        onClick={() => setFilterType('allow')}
                    >
                        このサイトを検索
                    </div>
                    <div
                        className={`segmented-option ${filterType === 'deny' ? 'selected deny-mode' : ''}`}
                        onClick={() => setFilterType('deny')}
                    >
                        このサイトを除外
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="wizard-label">URL / リンク</label>
                    <input
                        className="wizard-input"
                        placeholder="https://example.com/article..."
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        autoFocus
                    />
                    {errorMsg && <p className="text-xs text-red-500 mt-1">{errorMsg}</p>}

                    <p className="wizard-description">
                        記事やトップページのURLを貼り付けてください。<br />
                        自動的にドメインを抽出し、サイト全体を対象にします。
                    </p>
                </div>

                <button
                    className="btn-primary-action mt-4"
                    onClick={handleUrlAdd}
                    disabled={!urlInput}
                >
                    {filterType === 'allow' ? '検索対象に追加' : '除外リストに追加'}
                </button>
            </div>
        );
    }

    // ★ RENDER: List View (Default)
    return (
        <div className="flex flex-col">

            {/* 1. Toggle Switch */}
            <div className="toggle-switch-container mb-2" onClick={() => setForceSearch(!forceSearch)}>
                <div className="toggle-switch-label">
                    <span className="toggle-switch-title">Web検索を強制する</span>
                    <span className="toggle-switch-desc">
                        {forceSearch ? "AIの判断を待たずに検索します" : "AIが必要に応じて検索します (Auto)"}
                    </span>
                </div>
                <input
                    type="checkbox"
                    className="toggle-input"
                    checked={forceSearch}
                    onChange={() => { }}
                />
            </div>

            <div className="border-t border-gray-100 my-2"></div>

            {/* 2. Tag List OR Empty State */}
            {filters.length === 0 ? (
                <div className="empty-state-message">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-500 mb-3 shadow-sm">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">現在、Web全体を検索します</span>
                    <span className="text-xs text-gray-400 mt-1">特定のサイトに絞り込むことも可能です</span>
                </div>
            ) : (
                <div className="domain-tag-container my-2">
                    {filters.map((filter, index) => {
                        const isDeny = filter.startsWith('-');
                        return (
                            <span key={index} className={`domain-tag ${isDeny ? 'deny' : 'allow'}`}>
                                {isDeny ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-75"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                ) : (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-75"><polyline points="20 6 9 17 4 12" /></svg>
                                )}
                                <span className="pt-[1px]">{filter.replace(/^-/, '')}</span>
                                <button
                                    onClick={() => removeTag(index)}
                                    className="domain-tag-close"
                                    title="削除"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </span>
                        );
                    })}

                    <input
                        className="domain-input"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        onKeyDown={handleManualKeyDown}
                        placeholder="直接入力..."
                    />
                </div>
            )}

            {/* 3. Wizard Button */}
            <button className="btn-add-url" onClick={() => setMode('wizard')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                URLからサイトを追加・除外...
            </button>
        </div>
    );
};

export default DomainTagger;