// src/components/IntelligenceHUD/ErrorGlassCard.tsx
// IntelligenceErrorHandler - Liquid Glass Error Card

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { IntelligenceError } from '../../utils/errorIntelligence';
import './ErrorGlassCard.css';

// ========================================
// Icon Components (SVG inline)
// ========================================

const ClockIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const ChatIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const ShieldIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const WifiIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
);

const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const AlertIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const RetryIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
);

const ICON_MAP: Record<string, React.FC> = {
    clock: ClockIcon,
    chat: ChatIcon,
    shield: ShieldIcon,
    wifi: WifiIcon,
    settings: SettingsIcon,
    alert: AlertIcon,
};

// ========================================
// Animation Variants
// ========================================

// Spring entrance (下部からふわりと浮き上がる)
const cardVariants = {
    initial: {
        opacity: 0,
        y: 30,
        scale: 0.96,
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring' as const,
            stiffness: 250,
            damping: 25,
            mass: 1,
        },
    },
    exit: {
        opacity: 0,
        y: -10,
        scale: 0.98,
        transition: {
            duration: 0.25,
            ease: [0.25, 0.1, 0.25, 1] as const,
        },
    },
};

// Shake animation (macOS パスワードエラー風)
const shakeVariants = {
    shake: {
        x: [0, -8, 8, -6, 6, -3, 3, 0],
        transition: {
            duration: 0.5,
            ease: [0.42, 0, 0.58, 1] as const,
        },
    },
};

// ========================================
// Props
// ========================================

interface ErrorGlassCardProps {
    /** 表示するエラー情報 */
    error: IntelligenceError | null;
    /** リトライまでのカウントダウン（秒） */
    retryCountdown: number;
    /** リトライ中フラグ */
    isRetrying: boolean;
    /** 現在のリトライ回数 */
    retryCount: number;
    /** Shakeアニメーション用キー */
    shakeKey: number;
    /** 閉じるコールバック */
    onDismiss: () => void;
    /** 手動リトライコールバック */
    onManualRetry: () => void;
    /** 設定画面を開くコールバック */
    onOpenConfig?: () => void;
}

// ========================================
// Component
// ========================================

const ErrorGlassCard: React.FC<ErrorGlassCardProps> = ({
    error,
    retryCountdown,
    isRetrying,
    retryCount,
    shakeKey,
    onDismiss,
    onManualRetry,
    onOpenConfig,
}) => {
    // Shake アニメーション制御
    const [shouldShake, setShouldShake] = useState(false);

    useEffect(() => {
        if (shakeKey > 0) {
            setShouldShake(true);
            const timer = setTimeout(() => setShouldShake(false), 600);
            return () => clearTimeout(timer);
        }
    }, [shakeKey]);

    return (
        <div className="error-hud-overlay">
            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        key="error-glass-card"
                        className="error-glass-card"
                        data-severity={error.severity}
                        variants={cardVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        {/* Shake wrapper */}
                        <motion.div
                            style={{ display: 'contents' }}
                            animate={shouldShake ? 'shake' : undefined}
                            variants={shakeVariants}
                        >
                            {/* Icon */}
                            <div className="error-glass-icon">
                                {(() => {
                                    const IconComponent = ICON_MAP[error.icon] || AlertIcon;
                                    return <IconComponent />;
                                })()}
                            </div>

                            {/* Body */}
                            <div className="error-glass-body">
                                <div className="error-glass-title">{error.title}</div>
                                <div className="error-glass-desc">{error.description}</div>

                                {/* Auto-Retry Status */}
                                {error.action === 'auto-retry' && (
                                    <div className="error-glass-retry-status">
                                        {isRetrying ? (
                                            <>
                                                <div className="error-glass-spinner" />
                                                <span>{retryCountdown}秒後に再試行...</span>
                                                {retryCount > 0 && (
                                                    <span style={{ opacity: 0.6 }}>
                                                        ({retryCount}/{error.maxRetries}回目)
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div className="error-glass-countdown">
                                                    {retryCountdown}
                                                </div>
                                                <span>自動リトライ待機中...</span>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="error-glass-actions">
                                    {/* Manual Retry */}
                                    {error.action === 'manual-retry' && (
                                        <button
                                            className="error-glass-btn error-glass-btn-primary"
                                            onClick={onManualRetry}
                                        >
                                            <RetryIcon />
                                            再試行する
                                        </button>
                                    )}

                                    {/* Config */}
                                    {error.action === 'config' && onOpenConfig && (
                                        <button
                                            className="error-glass-btn error-glass-btn-primary"
                                            onClick={onOpenConfig}
                                        >
                                            <SettingsIcon />
                                            API設定を開く
                                        </button>
                                    )}

                                    {/* Report */}
                                    {error.action === 'report' && (
                                        <button
                                            className="error-glass-btn"
                                            onClick={onManualRetry}
                                        >
                                            <RetryIcon />
                                            再試行する
                                        </button>
                                    )}

                                    {/* Guidance / Suggest は閉じるボタンのみ */}
                                </div>
                            </div>

                            {/* Dismiss */}
                            <button
                                className="error-glass-dismiss"
                                onClick={onDismiss}
                                aria-label="閉じる"
                            >
                                <CloseIcon />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ErrorGlassCard;
