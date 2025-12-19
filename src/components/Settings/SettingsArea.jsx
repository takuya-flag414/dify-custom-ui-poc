// src/components/Settings/SettingsArea.jsx
import React, { useState, useEffect } from 'react';
import SettingsNav from './SettingsNav';
import SettingsPanel from './SettingsPanel';
import { settingsCategories } from '../../config/settingsConfig';
import './SettingsArea.css';

// ★変更: propsを拡張して受け取る
const SettingsArea = ({
    currentUser,
    settings,
    onUpdateSettings,
    mockMode,           // 追加
    setMockMode,        // 追加
    onOpenApiConfig     // 追加
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

    return (
        <div className="settings-area-container">
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
                // ★追加: DebugSettings等で使うPropsを渡す
                mockMode={mockMode}
                setMockMode={setMockMode}
                onOpenApiConfig={onOpenApiConfig}
            />
        </div>
    );
};

export default SettingsArea;