import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Star, 
    Globe, 
    Presentation, 
    FileText, 
    FileSpreadsheet, 
    Scissors, 
    Table, 
    CheckSquare, 
    HelpCircle, 
    Workflow, 
    Network, 
    FileCode,
    Briefcase
} from 'lucide-react';
import { UseCaseData } from '../UseCaseItem';
import './AllToolsModal.css'; // 専用CSSをインポート

export interface CategoryData {
    title: string;
    items: (UseCaseData & { desc: string })[];
}

interface AllToolsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: string) => void;
    useCases: CategoryData[];
    favorites: string[];
    toggleFavorite: (id: string) => void;
}

// 設定画面（SettingsNav.jsx）と統一されたSpring物理ベースのホバー演出設定
const hoverAnimation = {
    x: 4,
    transition: { type: "spring" as const, stiffness: 400, damping: 25 }
};

const AllToolsModal: React.FC<AllToolsModalProps> = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    useCases, 
    favorites, 
    toggleFavorite 
}) => {
    const [activeCategory, setActiveCategory] = useState<string>('all');

    // 全アイテムをフラット化してIDで検索しやすくする
    const allItems = useCases.flatMap(c => c.items);
    
    // カテゴリに応じたSVGアイコンマッピング
    const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
        '🎨 発表・提案する': Presentation,
        '📝 記録・要約する': FileText,
        '💡 整理・比較する': CheckSquare,
        '📐 図解・可視化する': Network
    };
    
    // 各ツール（UseCase）に応じたSVGアイコンマッピング
    const ITEM_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
        slide_creation: Presentation,
        document_studio: FileText,
        meeting_minutes: FileSpreadsheet,
        summarize_text: Scissors,
        comparison_table: Table,
        checklist: CheckSquare,
        faq_creation: HelpCircle,
        drawio_studio: Workflow,
        mermaid_studio: Network
    };
    
    // 各ツール（UseCase）に応じた直感的なカラーマッピング
    const ITEM_COLORS: Record<string, string> = {
        slide_creation: '#ff9500',    // オレンジ
        document_studio: '#007aff',   // ブルー
        meeting_minutes: '#34c759',   // グリーン
        summarize_text: '#af52de',    // パープル
        comparison_table: '#5ac8fa',   // シアン
        checklist: '#30d158',          // ライムグリーン
        faq_creation: '#ffd60a',       // イエロー
        drawio_studio: '#ff2d55',      // ピンク
        mermaid_studio: '#5856d6'      // インディゴ
    };

    // 選択されたカテゴリに応じたアイテムリストを取得
    const getFilteredItems = () => {
        if (activeCategory === 'all') return allItems;
        const category = useCases.find(c => c.title === activeCategory);
        return category ? category.items : [];
    };

    if (typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="toolbox-overlay" onClick={onClose}>
                    <motion.div
                        className="toolbox-console mat-hud-panel"
                        onClick={(e) => e.stopPropagation()} // モーダル内のクリックで閉じないように
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    >
                        {/* 左カラム：カテゴリ・ナビゲーション (Sidebar) */}
                        <div className="toolbox-sidebar">
                            <div className="toolbox-sidebar-header">
                                <span className="toolbox-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Briefcase size={18} style={{ color: 'var(--color-primary)' }} />
                                    <span>Toolbox</span>
                                </span>
                            </div>
                            <div className="toolbox-sidebar-menu">
                                <motion.button 
                                    className={`sidebar-menu-item ${activeCategory === 'all' ? 'active' : ''}`}
                                    onClick={() => setActiveCategory('all')}
                                    whileHover={hoverAnimation}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Globe size={14} className="menu-item-icon" />
                                    <span className="menu-item-label">すべてのツール</span>
                                </motion.button>
                                <div className="sidebar-menu-divider" />
                                {useCases.map(category => {
                                    const CategoryIcon = CATEGORY_ICONS[category.title] || Globe;
                                    const cleanTitle = category.title.replace(/^[\s\p{Emoji}]+\s*/u, '');
                                    
                                    return (
                                        <motion.button 
                                            key={category.title}
                                            className={`sidebar-menu-item ${activeCategory === category.title ? 'active' : ''}`}
                                            onClick={() => setActiveCategory(category.title)}
                                            whileHover={hoverAnimation}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <CategoryIcon size={14} className="menu-item-icon" />
                                            <span className="menu-item-label">{cleanTitle}</span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 右カラム：ツールグリッド (Main Canvas) */}
                        <div className="toolbox-main">
                            <div className="toolbox-main-header">
                                <h2 className="toolbox-main-title">
                                    {activeCategory === 'all' 
                                        ? 'すべてのツール' 
                                        : activeCategory.replace(/^[\s\p{Emoji}]+\s*/u, '')}
                                </h2>
                                <button 
                                    className="toolbox-close-button"
                                    onClick={onClose}
                                    aria-label="閉じる"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="toolbox-main-content">
                                <div className="toolbox-grid">
                                    <AnimatePresence mode="popLayout">
                                        {getFilteredItems().map(item => {
                                            const isFav = favorites.includes(item.id);
                                            return (
                                                <motion.div
                                                    key={item.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="toolbox-card-wrapper"
                                                >
                                                    <div 
                                                        className="toolbox-tool-card"
                                                        onClick={() => {
                                                            onSelect(item.id);
                                                            onClose();
                                                        }}
                                                    >
                                                        <div className="tool-card-icon">
                                                            {(() => {
                                                                const CardIcon = ITEM_ICONS[item.id] || FileCode;
                                                                const iconColor = ITEM_COLORS[item.id] || 'var(--color-text-main)';
                                                                return <CardIcon size={22} className="tool-card-icon-svg" style={{ color: iconColor }} />;
                                                            })()}
                                                        </div>
                                                        <div className="tool-card-info">
                                                            <h4 className="tool-card-label">{item.label}</h4>
                                                            <p className="tool-card-desc">{item.desc}</p>
                                                        </div>
                                                        <button 
                                                            className={`tool-card-fav-button ${isFav ? 'is-fav' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleFavorite(item.id);
                                                            }}
                                                            aria-label="お気に入りトグル"
                                                        >
                                                            <Star size={16} fill={isFav ? "currentColor" : "none"} />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default AllToolsModal;
