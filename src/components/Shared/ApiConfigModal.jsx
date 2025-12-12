import React, { useState, useEffect } from 'react';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 mx-4 transform transition-all">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">API設定</h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Dify API Endpoint URL
                        </label>
                        <input
                            type="text"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            placeholder="https://api.dify.ai/v1"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Dify API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="app-..."
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl border-2 border-blue-700 text-blue-700 font-semibold hover:bg-blue-50 transition-colors duration-200"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-3 rounded-xl bg-blue-500 text-white font-semibold shadow-md hover:bg-blue-600 hover:shadow-lg transition-all duration-200"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApiConfigModal;
