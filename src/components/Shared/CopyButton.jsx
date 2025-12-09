// src/components/Shared/CopyButton.jsx
import React, { useState } from 'react';
import '../Message/MessageBlock.css'; // スタイルはMessageBlock.cssに集約します

const CopyButton = ({ text, isAi, className = '' }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async (e) => {
        e.stopPropagation(); // バブルのクリックイベント等を防止
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // 2秒後に戻す
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <button
            className={`copy-btn ${isAi ? 'copy-btn-ai' : 'copy-btn-user'} ${className} ${isCopied ? 'copied' : ''}`}
            onClick={handleCopy}
            aria-label={isCopied ? "コピー完了" : "クリップボードにコピー"}
            title={isCopied ? "コピーしました" : "コピー"}
            type="button"
        >
            <div className="copy-btn-inner">
                {isCopied ? (
                    /* Check Icon */
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                ) : (
                    /* Copy Icon */
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                )}
            </div>
        </button>
    );
};

export default CopyButton;