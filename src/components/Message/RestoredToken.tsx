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

    // 復元済み: 元の値をインライン表示
    if (restoredValue) {
        return (
            <span className="restored-token restored-token--resolved">
                <span className="restored-token__badge" title="保護された機密情報（復元済み）">🛡️</span>
                <span className="restored-token__value">{restoredValue}</span>
            </span>
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
