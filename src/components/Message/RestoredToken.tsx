// src/components/Message/RestoredToken.tsx
/**
 * RestoredToken - 復元済み/未復元トークンのインライン表示
 * 
 * - 復元済み: 元の値 + 🛡️ バッジ + 控えめなアンダーライン
 * - 未復元（リロード後等）: 伏字チップ + ツールチップ
 */

import React, { useState } from 'react';
import './RestoredToken.css';

interface RestoredTokenProps {
    /** 復元された元の値（null の場合は未復元） */
    restoredValue: string | null;
    /** トークン文字列（例: "{{PHONE_NUMBER_A1}}"） */
    token: string;
}

const RestoredToken: React.FC<RestoredTokenProps> = ({ restoredValue, token }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);

    // 復元済み: 元の値とトークンを切り替えて表示
    if (restoredValue) {
        return (
            <button
                type="button"
                className={`restored-token restored-token--resolved ${isRevealed ? 'is-revealed' : 'is-hidden'}`}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsRevealed(!isRevealed);
                }}
                title={isRevealed ? "クリックして隠す" : "クリックして表示"}
                aria-expanded={isRevealed}
            >
                <span className="restored-token__badge">
                    {isRevealed ? (
                        <svg className="token-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                        </svg>
                    ) : (
                        <svg className="token-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                    )}
                </span>
                <span className="restored-token__display-value">
                    {isRevealed ? restoredValue : token}
                </span>
            </button>
        );
    }

    // 未復元: 伏字チップ表示
    return (
        <span
            className="restored-token restored-token--redacted"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <span className="restored-token__chip">
                <span className="restored-token__lock">🔒</span>
                <span className="restored-token__redacted-text">機密情報を含むため伏せてあります</span>
            </span>
            {showTooltip && (
                <span className="restored-token__tooltip">
                    このセッションでは復元できません。元の情報はサーバーに送信されていません。
                </span>
            )}
        </span>
    );
};

export default RestoredToken;
