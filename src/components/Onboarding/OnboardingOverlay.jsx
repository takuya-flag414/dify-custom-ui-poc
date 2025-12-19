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

    // アニメーション設定
    const stepVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 30 : -30,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            x: direction < 0 ? 30 : -30,
            opacity: 0
        })
    };

    return createPortal(
        <div className="onboarding-overlay">
            <motion.div
                className="onboarding-container"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
                <div className="onboarding-content">
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

                    {/* ステップコンテンツ */}
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={currentStep}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                            style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
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
