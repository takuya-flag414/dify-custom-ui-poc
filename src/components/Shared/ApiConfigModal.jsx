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

const ApiConfigModal = ({ isOpen, onClose, currentApiKey, currentApiUrl, onSave }) => {
    const [apiKey, setApiKey] = useState('');
    const [apiUrl, setApiUrl] = useState('');
    const [showKey, setShowKey] = useState(false);

    // Status: idle | testing | success | error
    const [status, setStatus] = useState('idle');
    const [statusMessage, setStatusMessage] = useState('');

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
        // 末尾のスラッシュ削除
        if (formatted.endsWith('/')) {
            formatted = formatted.slice(0, -1);
        }
        return formatted;
    };

    const handleTestAndSave = async () => {
        // 簡易バリデーション
        if (!apiUrl) {
            setStatus('error');
            setStatusMessage('API URLを入力してください');
            return;
        }
        if (!apiKey) {
            setStatus('error');
            setStatusMessage('API Keyを入力してください');
            return;
        }

        const formattedUrl = formatUrl(apiUrl);

        // 接続テスト開始
        setStatus('testing');
        setStatusMessage('Difyサーバーに接続中...');

        try {
            // Dify API仕様に基づき /info または /meta にアクセスして認証確認
            const endpoint = formattedUrl.endsWith('/v1')
                ? `${formattedUrl}/info`
                : `${formattedUrl}/v1/info`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // 成功
                setStatus('success');
                setStatusMessage('接続成功！設定を保存しました');

                // 1秒後に保存して閉じる
                setTimeout(() => {
                    onSave(apiKey, formattedUrl);
                    onClose();
                }, 1000);
            } else {
                // エラーハンドリング
                const statusText = response.status === 401 ? '認証エラー: APIキーが無効です'
                    : response.status === 404 ? 'エラー: エンドポイントが見つかりません'
                        : `エラー: サーバー応答 ${response.status}`;

                setStatus('error');
                setStatusMessage(statusText);
            }
        } catch (error) {
            setStatus('error');
            setStatusMessage('通信エラー: URLを確認してください');
            console.error('Connection Test Error:', error);
        }
    };

    const handleUseCloudDefaults = () => {
        setApiUrl(DIFY_CLOUD_URL);
        // エラー状態からの復帰があればクリア
        if (status === 'error') {
            setStatus('idle');
            setStatusMessage('');
        }
    };

    return (
        <div className="api-modal-overlay" onClick={onClose}>
            <div className="api-modal-container" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="api-modal-header">
                    <h2 className="api-modal-title">API接続設定</h2>
                    {/* Closeボタンは削除 */}
                </div>

                {/* Body */}
                <div className="api-modal-body">

                    {/* URL Input */}
                    <div className="input-group">
                        <label className="input-label">Dify API URL</label>
                        <div className="input-wrapper">
                            <ServerIcon className="input-icon-left" width="18" height="18" />
                            <input
                                type="text"
                                className="styled-input"
                                placeholder="https://api.dify.ai/v1"
                                value={apiUrl}
                                onChange={(e) => {
                                    setApiUrl(e.target.value);
                                    if (status === 'error') setStatus('idle');
                                }}
                            />
                        </div>

                        {/* Helper Button */}
                        <button
                            className="helper-action"
                            onClick={handleUseCloudDefaults}
                            type="button"
                        >
                            <CloudIcon width="14" height="14" />
                            <span>Dify Cloud (Default) を使用</span>
                        </button>
                    </div>

                    {/* API Key Input */}
                    <div className="input-group">
                        <label className="input-label">API Key</label>
                        <div className="input-wrapper">
                            <KeyIcon className="input-icon-left" width="18" height="18" />
                            <input
                                type={showKey ? "text" : "password"}
                                className="styled-input font-mono"
                                placeholder="app-xxxxxxxxxxxxxxxxxxxx"
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    if (status === 'error') setStatus('idle');
                                }}
                            />
                            <div className="input-action-right">
                                <button
                                    className="icon-button"
                                    onClick={() => setShowKey(!showKey)}
                                    type="button"
                                    title={showKey ? "隠す" : "表示する"}
                                >
                                    {showKey ? <EyeOffIcon width="18" height="18" /> : <EyeIcon width="18" height="18" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="api-modal-footer">
                    {/* Status Bar */}
                    {status !== 'idle' && (
                        <div className={`status-bar ${status}`}>
                            {status === 'testing' && <LoaderIcon width="16" height="16" />}
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
                            disabled={status === 'testing' || !apiUrl || !apiKey}
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