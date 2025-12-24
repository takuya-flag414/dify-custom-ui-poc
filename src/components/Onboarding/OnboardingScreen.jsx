// src/components/Onboarding/OnboardingScreen.jsx
import React, { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './OnboardingScreen.css';

import AnimatedBackground from './components/AnimatedBackground';
import ProgressLine from './components/ProgressLine';

import StepWelcome from './steps/StepWelcome';
import StepNameInput from './steps/StepNameInput';
import StepStyleSelect from './steps/StepStyleSelect';
import StepReady from './steps/StepReady';

/**
 * 新オンボーディング画面 - "The Unboxing"
 * 全画面没入型のセットアップウィザード
 * キーボードナビゲーション対応
 */
const OnboardingScreen = ({
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
    // 方向性トラッキング（前進: 1, 後退: -1）- ref で同期的に追跡
    const prevStepRef = useRef(currentStep);
    const directionRef = useRef(1);
    const containerRef = useRef(null);

    // 方向をレンダリング時に同期的に計算
    if (currentStep !== prevStepRef.current) {
        directionRef.current = currentStep > prevStepRef.current ? 1 : -1;
        prevStepRef.current = currentStep;
    }
    const direction = directionRef.current;

    // キーボードナビゲーション
    const handleKeyDown = useCallback((e) => {
        // 入力フィールドにフォーカスがある場合は無視
        const activeElement = document.activeElement;
        const isInputFocused = activeElement?.tagName === 'INPUT' ||
            activeElement?.tagName === 'TEXTAREA';

        if (isInputFocused && e.key !== 'Escape') {
            return;
        }

        switch (e.key) {
            case 'ArrowRight':
                // ウェルカム画面または最終画面以外で次へ
                if (currentStep === 0) {
                    nextStep();
                } else if (currentStep === 1 && tempProfile.name.trim()) {
                    nextStep();
                } else if (currentStep === 2) {
                    nextStep();
                }
                break;
            case 'ArrowLeft':
                // 最初のステップ以外で戻る
                if (currentStep > 0) {
                    prevStep();
                }
                break;
            case 'Escape':
                // ESCキーで戻る（最初のステップ以外）
                if (currentStep > 0) {
                    prevStep();
                }
                break;
            default:
                break;
        }
    }, [currentStep, nextStep, prevStep, tempProfile.name]);

    // キーボードイベントリスナーを設定
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // 完了済みの場合は表示しない
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
                        onPrev={prevStep}
                    />
                );
            default:
                return null;
        }
    };

    // ステップ切り替えアニメーション（方向対応）
    const stepVariants = {
        enter: (dir) => ({
            opacity: 0,
            x: dir > 0 ? 60 : -60,
            scale: 0.98,
        }),
        center: {
            opacity: 1,
            x: 0,
            scale: 1,
        },
        exit: (dir) => ({
            opacity: 0,
            x: dir > 0 ? -40 : 40,
            scale: 0.98,
        })
    };

    return (
        <motion.div
            className="onboarding-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
                opacity: 0,
                transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
            }}
        >
            {/* 背景エフェクト */}
            <AnimatedBackground />

            {/* コンテンツエリア */}
            <div className="onboarding-screen-content">
                {/* プログレスライン */}
                <ProgressLine currentStep={currentStep} totalSteps={totalSteps} />

                {/* ステップコンテンツ */}
                <AnimatePresence mode="wait" initial={currentStep === 0} custom={direction}>
                    <motion.div
                        key={currentStep}
                        className="onboarding-step-wrapper"
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            duration: 0.35,
                            ease: [0.4, 0, 0.2, 1]
                        }}
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default OnboardingScreen;
