// src/components/Settings/SettingsPanel.jsx
import React from 'react';
import { settingsCategories } from '../../config/settingsConfig';

// ★変更: ...restProps でその他のProps（onOpenApiConfigなど）をまとめて受け取る
const SettingsPanel = ({ activeTab, ...restProps }) => {
    const category = settingsCategories.find(c => c.id === activeTab);

    if (!category) return null;

    const Component = category.component;

    return (
        <div className="settings-panel">
            <header className="settings-header">
                <h2 className="settings-page-title">{category.label}</h2>
            </header>
            <div className="settings-content-scroll">
                <div className="settings-section-container">
                    {/* ★変更: 受け取った全てのPropsをComponentへ渡す */}
                    <Component {...restProps} />
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;