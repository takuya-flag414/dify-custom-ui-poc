// src/components/ThinkingProcess.jsx
import React, { useState, useEffect } from 'react';
import './styles/ThinkingProcess.css';

const ThinkingProcess = ({ steps, isStreaming }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    // 全ステップが完了したら自動で閉じる（オプション: UXの好みによる）
    useEffect(() => {
        if (!isStreaming && steps.every(s => s.status === 'done')) {
            // ユーザーが読んでから閉じるように少し遅延させる
            const timer = setTimeout(() => setIsExpanded(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isStreaming, steps]);

    if (!steps || steps.length === 0) return null;

    const currentStep = steps.find(s => s.status === 'processing') || steps[steps.length - 1];
    const isAllDone = steps.every(s => s.status === 'done');

    return (
        <div className="thinking-process-container">
            {/* Header / Summary View */}
            <button
                className={`thinking-header ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="thinking-icon-wrapper">
                    {isStreaming && !isAllDone ? (
                        <div className="thinking-spinner"></div>
                    ) : (
                        <svg className="thinking-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    )}
                </div>
                <span className="thinking-summary-text">
                    {isExpanded
                        ? '思考プロセス'
                        : (currentStep?.title || '完了しました')}
                </span>
                <svg
                    className={`thinking-chevron ${isExpanded ? 'rotate' : ''}`}
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            {/* Detailed Steps List */}
            {isExpanded && (
                <div className="thinking-steps-list">
                    {steps.map((step, index) => (
                        <div key={step.id || index} className={`thinking-step-item ${step.status}`}>
                            <div className="step-line-container">
                                <div className={`step-dot ${step.status}`}></div>
                                {index !== steps.length - 1 && <div className="step-line"></div>}
                            </div>
                            <span className="step-title">{step.title}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ThinkingProcess;