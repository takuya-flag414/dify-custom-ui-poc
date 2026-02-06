// src/components/Shared/ApiConfigModal.jsx
import React, { useState, useEffect } from 'react';
import './ApiConfigModal.css';
import {
    ServerIcon,
    KeyIcon,
    EyeIcon,
    EyeOffIcon,
    CloudIcon,
    LoaderIcon,
    CheckCircleIcon,
    AlertCircleIcon
} from './SystemIcons';

const DIFY_CLOUD_URL = 'https://api.dify.ai/v1';

// タブ定義
const TABS = {
    BACKEND_A: 'backend_a',
    BACKEND_B: 'backend_b',
};

const TAB_LABELS = {
    [TABS.BACKEND_A]: 'Backend A (チャット)',
    [TABS.BACKEND_B]: 'Backend B (ストア管理)',
};

const TAB_DESCRIPTIONS = {
    [TABS.BACKEND_A]: 'HybridQA チャットアプリとの接続設定',
    [TABS.BACKEND_B]: 'Gemini File Search ストア管理用ワークフローとの接続設定',
};

// TabButton コンポーネント
const TabButton = ({ tabId, activeTab, onClick, children }) => (
    <button
        type="button"
        className={`tab-button ${activeTab === tabId ? 'active' : ''}`}
        onClick={() => onClick(tabId)}
    >
        {children}
    </button>
);

/**
 * API設定モーダル（タブ切り替え式）
 * - Backend A: HybridQA (Chatflowアプリ)
 * - Backend B: Gemini File Search PoC (Workflowアプリ)
 */
