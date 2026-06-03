// src/components/Shared/ContextSelector.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ContextSelector.css';

// 表示制御フラグをインポート
import { ENABLE_WEB_SEARCH, ENABLE_INTERNAL_DATA } from '../../config/env';

// ViewHeaderとStoreSelectorは不要になったため削除
// import ViewHeader from './ViewHeader';
// import StoreSelector from './StoreSelector';

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

// --- Mode Definitions (v3.0: Flat structure) ---
const MAIN_MODES = [
    {
        id: 'chat',
        label: 'チャット',
        desc: '外部情報を参照せず回答',
        icon: <ChatBubbleIcon />,
        settings: { ragEnabled: false, webEnabled: false },
        colorClass: 'mode-chat',
    },
    {
        id: 'deep',
        label: 'Web検索',
        desc: '最新のWeb情報を検索',
        icon: <GlobeAltIcon />,
        settings: { ragEnabled: false, webEnabled: true },
        colorClass: 'mode-deep',
        hidden: !ENABLE_WEB_SEARCH, // 環境変数で制御
    },
];

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

// Mode Button (simple, no sub-settings chevron needed in v3.0)
const ModeButton = ({ mode, isActive, onClick }) => {
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
        </div>
    );
};

// --- Main Component ---
const ContextSelector = ({
    settings,
    onSettingsChange,
    onOpenStoreModal,
}) => {

    const currentModeId = useMemo(() => {
        const { ragEnabled, webEnabled } = settings;
        if (ragEnabled && webEnabled) return 'hybrid';
        if (ragEnabled && !webEnabled) return 'enterprise';
        if (!ragEnabled && webEnabled) return 'deep';
        return 'chat'; // デフォルト
    }, [settings]);

    // Mode selection handler
    const handleModeSelect = (modeId) => {
        const targetMode = MAIN_MODES.find(m => m.id === modeId);
        if (targetMode) {
            onSettingsChange({
                ...settings,
                ...targetMode.settings,
                // 非ストアモード選択時はストア選択をクリア
                selectedStoreId: null,
                selectedStoreName: null,
            });
        }
    };

    // --- Render Views ---

    // Main view (v3.0: All basic modes + Enterprise entry)
    const renderMainView = () => (
        <div className="view-content">
            <div className="context-section-label">検索モード</div>

            <div className="primary-modes-group">
                {MAIN_MODES.filter(m => !m.hidden).map((mode) => (
                    <ModeButton
                        key={mode.id}
                        mode={mode}
                        isActive={currentModeId === mode.id}
                        onClick={() => handleModeSelect(mode.id)}
                    />
                ))}

                {/* 社内データ > (Enterprise entry point) */}
                {ENABLE_INTERNAL_DATA && (
                    <div className={`mode-item-wrapper ${['enterprise', 'hybrid'].includes(currentModeId) ? `active mode-enterprise` : ''}`}>
                        <button
                            onClick={() => {
                                if (onOpenStoreModal) onOpenStoreModal();
                            }}
                            className={`mode-item ${['enterprise', 'hybrid'].includes(currentModeId) ? `active mode-enterprise` : ''}`}
                        >
                            <div className="mode-icon-wrapper">
                                <BuildingOfficeIcon />
                            </div>
                            <div className="mode-info">
                                <div className="mode-label">社内データ</div>
                                <div className="mode-desc">社内ナレッジを検索</div>
                            </div>
                            {['enterprise', 'hybrid'].includes(currentModeId) && <CheckIcon className="check-icon" />}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="context-selector-container">
            {renderMainView()}
        </div>
    );
};

export default ContextSelector;
