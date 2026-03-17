import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DomainSelector from '../../Shared/DomainSelector';

// Icons
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6"></path>
    </svg>
);

const DocumentTextIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

const DocumentReportIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="21" y1="9" x2="3" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
);

const DocumentCheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
         <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
         <polyline points="14 2 14 8 20 8"></polyline>
         <path d="M9 15l2 2 4-4" />
    </svg>
);

const DocumentTableIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
);

const DocumentQuestionIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
         <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
         <polyline points="14 2 14 8 20 8"></polyline>
         <path d="M9.09 13.5a1 1 0 0 1 1-1.33 3.01 3.01 0 0 1 3.47.01 3.02 3.02 0 0 1 1.44 2.1c.14.88-.13 1.76-.75 2.37-1.16 1.15-2.25 2.13-2.25 3.85" />
         <line x1="12" y1="21" x2="12.01" y2="21" />
    </svg>
);

const DocumentGroupIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
         <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
         <polyline points="14 2 14 8 20 8"></polyline>
         <circle cx="12" cy="13" r="2" />
         <path d="M16 19v-1a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v1" />
    </svg>
);

const ChevronLeftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6"></path>
    </svg>
);

// Animations
const menuVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
};

const subMenuVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
};


const MenuItem = ({ icon, label, onClick, showArrow = false }) => (
    <button
        className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors group"
        onClick={onClick}
    >
        <div className="flex items-center gap-3">
            <span className="text-gray-500 dark:text-gray-400 group-hover:text-primary dark:group-hover:text-primary-dark transition-colors">
                {icon}
            </span>
            <span className="font-medium">{label}</span>
        </div>
        {showArrow && <span className="text-gray-400"><ChevronRightIcon /></span>}
    </button>
);

const UniversalAddMenu = ({
    onClose,
    onFileUpload,
    // Domain Props
    domainFilters,
    onAddDomain,
    onRemoveDomain,
    // Artifact Props
    onAddArtifact
}) => {
    const [view, setView] = useState('MAIN'); // MAIN, DOMAIN, ARTIFACT

    return (
        <div className="w-[280px] bg-white/80 dark:bg-[#1c1c1e]/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
                {view === 'MAIN' && (
                    <motion.div
                        key="main"
                        variants={menuVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="p-2"
                    >
                        <div className="px-2 py-1 mb-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Add to Context</span>
                        </div>
                        <MenuItem
                            icon={<CloudArrowUpIcon />}
                            label="ファイルアップロード"
                            onClick={onFileUpload}
                        />
                        <MenuItem
                            icon={<GlobeAltIcon />}
                            label="Webサイトを指定"
                            onClick={() => setView('DOMAIN')}
                            showArrow
                        />
                        <MenuItem
                            icon={<DocumentTextIcon />}
                            label="Artifact を作成"
                            onClick={() => setView('ARTIFACT')}
                            showArrow
                        />
                    </motion.div>
                )}

                {view === 'DOMAIN' && (
                    <DomainSelector
                        onBack={() => setView('MAIN')}
                        filters={domainFilters}
                        onAddFilter={onAddDomain}
                        onRemoveFilter={onRemoveDomain}
                        variants={subMenuVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}

                {view === 'ARTIFACT' && (
                    <motion.div
                        key="artifact"
                        variants={subMenuVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="p-2"
                    >
                        <div className="flex items-center gap-2 px-2 py-1 mb-1">
                            <button
                                onClick={() => setView('MAIN')}
                                className="p-1 -ml-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-md"
                            >
                                <ChevronLeftIcon />
                            </button>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Artifact タイプ選択</span>
                        </div>
                        <MenuItem
                            icon={<DocumentReportIcon />}
                            label="サマリーレポート"
                            onClick={() => {
                                onAddArtifact('summary_report', 'サマリーレポート');
                                onClose();
                            }}
                        />
                        <MenuItem
                            icon={<DocumentCheckIcon />}
                            label="チェックリスト"
                            onClick={() => {
                                onAddArtifact('checklist', 'チェックリスト');
                                onClose();
                            }}
                        />
                        <MenuItem
                            icon={<DocumentTableIcon />}
                            label="比較表"
                            onClick={() => {
                                onAddArtifact('comparison_table', '比較表');
                                onClose();
                            }}
                        />
                        <MenuItem
                            icon={<DocumentQuestionIcon />}
                            label="FAQ"
                            onClick={() => {
                                onAddArtifact('faq', 'FAQ');
                                onClose();
                            }}
                        />
                        <MenuItem
                            icon={<DocumentGroupIcon />}
                            label="議事録"
                            onClick={() => {
                                onAddArtifact('meeting_minutes', '議事録');
                                onClose();
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UniversalAddMenu;
