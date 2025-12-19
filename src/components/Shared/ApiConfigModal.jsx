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

// mockMode は Props として受け取りますが、もはやバリデーション緩和には使いません
const ApiConfigModal = ({ isOpen, onClose, currentApiKey, currentApiUrl, onSave, mockMode }) => {
    const [apiKey, setApiKey] = useState('');
    const [apiUrl, setApiUrl] = useState('');
    const [showKey, setShowKey] = useState(false);

    // Status: idle | testing | success | error
    const [status, setStatus] = useState('idle');
    const [statusMessage, setStatusMessage] = useState('');

    const { checkConnection } = useApiConfig();

    // モーダルが開くたびに初期化
    useEffect(() => {
        if (isOpen) {
            setApiKey(currentApiKey || '');
            setApiUrl(currentApiUrl || '');
            setStatus('idle');
            setStatusMessage('');
            setShowKey(false);
        }
    }, [isOpen, currentApiKey, currentApiUrl]);

    if (!isOpen) return null;

    // バリデーションと整形
    const formatUrl = (url) => {
        let formatted = url.trim();
        if (formatted.endsWith('/')) {
            formatted = formatted.slice(0, -1);
        }
        return formatted;
    };

    const handleTestAndSave = async () => {
        const formattedUrl = formatUrl(apiUrl);
        
        // ★変更: モードに関わらず必須チェック
        if (!apiKey.trim()) {
            setStatus('error');
            setStatusMessage('APIキーを入力してください');
            return;
        }

        setStatus('testing');
        setStatusMessage('接続を確認中...');

        try {
            // Adapterは常にリアルな通信を行うようになった
            await checkConnection(apiKey, formattedUrl, mockMode);

            setStatus('success');
            setStatusMessage('接続に成功しました');

            setTimeout(() => {
                onSave(apiKey, formattedUrl);
                onClose();
            }, 1000);

        } catch (error) {
            setStatus('error');
            setStatusMessage(`接続失敗: ${error.message || '不明なエラー'}`);
        }
    };

    // ★変更: APIKeyとURLがある場合のみ有効
    const isFormValid = apiUrl && apiKey;

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

                {/* Body */}
                <div className="api-modal-body">
                    
                    {/* ★変更: FEモードの警告バッジを削除 */}

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
                            onClick={handleTestAndSave}
                            // ★変更: 厳格なチェック
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