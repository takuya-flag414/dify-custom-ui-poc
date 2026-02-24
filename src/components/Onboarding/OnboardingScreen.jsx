// src/components/Onboarding/OnboardingScreen.jsx
import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StepWelcome from './steps/StepWelcome';
import StepContextTutorial from './steps/StepContextTutorial';
import StepNameInput from './steps/StepNameInput';
import StepInstructions from './steps/StepInstructions';
import StepReady from './steps/StepReady';
import AnimatedBackground from './components/AnimatedBackground';
import ProgressLine from './components/ProgressLine';
import './OnboardingScreen.css';

/**
 * オンボーディング メイン画面
 * Step IDs:
 *   0: welcome
 *   1: tutorial-knowledge
 *   2: tutorial-web
 *   3: tutorial-hybrid
 *   4: name
 *   5: instructions
 *   6: ready
 */
const OnboardingScreen = ({
    isCompleted,
    currentStep,
    totalSteps,
    tempProfile,
    nextStep,
    prevStep,
    skipTutorial,
    setTempName,
    setTempInstructions,
    completeOnboarding,
    updateSettings,
}) => {
    // 完了ハンドラ
    const handleComplete = useCallback(() => {
        completeOnboarding(updateSettings);
    }, [completeOnboarding, updateSettings]);

    // キーボードナビゲーション
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') nextStep();
            if (e.key === 'ArrowLeft') prevStep();
            if (e.key === 'Escape') {
                // ESCでスキップ（Welcome画面でのみ有効）
                if (currentStep === 0 && skipTutorial) skipTutorial();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextStep, prevStep, skipTutorial, currentStep]);

    // スライド方向（常に右→左）
    const variants = {
        enter: { opacity: 0, x: 40 },
        center: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -40 },
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <StepWelcome
                        key="welcome"
                        onNext={nextStep}
                        onSkip={skipTutorial}
                    />
                );
            case 1:
                return (
                    <StepContextTutorial
                        key="tutorial-knowledge"
                        mode="knowledge"
                        onNext={nextStep}
                        onPrev={prevStep}
                    />
                );
            case 2:
                return (
                    <StepContextTutorial
                        key="tutorial-web"
                        mode="web"
                        onNext={nextStep}
                        onPrev={prevStep}
                    />
                );
            case 3:
                return (
                    <StepContextTutorial
                        key="tutorial-hybrid"
                        mode="hybrid"
                        onNext={nextStep}
                        onPrev={prevStep}
                    />
                );
            case 4:
                return (
                    <StepNameInput
                        key="name"
                        name={tempProfile.name}
                        onNameChange={setTempName}
                        onNext={nextStep}
                        onPrev={prevStep}
                    />
                );
            case 5:
                return (
                    <StepInstructions
                        key="instructions"
                        instructions={tempProfile.customInstructions}
                        onInstructionsChange={setTempInstructions}
                        onNext={nextStep}
                        onPrev={prevStep}
                    />
                );
            case 6:
                return (
                    <StepReady
                        key="ready"
                        name={tempProfile.name}
                        customInstructions={tempProfile.customInstructions}
                        onComplete={handleComplete}
                        onPrev={prevStep}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            className="onboarding-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <AnimatedBackground />

            {/* スライド風背景装飾 */}
            <div className="onboarding-bg-shape bg-shape-1" />
            <div className="onboarding-bg-shape bg-shape-2" />
            <div className="onboarding-bg-shape bg-shape-3" />
            <div className="onboarding-bg-shape bg-shape-4" />
            <div className="onboarding-bg-shape bg-shape-5" />
            <div className="onboarding-bg-shape bg-shape-6" />

            <div className="onboarding-screen-content">
                <ProgressLine currentStep={currentStep} totalSteps={totalSteps} />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            type: 'spring',
                            stiffness: 250,
                            damping: 25,
                        }}
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', flex: 1 }}
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default OnboardingScreen;
