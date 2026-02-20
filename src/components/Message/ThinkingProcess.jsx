import React, { useState, useEffect } from 'react';
import './ThinkingProcess.css';
import FluidOrb from '../Shared/FluidOrb';
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
    'file-search': (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <circle cx="11.5" cy="14.5" r="2.5"></circle>
            <line x1="14.5" y1="17.5" x2="18" y2="21"></line>
        </svg>
    ),
    checkCircle: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm-2 17l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
    ),
    default: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
        </svg>
    )
};

// アニメーションする3点リーダー
const ThinkingDots = () => {
    const [dots, setDots] = useState('.');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '.' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return <span>{dots}</span>;
};

const ThinkingProcess = ({ steps, isStreaming, thinkingContent, hasAnswer }) => {
    // stepsまたはthinkingContentがあるかチェック
    const hasSteps = steps && steps.length > 0;
    const hasThinking = thinkingContent && thinkingContent.trim().length > 0;
    const hasContent = hasSteps || hasThinking;

    // コンテンツがない場合、ストリーミング中でなければ何も表示しない
    if (!hasContent && !isStreaming) return null;

    // アイコン取得ヘルパー
    const getIcon = (iconType) => Icons[iconType] || Icons.default;

    // 視覚的な現在ステップのインデックス管理
    const [visualCurrentStepIndex, setVisualCurrentStepIndex] = useState(0);

    // ストリーミング終了時または履歴表示時は全てのステップを表示
    useEffect(() => {
        if (!isStreaming) {
            setVisualCurrentStepIndex(steps ? steps.length : 0);
        }
    }, [isStreaming, steps?.length]);

    // ステップ完了時の自動進行制御 (タイプライターがない場合)
    useEffect(() => {
        if (!isStreaming || !hasSteps) return;

        const currentStep = steps[visualCurrentStepIndex];
        if (!currentStep) return;

        const isDone = currentStep.status === 'done' || currentStep.status === 'error';
        // thinkingContentも含めてモノローグ有無を判定（LLM_Synthesis対応）
        const hasMonologue = currentStep.thinking || currentStep.reasoning || currentStep.thinkingContent;

        // モノローグがない場合は、完了したら即座に次のステップへ進む
        // (モノローグがある場合はTypewriterEffectのonCompleteで進める)
        if (isDone && !hasMonologue) {
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
            {/* 初期ローディング状態: ステップがまだ1つもない場合のみ表示 */}
            {!hasSteps && isStreaming && (
                <div className="fluid-loading-container">
                    <FluidOrb width="40px" height="40px" />
                    <span className="fluid-loading-text">Thinking<ThinkingDots /></span>
                </div>
            )}

            {hasSteps && steps.map((step, index) => {
                // 未来のステップは表示しない (ストリーミング中のみ)
                if (isStreaming && index > visualCurrentStepIndex) return null;

                const mode = determineRenderMode(step);
                const isStepDone = step.status === 'done' || step.status === 'error';
                // 末尾の「.」や「。」を削除してベーステキストを作成 (全角・半角ドット対応)
                const baseThinkingText = (step.thinkingText || 'Thinking').replace(/[.．。]+$/, '');
                const thinkingText = (
                    <>
                        {baseThinkingText}
                        <ThinkingDots />
                    </>
                );

                // 共通プレースホルダー: 現在進行中のステップで、かつ表示するものがない場合に表示
                const ThinkingPlaceholder = (
                    <div key={step.id || index} className="thought-monologue-container">
                        <div className="fluid-loading-container small">
                            <FluidOrb width="24px" height="24px" />
                            <span className="fluid-loading-text">{thinkingText}</span>
                        </div>
                    </div>
                );

                // Silent: 基本非表示だが、現在進行中のステップで本文がまだ表示されていない場合のみThinkingを表示
                if (mode === 'silent') {
                    if (isStreaming && index === visualCurrentStepIndex && !hasAnswer) {
                        return ThinkingPlaceholder;
                    }
                    return null;
                }

                // ルーターノード（判定結果）はチップUI非表示、thinkingのみ表示
                if (step.iconType === 'router') {
                    const monologueContent = step.thinking || step.reasoning;

                    if (!monologueContent) {
                        // thinkingもなければ基本非表示だが、現在進行中ならThinkingを表示
                        if (isStreaming && index === visualCurrentStepIndex) {
                            return ThinkingPlaceholder;
                        }
                        return null;
                    }

                    return (
                        <div key={step.id || index} className="thought-monologue-container">
                            {isStepDone ? (
                                <TypewriterEffect
                                    content={monologueContent}
                                    onComplete={() => handleStepComplete(index)}
                                />
                            ) : (
                                <div className="fluid-loading-container small">
                                    <FluidOrb width="24px" height="24px" />
                                    <span className="fluid-loading-text">Thinking<ThinkingDots /></span>
                                </div>
                            )}
                        </div>
                    );
                }

                // Action: チップ型UI
                if (mode === 'action') {
                    const actionMonologueContent = step.thinking || step.reasoning;
                    const hasAdditionalResults = step.additionalResults && step.additionalResults.length > 0;

                    // ファイル検索ストアツールは「社内データを検索」とわかりやすく表示
                    const isFileSearchStore = step.title?.includes('ファイル検索ストア');
                    const displayTitle = isFileSearchStore ? '📂 社内データを検索' : step.title;
                    const displayIconType = isFileSearchStore ? 'file-search' : step.iconType;

                    return (
                        <div key={step.id || index} className="thought-action-container">
                            <div className={`thought-action-chip ${step.status} ${hasAdditionalResults || step.resultValue ? 'has-details' : ''}`}>
                                <div className="thought-action-header">
                                    <span className="action-icon">{getIcon(displayIconType)}</span>
                                    <span className="action-title">{displayTitle}</span>
                                    {step.status === 'processing' && <span className="action-spinner" />}
                                    {step.status === 'error' && <span className="action-error-icon">⚠️</span>}
                                    {step.status === 'done' && (
                                        <span className="action-done-icon text-success">
                                            {Icons.checkCircle}
                                        </span>
                                    )}
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
                            {/* LLM_SynthesisなどのthinkingContentフィールドを表示 */}
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

                // コンテンツがまだない場合（processing中）
                if (!monologueContent) {
                    // 現在進行中のステップならThinkingプレースホルダーを表示（thinkingTextを使用）
                    if (isStreaming && index === visualCurrentStepIndex && !isStepDone) {
                        return ThinkingPlaceholder;
                    }
                    return null;
                }

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
                                <span className="fluid-loading-text">Thinking<ThinkingDots /></span>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* 最終回答との視覚的な区切り - 本文が表示されてから表示 */}
            {hasAnswer && <hr className="thought-divider" />}
        </div>
    );
};

export default ThinkingProcess;