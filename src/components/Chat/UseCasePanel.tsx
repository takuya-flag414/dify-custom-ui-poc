import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavoriteArtifacts } from '../../hooks/useFavoriteArtifacts';
import UseCaseItem, { UseCaseData } from './UseCaseItem';
import { Star, Grid } from 'lucide-react';
import AllToolsModal from './Toolbox/AllToolsModal';

export interface CategoryData {
    title: string;
    items: (UseCaseData & { desc: string })[];
}

export const USE_CASES: CategoryData[] = [
    {
        title: '🎨 発表・提案する',
        items: [
            { id: 'slide_creation', label: 'プレゼン資料を作る', icon: '📊', type: 'slide_creation', desc: 'AIが構成する美しいスライドを自動で作成します' },
            { id: 'document_studio', label: '提案書・仕様書を作る', icon: '📄', type: 'document_studio', desc: '各種文書をプロフェッショナルな構成で作成します' },
        ]
    },
    {
        title: '📝 記録・要約する',
        items: [
            { id: 'meeting_minutes', label: '議事録をまとめる', icon: '📝', type: 'markdown', desc: '会議のテキストから要点・決定事項を自動整理します' },
            { id: 'summarize_text', label: '長文を要約する', icon: '✂️', type: 'markdown', desc: 'ニュースや長文資料を指定の粒度で要約します' },
        ]
    },
    {
        title: '💡 整理・比較する',
        items: [
            { id: 'comparison_table', label: '比較表を作成する', icon: '📋', type: 'markdown', desc: '複数の要素を比較し、分かりやすい表を作成します' },
            { id: 'checklist', label: 'チェックリスト化', icon: '✅', type: 'markdown', desc: '手順や要件から、実践的なチェックリストを生成します' },
            { id: 'faq_creation', label: 'FAQを作る', icon: '❓', type: 'markdown', desc: '資料から想定される質問と回答（FAQ）を作成します' },
        ]
    },
    {
        title: '📐 図解・可視化する',
        items: [
            { id: 'drawio_studio', label: '業務フロー図を描く', icon: '🔄', type: 'drawio_studio', desc: '業務フローや手順を視覚的な配置図で作成します' },
            { id: 'mermaid_studio', label: 'システム構成図を生成', icon: '🏗️', type: 'mermaid_studio', desc: 'システム構成やシーケンス図などを自動生成します' },
        ]
    }
];

interface UseCasePanelProps {
    isFaded: boolean;
    onSelect: (type: string) => void;
}

const UseCasePanel: React.FC<UseCasePanelProps> = ({ isFaded, onSelect }) => {
    const { favorites, toggleFavorite } = useFavoriteArtifacts();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // 全アイテムをフラット化してIDで検索しやすくする
    const allItems = USE_CASES.flatMap(c => c.items);
    
    // お気に入りアイテムのリストを作成
    const favoriteItems = favorites.map(id => allItems.find(item => item.id === id)).filter(Boolean) as (UseCaseData & { desc: string })[];

    return (
        <div className={`use-case-panel ${isFaded ? 'faded' : ''}`}>
            {/* 🔗 横一列に統合したサジェスト行 (お気に入りリスト ＋ ツールボックス起動ボタン) */}
            <div className="use-case-shortcuts">
                <AnimatePresence initial={false}>
                    {favoriteItems.map(item => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                            <UseCaseItem
                                item={item}
                                isFavorite={true}
                                onToggleFavorite={toggleFavorite}
                                onSelect={onSelect}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                <button 
                    className="toolbox-trigger-button" 
                    onClick={() => setIsModalOpen(true)}
                    aria-label="すべてのツール一覧を開く"
                >
                    <Grid size={13} className="toolbox-trigger-icon" />
                    <span>すべてのツール</span>
                </button>
            </div>

            {/* 📂 ツールボックスモーダル（Adobe CC製品一覧コンソール風） */}
            <AllToolsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={onSelect}
                useCases={USE_CASES}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
            />
        </div>
    );
};

export default UseCasePanel;
