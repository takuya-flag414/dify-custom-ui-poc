// src/components/Tutorial/TutorialOverlay.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './TutorialOverlay.css';

// 閉じるアイコン
const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const TutorialOverlay = ({ isActive, step, currentStepIndex, totalSteps, onNext, onPrev, onClose }) => {
    const [targetRect, setTargetRect] = useState(null);

    // ターゲット要素の位置を追跡
    useEffect(() => {
        if (!isActive || !step) return;

        const updatePosition = () => {
            const element = document.querySelector(`[data-tutorial="${step.target}"]`);
            if (element) {
                const rect = element.getBoundingClientRect();
                // スポットライト用に少し余白を持たせる
                setTargetRect({
                    top: rect.top - 8,
                    left: rect.left - 8,
                    width: rect.width + 16,
                    height: rect.height + 16,
                    radius: 12 // 角丸の近似値
                });
            } else {
                // 要素が見つからない場合は画面中央にフォールバック（または何もしない）
                setTargetRect(null);
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);

        // アニメーション完了待ちなどでDOM位置がずれる可能性があるため、少し遅延して再取得
        const timer = setTimeout(updatePosition, 300);

        return () => {
            window.removeEventListener('resize', updatePosition);
            clearTimeout(timer);
        };
    }, [isActive, step]);

    if (!isActive) return null;

    // SVGパスの生成 (穴あき長方形)
    // 画面全体を覆い、targetRectの部分だけくり抜く
    const getMaskPath = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;

        if (!targetRect) {
            // ターゲットがない場合は全画面暗転
            return `M0,0 H${w} V${h} H0 Z`;
        }

        const { top, left, width, height, radius } = targetRect;
        const right = left + width;
        const bottom = top + height;

        // Outer box (Clockwise) -> Inner box (Counter-Clockwise for hole)
        // SVGのfill-rule="evenodd" を利用して穴を開ける
        return `
      M0,0 H${w} V${h} H0 Z
      M${left + radius},${top} 
      L${right - radius},${top} Q${right},${top} ${right},${top + radius}
      L${right},${bottom - radius} Q${right},${bottom} ${right - radius},${bottom}
      L${left + radius},${bottom} Q${left},${bottom} ${left},${bottom - radius}
      L${left},${top + radius} Q${left},${top} ${left + radius},${top} Z
    `;
    };

    // ポップオーバー位置の計算
    const getPopoverStyle = () => {
        if (!targetRect) {
            return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        }

        const POPOVER_WIDTH = 320;
        const POPOVER_HEIGHT = 200; // 推定
        const MARGIN = 16;
        const { top, left, width, height } = targetRect;

        // 基本位置の候補
        const positions = {
            top: { top: top - MARGIN - POPOVER_HEIGHT, left: left + width / 2 - POPOVER_WIDTH / 2 },
            bottom: { top: top + height + MARGIN, left: left + width / 2 - POPOVER_WIDTH / 2 },
            left: { top: top + height / 2 - POPOVER_HEIGHT / 2, left: left - MARGIN - POPOVER_WIDTH },
            right: { top: top + height / 2 - POPOVER_HEIGHT / 2, left: left + width + MARGIN }
        };

        // 指定された位置を優先、はみ出る場合は調整（簡易ロジック）
        let pos = positions[step.position] || positions.bottom;

        // 画面下端にはみ出る場合 -> 上に表示
        if (pos.top + POPOVER_HEIGHT > window.innerHeight) pos = positions.top;
        // 画面上端にはみ出る場合 -> 下に表示
        if (pos.top < 0) pos = positions.bottom;
        // 右端調整
        if (pos.left + POPOVER_WIDTH > window.innerWidth) pos.left = window.innerWidth - POPOVER_WIDTH - 20;
        // 左端調整
        if (pos.left < 0) pos.left = 20;

        return { top: pos.top, left: pos.left };
    };

    return createPortal(
        <div className="tutorial-overlay">
            {/* 1. Spotlight Mask */}
            <svg className="tutorial-mask" width="100%" height="100%">
                <path d={getMaskPath()} fillRule="evenodd" />
            </svg>

            {/* 2. Popover Card */}
            <div className="tutorial-popover" style={getPopoverStyle()}>
                <div className="tutorial-header">
                    <h3 className="tutorial-title">{step?.title}</h3>
                    <button className="tutorial-close-btn" onClick={onClose} title="ツアーを終了">
                        <CloseIcon />
                    </button>
                </div>

                <div className="tutorial-content">
                    {step?.content}
                </div>

                <div className="tutorial-footer">
                    <div className="tutorial-progress">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={`progress-dot ${i === currentStepIndex ? 'active' : ''}`}
                            />
                        ))}
                    </div>

                    <div className="tutorial-actions">
                        {currentStepIndex > 0 && (
                            <button className="tutorial-btn secondary" onClick={onPrev}>
                                戻る
                            </button>
                        )}
                        <button className="tutorial-btn primary" onClick={onNext}>
                            {currentStepIndex === totalSteps - 1 ? '完了' : '次へ'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default TutorialOverlay;