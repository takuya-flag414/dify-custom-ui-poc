// src/components/Settings/sections/DebugSettings.jsx
import React, { useState, useEffect } from 'react';
import {
    Server, Database, Key, RefreshCw, Check, Code, Users,
    Download, Upload, Copy, Terminal
} from 'lucide-react';
import { MacSettingsSection, MacSettingsRow, MacSelect } from './MacSettingsComponents';
import './SettingsCommon.css';
// import './DebugSettings.css'; // Removed

const DebugSettings = ({ currentUser, mockMode, setMockMode, onOpenApiConfig }) => {
    const [userIdInput, setUserIdInput] = useState(currentUser?.id || '');
    const [isIdChanged, setIsIdChanged] = useState(false);
    const [importJson, setImportJson] = useState('');
    const [selectedRole, setSelectedRole] = useState(localStorage.getItem('app_debug_role') || 'developer');

    useEffect(() => {
        setUserIdInput(currentUser?.id || '');
    }, [currentUser?.id]);

    const handleUserIdChange = (e) => {
        setUserIdInput(e.target.value);
        setIsIdChanged(e.target.value !== currentUser?.id);
    };

    const handleApplyUserId = () => {
        if (!userIdInput.trim()) return;
        if (window.confirm('Reload app with new User ID?')) {
            localStorage.setItem('app_user_id', userIdInput.trim());
            window.location.reload();
        }
    };

    const handleRoleApply = () => {
        localStorage.setItem('app_debug_role', selectedRole);
        window.location.reload();
    };

    return (
        <div className="settings-container">
            {/* 1. Environment & Mode */}
            <MacSettingsSection title="Environment">
                <MacSettingsRow icon={Server} label="Mock Mode" description="API Simulation">
                    <MacSelect
                        value={mockMode}
                        onChange={(e) => setMockMode(e.target.value)}
                        options={[
                            { value: 'FE', label: 'Frontend Mock' },
                            { value: 'BE', label: 'Backend Mock' },
                            { value: 'OFF', label: 'Real API' }
                        ]}
                        style={{ minWidth: '140px' }}
                    />
                </MacSettingsRow>

                <MacSettingsRow icon={Key} label="API Configuration" description="Keys & Endpoints" isLast>
                    <button className="settings-btn secondary" onClick={onOpenApiConfig}>
                        <span>Edit Config</span>
                    </button>
                </MacSettingsRow>
            </MacSettingsSection>

            {/* 2. Identity */}
            <MacSettingsSection title="Identity">
                <MacSettingsRow icon={Database} label="User ID">
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            className="settings-input"
                            style={{ width: '140px', fontFamily: 'monospace' }}
                            value={userIdInput}
                            onChange={handleUserIdChange}
                        />
                        {isIdChanged && (
                            <button className="settings-btn primary" onClick={handleApplyUserId}>
                                <Check size={14} />
                            </button>
                        )}
                    </div>
                </MacSettingsRow>

                <MacSettingsRow icon={Users} label="Debug Role" isLast>
                    <div className="mac-segmented">
                        {['user', 'admin', 'developer'].map(role => (
                            <button
                                key={role}
                                className={`mac-segmented-item ${selectedRole === role ? 'active' : ''}`}
                                onClick={() => setSelectedRole(role)}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                    {selectedRole !== (localStorage.getItem('app_debug_role') || 'developer') && (
                        <button className="settings-btn primary" onClick={handleRoleApply} style={{ marginLeft: '8px' }}>
                            Apply
                        </button>
                    )}
                </MacSettingsRow>
            </MacSettingsSection>

            {/* 3. Data */}
            <MacSettingsSection title="Data Management">
                <MacSettingsRow icon={Copy} label="Export Settings">
                    <button className="settings-btn secondary" onClick={() => {
                        const data = localStorage.getItem(`app_preferences_${currentUser?.id}`) || '{}';
                        navigator.clipboard.writeText(JSON.stringify(JSON.parse(data), null, 2));
                        alert('Copied to clipboard');
                    }}>
                        <Download size={14} /> Export
                    </button>
                </MacSettingsRow>

                {/* Custom Content for Import */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <Upload size={14} className="text-muted" />
                        <span className="settings-label-text" style={{ fontSize: '12px' }}>Import JSON</span>
                    </div>
                    <textarea
                        className="settings-textarea"
                        value={importJson}
                        onChange={(e) => setImportJson(e.target.value)}
                        style={{ minHeight: '60px', width: '100%', marginBottom: '8px' }}
                        placeholder='Paste settings JSON...'
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            className="settings-btn primary"
                            disabled={!importJson}
                            onClick={() => {
                                try {
                                    localStorage.setItem(`app_preferences_${currentUser?.id}`, JSON.stringify(JSON.parse(importJson)));
                                    window.location.reload();
                                } catch (e) { alert('Invalid JSON'); }
                            }}
                        >
                            Import & Reload
                        </button>
                    </div>
                </div>
            </MacSettingsSection>

            <MacSettingsSection title="System">
                <MacSettingsRow icon={Terminal} label="Version" description="v0.5.0 (Phase 1)" />
                <MacSettingsRow icon={Code} label="React" description={React.version} isLast />
            </MacSettingsSection>
        </div>
    );
};

export default DebugSettings;