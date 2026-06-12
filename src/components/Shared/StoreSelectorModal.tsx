import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Folder, LayoutGrid, List, Rocket } from 'lucide-react';
import { SHOW_HYBRID_SEARCH } from '../../config/env';
import { useAuth } from '../../context/AuthContext';
import { formatStoreDisplayName } from '../../utils/storeFormatter';
import './StoreSelectorModal.css';

export interface Store {
    id: string;
    display_name: string;
    description?: string;
    updatedAt?: string;
}

interface StoreSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (store: Store, isHybrid: boolean) => void;
    stores: Store[];
    isLoading?: boolean;
}

const StoreSelectorModal: React.FC<StoreSelectorModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    stores,
    isLoading
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isHybridMode, setIsHybridMode] = useState(false);

    const { user } = useAuth();
    
    // RBAC Permissions
    const isAdmin = user?.roles?.some(r => r.roleCode === 'admin') || user?.role === 'admin';
    const isKnowledgeManager = user?.roles?.some(r => r.roleCode === 'knowledge_manager') || user?.permissions?.includes('knowledge:manage');
    const deptCode = user?.departmentId?.toString() || '';

    const filteredStores = useMemo(() => {
        let storesToDisplay = stores;

        // RBAC filtering
        storesToDisplay = storesToDisplay.filter(store => {
            if (isAdmin) return true;
            if (!isKnowledgeManager) return false;

            const parts = store.display_name.split('_');
            if (parts.length < 2) return false;
            
            const storeDept = parts[1];
            if (storeDept === deptCode) return true;

            return false;
        });

        if (!searchQuery) return storesToDisplay;
        
        return storesToDisplay.filter(s => {
            // 検索時は元の名前と整形後の名前の両方でヒットするようにする
            const formattedName = formatStoreDisplayName(s.display_name);
            const query = searchQuery.toLowerCase();
            return s.display_name.toLowerCase().includes(query) || formattedName.toLowerCase().includes(query);
        });
    }, [stores, searchQuery, isAdmin, isKnowledgeManager, deptCode]);

    const handleConfirm = () => {
        const store = stores.find(s => s.id === selectedStoreId);
        if (store) {
            onSelect(store, isHybridMode);
            onClose();
        }
    };

    if (typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="store-modal-overlay" onClick={onClose}>
                    <motion.div
                        className="store-modal-window mat-hud-panel"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    >
                        {/* Header */}
                        <div className="store-modal-header">
                            <div className="window-title">ナレッジを選択</div>
                        </div>

                        {/* Toolbar */}
                        <div className="store-modal-toolbar">
                            <div className="toolbar-search">
                                <Search size={16} className="search-icon" />
                                <input 
                                    type="text" 
                                    placeholder="検索..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="toolbar-actions-group">
                                {SHOW_HYBRID_SEARCH && (
                                    <button 
                                        className={`rocket-toggle ${isHybridMode ? 'active' : ''}`}
                                        onClick={() => setIsHybridMode(!isHybridMode)}
                                        title="Web検索も同時に実行する"
                                    >
                                        <Rocket size={16} />
                                    </button>
                                )}
                                <div className="toolbar-actions">
                                    <button 
                                        className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <LayoutGrid size={16} />
                                    </button>
                                    <button 
                                        className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                                        onClick={() => setViewMode('list')}
                                    >
                                        <List size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Canvas (Files) */}
                        <div className="store-modal-canvas" onClick={() => setSelectedStoreId(null)}>
                            {isLoading ? (
                                <div className="canvas-loading">読み込み中...</div>
                            ) : (
                                <motion.div layout className={viewMode === 'grid' ? "store-grid" : "store-list"}>
                                    <AnimatePresence mode="popLayout">
                                        {filteredStores.map(store => (
                                            <motion.div 
                                                layout
                                                initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                                exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                                                transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
                                                key={store.id}
                                                className={`store-folder-item ${viewMode === 'list' ? 'list-mode' : ''} ${selectedStoreId === store.id ? 'selected' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedStoreId(store.id);
                                                }}
                                                onDoubleClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelect(store, isHybridMode);
                                                    onClose();
                                                }}
                                            >
                                                <motion.div layout="position">
                                                    <Folder size={viewMode === 'grid' ? 48 : 24} className="folder-icon" />
                                                </motion.div>
                                                <motion.div layout="position" className="folder-name" title={store.display_name}>
                                                    {formatStoreDisplayName(store.display_name)}
                                                </motion.div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    <AnimatePresence>
                                        {filteredStores.length === 0 && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="empty-state"
                                            >
                                                見つかりませんでした
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="store-modal-footer">
                            <div className="footer-status">
                                {selectedStoreId ? '1項目を選択中' : `${filteredStores.length}項目`}
                            </div>
                            <div className="footer-actions">
                                <button className="btn-cancel" onClick={onClose}>キャンセル</button>
                                <button 
                                    className="btn-primary" 
                                    disabled={!selectedStoreId}
                                    onClick={handleConfirm}
                                >
                                    開く
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default StoreSelectorModal;
