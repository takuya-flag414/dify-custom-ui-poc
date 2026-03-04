// src/components/Onboarding/OnboardingScreen.jsx
import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StepWelcome from './steps/StepWelcome';
import StepContextTutorial from './steps/StepContextTutorial';
import StepNameInput from './steps/StepNameInput';
import StepInstructions from './steps/StepInstructions';
import StepReady from './steps/StepReady';
import StepDiagnosisIntro from './steps/StepDiagnosisIntro';
import StepDiagnosisQuestion from './steps/StepDiagnosisQuestion';
import StepDiagnosisResult from './steps/StepDiagnosisResult';
import { DIAGNOSIS_QUESTIONS } from './utils/diagnosisConstants';
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
 *   5: diagnosis (旧: instructions) - 内部でサブステップ管理
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
    // 診断機能
    diagnosisMode,
    diagnosisSubStep,
    setDiagnosisMode,
    setDiagnosisAnswer,
    nextDiagnosisSubStep,
    prevDiagnosisSubStep,
    resetDiagnosis,
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
                return renderDiagnosisSubStep();
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

    // ─── ステップ5内部: 診断サブステップのルーティング ───
    const renderDiagnosisSubStep = () => {
        // 手動入力モード
        if (diagnosisMode === 'manual') {
            return (
                <StepInstructions
                    key="instructions-manual"
                    instructions={tempProfile.customInstructions}
                    onInstructionsChange={setTempInstructions}
                    onNext={nextStep}
                    onPrev={() => {
                        resetDiagnosis();
                    }}
                />
            );
        }

        // 診断モード: Q1〜Q4
        if (diagnosisMode === 'diagnosis' && diagnosisSubStep >= 1 && diagnosisSubStep <= 4) {
            const qIndex = diagnosisSubStep - 1;
            const questionData = DIAGNOSIS_QUESTIONS[qIndex];
            const currentAnswer = tempProfile.diagnosisAnswers?.[questionData.axisKey] || null;

            return (
                <StepDiagnosisQuestion
                    key={`diagnosis-q${qIndex}`}
                    questionIndex={qIndex}
                    totalQuestions={DIAGNOSIS_QUESTIONS.length}
                    questionData={questionData}
                    selectedAnswer={currentAnswer}
                    onSelect={(answer) => {
                        setDiagnosisAnswer(questionData.axisKey, answer);
                        // 0.3秒後に自動で次の設問へ
                        setTimeout(() => {
                            nextDiagnosisSubStep();
                        }, 300);
                    }}
                    onPrev={prevDiagnosisSubStep}
                />
            );
        }

        // 診断モード: 結果表示
        if (diagnosisMode === 'diagnosis' && diagnosisSubStep === 5) {
            const answers = tempProfile.diagnosisAnswers;
            // 全軸回答済みかチェック
            if (answers?.axis1 && answers?.axis2 && answers?.axis3 && answers?.axis4) {
                return (
                    <StepDiagnosisResult
                        key="diagnosis-result"
                        answers={answers}
                        onConfirm={(prompt, personaName) => {
                            setTempInstructions(prompt);
                            nextStep();
                        }}
                        onRetry={resetDiagnosis}
                        onPrev={prevDiagnosisSubStep}
                    />
                );
            }
        }

        // デフォルト: Intro画面
        return (
            <StepDiagnosisIntro
                key="diagnosis-intro"
                onSelectDiagnosis={() => setDiagnosisMode('diagnosis')}
                onSelectManual={() => setDiagnosisMode('manual')}
                onSelectSkip={() => {
                    setDiagnosisMode('skip');
                    nextStep();
                }}
                onPrev={prevStep}
            />
        );
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
                        key={currentStep === 5 ? `${currentStep}-${diagnosisMode}-${diagnosisSubStep}` : currentStep}
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
