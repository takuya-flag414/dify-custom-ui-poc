import React, { useState, useEffect } from 'react';
import './ApiConfigModal.css';

const ApiConfigModal = ({ isOpen, onClose, currentApiKey, currentApiUrl, onSave }) => {
    const [apiKey, setApiKey] = useState(currentApiKey);
    const [apiUrl, setApiUrl] = useState(currentApiUrl);

    useEffect(() => {
        if (isOpen) {
            setApiKey(currentApiKey);
            setApiUrl(currentApiUrl);
        }
    }, [isOpen, currentApiKey, currentApiUrl]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(apiKey, apiUrl);
        onClose();
    };

    return (
        <div className="api-modal-overlay">
            <div className="api-modal-container">
                <h2 className="api-modal-title">API設定</h2>

                <div className="api-modal-form">
                    <div className="api-modal-field">
                        <label className="api-modal-label">
                            Dify API Endpoint URL
                        </label>
                        <input
                            type="text"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            placeholder="https://api.dify.ai/v1"
                            className="api-modal-input"
                        />
                    </div>

                    <div className="api-modal-field">
                        <label className="api-modal-label">
                            Dify API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="app-..."
                            className="api-modal-input"
                        />
                    </div>
                </div>

                <div className="api-modal-actions">
                    <button
                        onClick={onClose}
                        className="api-modal-btn-cancel"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        className="api-modal-btn-save"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApiConfigModal;
