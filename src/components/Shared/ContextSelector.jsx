// src/components/Shared/ContextSelector.jsx
import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ContextSelector.css';

// Phase A: モックデータ (Phase Bで API経由に置き換え)
import { MOCK_STORES } from '../../mocks/storeData';

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

// 💬 ChatBubble (チャットのみ)
const ChatBubbleIcon = () => (
    <svg {...iconProps}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

// 🚀 RocketLaunch (ハイブリッド)
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

// 📁 Folder (ストア用)
const FolderIcon = () => (
    <svg {...iconProps}>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
);

// --- Mode Definitions ---
const MODES = [
    {
        id: 'standard',
        label: 'オート',
        desc: 'AIが情報源を自動判断',
        icon: <SparklesIcon />,
        settings: { ragEnabled: 'auto', webMode: 'auto' },
        colorClass: 'mode-standard',
        isDefault: true
    },
    {
        id: 'chat',
        label: 'チャットのみ',
        desc: '外部情報を参照せず、AIの知識のみで回答',
        icon: <ChatBubbleIcon />,
        settings: { ragEnabled: false, webMode: 'off' },
        colorClass: 'mode-chat'
    },
    {
        id: 'hybrid',
        label: 'ハイブリッド',
        desc: '社内とWebを統合して徹底調査',
        icon: <RocketLaunchIcon />,
        settings: { ragEnabled: true, webMode: 'auto' },
        colorClass: 'mode-hybrid',
        hasSubSettings: true,
        subSettingsView: 'domains'
    },
    {
        id: 'enterprise',
        label: '社内データ',
        desc: '社内情報のみ。Web検索なし',
        icon: <BuildingOfficeIcon />,
        settings: { ragEnabled: true, webMode: 'off' },
        colorClass: 'mode-enterprise',
        hasSubSettings: true,
        subSettingsView: 'stores'
    },
    {
        id: 'deep',
        label: 'Web検索',
        desc: '最新のWeb情報を検索',
        icon: <GlobeAltIcon />,
        settings: { ragEnabled: false, webMode: 'force' },
        colorClass: 'mode-deep',
        hasSubSettings: true,
        subSettingsView: 'domains'
    }
];

const PRIMARY_MODES = MODES.filter(m => ['standard', 'chat'].includes(m.id));
const ADVANCED_MODES = MODES.filter(m => !['standard', 'chat'].includes(m.id));

// --- Animation Variants ---
const slideVariants = {
    enterFromRight: { x: 50, opacity: 0 },
    enterFromLeft: { x: -50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exitToLeft: { x: -50, opacity: 0 },
    exitToRight: { x: 50, opacity: 0 }
};

const springTransition = { type: "spring", stiffness: 300, damping: 30 };

// --- Sub Components ---

// Mode Button with optional sub-settings chevron
const ModeButton = ({ mode, isActive, onClick, onSubSettingsClick }) => {
    const activeClass = isActive ? `active ${mode.colorClass}` : '';

    return (
        <div className={`mode-item-wrapper ${activeClass}`}>
            <button
                onClick={onClick}
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

            {/* Sub-settings navigation button */}
            {mode.hasSubSettings && isActive && (
                <button
                    className="mode-sub-settings-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSubSettingsClick(mode.subSettingsView);
                    }}
                    title={mode.subSettingsView === 'stores' ? 'ストア選択' : 'ドメイン設定'}
                >
                    <ChevronRightIcon />
                </button>
            )}
        </div>
    );
};

