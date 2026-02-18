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
    onRemoveDomain
}) => {
    const [view, setView] = useState('MAIN'); // MAIN, DOMAIN

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
            </AnimatePresence>
        </div>
    );
};

export default UniversalAddMenu;
