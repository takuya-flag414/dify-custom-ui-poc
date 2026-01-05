// src/components/Settings/SettingsNav.jsx
import React from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { settingsCategories } from '../../config/settingsConfig';

// Animation Physics (Matched with Sidebar.jsx)
const hoverAnimation = {
    x: 4,
    transition: { type: "spring", stiffness: 400, damping: 25 }
};

const SettingsNav = ({ activeTab, onSelectTab, currentUser }) => {
    // RBAC Filtering
    const currentRole = currentUser?.role || 'user';
    const filteredCategories = settingsCategories.filter(
        category => category.allowedRoles.includes(currentRole)
    );

    return (
        <div className="settings-nav">
            {/* Unified Toolbar Header Area */}
            <div className="settings-nav-header">
                <span className="settings-nav-title">Settings</span>
            </div>

            {/* Scrollable Nav List */}
            <div className="settings-nav-scroll">
                <LayoutGroup id="settings-nav">
                    {filteredCategories.map((category) => {
                        const Icon = category.icon;
                        const isActive = activeTab === category.id;

                        return (
                            <motion.button
                                key={category.id}
                                layout="position"
                                className={`settings-nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => onSelectTab(category.id)}
                                // Accessibility
                                role="tab"
                                aria-selected={isActive}
                                tabIndex={0}
                                // Micro-interaction (Sidebar.jsx Compatible)
                                whileHover={hoverAnimation}
                                // Micro-tap interaction
                                whileTap={{ scale: 0.98 }}
                            >
                                <Icon
                                    className="settings-nav-icon"
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span>
                                    {category.label}
                                </span>
                            </motion.button>
                        );
                    })}
                </LayoutGroup>
            </div>
        </div>
    );
};

export default SettingsNav;