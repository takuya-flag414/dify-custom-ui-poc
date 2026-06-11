import React, { useState, useRef, useEffect, useMemo } from 'react';
import ContextSelector from '../../Shared/ContextSelector';
import StoreSelectorModal from '../../Shared/StoreSelectorModal';
import IntelligenceSelector from '../../Shared/IntelligenceSelector';
import IntelligenceSendButton from '../IntelligenceSendButton';
import PrivacyShieldButton from '../PrivacyShieldButton';
import UniversalAddMenu from './UniversalAddMenu'; // Import Add Menu
import { motion, AnimatePresence } from 'framer-motion';
import { SHOW_REASONING_SELECTOR } from '../../../config/env';
import { useGeminiStores } from '../../../hooks/useGeminiStores';

// --- Icons ---
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

const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const SparklesIcon = () => (
    <svg {...iconProps}>
        <path d="M12 2L14.4 7.2L20 9.6L14.4 12L12 17.2L9.6 12L4 9.6L9.6 7.2L12 2Z" />
    </svg>
);

const ChatBubbleIcon = () => (
    <svg {...iconProps}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

const RocketLaunchIcon = () => (
    <svg {...iconProps}>
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.01-.09-2.79a1.993 1.993 0 0 0-2.91.09z"></path>
        <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
    </svg>
);

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

const GlobeAltIcon = () => (
    <svg {...iconProps}>
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M2 12h20"></path>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
);

const SearchIcon = () => (
    <svg {...iconProps}>
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const ChevronUpIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
);

const CloseIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const RobotIcon = () => (
    <svg {...iconProps}>
        <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
        <circle cx="12" cy="5" r="2"></circle>
        <path d="M12 7v4"></path>
        <line x1="8" y1="16" x2="8.01" y2="16"></line>
        <line x1="16" y1="16" x2="16.01" y2="16"></line>
    </svg>
);

// --- Mode Logic ---
const getModeInfo = (settings) => {
    const { ragEnabled, webEnabled, domainFilters } = settings || { ragEnabled: false, webEnabled: false };
    const filterCount = domainFilters?.length || 0;
    const suffix = filterCount > 0 ? ` (${filterCount})` : '';

    if (ragEnabled && webEnabled) {
        return { 
            id: 'hybrid',
            label: '社内データ + Web', 
            textClass: 'text-purple-600 dark:text-purple-400',
            bgClass: 'bg-purple-500/10 dark:bg-purple-400/10',
            ringClass: 'ring-1 ring-purple-500/20 dark:ring-purple-400/20',
            icon: <RocketLaunchIcon /> 
        };
    }
    if (ragEnabled) {
        return { 
            id: 'rag',
            label: '社内データ', 
            textClass: 'text-green-600 dark:text-green-400',
            bgClass: 'bg-green-500/10 dark:bg-green-400/10',
            ringClass: 'ring-1 ring-green-500/20 dark:ring-green-400/20',
            icon: <BuildingOfficeIcon /> 
        };
    }
    if (webEnabled) {
        return { 
            id: 'web',
            label: `Web検索${suffix}`, 
            textClass: 'text-blue-600 dark:text-blue-400',
            bgClass: 'bg-blue-500/10 dark:bg-blue-400/10',
            ringClass: 'ring-1 ring-blue-500/20 dark:ring-blue-400/20',
            icon: <GlobeAltIcon /> 
        };
    }
    return { 
        id: 'chat',
        label: `チャット${suffix}`, 
        textClass: 'text-gray-500 dark:text-gray-400',
        bgClass: '',
        ringClass: '',
        icon: <ChatBubbleIcon /> 
    };
};

const ControlDeck = ({
    // Add Menu Callbacks & Data
    onAddMenuOpen, // Trigger to load stores etc.
    onFileUpload,
    domainFilters,
    onAddDomain,
    onRemoveDomain,
    onAddArtifact, // ★追加: Artifact追加関数

    // v3.0: ContextSelector props
    onStoreSelected,
    showStoreError, // ★ Validation Error Prop

    searchSettings,
    setSearchSettings,
    mockMode,
    backendBApiKey,
    backendBApiUrl,
    privacyWarning,
    isTyping,
    isStreaming,
    canSend,
    onSend,
    onStop,
    isLoading,
    
    // Custom Bot
    activeBot
}) => {
    const [isContextOpen, setIsContextOpen] = useState(false);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

    // Phase B: ストア一覧をAPI経由で取得
    const {
        stores,
        isLoading: isStoresLoading,
        error: storesError,
        refetch: refetchStores,
    } = useGeminiStores(mockMode, backendBApiKey, backendBApiUrl);

    const contextRef = useRef(null);
    const addMenuRef = useRef(null);

    const modeInfo = useMemo(() => getModeInfo(searchSettings), [searchSettings]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contextRef.current && !contextRef.current.contains(event.target)) {
                setIsContextOpen(false);
            }
            if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
                setIsAddMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddClick = () => {
        const nextState = !isAddMenuOpen;
        setIsAddMenuOpen(nextState);
        if (nextState && onAddMenuOpen) {
            onAddMenuOpen();
        }
    };

    return (
        <div className="flex items-center justify-between px-3 pb-3 pt-1 relative z-20">
            <div className="flex items-center gap-2">
                {/* Universal Add Button Container */}
                <div className="relative" ref={addMenuRef}>
                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.05)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddClick}
                        disabled={isLoading}
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors ${isAddMenuOpen ? 'bg-black/5 dark:bg-white/10' : ''}`}
                        title="コンテキストを追加"
                    >
                        <PlusIcon />
                    </motion.button>

                    {/* Universal Add Menu Popover */}
                    <AnimatePresence>
                        {isAddMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="absolute left-0 bottom-[calc(100%+8px)] z-50 origin-bottom-left"
                            >
                                <UniversalAddMenu
                                    onClose={() => setIsAddMenuOpen(false)}
                                    onFileUpload={() => {
                                        onFileUpload();
                                        setIsAddMenuOpen(false);
                                    }}
                                    // Domain Props
                                    domainFilters={domainFilters}
                                    onAddDomain={onAddDomain}
                                    onRemoveDomain={onRemoveDomain}
                                    // Artifact Props
                                    onAddArtifact={onAddArtifact} // ★追加: UniversalAddMenuへ伝搬
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Vertical Divider */}
                <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

                {activeBot ? (
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            initial={{ opacity: 0, x: -10, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -10, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                            className="flex items-center h-8 px-3 gap-1.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 dark:ring-amber-400/20 backdrop-blur-md"
                            title={activeBot.name || 'カスタムボット'}
                        >
                            <RobotIcon />
                            <span className="text-xs font-semibold whitespace-nowrap">
                                {activeBot.name || 'カスタムボット'}
                            </span>
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    <div className="relative flex items-center gap-1.5" ref={contextRef}>
                        {/* Context Selector Trigger */}
                        {/* Error Tooltip */}
                        <AnimatePresence>
                            {showStoreError && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: -45, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                    className="absolute left-1/2 -translate-x-1/2 -top-2 z-50 whitespace-nowrap pointer-events-none"
                                >
                                    <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg relative">
                                        ストアを選択してください
                                        {/* Triangle */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-500" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div
                            animate={showStoreError ? { x: [-5, 5, -5, 5, 0] } : {}}
                            transition={{ duration: 0.4 }}
                        >
                            <motion.button
                                layout
                                onClick={() => setIsContextOpen(!isContextOpen)}
                                className={`flex items-center h-8 px-3 gap-1.5 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 ${isContextOpen ? 'bg-black/5 dark:bg-white/10 text-gray-800 dark:text-gray-200' : ''}`}
                                title="検索モードを変更"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <SearchIcon />
                                <span className="text-xs font-medium whitespace-nowrap">検索モード</span>
                                <motion.div
                                    animate={{ rotate: isContextOpen ? 180 : 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="flex items-center justify-center"
                                >
                                    <ChevronUpIcon />
                                </motion.div>
                            </motion.button>
                        </motion.div>

                        {/* Floating Status Badge */}
                        <AnimatePresence mode="popLayout">
                            {modeInfo.id !== 'chat' && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -10, scale: 0.9 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                    className={`flex items-center h-6 px-2.5 rounded-full ${modeInfo.bgClass} ${modeInfo.textClass} ${modeInfo.ringClass} backdrop-blur-md group`}
                                    title={modeInfo.label}
                                >
                                    <div className="[&>svg]:w-3.5 [&>svg]:h-3.5 mr-1">
                                        {modeInfo.icon}
                                    </div>
                                    <span className="text-[11px] font-medium whitespace-nowrap">
                                        {modeInfo.label}
                                    </span>
                                    <button
                                        onClick={() => setSearchSettings({ ...searchSettings, ragEnabled: false, webEnabled: false, selectedStoreId: null, selectedStoreName: null })}
                                        className={`ml-1.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition-all`}
                                        title="検索モードを解除"
                                    >
                                        <CloseIcon />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Popover */}
                        <AnimatePresence>
                            {isContextOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                    className="absolute left-0 bottom-[calc(100%+8px)] z-50 origin-bottom-left"
                                >
                                    {/* ContextSelector component */}
                                    <div className="shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/5">
                                        <ContextSelector
                                            settings={searchSettings}
                                            onSettingsChange={setSearchSettings}
                                            mockMode={mockMode}
                                            backendBApiKey={backendBApiKey}
                                            backendBApiUrl={backendBApiUrl}
                                            onStoreSelected={onStoreSelected}
                                            onOpenStoreModal={() => {
                                                setIsContextOpen(false);
                                                refetchStores();
                                                setIsStoreModalOpen(true);
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}


            </div>

            <div className="flex items-center gap-2">
                {/* Privacy Shield */}
                {privacyWarning.hasWarning && (
                    <PrivacyShieldButton detections={privacyWarning.detections} />
                )}

                {/* Intelligence Selector - 環境変数に基づいて表示・非表示を制御 */}
                {SHOW_REASONING_SELECTOR && (
                    <IntelligenceSelector
                        mode={searchSettings?.reasoningMode || 'fast'}
                        onChange={(mode) => setSearchSettings({ ...searchSettings, reasoningMode: mode })}
                    />
                )}

                {/* Send Button */}
                <IntelligenceSendButton
                    isTyping={isTyping}
                    isStreaming={isStreaming}
                    canSend={canSend}
                    onSend={onSend}
                    onStop={onStop}
                    disabled={!canSend}
                />
            </div>

            <StoreSelectorModal
                isOpen={isStoreModalOpen}
                onClose={() => setIsStoreModalOpen(false)}
                stores={stores || []}
                isLoading={isStoresLoading}
                onSelect={(store, isHybrid) => {
                    setSearchSettings({
                        ...searchSettings,
                        ragEnabled: true,
                        webEnabled: isHybrid,
                        selectedStoreId: store.id,
                        selectedStoreName: store.display_name || '',
                    });
                    if (onStoreSelected) {
                        onStoreSelected(store);
                    }
                }}
            />
        </div>
    );
};

export default ControlDeck;
