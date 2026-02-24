// src/components/Onboarding/StepWelcome.jsx
import React from 'react';

// App Icon
const AppIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="10" r="1" fill="currentColor" />
        <circle cx="8" cy="10" r="1" fill="currentColor" />
        <circle cx="16" cy="10" r="1" fill="currentColor" />
    </svg>
);

const StepWelcome = ({ onNext }) => {
    return (
        <div className="onboarding-step split-layout">
            <div className="onboarding-step-left">
                <div className="onboarding-icon">
                    <AppIcon />
                </div>
                <h1 className="onboarding-title">ようこそ</h1>
                <p className="onboarding-subtitle">あなたの新しい思考のパートナーへ。</p>
                <div className="title-decoration-line" />
            </div>
            <div className="onboarding-step-right">
                <p className="onboarding-description large-text">
                    数ステップの簡単な設定で、<br />
                    あなたに最適化されたAIアシスタントが始まります。
                </p>
                <div className="onboarding-actions">
                    <button
                        className="onboarding-btn onboarding-btn-primary"
                        onClick={onNext}
                    >
                        始める
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StepWelcome;
