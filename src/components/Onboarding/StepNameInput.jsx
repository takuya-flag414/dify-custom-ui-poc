// src/components/Onboarding/StepNameInput.jsx
import React, { useRef, useEffect } from 'react';

const StepNameInput = ({ name, onNameChange, onNext, onPrev }) => {
    const inputRef = useRef(null);

    // オートフォーカス
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 300); // アニメーション完了後
        return () => clearTimeout(timer);
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && name.trim()) {
            onNext();
        }
    };

    const isValid = name.trim().length > 0;

    return (
        <div className="onboarding-step split-layout">
            <div className="onboarding-step-left">
                <h1 className="onboarding-title">
                    あなたのお名前を<br />教えてください
                </h1>
                <p className="onboarding-subtitle">
                    AIはあなたをこの名前で呼びます。
                </p>
                <div className="title-decoration-line" />
            </div>

            <div className="onboarding-step-right">
                <div className="input-container-large">
                    <input
                        ref={inputRef}
                        type="text"
                        className="onboarding-input"
                        placeholder="お名前"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        maxLength={20}
                        autoComplete="off"
                    />
                    <p className="onboarding-input-hint">
                        ニックネームでもOKです
                    </p>
                </div>

                <div className="onboarding-actions row-actions">
                    <button
                        className="onboarding-btn onboarding-btn-secondary"
                        onClick={onPrev}
                    >
                        戻る
                    </button>
                    <button
                        className="onboarding-btn onboarding-btn-primary"
                        onClick={onNext}
                        disabled={!isValid}
                    >
                        次へ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StepNameInput;
