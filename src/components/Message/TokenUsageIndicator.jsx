import React from 'react';
import './TokenUsageIndicator.css';

const TokenUsageIndicator = ({ usage }) => {
    if (!usage || !usage.total_tokens) return null;

    return (
        <div className="token-usage-indicator">
            <span className="token-usage-total">
                {usage.total_tokens.toLocaleString()} tokens
            </span>

            <div className="token-usage-tooltip">
                {(usage.prompt_tokens !== null && usage.prompt_tokens !== undefined) && (
                    <div className="tooltip-row">
                        <span className="tooltip-label">入力</span>
                        <span className="tooltip-value">{usage.prompt_tokens.toLocaleString()}</span>
                    </div>
                )}
                {(usage.completion_tokens !== null && usage.completion_tokens !== undefined) && (
                    <div className="tooltip-row">
                        <span className="tooltip-label">出力</span>
                        <span className="tooltip-value">{usage.completion_tokens.toLocaleString()}</span>
                    </div>
                )}
                {(usage.prompt_tokens !== null && usage.prompt_tokens !== undefined) && <div className="tooltip-divider"></div>}
                <div className="tooltip-row total">
                    <span className="tooltip-label">合計</span>
                    <span className="tooltip-value">{usage.total_tokens?.toLocaleString() || 0}</span>
                </div>
            </div>
        </div>
    );
};

export default TokenUsageIndicator;
