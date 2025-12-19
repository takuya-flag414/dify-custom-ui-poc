// src/components/Settings/sections/DebugSettings.jsx
import React, { useState, useEffect } from 'react';
import {
    Server,
    Database,
    Key,
    RefreshCw,
    Check,
    Code,
    Users, // ★追加
    Download, // ★追加
    Upload, // ★追加
    Copy, // ★追加
    FileJson // ★追加
} from 'lucide-react';
import './DebugSettings.css';

const DebugSettings = ({
    currentUser,
    mockMode,
    setMockMode,
    onOpenApiConfig,
    // 親コンポーネント(SettingsPanel等)から全設定データを受け取る想定
    // 受け取れない場合はhookをここで呼ぶ形になりますが、今回は簡易的にlocalStorageから直読みします
}) => {
    // --- 1. User ID Logic ---
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
        if (window.confirm('ユーザーIDを変更してアプリをリロードしますか？')) {
            localStorage.setItem('app_user_id', userIdInput.trim());
            window.location.reload();
        }
    };

    const handleRegenerateId = () => {
        const newId = `user-${crypto.randomUUID().slice(0, 8)}`;
        setUserIdInput(newId);
        setIsIdChanged(true);
    };

    // --- 2. Role Switching Logic (New) ---
    // 現在のデバッグ用ロールを取得
    const currentDebugRole = localStorage.getItem('app_debug_role') || 'developer';
    const [selectedRole, setSelectedRole] = useState(currentDebugRole);

    const handleRoleApply = () => {
        if (selectedRole === currentDebugRole) return;
        localStorage.setItem('app_debug_role', selectedRole);
        window.location.reload(); // リロードして設定画面の表示項目への反映を確認する
    };

    // --- 3. Sync Settings Logic (New) ---
    const [importJson, setImportJson] = useState('');
    
    const handleExport = () => {
        const userId = localStorage.getItem('app_user_id');
        const key = `app_preferences_${userId}`;
        const data = localStorage.getItem(key) || '{}';
        
        // 整形してクリップボードへ
        try {
            const formatted = JSON.stringify(JSON.parse(data), null, 2);
            navigator.clipboard.writeText(formatted);
            alert('設定JSONをクリップボードにコピーしました');
        } catch (e) {
            alert('設定データの取得に失敗しました');
        }
    };

    const handleImport = () => {
        try {
            const parsed = JSON.parse(importJson);
            const userId = localStorage.getItem('app_user_id');
            const key = `app_preferences_${userId}`;
            
            if (window.confirm('現在の設定を上書きしますか？この操作は取り消せません。')) {
                localStorage.setItem(key, JSON.stringify(parsed));
                window.location.reload();
            }
        } catch (e) {
            alert('無効なJSON形式です');
        }
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

            {/* 2. Identity & Role Management (Extended) */}
            <div className="debug-card">
                <div className="debug-card-header">
                    <div className="debug-card-title">
                        <Database size={20} className="text-purple-500" />
                        <span>ID & ロール管理 (Identity)</span>
                    </div>
                </div>

                {/* User ID */}
                <div className="flex flex-col gap-2 mb-4">
                    <span className="debug-label">Current User ID</span>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="debug-input"
                            value={userIdInput}
                            onChange={handleUserIdChange}
                        />
                        <button className="debug-btn" onClick={handleRegenerateId} title="Re-gen ID">
                            <RefreshCw size={16} />
                        </button>
                    </div>
                    {isIdChanged && (
                        <div className="flex justify-end">
                            <button className="debug-btn primary" onClick={handleApplyUserId}>
                                <Check size={16} /> <span>ID変更を適用</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Role Switching */}
                <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Users size={16} className="text-[var(--color-text-sub)]" />
                        <span className="debug-label">Debug Role (Persona)</span>
                    </div>
                    <div className="flex gap-2">
                        <select 
                            className="debug-select flex-1"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        >
                            <option value="user">User (一般ユーザー)</option>
                            <option value="admin">Admin (管理者)</option>
                            <option value="developer">Developer (開発者)</option>
                        </select>
                        <button 
                            className={`debug-btn ${selectedRole !== currentDebugRole ? 'primary' : ''}`}
                            onClick={handleRoleApply}
                            disabled={selectedRole === currentDebugRole}
                        >
                            <RefreshCw size={16} />
                            <span>切替</span>
                        </button>
                    </div>
                    <p className="text-xs text-orange-500 mt-1">
                        ※ ロールを切り替えると、サイドバーの設定項目の表示が変わります。
                    </p>
                </div>
            </div>

            {/* 3. Settings Sync (New) */}
            <div className="debug-card">
                 <div className="debug-card-header">
                    <div className="debug-card-title">
                        <FileJson size={20} className="text-green-500" />
                        <span>設定同期 (Sync)</span>
                    </div>
                </div>
                
                <div className="flex flex-col gap-4">
                    {/* Export */}
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="debug-label">Current Settings Export</span>
                            <span className="text-xs text-gray-500">現在の設定をJSONとしてコピー</span>
                        </div>
                        <button className="debug-btn" onClick={handleExport}>
                            <Copy size={14} />
                            <span>Copy JSON</span>
                        </button>
                    </div>

                    {/* Import */}
                    <div className="flex flex-col gap-2">
                        <span className="debug-label">Import Settings JSON</span>
                        <textarea 
                            className="w-full h-24 p-2 text-xs font-mono border border-[var(--color-border)] rounded bg-[var(--color-bg-body)] focus:outline-none focus:border-blue-500"
                            placeholder='Paste JSON here: {"general": {...}, "profile": {...}}'
                            value={importJson}
                            onChange={(e) => setImportJson(e.target.value)}
                        />
                        <div className="flex justify-end">
                             <button 
                                className="debug-btn" 
                                onClick={handleImport}
                                disabled={!importJson}
                             >
                                <Upload size={14} />
                                <span>Import & Reload</span>
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. System Info */}
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