import React, { useState, useEffect } from 'react';
import './ThinkingProcess.css';
import FluidOrb from '../Shared/FluidOrb';
import MarkdownRenderer from '../Shared/MarkdownRenderer';
import { IS_THINKING_PROCESS_MERGED } from '../../config/env';
import { determineRenderMode } from '../../config/thinkingRenderRules';
import TypewriterEffect from '../Shared/TypewriterEffect';

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
    // ★追加: エラーアイコン
    error: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
    ),
    'document-extractor': (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <line x1="10" y1="9" x2="8" y2="9"></line>
        </svg>
    ),
    'http-request': (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
    ),
    'llm': (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
    ),
    'iteration': (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
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

    // ★追加: エラー状態のチェック
    const hasError = hasSteps && steps.some(s => s.status === 'error');

    useEffect(() => {
        // ★変更: エラーがある場合は自動で閉じない
        if (!isStreaming && hasSteps && steps.every(s => s.status === 'done') && !hasError) {
            const timer = setTimeout(() => {
                setIsExpanded(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isStreaming, steps, hasSteps, hasError]);

    // コンテンツがない場合は何も表示しない
    // ただし、Mergedモードでストリーミング中はローディングUIを表示するため早期リターンしない
    if (!hasContent && !(IS_THINKING_PROCESS_MERGED && isStreaming)) return null;

    const currentStep = hasSteps ? (steps.find(s => s.status === 'processing') || steps[steps.length - 1]) : null;
    // ★変更: エラー状態も「完了」とみなす（表示用）
    const isAllDone = hasSteps ? steps.every(s => s.status === 'done' || s.status === 'error') : !isStreaming;

    // ★ Fluid Thought Stream モード (環境変数 VITE_MERGE_THINKING_PROCESS=true の場合)
    if (IS_THINKING_PROCESS_MERGED) {
        // アイコン取得ヘルパー
        const getIcon = (iconType) => Icons[iconType] || Icons.default;

        // ★追加: 視覚的な現在ステップのインデックス管理
        const [visualCurrentStepIndex, setVisualCurrentStepIndex] = useState(0);

        // ★追加: ストリーミング終了時または履歴表示時は全てのステップを表示
        useEffect(() => {
            if (!isStreaming) {
                setVisualCurrentStepIndex(steps ? steps.length : 0);
            }
        }, [isStreaming, steps?.length]);

        // ★追加: ステップ完了時の自動進行制御 (タイプライターがない場合)
        useEffect(() => {
            if (!isStreaming || !hasSteps) return;

            const currentStep = steps[visualCurrentStepIndex];
            if (!currentStep) return;

            const isDone = currentStep.status === 'done' || currentStep.status === 'error';
            // ★修正: thinkingContentも含めてモノローグ有無を判定（LLM_Synthesis対応）
            const hasMonologue = currentStep.thinking || currentStep.reasoning || currentStep.thinkingContent;

            // モノローグがない場合は、完了したら即座に次のステップへ進む
            // (モノローグがある場合はTypewriterEffectのonCompleteで進める)
            if (isDone && !hasMonologue) {
                // 少しだけ余韻を残すためにごく短い遅延を入れることも可能だが、
                // 「チップUIは完了タイミングを同期」という要望通り即座に進める
                setVisualCurrentStepIndex(prev => prev + 1);
            }
        }, [steps, visualCurrentStepIndex, isStreaming, hasSteps]);

        // 表示可能なコンテンツがあるかチェック
        const hasVisibleContent = hasSteps && steps.some(step => {
            const mode = determineRenderMode(step);
            if (mode === 'silent') return false;
            if (mode === 'action') return true;
            return !!(step.thinking || step.reasoning);
        });

        // ステップ完了ハンドル (TypewriterEffectから呼ばれる)
        const handleStepComplete = (index) => {
            setVisualCurrentStepIndex(prev => Math.max(prev, index + 1));
        };

        return (
            <div className="fluid-thought-stream">
                {/* 初期ローディング状態 */}
                {!hasVisibleContent && isStreaming && (
                    <div className="fluid-loading-container">
                        <FluidOrb width="40px" height="40px" />
                        <span className="fluid-loading-text">Thinking...</span>
                    </div>
                )}

                {hasSteps && steps.map((step, index) => {
                    // ★追加: 未来のステップは表示しない (ストリーミング中のみ)
                    if (isStreaming && index > visualCurrentStepIndex) return null;

                    const mode = determineRenderMode(step);
                    const isStepDone = step.status === 'done' || step.status === 'error';

                    // Silent: 非表示
                    if (mode === 'silent') return null;

                    // Action: チップ型UI
                    if (mode === 'action') {
                        const actionMonologueContent = step.thinking || step.reasoning;
                        const hasAdditionalResults = step.additionalResults && step.additionalResults.length > 0;

                        return (
                            <div key={step.id || index} className="thought-action-container">
                                <div className={`thought-action-chip ${step.status} ${hasAdditionalResults || step.resultValue ? 'has-details' : ''}`}>
                                    <div className="thought-action-header">
                                        <span className="action-icon">{getIcon(step.iconType)}</span>
                                        <span className="action-title">{step.title}</span>
                                        {step.status === 'processing' && <span className="action-spinner" />}
                                        {step.status === 'error' && <span className="action-error-icon">⚠️</span>}
                                    </div>

                                    {/* 詳細情報のラッパー（アニメーション用） */}
                                    {(step.resultValue || hasAdditionalResults) && (
                                        <div className="action-content-wrapper">
                                            {/* メイン結果の表示 */}
                                            {step.resultValue && (
                                                <div className="thought-action-result">
                                                    {step.resultValue}
                                                </div>
                                            )}

                                            {/* 詳細パラメータの表示 */}
                                            {hasAdditionalResults && (
                                                <div className="thought-action-details">
                                                    {step.additionalResults.map((result, i) => (
                                                        <div key={i} className="action-detail-item">
                                                            <span className="detail-label">{result.label}</span>
                                                            <span className="detail-value">{result.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {step.status === 'error' && step.errorMessage && (
                                    <div className="action-error-detail">{step.errorMessage}</div>
                                )}
                                {/* thinking/reasoningがあれば完了後に表示 */}
                                {actionMonologueContent && isStepDone && (
                                    <div className="thought-monologue-container action-monologue">
                                        <TypewriterEffect
                                            content={actionMonologueContent}
                                            onComplete={() => handleStepComplete(index)}
                                        />
                                    </div>
                                )}
                                {/* ★追加: LLM_SynthesisなどのthinkingContentフィールドを表示 */}
                                {step.thinkingContent && isStepDone && (
                                    <div className="thought-monologue-container action-monologue synthesis-thinking">
                                        <TypewriterEffect
                                            content={step.thinkingContent}
                                            onComplete={() => handleStepComplete(index)}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // Monologue: thinking/reasoningフィールドを表示
                    const monologueContent = step.thinking || step.reasoning;
                    if (!monologueContent) return null;

                    return (
                        <div key={step.id || index} className="thought-monologue-container">
                            {isStepDone ? (
                                <TypewriterEffect
                                    content={monologueContent}
                                    onComplete={() => handleStepComplete(index)}
                                />
                            ) : (
                                // 処理中はプレースホルダーを表示
                                <div className="fluid-loading-container small">
                                    <FluidOrb width="24px" height="24px" />
                                    <span className="fluid-loading-text">Thinking...</span>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* 最終回答との視覚的な区切り */}
                <hr className="thought-divider" />
            </div>
        );
    }

    return (
        <div className="thinking-process-container">
            <button
                className={`thinking-header ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="thinking-icon-wrapper">
                    {/* 完了時は常にチェックマーク。進行中はFluidOrb。エラー時はエラーアイコン */}
                    {hasError ? (
                        <div className="thinking-error-icon">
                            {Icons.error}
                        </div>
                    ) : isStreaming && !isAllDone ? (
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
                                // アイコンの取得（エラー時はエラーアイコンを使用）
                                const StepIcon = step.status === 'error' ? Icons.error : (Icons[step.iconType] || Icons.default);
                                const hasDetail = step.thinking || step.resultValue || step.errorMessage;

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

                                        {/* ★追加: ステップ詳細（thinking + result または error）の表示 */}
                                        {hasDetail && (step.status === 'done' || step.status === 'error') && (
                                            <div className={`step-detail-container ${step.status === 'error' ? 'error' : ''}`}>
                                                {/* エラーメッセージの表示 */}
                                                {step.status === 'error' && step.errorMessage && (
                                                    <div className="step-error-row">
                                                        <span className="step-error-icon">⚠️</span>
                                                        <span className="step-error-text">{step.errorMessage}</span>
                                                    </div>
                                                )}
                                                {/* thinkingの表示（エラーでない場合のみ） */}
                                                {step.thinking && step.status !== 'error' && (
                                                    <div className="step-thinking-row">
                                                        <span className="step-thinking-icon">🧠</span>
                                                        <span className="step-thinking-text">{step.thinking}</span>
                                                    </div>
                                                )}
                                                {step.resultLabel && step.resultValue && step.status !== 'error' && (
                                                    <div className="step-result-row">
                                                        <span className="step-result-label">{step.resultLabel}:</span>
                                                        <span className="step-result-value">{step.resultValue}</span>
                                                    </div>
                                                )}
                                                {/* ★追加: 追加結果行のループ表示 */}
                                                {step.additionalResults && step.status !== 'error' && step.additionalResults.map((result, i) => (
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