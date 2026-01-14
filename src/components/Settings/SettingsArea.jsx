// src/components/Settings/SettingsArea.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SettingsNav from './SettingsNav';
import SettingsPanel from './SettingsPanel';
import { settingsCategories } from '../../config/settingsConfig';
import './SettingsArea.css';

// Helper for modal animation (macOS Sequoia Physics)
const modalOverlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } }
};

const modalContainerVariants = {
    hidden: { scale: 0.96, opacity: 0, y: 8 },
    visible: { scale: 1, opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } },
    exit: { scale: 0.96, opacity: 0, y: 8, transition: { duration: 0.15 } }
};

const SettingsArea = ({
    currentUser,
    settings,
    onUpdateSettings,
    mockMode,
    setMockMode,
    onOpenApiConfig,
    onResetOnboarding,
    onLogout,  // ★追加: Phase A ログアウト機能
    // Modal Props
    isModal = false,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState('profile');

    // Role変更時のタブリセット処理
    useEffect(() => {
        const currentRole = currentUser?.role || 'user';
        const allowedCategories = settingsCategories.filter(
            c => c.allowedRoles.includes(currentRole)
        );

        // 現在のタブがアクセス可能か確認
        const isCurrentTabAllowed = allowedCategories.some(c => c.id === activeTab);

        if (!isCurrentTabAllowed && allowedCategories.length > 0) {
            // 最初に許可されているタブにリセット
            setActiveTab(allowedCategories[0].id);
        }
    }, [currentUser?.role, activeTab]);

    const content = (
        <>
            <SettingsNav
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                currentUser={currentUser}
            />
            <SettingsPanel
                activeTab={activeTab}
                currentUser={currentUser}
                settings={settings}
                onUpdateSettings={onUpdateSettings}
                mockMode={mockMode}
                setMockMode={setMockMode}
                onOpenApiConfig={onOpenApiConfig}
                onResetOnboarding={onResetOnboarding}
                onLogout={onLogout}
            />
        </>
    );

    if (isModal) {
        return (
            <motion.div
                className="settings-modal-overlay"
                variants={modalOverlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={onClose} // Close when clicking overlay
            >
                <div
                    className="settings-modal-click-trap"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
                >
                    <motion.div
                        className="settings-modal-container"
                        variants={modalContainerVariants}
                    >
                        {/* Close Button implementation could go here inside a header if needed, 
                            but for now we rely on outside click or we can add a close button element */}
                        <button className="settings-modal-close-btn" onClick={onClose} aria-label="Close Settings">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        <div className="settings-modal-content-wrapper">
                            {content}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    // Legacy Full Page Layout
    return (
        <div className="settings-area-container">
            {content}
        </div>
    );
};

export default SettingsArea;