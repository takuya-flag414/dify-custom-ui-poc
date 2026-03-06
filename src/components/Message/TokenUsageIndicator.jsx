import React from 'react';
import { motion } from 'framer-motion';
import './TokenUsageIndicator.css';

const TokenUsageIndicator = ({ usage }) => {
    if (!usage || !usage.total_tokens) return null;

    return (
        <motion.div
            className="token-usage-indicator group"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
        >
            <div className="token-usage-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
            </div>
            <span className="token-usage-total">
                {usage.total_tokens.toLocaleString()}
            </span>

            <div className="token-usage-tooltip">
                {(usage.prompt_tokens !== null && usage.prompt_tokens !== undefined) && (
                    <div className="tooltip-row">
                        <span className="tooltip-label">Prompt</span>
                        <span className="tooltip-value">{usage.prompt_tokens.toLocaleString()}</span>
                    </div>
                )}
                {(usage.completion_tokens !== null && usage.completion_tokens !== undefined) && (
                    <div className="tooltip-row">
                        <span className="tooltip-label">Completion</span>
                        <span className="tooltip-value">{usage.completion_tokens.toLocaleString()}</span>
                    </div>
                )}
                {(usage.prompt_tokens !== null && usage.prompt_tokens !== undefined) && <div className="tooltip-divider"></div>}
                <div className="tooltip-row total">
                    <span className="tooltip-label">Total</span>
                    <span className="tooltip-value">{usage.total_tokens?.toLocaleString() || 0}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default TokenUsageIndicator;
