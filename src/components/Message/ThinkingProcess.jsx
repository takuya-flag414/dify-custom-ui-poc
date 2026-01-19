// src/components/Message/ThinkingProcess.jsx
import React, { useState, useEffect } from 'react';
import './ThinkingProcess.css';
import FluidOrb from '../Shared/FluidOrb';
import MarkdownRenderer from '../Shared/MarkdownRenderer';

// --- SF Symbols風 SVG Icons ---
const Icons = {
    reasoning: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
    ),
    search: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
    ),
    document: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <line x1="10" y1="9" x2="8" y2="9"></line>
        </svg>
    ),
    router: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
    ),
    retrieval: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
    ),
    writing: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
    ),
    check: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    ),
    thinking: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
    ),
    default: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
        </svg>
    )
};

const ThinkingProcess = ({ steps, isStreaming, thinkingContent }) => {
    const [isExpanded, setIsExpanded] = useState(isStreaming);

    // stepsまたはthinkingContentがあるかチェック
    const hasSteps = steps && steps.length > 0;
    const hasThinking = thinkingContent && thinkingContent.trim().length > 0;
    const hasContent = hasSteps || hasThinking;

    useEffect(() => {
        if (!isStreaming && hasSteps && steps.every(s => s.status === 'done')) {
            const timer = setTimeout(() => {
                setIsExpanded(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isStreaming, steps, hasSteps]);

    // コンテンツがない場合は何も表示しない
    if (!hasContent) return null;

    const currentStep = hasSteps ? (steps.find(s => s.status === 'processing') || steps[steps.length - 1]) : null;
    const isAllDone = hasSteps ? steps.every(s => s.status === 'done') : !isStreaming;

    return (
        <div className="thinking-process-container">
            <button
                className={`thinking-header ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="thinking-icon-wrapper">
                    {/* 完了時は常にチェックマーク。進行中はFluidOrb */}
                    {isStreaming && !isAllDone ? (
                        <FluidOrb />
                    ) : (
                        <div className="thinking-done-icon">
                            {Icons.check}
                        </div>
                    )}
                </div>
                <span className="thinking-summary-text">
                    {isExpanded || isAllDone ? '思考プロセス' : (currentStep?.title || '処理中...')}
                </span>
                <svg
                    className={`thinking-chevron ${isExpanded ? 'rotate' : ''}`}
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            <div className={`thinking-accordion-grid ${isExpanded ? 'expanded' : ''}`}>
                <div className="thinking-accordion-overflow">
                    {/* ワークフローステップ */}
                    {hasSteps && (
                        <div className="thinking-steps-list">
                            {steps.map((step, index) => {
                                // アイコンの取得
                                const StepIcon = Icons[step.iconType] || Icons.default;
                                const hasDetail = step.thinking || step.resultValue;

                                return (
                                    <div key={step.id || index} className="thinking-step-wrapper">
                                        <div className={`thinking-step-item ${step.status}`}>
                                            <div className="step-icon-column">
                                                {/* ステータスに応じたアイコン表示 */}
                                                <div className={`step-icon-circle ${step.status}`}>
                                                    {StepIcon}
                                                </div>
                                                {/* 線 (最後の要素以外) */}
                                                {index !== steps.length - 1 && <div className="step-line"></div>}
                                            </div>
                                            <span className="step-title">{step.title}</span>
                                        </div>

                                        {/* ★追加: ステップ詳細（thinking + result）の表示 */}
                                        {hasDetail && step.status === 'done' && (
                                            <div className="step-detail-container">
                                                {step.thinking && (
                                                    <div className="step-thinking-row">
                                                        <span className="step-thinking-icon">🧠</span>
                                                        <span className="step-thinking-text">{step.thinking}</span>
                                                    </div>
                                                )}
                                                {step.resultLabel && step.resultValue && (
                                                    <div className="step-result-row">
                                                        <span className="step-result-label">{step.resultLabel}:</span>
                                                        <span className="step-result-value">{step.resultValue}</span>
                                                    </div>
                                                )}
                                                {/* ★追加: 追加結果行のループ表示 */}
                                                {step.additionalResults && step.additionalResults.map((result, i) => (
                                                    <div key={i} className="step-result-row">
                                                        <span className="step-result-label">{result.label}:</span>
                                                        <span className="step-result-value">{result.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* AIの思考セクション - ステップの下に表示 */}
                    {hasThinking && (
                        <div className="thinking-content-section">
                            <div className="thinking-content-header">
                                <div className="thinking-content-icon">
                                    {Icons.thinking}
                                </div>
                                <span>AIの思考</span>
                            </div>
                            <div className="thinking-content-body">
                                <MarkdownRenderer content={thinkingContent} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ThinkingProcess;