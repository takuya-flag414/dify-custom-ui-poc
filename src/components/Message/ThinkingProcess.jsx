// src/components/Message/ThinkingProcess.jsx
import React, { useState, useEffect, useRef } from 'react';
import './ThinkingProcess.css';

const ThinkingProcess = ({ steps, isStreaming }) => {
    // ★ 修正: ストリーミング中（生成中）のみ初期状態で開く
    // 過去ログ（isStreaming=false）の場合は閉じた状態で初期化
    const [isExpanded, setIsExpanded] = useState(isStreaming);

    // 全ステップが完了したら自動で閉じる
    useEffect(() => {
        if (!isStreaming && steps && steps.every(s => s.status === 'done')) {
            // 生成終了直後の場合のみ、ユーザーが読めるよう2秒待ってから閉じる
            // (履歴表示時に勝手に閉じる挙動を防ぐため、初期状態で開いている場合のみタイマーセット等の制御を入れるのが理想ですが
            //  今回はシンプルに「生成完了フロー」として処理します)
            const timer = setTimeout(() => {
                // ユーザーが手動で開閉した直後の干渉を防ぐため、
                // 必要であればここで isExpanded のチェックを入れることも可能ですが
                // UXとしては「完了したら畳む」で統一します
                setIsExpanded(false);
            }, 2000);
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
                aria-expanded={isExpanded}
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

            {/* Accordion Animation Wrapper (CSS Grid Transition) */}
            <div className={`thinking-accordion-grid ${isExpanded ? 'expanded' : ''}`}>
                <div className="thinking-accordion-overflow">
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
                </div>
            </div>
        </div>
    );
};

export default ThinkingProcess;