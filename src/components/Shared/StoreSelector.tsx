import React from 'react';
import { motion } from 'framer-motion';
import ViewHeader from './ViewHeader';
import './ContextSelector.css'; // Ensure CSS is available if needed, though usually imported in parent or global

// --- Icons ---
const iconProps: React.SVGProps<SVGSVGElement> = {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
};

const FolderIcon = () => (
    <svg {...iconProps}>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
);

const RefreshIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 4v6h-6"></path>
        <path d="M1 20v-6h6"></path>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
);

// 🚀 RocketLaunch Icon (for Hybrid mode button)
const RocketIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.01-.09-2.79a1.993 1.993 0 0 0-2.91.09z"></path>
        <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
    </svg>
);

// --- Types ---
export interface Store {
    id: string;
    display_name: string;
    description: string;
}

interface StoreSelectorProps {
    onBack: () => void;
    stores: Store[];
    isLoading: boolean;
    error: any;
    onRefresh: (options?: { force: boolean }) => void;
    activeStoreId: string | null;
    onSelect: (storeId: string) => void;
    isHybridMode?: boolean;            // v3.1: Hybrid Mode state
    onToggleHybridMode?: () => void;   // v3.1: Toggle Handler
    variants: any;
    initial: string;
    animate: string;
    exit: string;
    transition: any;
}

// --- Sub Component ---
const StoreItem = ({ store, isSelected, onClick }: {
    store: Store,
    isSelected: boolean,
    onClick: () => void
}) => {
    return (
        <motion.div
            layout
            className={`store-item-row ${isSelected ? 'active' : ''}`}
        >
            <motion.button
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
        </motion.div>
    );
};

// --- Main Component ---
const StoreSelector: React.FC<StoreSelectorProps> = ({
    onBack,
    stores,
    isLoading,
    error,
    onRefresh,
    activeStoreId,
    onSelect,
    isHybridMode,
    onToggleHybridMode,
    variants,
    initial,
    animate,
    exit,
    transition
}) => {
    return (
        <motion.div
            key="stores"
            variants={variants}
            initial={initial}
            animate={animate}
            exit={exit}
            transition={transition}
            className="view-content"
        >
            <ViewHeader
                title="社内データ"
                onBack={onBack}
                rightElement={
                    <>
                        {onToggleHybridMode && (
                            <button
                                className={`refresh-btn ${isHybridMode ? 'active-hybrid' : ''}`}
                                onClick={onToggleHybridMode}
                                title={isHybridMode ? "Web検索を無効にする (Internal Only)" : "Web検索を有効にする (Hybrid Mode)"}
                                disabled={isLoading}
                                style={{ marginRight: 4 }}
                            >
                                <RocketIcon />
                            </button>
                        )}
                        <button
                            className="refresh-btn"
                            onClick={() => onRefresh({ force: true })}
                            title="ストア一覧を更新"
                            disabled={isLoading}
                        >
                            <RefreshIcon />
                        </button>
                    </>
                }
            />

            <div className="sub-panel-header">
                <span className="label">Knowledge Base Channel</span>
                <span className="badge">Internal Only</span>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="stores-loading">
                    <div className="loading-spinner" />
                    <span>ストア一覧を読み込み中...</span>
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <div className="stores-error">
                    <div className="error-icon">⚠️</div>
                    <div className="error-message">{String(error)}</div>
                    <button className="retry-button" onClick={() => onRefresh({ force: true })}>
                        再試行
                    </button>
                </div>
            )}

            {/* Store List */}
            {!isLoading && !error && (
                <div className="store-grid">
                    {stores.map((store) => (
                        <StoreItem
                            key={store.id}
                            store={store}
                            isSelected={activeStoreId === store.id}
                            onClick={() => onSelect(store.id)}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default StoreSelector;
