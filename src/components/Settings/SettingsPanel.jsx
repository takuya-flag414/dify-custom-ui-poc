// src/components/Settings/SettingsPanel.jsx
import React from 'react';
import { settingsCategories } from '../../config/settingsConfig';

// ★変更: currentUserを明示的に受け取り、restPropsで他を渡す
const SettingsPanel = ({ activeTab, currentUser, ...restProps }) => {
    const currentRole = currentUser?.role || 'user';

    const category = settingsCategories.find(c => c.id === activeTab);

    // カテゴリが見つからない、または権限がない場合はnullを返す
    if (!category || !category.allowedRoles.includes(currentRole)) {
        return null;
    }

    const Component = category.component;

    return (
        <div className="settings-panel">
            <header className="settings-header">
                <h2 className="settings-page-title">{category.label}</h2>
            </header>
            <div className="settings-content-scroll">
                <div className="settings-section-container">
                    {/* ★変更: currentUserを含む全てのPropsをComponentへ渡す */}
                    <Component currentUser={currentUser} {...restProps} />
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;