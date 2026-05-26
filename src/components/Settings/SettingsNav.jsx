// src/components/Settings/SettingsNav.jsx
import React, { useMemo } from 'react';
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

    // Group categories by the 'group' property for UI hierarchy
    const groupedCategories = useMemo(() => {
        const groups = {};
        // 順番を保持するために配列も併用するか、そのまま追加
        filteredCategories.forEach(cat => {
            const groupName = cat.group || 'その他';
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(cat);
        });
        return groups;
    }, [filteredCategories]);

    return (
        <div className="settings-nav">
            {/* Unified Toolbar Header Area */}
            <div className="settings-nav-header">
                <span className="settings-nav-title">Settings</span>
            </div>

            {/* Scrollable Nav List */}
            <div className="settings-nav-scroll">
                <LayoutGroup id="settings-nav">
                    {Object.entries(groupedCategories).map(([groupName, categories]) => (
                        <div key={groupName} className="settings-nav-group" style={{ marginBottom: '16px' }}>
                            {/* Section Header (Apple Design Rule: Hierarchy) */}
                            <div className="settings-nav-group-title" style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                color: 'var(--color-text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                padding: '0 10px',
                                marginBottom: '6px',
                                opacity: 0.8
                            }}>
                                {groupName}
                            </div>
                            
                            {categories.map((category) => {
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
                        </div>
                    ))}
                </LayoutGroup>
            </div>
        </div>
    );
};

export default SettingsNav;