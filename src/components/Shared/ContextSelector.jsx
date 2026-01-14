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

// ✨ Sparkles (オート)
const SparklesIcon = () => (
    <svg {...iconProps}>
        <path d="M12 2L14.4 7.2L20 9.6L14.4 12L12 17.2L9.6 12L4 9.6L9.6 7.2L12 2Z" />
    </svg>
);

// ⚡ Zap (スピード)
const ZapIcon = () => (
    <svg {...iconProps}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
);

// � RocketLaunch (ハイブリッド)
const RocketLaunchIcon = () => (
    <svg {...iconProps}>
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.01-.09-2.79a1.993 1.993 0 0 0-2.91.09z"></path>
        <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
    </svg>
);

// 🏢 BuildingOffice (社内データ)
const BuildingOfficeIcon = () => (
    <svg {...iconProps}>
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
        <path d="M9 22v-4h6v4"></path>
        <path d="M8 6h.01"></path>
        <path d="M16 6h.01"></path>
        <path d="M12 6h.01"></path>
        <path d="M12 10h.01"></path>
        <path d="M12 14h.01"></path>
        <path d="M16 10h.01"></path>
        <path d="M16 14h.01"></path>
        <path d="M8 10h.01"></path>
        <path d="M8 14h.01"></path>
    </svg>
);

// 🌏 GlobeAlt (Web検索)
const GlobeAltIcon = () => (
    <svg {...iconProps}>
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M2 12h20"></path>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
);

// --- Mode Definitions ---
const MODES = [
    {
        id: 'standard',
        label: 'オート',
        desc: 'AIがRAGとWeb検索の必要性を判断します',
        icon: <SparklesIcon />,
        settings: { ragEnabled: 'auto', webMode: 'auto' },
        colorClass: 'mode-standard',
        isDefault: true
    },
    {
        id: 'fast',
        label: 'スピード',
        desc: '最速で応答。出典は省略します',
        icon: <ZapIcon />,
        settings: { ragEnabled: false, webMode: 'off' },
        colorClass: 'mode-fast'
    },
    {
        id: 'hybrid',
        label: 'ハイブリッド',
        desc: '社内とWebを統合して徹底調査',
        icon: <RocketLaunchIcon />,
        settings: { ragEnabled: true, webMode: 'auto' },
        colorClass: 'mode-hybrid'
    },
    {
        id: 'enterprise',
        label: '社内データ',
        desc: '社内情報のみ。外部検索なし',
        icon: <BuildingOfficeIcon />,
        settings: { ragEnabled: true, webMode: 'off' },
        colorClass: 'mode-enterprise'
    },
    {
        id: 'deep',
        label: 'Web検索',
        desc: '最新のWeb情報を検索します',
        icon: <GlobeAltIcon />,
        settings: { ragEnabled: false, webMode: 'force' },
        colorClass: 'mode-deep'
    }
];

const ContextSelector = ({ settings, onSettingsChange }) => {
    const [view, setView] = useState('main'); // 'main' | 'domains'
    const [urlInput, setUrlInput] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const currentModeId = useMemo(() => {
        const { ragEnabled, webMode } = settings;
        // 'auto' モード判定を最優先
        if (ragEnabled === 'auto' && webMode === 'auto') return 'standard';
        // 明示的にtrueの場合
        if (ragEnabled === true && webMode !== 'off') return 'hybrid';
        if (ragEnabled === true && webMode === 'off') return 'enterprise';
        // 明示的にfalseの場合
        if (ragEnabled === false && webMode === 'force') return 'deep';
        if (ragEnabled === false && webMode === 'off') return 'fast';
        // フォールバック
        return 'standard';
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
                                    <GlobeAltIcon />
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
                        <GlobeAltIcon />
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