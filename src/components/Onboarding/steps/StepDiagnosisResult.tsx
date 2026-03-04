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

    // 結果表示の演出（短いディレイ）
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsRevealed(true);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    // answers が変わったら再生成
    useEffect(() => {
        const newResult = generatePrompt(answers);
        setResult(newResult);
        setEditedPrompt(newResult.prompt);
    }, [answers]);

    const handleConfirm = useCallback(() => {
        onConfirm(editedPrompt, result.personaName);
    }, [editedPrompt, result.personaName, onConfirm]);

    // 各軸の結果サマリーチップを生成
    const summaryChips = DIAGNOSIS_QUESTIONS.map((q, index) => {
        const axisKey = q.axisKey as keyof DiagnosisAnswers;
        const answer = answers[axisKey];
        const option = answer === 'A' ? q.optionA : q.optionB;
        return {
            emoji: option.icon,
            label: option.label,
        };
    });

    if (!isRevealed) {
        // ローディング中（Thinking Glow）
        return (
            <div className="onboarding-step-new" style={{ maxWidth: '700px', margin: '0 auto', justifyContent: 'center', alignItems: 'center' }}>
                <motion.div
                    className="diagnosis-thinking-glow"
                    style={{
                        width: '200px',
                        height: '200px',
                        borderRadius: '50%',
                        background: 'var(--glass-bg, rgba(255,255,255,0.06))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
        <div className="onboarding-step-new" style={{ maxWidth: '700px', margin: '0 auto', padding: '8px 0', overflowX: 'hidden', overflowY: 'visible' }}>
            <div className="diagnosis-result-container">
                {/* ペルソナ名 */}
                <motion.h1
                    className="diagnosis-result-persona"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {result.personaName}
                </motion.h1>
                <div className="title-decoration-line" style={{ margin: '0 auto 12px' }} />

                {/* 説明 */}
                <motion.p
                    className="diagnosis-result-description"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    style={{ marginBottom: '20px' }}
                >
                    {result.personaDescription}
                </motion.p>

                {/* 4軸サマリーチップ */}
                <motion.div
                    className="diagnosis-result-summary"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
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
                    style={{ width: '100%' }}
                >
                    <p className="diagnosis-result-prompt-label">生成されたカスタム指示（編集可能）</p>
                    <textarea
                        className="diagnosis-result-textarea"
                        value={editedPrompt}
                        onChange={(e) => setEditedPrompt(e.target.value)}
                        rows={6}
                    />
                </motion.div>

                {/* アクションボタン */}
                <motion.div
                    className="diagnosis-result-actions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                >
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
                    >
                        やり直す
                    </button>
                    <motion.button
                        type="button"
                        className="onboarding-btn-new onboarding-btn-primary-new diagnosis-btn-glow"
                        onClick={handleConfirm}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ minWidth: '200px', marginLeft: 'auto' }}
                    >
                        この設定で続ける
                        <ArrowRightIcon />
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
};

export default StepDiagnosisResult;
