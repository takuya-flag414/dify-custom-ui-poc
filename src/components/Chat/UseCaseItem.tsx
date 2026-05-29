import React from 'react';
import { motion } from 'framer-motion';
import FavoriteButton from './FavoriteButton';
import { 
    Presentation, 
    FileText, 
    FileSpreadsheet, 
    Scissors, 
    Table, 
    CheckSquare, 
    HelpCircle, 
    Workflow, 
    Network, 
    FileCode 
} from 'lucide-react';

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

export interface UseCaseData {
    id: string;
    label: string;
    icon: React.ReactNode;
    type: string; // URL routing parameter for /studio/:type
}

interface UseCaseItemProps {
    item: UseCaseData;
    isFavorite: boolean;
    onToggleFavorite: (id: string) => void;
    onSelect: (type: string) => void;
}

const UseCaseItem: React.FC<UseCaseItemProps> = ({ item, isFavorite, onToggleFavorite, onSelect }) => {
    const handleClick = () => {
        onSelect(item.id);
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // 遷移を防ぐ
        onToggleFavorite(item.id);
    };

    return (
        <motion.div
            className="use-case-item"
            onClick={handleClick}
            whileTap={{ scale: 0.96 }}
        >
            <div className="use-case-item-content">
                <span className="use-case-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    {(() => {
                        const CardIcon = ITEM_ICONS[item.id] || FileCode;
                        const iconColor = ITEM_COLORS[item.id] || 'var(--color-text-main)';
                        return <CardIcon size={16} style={{ color: iconColor }} />;
                    })()}
                </span>
                <span className="use-case-label">{item.label}</span>
            </div>
            <FavoriteButton
                isFavorite={isFavorite}
                onClick={handleFavoriteClick}
            />
        </motion.div>
    );
};

export default UseCaseItem;
