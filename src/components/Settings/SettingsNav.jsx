// src/components/Settings/SettingsNav.jsx
import React from 'react';
import { settingsCategories } from '../../config/settingsConfig';

const SettingsNav = ({ activeTab, onSelectTab }) => {
    // Phase 1: 権限チェックは簡易的に実装（すべて表示）
    // 将来的には currentUser.role でフィルタリングする
    const filteredCategories = settingsCategories;

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