import React from 'react';
import './TokenUsageIndicator.css';
import { SHOW_TOKEN_USAGE } from '../../config/env';

const TokenUsageIndicator = ({ usage }) => {
    if (!SHOW_TOKEN_USAGE || !usage || !usage.total_tokens) return null;

    // 入力・出力トークンが取得できているかどうか
    const hasBreakdown = (usage.prompt_tokens != null) && (usage.completion_tokens != null);

    return (
        <div className="token-usage-indicator">
            <span className="token-usage-total">
                {hasBreakdown ? (
                    <>
                        <span className="token-detail-group">
                            <span className="token-detail-label">入力</span>
                            <span className="token-detail-value">{usage.prompt_tokens.toLocaleString()}</span>
                        </span>
                        <span className="token-detail-separator">・</span>
                        <span className="token-detail-group">
                            <span className="token-detail-label">出力</span>
                            <span className="token-detail-value">{usage.completion_tokens.toLocaleString()}</span>
                        </span>
                        <span className="token-detail-separator">・</span>
                        <span className="token-detail-group">
                            <span className="token-detail-label">合計</span>
                            <span className="token-detail-value">{usage.total_tokens.toLocaleString()}</span>
                        </span>
                    </>
                ) : (
                    // 入出力の内訳が無い場合は合計のみ表示（従来動作）
                    <>{usage.total_tokens.toLocaleString()} tokens</>
                )}
            </span>

            {/* ツールチップ：コスト情報があれば追加表示 */}
            <div className="token-usage-tooltip">
                {hasBreakdown && (
                    <>
                        <div className="tooltip-row">
                            <span className="tooltip-label">入力</span>
                            <span className="tooltip-value">{usage.prompt_tokens.toLocaleString()}</span>
                        </div>
                        <div className="tooltip-row">
                            <span className="tooltip-label">出力</span>
                            <span className="tooltip-value">{usage.completion_tokens.toLocaleString()}</span>
                        </div>
                        <div className="tooltip-divider"></div>
                    </>
                )}
                <div className="tooltip-row total">
                    <span className="tooltip-label">合計</span>
                    <span className="tooltip-value">{usage.total_tokens?.toLocaleString() || 0}</span>
                </div>
            </div>
        </div>
    );
};

export default TokenUsageIndicator;
