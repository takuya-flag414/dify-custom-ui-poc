import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TableModal = ({ isOpen, onClose, tableContent }) => {
    // macOS Sequoia Spring Animation settings
    const springConfig = {
        type: 'spring',
        stiffness: 250,
        damping: 25,
        mass: 1,
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="table-modal-overlay">
                    {/* Backdrop with strong blur (DESIGN_RULE 1.1) */}
                    <motion.div
                        className="table-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <motion.div
                        className="table-modal-content"
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={springConfig}
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Header / Traffic Lights area */}
                        <div className="table-modal-header">
                            <div className="table-modal-controls">
                                <button
                                    className="table-modal-close-btn"
                                    onClick={onClose}
                                    aria-label="Close fullscreen table"
                                    title="Close"
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            <div className="table-modal-title">Table View</div>
                        </div>

                        {/* Content Body */}
                        <div className="table-modal-body markdown-renderer">
                            {tableContent}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TableModal;
