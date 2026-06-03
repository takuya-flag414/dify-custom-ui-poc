// src/components/Onboarding/steps/StepDiagnosisResult.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { generatePrompt, type DiagnosisAnswers } from '../utils/promptGenerator';
import { DIAGNOSIS_QUESTIONS } from '../utils/diagnosisConstants';
import './StepDiagnosis.css';

// 矢印アイコン
const ArrowRightIcon: React.FC = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

interface Props {
    answers: DiagnosisAnswers;
    onConfirm: (prompt: string, personaName: string) => void;
    onRetry: () => void;
    onPrev: () => void;
}

/**
 * 診断結果の表示 + プロンプト微調整画面
 */
const StepDiagnosisResult: React.FC<Props> = ({
    answers,
    onConfirm,
    onRetry,
    onPrev,
}) => {
    const [isRevealed, setIsRevealed] = useState(false);
    const [result, setResult] = useState(() => generatePrompt(answers));
    const [editedPrompt, setEditedPrompt] = useState(result.prompt);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsRevealed(true);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const newResult = generatePrompt(answers);
        setResult(newResult);
        setEditedPrompt(newResult.prompt);
    }, [answers]);

    const handleConfirm = useCallback(() => {
        onConfirm(editedPrompt, result.personaName);
    }, [editedPrompt, result.personaName, onConfirm]);

    const summaryChips = DIAGNOSIS_QUESTIONS.map((q) => {
        const axisKey = q.axisKey as keyof DiagnosisAnswers;
        const answer = answers[axisKey];
        const option = answer === 'A' ? q.optionA : q.optionB;
        return {
            emoji: option.icon,
            label: option.label,
        };
    });

    if (!isRevealed) {
        return (
            <div className="onboarding-step-new" style={{ maxWidth: '700px', margin: '0 auto', justifyContent: 'center', alignItems: 'center' }}>
                <motion.div
                    className="diagnosis-thinking-glow"
                    style={{
                        width: '200px',
                        height: '200px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    <motion.span
                        style={{ fontSize: '4rem' }}
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        🧠
                    </motion.span>
                </motion.div>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{ marginTop: '24px', fontSize: '1.1rem' }}
                    className="diagnosis-question-subtitle"
                >
                    あなたに最適なスタイルを分析中...
                </motion.p>
            </div>
        );
    }

    return (
        <div className="onboarding-step-new">
            {/* ペルソナ名 */}
            <motion.h1
                className="diagnosis-result-persona"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ fontSize: '28px', marginBottom: '16px' }}
            >
                {result.personaName}
            </motion.h1>

            {/* 説明 */}
            <motion.p
                className="diagnosis-result-description"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                style={{ marginBottom: '24px', maxWidth: '520px' }}
            >
                {result.personaDescription}
            </motion.p>

            {/* 4軸サマリーチップ */}
            <motion.div
                className="diagnosis-result-summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                style={{ maxWidth: '520px', marginBottom: '32px' }}
            >
                {summaryChips.map((chip, i) => (
                    <div key={i} className="diagnosis-summary-chip">
                        <span className="diagnosis-summary-chip-emoji">{chip.emoji}</span>
                        <span>{chip.label}</span>
                    </div>
                ))}
            </motion.div>

            {/* 生成プロンプト */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                style={{ width: '100%', maxWidth: '520px' }}
            >
                <p className="diagnosis-result-prompt-label">生成されたカスタム指示（編集可能）</p>
                <textarea
                    className="diagnosis-result-textarea"
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    rows={5}
                    style={{
                        background: 'var(--glass-bg, rgba(255, 255, 255, 0.45))',
                        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.5))',
                        borderRadius: '16px',
                        padding: '16px',
                        width: '100%',
                        resize: 'none',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03) inset',
                        color: 'var(--color-text-main)',
                    }}
                />
            </motion.div>

            {/* アクションバー（Sticky Footer） */}
            <motion.div
                className="onboarding-footer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
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
                    <button
                        type="button"
                        className="diagnosis-result-retry"
                        onClick={onRetry}
                        style={{ marginLeft: '12px' }}
                    >
                        やり直す
                    </button>
                </div>

                <div className="onboarding-pagination">
                    <div className="pagination-dot active" />
                </div>

                <div className="onboarding-footer-right">
                    <motion.button
                        className="onboarding-btn-new onboarding-btn-primary-new diagnosis-btn-glow"
                        onClick={handleConfirm}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ minWidth: '160px', height: '40px', fontSize: '14px' }}
                    >
                        この設定で続ける
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default StepDiagnosisResult;
