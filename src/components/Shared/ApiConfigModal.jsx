// src/components/Shared/ApiConfigModal.jsx
import React, { useState, useEffect } from 'react';
import { useApiConfig } from '../../hooks/useApiConfig';
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

// ★変更: addLogを受け取る
const ApiConfigModal = ({ isOpen, onClose, currentApiKey, currentApiUrl, onSave, mockMode, addLog }) => {
    const [apiKey, setApiKey] = useState('');
    const [apiUrl, setApiUrl] = useState('');
    const [showKey, setShowKey] = useState(false);

    // Status: idle | testing | success | error
    const [status, setStatus] = useState('idle');
    const [statusMessage, setStatusMessage] = useState('');

    const { checkConnection } = useApiConfig();

    useEffect(() => {
        if (isOpen) {
            setApiKey(currentApiKey || '');
            setApiUrl(currentApiUrl || '');
            setStatus('idle');
            setStatusMessage('');
            setShowKey(false);

            // ★追加: モーダルオープン時の状態をログ出力
            if (addLog) {
                addLog(`[ApiConfig] Modal Opened. MockMode: ${mockMode}, HasKey: ${!!currentApiKey}, HasUrl: ${!!currentApiUrl}`, 'debug');
            }
        }
    }, [isOpen, currentApiKey, currentApiUrl, mockMode, addLog]);

    if (!isOpen) return null;

    const formatUrl = (url) => {
        let formatted = url.trim();
        if (formatted.endsWith('/')) {
            formatted = formatted.slice(0, -1);
        }
        return formatted;
    };

    const handleTestAndSave = async () => {
        const formattedUrl = formatUrl(apiUrl);

        // ログ出力
        if (addLog) {
            addLog(`[ApiConfig] Test & Save clicked. Mode: ${mockMode}, KeyLength: ${apiKey.length}, URL: ${formattedUrl}`, 'info');
        }

        // バリデーションログ
        if (mockMode !== 'FE' && !apiKey.trim()) {
            const msg = 'APIキーを入力してください (Non-FE Mode)';
            if (addLog) addLog(`[ApiConfig] Validation Failed: ${msg}`, 'warn');
            setStatus('error');
            setStatusMessage('APIキーを入力してください');
            return;
        }

        setStatus('testing');
        setStatusMessage('接続を確認中...');

        try {
            if (addLog) addLog('[ApiConfig] Calling checkConnection...', 'debug');

            await checkConnection(apiKey, formattedUrl, mockMode);

            if (addLog) addLog('[ApiConfig] Connection check passed.', 'success');

            setStatus('success');
            setStatusMessage('接続に成功しました');

            setTimeout(() => {
                if (addLog) addLog('[ApiConfig] Saving config and closing.', 'info');
                onSave(apiKey, formattedUrl);
                onClose();
            }, 1000);

        } catch (error) {
            const errorMsg = error.message || '不明なエラー';
            if (addLog) addLog(`[ApiConfig] Connection Failed: ${errorMsg}`, 'error');

            setStatus('error');
            setStatusMessage(`接続失敗: ${errorMsg}`);
        }
    };

    // ボタンの有効化状態
    const isFormValid = mockMode === 'FE' || (apiUrl && apiKey);

    // ★追加: バリデーション状態の変化をデバッグ
    // (頻繁に出るのを防ぐため、ボタンクリック時または値確定時に見るのが良いが、今回はデバッグのためシンプルに)

    return (
        <div className="api-modal-overlay">
            <div className="api-modal-container">

                <div className="api-modal-header">
                    <div className="icon-wrapper">
                        <CloudIcon width="24" height="24" color="var(--color-primary)" />
                    </div>
                    <div className="header-text">
                        <h2>API設定</h2>
                        <p>Dify APIとの接続設定を管理します</p>
                    </div>
                </div>

                <div className="api-modal-body">

                    {mockMode === 'FE' && (
                        <div className="mock-mode-info">
                            <AlertCircleIcon width="16" height="16" />
                            <span>現在 <strong>Frontend Mock Mode</strong> です。接続テストはシミュレーションされます。</span>
                        </div>
                    )}

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
                </div>

                <div className="api-modal-footer">
                    {status !== 'idle' && (
                        <div className={`status-bar ${status}`}>
                            {status === 'testing' && <LoaderIcon width="16" height="16" className="animate-spin" />}
                            {status === 'success' && <CheckCircleIcon width="16" height="16" />}
                            {status === 'error' && <AlertCircleIcon width="16" height="16" />}
                            <span className="status-text">{statusMessage}</span>
                        </div>
                    )}

                    <div className="button-row">
                        <button className="btn-cancel" onClick={onClose}>
                            キャンセル
                        </button>
                        <button
                            className="btn-save"
                            onClick={handleTestAndSave}
                            // ボタンが無効化されている原因を知るために、無効化ロジックは厳密に
                            disabled={status === 'testing' || !isFormValid}
                            title={!isFormValid ? "FEモード以外ではAPI URLとAPIキーが必須です" : ""}
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