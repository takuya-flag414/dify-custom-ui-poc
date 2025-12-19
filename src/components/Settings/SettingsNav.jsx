// src/components/Settings/SettingsNav.jsx
import React from 'react';
import { settingsCategories } from '../../config/settingsConfig';

const SettingsNav = ({ activeTab, onSelectTab, currentUser }) => {
    // RBAC: settingsConfig.jsx の allowedRoles に基づいてフィルタリング
    const currentRole = currentUser?.role || 'user';
    const filteredCategories = settingsCategories.filter(
        category => category.allowedRoles.includes(currentRole)
    );

    return (
        <div className="settings-nav">
            <div className="settings-nav-title">Settings</div>
            {filteredCategories.map((category) => {
                const Icon = category.icon;
                const isActive = activeTab === category.id;

                return (
                    <div
                        key={category.id}
                        className={`settings-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => onSelectTab(category.id)}
                    >
                        <Icon className="settings-nav-icon" />
                        <span>{category.label}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default SettingsNav;