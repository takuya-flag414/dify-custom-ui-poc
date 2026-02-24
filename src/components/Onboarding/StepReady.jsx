// src/components/Onboarding/StepReady.jsx
import React from 'react';

// チェックアイコン
const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const STYLE_LABELS = {
    efficient: '効率重視',
    partner: '思考パートナー'
};

const StepReady = ({ name, style, onComplete }) => {
    return (
        <div className="onboarding-step centered-layout">
            <div className="onboarding-ready-icon">
                <CheckIcon />
            </div>

            <h1 className="onboarding-title">
                準備が整いました、<br />{name}さん
            </h1>

            <p className="onboarding-subtitle">
                さっそく始めましょう。
            </p>

            <div className="horizontal-summary">
                <div className="onboarding-summary-card">
                    <span className="onboarding-summary-label">お名前</span>
                    <span className="onboarding-summary-value">{name}</span>
                </div>
                <div className="onboarding-summary-card">
                    <span className="onboarding-summary-label">スタイル</span>
                    <span className="onboarding-summary-value">{STYLE_LABELS[style] || style}</span>
                </div>
            </div>

            <div className="onboarding-actions">
                <button
                    className="onboarding-btn onboarding-btn-primary large-btn"
                    onClick={onComplete}
                >
                    チャットを開始
                </button>
            </div>
        </div>
    );
};

export default StepReady;
