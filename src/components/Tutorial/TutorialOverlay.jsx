// src/components/Tutorial/TutorialOverlay.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './TutorialOverlay.css';

/**
 * macOS Sequoia スタイル チュートリアルオーバーレイ
 * Vibrancy + Spring Physics + Coachmarks
 */
const TutorialOverlay = ({
    isActive,
    step,
    currentStepIndex,
    totalSteps,
    direction = 1,
    onNext,
    onPrev,
    onClose
}) => {
    const [targetRect, setTargetRect] = useState(null);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    // ウィンドウサイズ追跡
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ターゲット要素の位置を追跡
    useEffect(() => {
        if (!isActive || !step) return;

        const updatePosition = () => {
            // center表示の場合はターゲットなし
            if (!step.target) {
                setTargetRect(null);
                return;
            }

            const element = document.querySelector(`[data-tutorial="${step.target}"]`);
            if (element) {
                const rect = element.getBoundingClientRect();
                // スポットライト用に少し余白を持たせる
                setTargetRect({
                    // 実際の要素位置
                    elementTop: rect.top,
                    elementLeft: rect.left,
                    elementWidth: rect.width,
                    elementHeight: rect.height,
                    // スポットライト用（余白込み）
                    top: rect.top - 8,
                    left: rect.left - 8,
                    width: rect.width + 16,
                    height: rect.height + 16,
                    radius: 16
                });
            } else {
                setTargetRect(null);
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        const timer = setTimeout(updatePosition, 300);

        return () => {
            window.removeEventListener('resize', updatePosition);
            clearTimeout(timer);
        };
    }, [isActive, step]);

    if (!isActive) return null;

    // SVGパスの生成 (穴あき長方形)
    const getMaskPath = () => {
        const w = windowSize.width;
        const h = windowSize.height;

        if (!targetRect) {
            return `M0,0 H${w} V${h} H0 Z`;
        }

        const { top, left, width, height, radius } = targetRect;
        const right = left + width;
        const bottom = top + height;

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
    const getPopoverPosition = () => {
        if (!targetRect || step?.position === 'center') {
            return {
                style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                arrowPosition: null,
                arrowOffset: null
            };
        }

        const POPOVER_WIDTH = 340;
        const POPOVER_HEIGHT = 220;
        const MARGIN = 80;

        // 実際の要素中心を使用
        const targetCenterX = targetRect.elementLeft + targetRect.elementWidth / 2;
        const targetCenterY = targetRect.elementTop + targetRect.elementHeight / 2;

        let posTop, posLeft, arrowPosition, arrowOffset = null;
        const preferredPosition = step.position || 'top';

        if (preferredPosition === 'top') {
            posTop = targetRect.top - MARGIN - POPOVER_HEIGHT;
            posLeft = targetCenterX - POPOVER_WIDTH / 2;
            arrowPosition = 'bottom';
        } else if (preferredPosition === 'bottom') {
            posTop = targetRect.top + targetRect.height + MARGIN;
            posLeft = targetCenterX - POPOVER_WIDTH / 2;
            arrowPosition = 'top';
        } else if (preferredPosition === 'left') {
            posTop = targetCenterY - POPOVER_HEIGHT / 2;
            posLeft = targetRect.left - MARGIN - POPOVER_WIDTH;
            arrowPosition = 'right';
        } else if (preferredPosition === 'right') {
            posTop = targetCenterY - POPOVER_HEIGHT / 2;
            posLeft = targetRect.left + targetRect.width + MARGIN;
            arrowPosition = 'left';
        }

        // 画面端オーバーフロー処理
        if (posTop < 10) {
            posTop = targetRect.top + targetRect.height + MARGIN;
            arrowPosition = 'top';
        }
        if (posTop + POPOVER_HEIGHT > windowSize.height - 10) {
            posTop = targetRect.top - MARGIN - POPOVER_HEIGHT;
            arrowPosition = 'bottom';
        }

        // 左右端調整 + 矢印オフセット計算
        if (posLeft < 10) {
            arrowOffset = targetCenterX - 10;
            posLeft = 10;
        }
        if (posLeft + POPOVER_WIDTH > windowSize.width - 10) {
            arrowOffset = targetCenterX - (windowSize.width - POPOVER_WIDTH - 10);
            posLeft = windowSize.width - POPOVER_WIDTH - 10;
        }

        return {
            style: { top: posTop, left: posLeft },
            arrowPosition,
            arrowOffset
        };
    };

    const { style: popoverStyle, arrowPosition, arrowOffset } = getPopoverPosition();
    const isCenter = step?.position === 'center';
    const isComplete = step?.isComplete;

    // Spring animation config
    const springConfig = {
        type: "spring",
        stiffness: 400,
        damping: 30
    };

    // Popover variants
    const popoverVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            y: isCenter ? 0 : 8
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: springConfig
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.15 }
        }
    };

    // Content slide variants
    const contentVariants = {
        enter: (dir) => ({
            opacity: 0,
            x: dir > 0 ? 30 : -30
        }),
        center: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
        },
        exit: (dir) => ({
            opacity: 0,
            x: dir > 0 ? -20 : 20,
            transition: { duration: 0.15 }
        })
    };

    // 矢印のスタイル計算
    const getArrowStyle = () => {
        if (!arrowOffset) return {};
        if (arrowPosition === 'top' || arrowPosition === 'bottom') {
            return { left: arrowOffset, marginLeft: 0 };
        }
        return {};
    };

    return createPortal(
        <motion.div
            className="tutorial-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            {/* 1. Spotlight Mask */}
            <svg className="tutorial-mask" width="100%" height="100%">
                <motion.path
                    d={getMaskPath()}
                    fillRule="evenodd"
                    initial={false}
                    animate={{ d: getMaskPath() }}
                    transition={springConfig}
                />
            </svg>

            {/* 2. Popover Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStepIndex}
                    className={`tutorial-popover ${isCenter ? 'center' : ''} ${isComplete ? 'complete' : ''}`}
                    style={popoverStyle}
                    variants={popoverVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Arrow (矢印) */}
                    {arrowPosition && (
                        <div
                            className={`tutorial-arrow ${arrowPosition}`}
                            style={getArrowStyle()}
                        />
                    )}

                    {/* Close button */}
                    <button
                        className="tutorial-close-btn"
                        onClick={onClose}
                        title="チュートリアルを終了 (Esc)"
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>

                    {/* Content with slide animation */}
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={currentStepIndex}
                            className="tutorial-content-wrapper"
                            custom={direction}
                            variants={contentVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                        >
                            {/* Icon */}
                            <div className={`tutorial-icon ${isComplete ? 'complete' : ''}`}>
                                {step?.icon}
                            </div>

                            {/* Text */}
                            <h3 className="tutorial-title">{step?.title}</h3>
                            <p className="tutorial-content">{step?.content}</p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Footer */}
                    <div className="tutorial-footer">
                        {/* Skip link (not on last step) */}
                        {!isComplete && (
                            <button className="tutorial-skip-btn" onClick={onClose}>
                                スキップ
                            </button>
                        )}

                        {/* Progress dots */}
                        <div className="tutorial-progress">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`progress-dot ${i === currentStepIndex ? 'active' : ''} ${i < currentStepIndex ? 'completed' : ''}`}
                                />
                            ))}
                        </div>

                        {/* Navigation buttons */}
                        <div className="tutorial-actions">
                            {currentStepIndex > 0 && !isComplete && (
                                <button className="tutorial-btn secondary" onClick={onPrev}>
                                    ←
                                </button>
                            )}
                            <button
                                className={`tutorial-btn primary ${isComplete ? 'complete' : ''}`}
                                onClick={onNext}
                            >
                                {isComplete ? '始める' : '次へ →'}
                            </button>
                        </div>
                    </div>

                    {/* Keyboard hint */}
                    <div className="tutorial-keyboard-hint">
                        ← → で移動 • Esc で終了
                    </div>
                </motion.div>
            </AnimatePresence>
        </motion.div>,
        document.body
    );
};

export default TutorialOverlay;