// src/components/Shared/ContextSelector.jsx
import React, { useState, useMemo } from 'react';
import './ContextSelector.css';

// --- Icons (SVG) ---
const iconProps = {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
};

const CheckIcon = ({ className }) => (
    <svg className={className} {...iconProps}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const ChevronRightIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

const ChevronLeftIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

// 🌐 Web
const GlobeIcon = () => (
    <svg {...iconProps}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
);

// 📚 Database
const DatabaseIcon = () => (
    <svg {...iconProps}>
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
);

// ✨ Auto
const SparklesIcon = () => (
    <svg {...iconProps}>
        <path d="M12 2L14.4 7.2L20 9.6L14.4 12L12 17.2L9.6 12L4 9.6L9.6 7.2L12 2Z" />
    </svg>
);

// 📚+🌐 Layers (Hybrid)
const LayersIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
    </svg>
);

// ⚡ Fast
const ZapIcon = () => (
    <svg {...iconProps}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
);

// --- Mode Definitions ---
const MODES = [
    {
        id: 'fast',
        label: 'Fast',
        desc: 'AI知識ベースのみで即答',
        icon: <ZapIcon />,
        settings: { ragEnabled: false, webMode: 'off' },
        colorClass: 'mode-fast'
    },
    {
        id: 'standard',
        label: 'Standard',
        desc: '必要に応じてWeb検索をAI判断',
        icon: <SparklesIcon />,
        settings: { ragEnabled: false, webMode: 'auto' },
        colorClass: 'mode-standard'
    },
    {
        id: 'enterprise',
        label: 'Enterprise',
        desc: '社内ナレッジのみを参照',
        icon: <DatabaseIcon />,
        settings: { ragEnabled: true, webMode: 'off' },
        colorClass: 'mode-enterprise'
    },
    {
        id: 'deep',
        label: 'Research',
        desc: 'Web情報を強制的に検索',
        icon: <GlobeIcon />,
        settings: { ragEnabled: false, webMode: 'force' },
        colorClass: 'mode-deep'
    },
    {
        id: 'hybrid',
        label: 'Hybrid',
        desc: '社内とWebを統合して回答',
        icon: <LayersIcon />,
        settings: { ragEnabled: true, webMode: 'auto' },
        colorClass: 'mode-hybrid'
    }
];

const ContextSelector = ({ settings, onSettingsChange }) => {
    const [view, setView] = useState('main'); // 'main' | 'domains'
    const [urlInput, setUrlInput] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const currentModeId = useMemo(() => {
        const { ragEnabled, webMode } = settings;
        if (ragEnabled && webMode !== 'off') return 'hybrid';
        if (ragEnabled && webMode === 'off') return 'enterprise';
        if (!ragEnabled && webMode === 'force') return 'deep';
        if (!ragEnabled && webMode === 'auto') return 'standard';
        return 'fast';
    }, [settings]);

    const handleModeSelect = (modeId) => {
        const targetMode = MODES.find(m => m.id === modeId);
        if (targetMode) {
            onSettingsChange({
                ...settings,
                ...targetMode.settings
            });
        }
    };

    // --- Domain Management ---
    const filters = settings.domainFilters || [];

    const addFilter = () => {
        if (!urlInput.trim()) return;
        try {
            const rawUrl = urlInput.trim();
            const safeUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
            const urlObj = new URL(safeUrl);
            let hostname = urlObj.hostname.replace(/^www\./, '');

            if (!filters.includes(hostname)) {
                onSettingsChange({
                    ...settings,
                    domainFilters: [...filters, hostname]
                });
            }
            setUrlInput('');
            setErrorMsg('');
        } catch (e) {
            setErrorMsg('有効なURLを入力してください');
        }
    };

    const removeFilter = (index) => {
        const newFilters = filters.filter((_, i) => i !== index);
        onSettingsChange({ ...settings, domainFilters: newFilters });
    };

    // --- Render: Domain Settings View ---
    if (view === 'domains') {
        return (
            <div className="context-selector-container">
                <div className="domain-header">
                    <button
                        onClick={() => setView('main')}
                        className="back-btn"
                        title="戻る"
                    >
                        <ChevronLeftIcon />
                    </button>
                    <span className="domain-title">検索対象サイトの設定</span>
                </div>

                <div className="domain-input-row">
                    <input
                        className="domain-input-field"
                        placeholder="example.com"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addFilter()}
                        autoFocus
                    />
                    <button
                        onClick={addFilter}
                        disabled={!urlInput}
                        className="domain-add-btn"
                    >
                        追加
                    </button>
                </div>
                {errorMsg && <p className="error-msg">{errorMsg}</p>}

                <p className="domain-help">
                    特定のドメインを追加すると、そのサイト内のみを検索します。
                </p>

                <div className="domain-list">
                    {filters.length === 0 ? (
                        <div className="domain-empty">
                            指定なし (Web全体を検索)
                        </div>
                    ) : (
                        filters.map((filter, idx) => (
                            <div key={idx} className="domain-item">
                                <div className="domain-info">
                                    <GlobeIcon />
                                    <span>{filter}</span>
                                </div>
                                <button
                                    onClick={() => removeFilter(idx)}
                                    className="domain-delete-btn"
                                    title="削除"
                                >
                                    ×
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // --- Render: Main Mode Selection View ---
    const isWebActive = settings.webMode !== 'off';

    return (
        <div className="context-selector-container">
            <div className="context-section-label">
                検索モード
            </div>

            {MODES.map((mode) => {
                const isActive = currentModeId === mode.id;
                const activeClass = isActive ? `active ${mode.colorClass}` : '';
                return (
                    <button
                        key={mode.id}
                        onClick={() => handleModeSelect(mode.id)}
                        className={`mode-item ${activeClass}`}
                    >
                        <div className="mode-icon-wrapper">
                            {mode.icon}
                        </div>
                        <div className="mode-info">
                            <div className="mode-label">
                                {mode.label}
                            </div>
                            <div className="mode-desc">
                                {mode.desc}
                            </div>
                        </div>
                        {isActive && <CheckIcon className="check-icon" />}
                    </button>
                );
            })}

            {/* Advanced Settings Link (Unified List Item Style) */}
            <div className="advanced-options-wrapper-static">
                <div className="advanced-divider" />
                <button
                    onClick={() => isWebActive && setView('domains')}
                    className={`advanced-link ${!isWebActive ? 'disabled' : ''}`}
                    disabled={!isWebActive}
                    title={!isWebActive ? "Web検索モードでのみ設定可能です" : ""}
                >
                    <div className="advanced-icon-wrapper">
                        <GlobeIcon />
                    </div>

                    <div className="advanced-info">
                        <div className="advanced-label">検索対象サイト</div>
                        <div className="advanced-sub">
                            {isWebActive
                                ? (filters.length > 0 ? `${filters.length}件の指定あり` : 'Web全体')
                                : 'Web検索を必要とするモードのみ'} {/* 短縮テキスト */}
                        </div>
                    </div>

                    {isWebActive && (
                        <span className="chevron-icon">
                            <ChevronRightIcon />
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ContextSelector;