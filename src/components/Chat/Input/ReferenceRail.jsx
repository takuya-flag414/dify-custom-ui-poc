import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FileIcon from '../../Shared/FileIcon';
import PrivacyShieldButton from '../PrivacyShieldButton';

// Close Icon Component
const CloseIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const GlassChip = ({ children, onRemove, className = "", warning = false }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium 
          bg-white/40 dark:bg-black/20 border border-white/20 dark:border-white/10 
          hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-default ${className}`}
    >
        {children}
        {onRemove && (
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
                <CloseIcon />
            </button>
        )}
    </motion.div>
);

const ReferenceRail = ({
    files = [],
    activeStore = null,
    activeDomains = [],
    quote = null, // ★追加: 引用テキスト
    activeArtifact = null, // ★追加: 選択されたArtifact
    onRemoveFile,
    onRemoveStore,
    onRemoveDomain,
    onRemoveQuote, // ★追加: 引用削除ハンドラ
    onRemoveArtifact // ★追加: Artifact削除ハンドラ
}) => {
    const hasItems = files.length > 0 || activeStore || activeDomains.length > 0 || quote || activeArtifact;

    return (
        <AnimatePresence>
            {hasItems && (
                <motion.div
                    className="w-full flex-shrink-0 border-b border-white/10 dark:border-white/5"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <div className="px-4 py-2 flex flex-wrap gap-2 items-center">


                        {/* ★追加: Quote Badge */}
                        {quote && (
                            <GlassChip onRemove={onRemoveQuote} className="text-gray-800 dark:text-gray-200 bg-black/5 dark:bg-white/10 border-l-[3px] border-l-[#0A84FF] pl-2 pr-3">
                                <span className="line-clamp-2 overflow-hidden text-ellipsis max-w-[300px]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    "{quote}"
                                </span>
                            </GlassChip>
                        )}

                        {/* ★追加: Artifact Badge */}
                        {activeArtifact && (
                            <GlassChip onRemove={onRemoveArtifact} className="text-purple-700 dark:text-purple-300 bg-purple-100/30 border-purple-200/50">
                                <span>📄 {activeArtifact.label}</span>
                            </GlassChip>
                        )}

                        {/* Selected Store */}
                        {activeStore && (
                            <GlassChip onRemove={onRemoveStore} className="text-emerald-700 dark:text-emerald-400 bg-emerald-100/30 border-emerald-200/50">
                                <span>🗄️ {activeStore.display_name}</span>
                            </GlassChip>
                        )}

                        {/* Active Domains */}
                        {activeDomains.map((domain, idx) => (
                            <GlassChip key={`domain-${idx}`} onRemove={() => onRemoveDomain(idx)} className="text-blue-700 dark:text-blue-400 bg-blue-100/30 border-blue-200/50">
                                <span>🌐 {domain}</span>
                            </GlassChip>
                        ))}

                        {/* Files */}
                        {files.map((fileData, idx) => (
                            <GlassChip
                                key={fileData.id || `file-${idx}`}
                                onRemove={() => onRemoveFile(idx)}
                                className={fileData.hasWarning ? "bg-amber-100/50 dark:bg-amber-900/30 border-amber-200" : ""}
                            >
                                <FileIcon filename={fileData.file.name} className="w-4 h-4 text-gray-500" />
                                <span className={fileData.hasWarning ? "text-amber-800 dark:text-amber-200" : "text-gray-700 dark:text-gray-200"}>
                                    {fileData.file.name}
                                </span>
                                {fileData.hasWarning && (
                                    <div className="ml-1 text-amber-500">
                                        <PrivacyShieldButton detections={fileData.detections} size="small" />
                                    </div>
                                )}
                            </GlassChip>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ReferenceRail;
