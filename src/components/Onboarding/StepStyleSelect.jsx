// src/components/Onboarding/StepStyleSelect.jsx
import React from 'react';

// 効率重視アイコン
const EfficientIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="13 17 18 12 13 7" />
        <polyline points="6 17 11 12 6 7" />
    </svg>
);

// 思考パートナーアイコン
const PartnerIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
);

const STYLES = [
    {
        id: 'efficient',
        icon: EfficientIcon,
        title: '効率重視',
        description: '結論から簡潔に。箇条書きを多用し、時間を節約します。'
    },
    {
        id: 'partner',
        icon: PartnerIcon,
        title: '思考パートナー',
        description: '背景や理由を含めて丁寧に。壁打ち相手として対話します。'
    }
];

const StepStyleSelect = ({ selectedStyle, onStyleChange, onNext, onPrev }) => {
    const handleCardClick = (styleId) => {
        onStyleChange(styleId);
    };

    return (
        <div className="onboarding-step">
            <h1 className="onboarding-title">
                どのようなサポートを<br />希望しますか？
            </h1>

            <p className="onboarding-subtitle">
                あなたに合ったコミュニケーションスタイルを選んでください。
            </p>

            <div className="onboarding-cards">
                {STYLES.map((style) => {
                    const IconComponent = style.icon;
                    const isSelected = selectedStyle === style.id;

                    return (
                        <div
                            key={style.id}
                            className={`onboarding-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleCardClick(style.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleCardClick(style.id);
                                }
                            }}
                        >
                            <div className="onboarding-card-icon">
                                <IconComponent />
                            </div>
                            <div className="onboarding-card-content">
                                <h3 className="onboarding-card-title">{style.title}</h3>
                                <p className="onboarding-card-desc">{style.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="onboarding-actions">
                <button
                    className="onboarding-btn onboarding-btn-primary"
                    onClick={onNext}
                >
                    次へ
                </button>
                <button
                    className="onboarding-btn onboarding-btn-secondary"
                    onClick={onPrev}
                >
                    戻る
                </button>
            </div>
        </div>
    );
};

export default StepStyleSelect;
