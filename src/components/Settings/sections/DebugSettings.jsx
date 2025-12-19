// src/components/Settings/sections/DebugSettings.jsx
import React, { useState, useEffect } from 'react';
import {
    Server,
    Database,
    Key,
    RefreshCw,
    Check,
    AlertCircle,
    Code
} from 'lucide-react';
import './DebugSettings.css';

const DebugSettings = ({
    currentUser,
    mockMode,
    setMockMode,
    onOpenApiConfig
}) => {
    const [userIdInput, setUserIdInput] = useState(currentUser?.id || '');
    const [isIdChanged, setIsIdChanged] = useState(false);

    useEffect(() => {
        setUserIdInput(currentUser?.id || '');
    }, [currentUser?.id]);

    const handleUserIdChange = (e) => {
        setUserIdInput(e.target.value);
        setIsIdChanged(e.target.value !== currentUser?.id);
    };

    const handleApplyUserId = () => {
        if (!userIdInput.trim()) return;
        if (window.confirm('ユーザーIDを変更してアプリをリロードしますか？\nこれまでの履歴は別のIDとして管理されます。')) {
            localStorage.setItem('app_user_id', userIdInput.trim());
            window.location.reload();
        }
    };

    const handleRegenerateId = () => {
        const newId = `user-${crypto.randomUUID().slice(0, 8)}`;
        setUserIdInput(newId);
        setIsIdChanged(true);
    };

    return (
        <div className="debug-section">

            {/* 1. Environment & Mode */}
            <div className="debug-card">
                <div className="debug-card-header">
                    <div className="debug-card-title">
                        <Server size={20} className="text-blue-500" />
                        <span>開発環境設定 (Environment)</span>
                    </div>
                </div>

                <div className="debug-row">
                    <div className="flex flex-col gap-1">
                        <span className="debug-label">Mock Mode</span>
                        <span className="text-xs text-gray-500">API通信のシミュレーション方法を選択</span>
                    </div>
                    <select
                        className="debug-select"
                        value={mockMode}
                        onChange={(e) => setMockMode(e.target.value)}
                    >
                        <option value="FE">Frontend Mock (完全オフライン)</option>
                        <option value="BE">Backend Mock (Dify API経由)</option>
                        <option value="OFF">Real API (本番動作)</option>
                    </select>
                </div>

                <div className="debug-row">
                    <div className="flex flex-col gap-1">
                        <span className="debug-label">API Configuration</span>
                        <span className="text-xs text-gray-500">エンドポイントとAPIキーの設定</span>
                    </div>
                    <button className="debug-btn" onClick={onOpenApiConfig}>
                        <Key size={16} />
                        <span>API設定を開く</span>
                    </button>
                </div>
            </div>

            {/* 2. Identity Management */}
            <div className="debug-card">
                <div className="debug-card-header">
                    <div className="debug-card-title">
                        <Database size={20} className="text-purple-500" />
                        <span>ID管理 (Identity)</span>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <span className="debug-label">Current User ID (localStorage: app_user_id)</span>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="debug-input"
                                value={userIdInput}
                                onChange={handleUserIdChange}
                            />
                            <button
                                className="debug-btn"
                                onClick={handleRegenerateId}
                                title="新しいIDを生成"
                            >
                                <RefreshCw size={16} />
                            </button>
                        </div>
                        <div className="flex justify-end">
                            <button
                                className={`debug-btn ${isIdChanged ? 'primary' : ''}`}
                                onClick={handleApplyUserId}
                                disabled={!isIdChanged}
                            >
                                <Check size={16} />
                                <span>適用してリロード</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. System Info */}
            <div className="debug-card">
                <div className="debug-card-header">
                    <div className="debug-card-title">
                        <Code size={20} className="text-gray-500" />
                        <span>System Info</span>
                    </div>
                </div>
                <div className="debug-row">
                    <span className="debug-label">App Version</span>
                    <span className="debug-value">Phase 1 (v0.5.0)</span>
                </div>
                <div className="debug-row">
                    <span className="debug-label">React Version</span>
                    <span className="debug-value">{React.version}</span>
                </div>
            </div>

        </div>
    );
};

export default DebugSettings;