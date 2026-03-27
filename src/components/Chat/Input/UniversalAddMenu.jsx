import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DomainSelector from '../../Shared/DomainSelector';

// --- Icons (SF Symbols Inspired) ---

const BoltIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" />
    </svg>
);

const DocumentRichtextIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M8 13h8M8 17h8M8 9h2" />
    </svg>
);

const CloudArrowUpIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
        <path d="M12 12v9"></path>
        <path d="m16 16-4-4-4 4"></path>
    </svg>
);

const GlobeAltIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M2 12h20"></path>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
);

const ChevronRightIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6"></path>
    </svg>
);

const ChevronLeftIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6"></path>
    </svg>
);

const SummaryIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2" />
        <path d="M21 12H3" />
    </svg>
);

const MinutesIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    </svg>
);

const ChecklistIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 11 3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
);

const ComparisonIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
);

const FAQIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
        <circle cx="12" cy="12" r="10" />
    </svg>
);

// --- Animation Configs (Aligned with ContextSelector) ---

const slideVariants = {
    enterFromRight: { x: 50, opacity: 0 },
    enterFromLeft: { x: -50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exitToLeft: { x: -50, opacity: 0 },
    exitToRight: { x: 50, opacity: 0 }
};

const springTransition = { type: "spring", stiffness: 300, damping: 30 };

// --- Components ---

const MenuItem = ({ icon, label, subtext, onClick, showArrow = false }) => (
    <motion.button
        className="w-full border-none bg-transparent flex items-center justify-between px-3 py-2.5 text-left rounded-xl transition-colors group select-none outline-none relative"
        onClick={onClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
    >
        <div className="flex items-center gap-3.5 relative z-10 pointer-events-none">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:text-primary dark:group-hover:text-primary-dark transition-colors">
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</span>
                {subtext && (
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
                        {subtext}
                    </span>
                )}
            </div>
        </div>
        {showArrow && (
            <span className="text-gray-400 dark:text-gray-500 group-hover:translate-x-0.5 transition-transform relative z-10 pointer-events-none">
                <ChevronRightIcon />
            </span>
        )}
        
        {/* Hover Highlight Overlay */}
        <div className="absolute inset-0 bg-black/5 dark:bg-white/10 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity pointer-events-none" />
    </motion.button>
);

const UniversalAddMenu = ({
    onClose,
    onFileUpload,
    domainFilters,
    onAddDomain,
    onRemoveDomain,
    onAddArtifact
}) => {
    const [view, setView] = useState('MAIN'); // MAIN, DOMAIN, ARTIFACT_L1, ARTIFACT_L2
    const [slideDirection, setSlideDirection] = useState('right');

    const navigateTo = (targetView, direction = 'right') => {
        setSlideDirection(direction);
        setView(targetView);
    };

    const handleArtifactSelect = (type, label) => {
        onAddArtifact(type, label);
        onClose();
    };

    const getAnimationState = () => ({
        initial: slideDirection === 'right' ? 'enterFromRight' : 'enterFromLeft',
        exit: slideDirection === 'right' ? 'exitToLeft' : 'exitToRight'
    });

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
            transition={springTransition}
            className="w-[300px] bg-white/60 dark:bg-[#1c1c1e]/70 backdrop-blur-[40px] saturate-[180%] rounded-[22px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/40 dark:border-white/10 overflow-hidden"
        >
            <div className="p-2 relative overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                    {view === 'MAIN' && (
                        <motion.div
                            key="main"
                            variants={slideVariants}
                            initial={getAnimationState().initial}
                            animate="center"
                            exit={getAnimationState().exit}
                            transition={springTransition}
                        >
                            <div className="px-3 py-2 mb-1">
                                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Add to Context</span>
                            </div>
                            <MenuItem
                                icon={<CloudArrowUpIcon />}
                                label="ファイルアップロード"
                                subtext="PDF、テキスト、Wordなど"
                                onClick={onFileUpload}
                            />
                            <MenuItem
                                icon={<GlobeAltIcon />}
                                label="Webサイトを指定"
                                subtext="URLを入力して情報を取得"
                                onClick={() => navigateTo('DOMAIN', 'right')}
                                showArrow
                            />
                            <MenuItem
                                icon={<BoltIcon />}
                                label="Artifact を作成"
                                subtext="ドキュメントやレポートを生成"
                                onClick={() => navigateTo('ARTIFACT_L1', 'right')}
                                showArrow
                            />
                        </motion.div>
                    )}

                    {view === 'DOMAIN' && (
                        <DomainSelector
                            onBack={() => navigateTo('MAIN', 'left')}
                            filters={domainFilters}
                            onAddFilter={onAddDomain}
                            onRemoveFilter={onRemoveDomain}
                            variants={slideVariants}
                            initial={getAnimationState().initial}
                            animate="center"
                            exit={getAnimationState().exit}
                            transition={springTransition}
                        />
                    )}

                    {view === 'ARTIFACT_L1' && (
                        <motion.div
                            key="artifact_l1"
                            variants={slideVariants}
                            initial={getAnimationState().initial}
                            animate="center"
                            exit={getAnimationState().exit}
                            transition={springTransition}
                        >
                            <div className="flex items-center gap-2 px-1 py-1 mb-2">
                                <button
                                    onClick={() => navigateTo('MAIN', 'left')}
                                    className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/5 border-none bg-transparent outline-none"
                                >
                                    <ChevronLeftIcon />
                                </button>
                                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Artifact 作成</span>
                            </div>
                            <MenuItem
                                icon={<BoltIcon />}
                                label="⚡️ クイックまとめ"
                                subtext="チャット内でさっと読む軽量なメモ"
                                onClick={() => navigateTo('ARTIFACT_L2', 'right')}
                                showArrow
                            />
                            <MenuItem
                                icon={<DocumentRichtextIcon />}
                                label="📄 A4ドキュメント"
                                subtext="印刷・PDF保存向けのリッチな資料"
                                onClick={() => handleArtifactSelect('html_document', 'A4ドキュメント')}
                            />
                        </motion.div>
                    )}

                    {view === 'ARTIFACT_L2' && (
                        <motion.div
                            key="artifact_l2"
                            variants={slideVariants}
                            initial={getAnimationState().initial}
                            animate="center"
                            exit={getAnimationState().exit}
                            transition={springTransition}
                        >
                            <div className="flex items-center gap-2 px-1 py-1 mb-2">
                                <button
                                    onClick={() => navigateTo('ARTIFACT_L1', 'left')}
                                    className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/5 border-none bg-transparent outline-none"
                                >
                                    <ChevronLeftIcon />
                                </button>
                                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">クイックまとめ</span>
                            </div>
                            <MenuItem
                                icon={<SummaryIcon />}
                                label="📝 要約・レポート"
                                subtext="長文の要約や箇条書きの報告"
                                onClick={() => handleArtifactSelect('summary_report', '要約・レポート')}
                            />
                            <MenuItem
                                icon={<MinutesIcon />}
                                label="📋 議事録・Next Action"
                                subtext="会議の記録とアクションアイテム"
                                onClick={() => handleArtifactSelect('meeting_minutes', '議事録・Next Action')}
                            />
                            <MenuItem
                                icon={<ChecklistIcon />}
                                label="✅ チェックリスト"
                                subtext="タスクや確認事項のリストアップ"
                                onClick={() => handleArtifactSelect('checklist', 'チェックリスト')}
                            />
                            <MenuItem
                                icon={<ComparisonIcon />}
                                label="📊 比較表"
                                subtext="複数要素のメリット・デメリット"
                                onClick={() => handleArtifactSelect('comparison_table', '比較表')}
                            />
                            <MenuItem
                                icon={<FAQIcon />}
                                label="❓ FAQ"
                                subtext="よくある質問と回答のリスト"
                                onClick={() => handleArtifactSelect('faq', 'FAQ (想定問答集)')}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default UniversalAddMenu;
