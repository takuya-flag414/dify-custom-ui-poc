// src/components/Onboarding/OnboardingOverlay.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './OnboardingOverlay.css';

import StepWelcome from './StepWelcome';
import StepNameInput from './StepNameInput';
import StepStyleSelect from './StepStyleSelect';
import StepReady from './StepReady';

/**
 * オンボーディングオーバーレイ
 * 初回起動時に表示されるセットアップウィザード
 */
const OnboardingOverlay = ({
    isCompleted,
    currentStep,
    totalSteps,
    tempProfile,
    nextStep,
    prevStep,
    setTempName,
    setTempStyle,
    completeOnboarding,
    updateSettings
}) => {
    // 完了済みの場合は何も表示しない
    if (isCompleted) {
        return null;
    }

    // 完了ハンドラー
    const handleComplete = () => {
        completeOnboarding(updateSettings);
    };

    // ステップコンポーネントを取得
    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <StepWelcome
                        key="welcome"
                        onNext={nextStep}
                    />
                );
            case 1:
                return (
                    <StepNameInput
                        key="name"
                        name={tempProfile.name}
                        onNameChange={setTempName}
                        onNext={nextStep}
                        onPrev={prevStep}
                    />
                );
            case 2:
                return (
                    <StepStyleSelect
                        key="style"
                        selectedStyle={tempProfile.style}
                        onStyleChange={setTempStyle}
                        onNext={nextStep}
                        onPrev={prevStep}
                    />
                );
            case 3:
                return (
                    <StepReady
                        key="ready"
                        name={tempProfile.name}
                        style={tempProfile.style}
                        onComplete={handleComplete}
                    />
                );
            default:
                return null;
        }
    };

    // アニメーション設定 (フルスクリーン用スライド風)
    const stepVariants = {
        enter: { x: 50, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -50, opacity: 0 }
    };

    return createPortal(
        <div className="onboarding-overlay">
            <motion.div
                className="onboarding-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
                {/* スライド風背景装飾 */}
                <div className="onboarding-bg-shape bg-shape-1" />
                <div className="onboarding-bg-shape bg-shape-2" />
                <div className="onboarding-bg-shape bg-shape-3" />
                <div className="onboarding-bg-shape bg-shape-4" />
                <div className="onboarding-bg-shape bg-shape-5" />
                <div className="onboarding-bg-shape bg-shape-6" />

                {/* ヘッダーエリア */}
                <div className="onboarding-header">
                    <div className="onboarding-logo">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        AI Partner
                    </div>
                    {/* 進捗ドット */}
                    <div className="onboarding-progress">
                        {Array.from({ length: totalSteps }).map((_, index) => (
                            <div
                                key={index}
                                className={`onboarding-progress-dot ${index === currentStep ? 'active' : ''
                                    } ${index < currentStep ? 'completed' : ''}`}
                            />
                        ))}
                    </div>
                </div>

                {/* ステップコンテンツ */}
                <div className="onboarding-content-wrapper">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={currentStep}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                            className="onboarding-step-container"
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default OnboardingOverlay;