// Store Item component
const StoreItem = ({ store, isSelected, onClick }) => {
    return (
        <motion.button
            layout
            onClick={onClick}
            className={`store-item ${isSelected ? 'active' : ''}`}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(5, 150, 105, 0.08)" }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="store-icon-container">
                <FolderIcon />
            </div>
            <div className="store-info">
                <span className="store-name">{store.display_name}</span>
                <span className="store-desc">{store.description}</span>
            </div>
            {isSelected && (
                <motion.div
                    className="store-active-glow"
                    layoutId="storeGlow"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}
        </motion.button>
    );
};

// View Header with back button
const ViewHeader = ({ title, onBack }) => (
    <div className="view-header">
        <button className="back-btn" onClick={onBack}>
            <ChevronLeftIcon />
            <span>{title}</span>
        </button>
    </div>
);

// --- Main Component ---
const ContextSelector = ({ settings, onSettingsChange }) => {
    // View state: 'primary' | 'advanced' | 'stores' | 'domains'
    const [view, setView] = useState('primary');
    const [slideDirection, setSlideDirection] = useState('right');

    const [urlInput, setUrlInput] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [activeStoreId, setActiveStoreId] = useState(null);

    const currentModeId = useMemo(() => {
        const { ragEnabled, webMode } = settings;
        if (ragEnabled === 'auto' && webMode === 'auto') return 'standard';
        if (ragEnabled === true && webMode !== 'off') return 'hybrid';
        if (ragEnabled === true && webMode === 'off') return 'enterprise';
        if (ragEnabled === false && webMode === 'force') return 'deep';
        if (ragEnabled === false && webMode === 'off') return 'chat';
        return 'standard';
    }, [settings]);

    // Navigation helpers
    const navigateTo = (targetView, direction = 'right') => {
        setSlideDirection(direction);
        setView(targetView);
    };

    const goBack = (targetView) => {
        navigateTo(targetView, 'left');
    };

    // Mode selection handler
    const handleModeSelect = (modeId) => {
        const targetMode = MODES.find(m => m.id === modeId);
        if (targetMode) {
            onSettingsChange({
                ...settings,
                ...targetMode.settings
            });
            if (modeId !== 'enterprise') {
                setActiveStoreId(null);
            }
        }
    };

    // Domain management
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

    // Get animation initial/exit states based on direction
    const getAnimationState = () => ({
        initial: slideDirection === 'right' ? 'enterFromRight' : 'enterFromLeft',
        exit: slideDirection === 'right' ? 'exitToLeft' : 'exitToRight'
    });

    // --- Render Views ---

    // Primary view (Auto, Chat only, + link to Advanced)
    const renderPrimaryView = () => (
        <motion.div
            key="primary"
            variants={slideVariants}
            initial={getAnimationState().initial}
            animate="center"
            exit={getAnimationState().exit}
            transition={springTransition}
            className="view-content"
        >
            <div className="context-section-label">検索モード</div>

            <div className="primary-modes-group">
                {PRIMARY_MODES.map((mode) => (
                    <ModeButton
                        key={mode.id}
                        mode={mode}
                        isActive={currentModeId === mode.id}
                        onClick={() => handleModeSelect(mode.id)}
                        onSubSettingsClick={() => { }}
                    />
                ))}
            </div>

            <button
                onClick={() => navigateTo('advanced', 'right')}
                className="advanced-trigger-btn"
            >
                <span className="trigger-icon">
                    <ChevronRightIcon />
                </span>
                <span className="trigger-text">
                    情報源を手動で指定...
                </span>
            </button>
        </motion.div>
    );

    // Advanced view (Hybrid, Enterprise, Web)
    const renderAdvancedView = () => (
        <motion.div
            key="advanced"
            variants={slideVariants}
            initial={getAnimationState().initial}
            animate="center"
            exit={getAnimationState().exit}
            transition={springTransition}
            className="view-content"
        >
            <ViewHeader title="戻る" onBack={() => goBack('primary')} />

            <div className="advanced-divider-label">Manual Override</div>

            <div className="advanced-modes-group">
                {ADVANCED_MODES.map((mode) => (
                    <ModeButton
                        key={mode.id}
                        mode={mode}
                        isActive={currentModeId === mode.id}
                        onClick={() => handleModeSelect(mode.id)}
                        onSubSettingsClick={(targetView) => navigateTo(targetView, 'right')}
                    />
                ))}
            </div>
        </motion.div>
    );

    // Stores view (Enterprise sub-settings)
    const renderStoresView = () => (
        <motion.div
            key="stores"
            variants={slideVariants}
            initial={getAnimationState().initial}
            animate="center"
            exit={getAnimationState().exit}
            transition={springTransition}
            className="view-content"
        >
            <ViewHeader title="社内データ" onBack={() => goBack('advanced')} />

            <div className="sub-panel-header">
                <span className="label">Knowledge Base Channel</span>
                <span className="badge">Internal Only</span>
            </div>

            <div className="store-grid">
                {MOCK_STORES.map((store) => (
                    <StoreItem
                        key={store.id}
                        store={store}
                        isSelected={activeStoreId === store.id}
                        onClick={() => {
                            setActiveStoreId(store.id);
                            console.log('[PhaseA Mock] Selected Store ID:', store.id);
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );

    // Domains view (Hybrid/Web sub-settings)
    const renderDomainsView = () => (
        <motion.div
            key="domains"
            variants={slideVariants}
            initial={getAnimationState().initial}
            animate="center"
            exit={getAnimationState().exit}
            transition={springTransition}
            className="view-content"
        >
            <ViewHeader title="戻る" onBack={() => goBack('advanced')} />

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
        </motion.div>
    );

    return (
        <div className="context-selector-container">
            <AnimatePresence mode="wait" initial={false}>
                {view === 'primary' && renderPrimaryView()}
                {view === 'advanced' && renderAdvancedView()}
                {view === 'stores' && renderStoresView()}
                {view === 'domains' && renderDomainsView()}
            </AnimatePresence>
        </div>
    );
};

export default ContextSelector;