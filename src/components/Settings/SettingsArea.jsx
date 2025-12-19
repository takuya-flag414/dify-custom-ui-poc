// src/components/Settings/SettingsArea.jsx
import React, { useState } from 'react';
import SettingsNav from './SettingsNav';
import SettingsPanel from './SettingsPanel';
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