const ApiConfigModal = ({
    isOpen,
    onClose,
    // Backend A
    currentApiKey,
    currentApiUrl,
    onSave,
    // Backend B
    currentBackendBApiKey = '',
    currentBackendBApiUrl = '',
    onSaveBackendB,
    // 共通
    mockMode
}) => {
    const [activeTab, setActiveTab] = useState(TABS.BACKEND_A);

    // Backend A State
    const [apiKeyA, setApiKeyA] = useState('');
    const [apiUrlA, setApiUrlA] = useState('');
    const [showKeyA, setShowKeyA] = useState(false);

    // Backend B State
    const [apiKeyB, setApiKeyB] = useState('');
    const [apiUrlB, setApiUrlB] = useState('');
    const [showKeyB, setShowKeyB] = useState(false);

    // Status: idle | testing | success | error
    const [status, setStatus] = useState('idle');
    const [statusMessage, setStatusMessage] = useState('');

    // モーダルが開くたびに初期化
    useEffect(() => {
        if (isOpen) {
            // Backend A
            setApiKeyA(currentApiKey || '');
            setApiUrlA(currentApiUrl || '');
            setShowKeyA(false);
            // Backend B
            setApiKeyB(currentBackendBApiKey || '');
            setApiUrlB(currentBackendBApiUrl || '');
            setShowKeyB(false);
            // 共通
            setStatus('idle');
            setStatusMessage('');
            setActiveTab(TABS.BACKEND_A);
        }
    }, [isOpen, currentApiKey, currentApiUrl, currentBackendBApiKey, currentBackendBApiUrl]);

    if (!isOpen) return null;

    // URL整形
    const formatUrl = (url) => {
        let formatted = url.trim();
        if (formatted.endsWith('/')) {
            formatted = formatted.slice(0, -1);
        }
        return formatted;
    };

    // 接続テスト（/info エンドポイント）
    const testApiConnection = async (apiKey, apiUrl) => {
        const response = await fetch(`${apiUrl}/info`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('認証に失敗しました。APIキーを確認してください');
            }
            throw new Error(`接続に失敗しました (${response.status})`);
        }
        return true;
    };

    // Backend A 保存処理
    const handleTestAndSaveA = async () => {
        const formattedUrl = formatUrl(apiUrlA);

        if (!apiKeyA.trim()) {
            setStatus('error');
            setStatusMessage('APIキーを入力してください');
            return;
        }

        setStatus('testing');
        setStatusMessage('接続を確認中...');

        try {
            await testApiConnection(apiKeyA, formattedUrl);
            setStatus('success');
            setStatusMessage('接続に成功しました');

            setTimeout(() => {
                onSave(apiKeyA, formattedUrl);
                onClose(); // モーダルを閉じる
            }, 500);
        } catch (error) {
            setStatus('error');
            setStatusMessage(`接続失敗: ${error.message || '不明なエラー'}`);
        }
    };

    // Backend B 保存処理
    const handleTestAndSaveB = async () => {
        const formattedUrl = formatUrl(apiUrlB);

        if (!apiKeyB.trim()) {
            setStatus('error');
            setStatusMessage('APIキーを入力してください');
            return;
        }

        setStatus('testing');
        setStatusMessage('接続を確認中...');

        try {
            await testApiConnection(apiKeyB, formattedUrl);
            setStatus('success');
            setStatusMessage('接続に成功しました');

            setTimeout(() => {
                if (onSaveBackendB) {
                    onSaveBackendB(apiKeyB, formattedUrl);
                }
                onClose(); // モーダルを閉じる
            }, 500);
        } catch (error) {
            setStatus('error');
            setStatusMessage(`接続失敗: ${error.message || '不明なエラー'}`);
        }
    };

    // タブ切り替え時にステータスをリセット
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setStatus('idle');
        setStatusMessage('');
    };

    // 現在のタブの入力状態バリデーション
    const isFormValid = activeTab === TABS.BACKEND_A
        ? apiUrlA && apiKeyA
        : apiUrlB && apiKeyB;

    const handleSave = activeTab === TABS.BACKEND_A
        ? handleTestAndSaveA
        : handleTestAndSaveB;

    // 入力フィールドのレンダリング
    const renderInputFields = () => {
        const isBackendA = activeTab === TABS.BACKEND_A;
        const apiKey = isBackendA ? apiKeyA : apiKeyB;
        const setApiKey = isBackendA ? setApiKeyA : setApiKeyB;
        const apiUrl = isBackendA ? apiUrlA : apiUrlB;
        const setApiUrl = isBackendA ? setApiUrlA : setApiUrlB;
        const showKey = isBackendA ? showKeyA : showKeyB;
        const setShowKey = isBackendA ? setShowKeyA : setShowKeyB;

        return (
            <>
                {/* API URL Input */}
                <div className="input-group">
                    <label>API エンドポイント (Base URL)</label>
                    <div className={`input-wrapper ${status === 'error' ? 'error' : ''}`}>
                        <div className="input-icon">
                            <ServerIcon width="18" height="18" />
                        </div>
                        <input
                            type="text"
                            value={apiUrl}
                            onChange={(e) => {
                                setApiUrl(e.target.value);
                                setStatus('idle');
                            }}
                            placeholder="https://api.dify.ai/v1"
                            className="styled-input"
                        />
                    </div>
                    <div className="helper-text">
                        <span className="link-btn" onClick={() => setApiUrl(DIFY_CLOUD_URL)}>
                            Dify Cloudのデフォルトを使用
                        </span>
                    </div>
                </div>

                {/* API Key Input */}
                <div className="input-group">
                    <label>API キー (App Key)</label>
                    <div className={`input-wrapper ${status === 'error' ? 'error' : ''}`}>
                        <div className="input-icon">
                            <KeyIcon width="18" height="18" />
                        </div>
                        <input
                            type={showKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => {
                                setApiKey(e.target.value);
                                setStatus('idle');
                            }}
                            placeholder="app-xxxxxxxxxxxxxxxxxxxx"
                            className="styled-input"
                        />
                        <button
                            className="toggle-visibility"
                            onClick={() => setShowKey(!showKey)}
                            tabIndex="-1"
                        >
                            {showKey ?
                                <EyeOffIcon width="16" height="16" /> :
                                <EyeIcon width="16" height="16" />
                            }
                        </button>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="api-modal-overlay">
            <div className="api-modal-container">

                {/* Header */}
                <div className="api-modal-header">
                    <div className="icon-wrapper">
                        <CloudIcon width="24" height="24" color="var(--color-primary)" />
                    </div>
                    <div className="header-text">
                        <h2>API設定</h2>
                        <p>Dify APIとの接続設定を管理します</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="api-modal-tabs">
                    <TabButton tabId={TABS.BACKEND_A} activeTab={activeTab} onClick={handleTabChange}>
                        {TAB_LABELS[TABS.BACKEND_A]}
                    </TabButton>
                    <TabButton tabId={TABS.BACKEND_B} activeTab={activeTab} onClick={handleTabChange}>
                        {TAB_LABELS[TABS.BACKEND_B]}
                    </TabButton>
                </div>

                {/* Body */}
                <div className="api-modal-body">
                    {/* Tab Description */}
                    <div className="tab-description">
                        {TAB_DESCRIPTIONS[activeTab]}
                    </div>

                    {renderInputFields()}
                </div>

                {/* Footer */}
                <div className="api-modal-footer">
                    {/* Status Bar */}
                    {status !== 'idle' && (
                        <div className={`status-bar ${status}`}>
                            {status === 'testing' && <LoaderIcon width="16" height="16" className="animate-spin" />}
                            {status === 'success' && <CheckCircleIcon width="16" height="16" />}
                            {status === 'error' && <AlertCircleIcon width="16" height="16" />}
                            <span className="status-text">{statusMessage}</span>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="button-row">
                        <button className="btn-cancel" onClick={onClose}>
                            キャンセル
                        </button>
                        <button
                            className="btn-save"
                            onClick={handleSave}
                            disabled={status === 'testing' || !isFormValid}
                        >
                            {status === 'testing' ? '確認中...' : '接続テスト & 保存'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ApiConfigModal;