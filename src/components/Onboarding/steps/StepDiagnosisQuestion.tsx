// src/components/Onboarding/steps/StepDiagnosisQuestion.tsx
import React, { useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuestionData } from '../utils/diagnosisConstants';
import './StepDiagnosis.css';

// チェックアイコン
const CheckIcon: React.FC = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

interface Props {
    questionIndex: number;
    totalQuestions: number;
    questionData: QuestionData;
    selectedAnswer: 'A' | 'B' | null;
    onSelect: (answer: 'A' | 'B') => void;
    onPrev: () => void;
}

/**
 * 1画面1設問の診断クエスチョンコンポーネント
 * A/Bを選択すると0.3秒後に自動で次の設問へ進む
 */
const StepDiagnosisQuestion: React.FC<Props> = ({
    questionIndex,
    totalQuestions,
    questionData,
    selectedAnswer,
    onSelect,
    onPrev,
}) => {
    const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSelect = useCallback((answer: 'A' | 'B') => {
        if (autoAdvanceTimer.current) {
            clearTimeout(autoAdvanceTimer.current);
        }
        onSelect(answer);
    }, [onSelect]);

    const contentVariants = {
        enter: { opacity: 0, y: 10 },
        center: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
    };

    return (
        <div className="onboarding-step-new">
            {/* カウンター */}
            <motion.div
                className="diagnosis-question-header"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ marginBottom: '16px' }}
            >
                <span className="diagnosis-question-counter" style={{ padding: '6px 12px', background: 'rgba(10, 132, 255, 0.1)', color: 'var(--sys-color-primary, #0A84FF)', borderRadius: '12px', fontSize: '13px' }}>
                    質問 {questionIndex + 1} / {totalQuestions}
                </span>
            </motion.div>

            {/* タイトル */}
            <AnimatePresence mode="wait">
                <motion.h1
                    key={`title-${questionIndex}`}
                    className="diagnosis-question-title"
                    variants={contentVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                    style={{ fontSize: '28px', marginBottom: '16px', fontWeight: 800 }}
                >
                    {questionData.title}
                </motion.h1>
            </AnimatePresence>

            {/* サブタイトル */}
            <AnimatePresence mode="wait">
                <motion.p
                    key={`subtitle-${questionIndex}`}
                    className="diagnosis-question-subtitle"
                    variants={contentVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'spring', stiffness: 250, damping: 25, delay: 0.05 }}
                    style={{ marginBottom: '32px' }}
                >
                    {questionData.subtitle}
                </motion.p>
            </AnimatePresence>

            {/* A/B 選択肢 */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`options-${questionIndex}`}
                    className="diagnosis-options"
                    variants={contentVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'spring', stiffness: 250, damping: 25, delay: 0.1 }}
                    style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                    <motion.button
                        type="button"
                        className={`diagnosis-option-card${selectedAnswer === 'A' ? ' selected' : ''}`}
                        onClick={() => handleSelect('A')}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >
                        <span className="diagnosis-option-emoji">{questionData.optionA.icon}</span>
                        <div className="diagnosis-option-content">
                            <h4>{questionData.optionA.label}</h4>
                            <p>{questionData.optionA.description}</p>
                        </div>
                        {selectedAnswer === 'A' && (
                            <motion.div
                                className="diagnosis-option-check"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            >
                                <CheckIcon />
                            </motion.div>
                        )}
                    </motion.button>

                    <motion.button
                        type="button"
                        className={`diagnosis-option-card${selectedAnswer === 'B' ? ' selected' : ''}`}
                        onClick={() => handleSelect('B')}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >
                        <span className="diagnosis-option-emoji">{questionData.optionB.icon}</span>
                        <div className="diagnosis-option-content">
                            <h4>{questionData.optionB.label}</h4>
                            <p>{questionData.optionB.description}</p>
                        </div>
                        {selectedAnswer === 'B' && (
                            <motion.div
                                className="diagnosis-option-check"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            >
                                <CheckIcon />
                            </motion.div>
                        )}
                    </motion.button>
                </motion.div>
            </AnimatePresence>

            {/* アクションバー（Sticky Footer） */}
            <motion.div
                className="onboarding-footer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
            >
                <div className="onboarding-footer-left">
                    <button
                        type="button"
                        className="onboarding-btn-new onboarding-btn-secondary-new"
                        onClick={onPrev}
                        style={{ minWidth: '100px' }}
                    >
                        戻る
                    </button>
                </div>
                
                <div className="onboarding-pagination">
                    {/* 診断中は専用のプログレスインジケータ（ドット）を表示 */}
                    {Array.from({ length: totalQuestions }).map((_, idx) => (
                        <div key={idx} className={`pagination-dot ${idx === questionIndex ? 'active' : ''}`} />
                    ))}
                </div>

                <div className="onboarding-footer-right">
                    {/* 選択肢をタップして進むため、「次へ」は非表示 */}
                </div>
            </motion.div>
        </div>
    );
};

export default StepDiagnosisQuestion;
