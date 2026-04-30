// src/components/Message/InlineErrorCard.jsx
// チャット内インラインエラーカード
// ErrorGlassCardのデザインシステムを継承し、メッセージバブル内に表示するコンポーネント

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './InlineErrorCard.css';

// ========================================
// Icon Components (SVGインライン - ErrorGlassCardと共通)
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

const AlertIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const LockIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const FileIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

// アイコンマップ（ErrorGlassCardと同じ）
const ICON_MAP = {
    clock: ClockIcon,
    chat: ChatIcon,
    shield: ShieldIcon,
    wifi: WifiIcon,
    settings: SettingsIcon,
    alert: AlertIcon,
    lock: LockIcon,
    file: FileIcon,
    search: SearchIcon,
};

// ========================================
// アニメーション設定
// ========================================

// 詳細アコーディオンのアニメーション
const detailsVariants = {
    closed: {
        height: 0,
        opacity: 0,
        transition: {
            height: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
            opacity: { duration: 0.15 },
        },
    },
    open: {
        height: 'auto',
        opacity: 1,
        transition: {
            height: {
                type: 'spring',
                stiffness: 250,
                damping: 25,
                mass: 1,
            },
            opacity: { duration: 0.2, delay: 0.1 },
        },
    },
};

// ========================================
// InlineErrorCard コンポーネント
// ========================================

/**
 * チャット内インラインエラーカード
 * MessageBlockのワークフローエラーバナーの代替として使用
 *
 * @param {Object} props
 * @param {Object} props.error - IntelligenceError型のエラー情報
 * @param {number} [props.retryCountdown] - リトライまでのカウントダウン（秒）
 * @param {boolean} [props.isRetrying] - リトライ中フラグ
 * @param {number} [props.retryCount] - 現在のリトライ回数
 */
const InlineErrorCard = ({
    error,
    retryCountdown = 0,
    isRetrying = false,
    retryCount = 0,
}) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    if (!error) return null;

    // アイコンコンポーネントの選択
    const IconComponent = ICON_MAP[error.icon] || AlertIcon;

    // 詳細情報の有無判定
    const hasDetails = error.rawErrorMessage || error.statusCode;

    return (
        <div
            className="inline-error-card"
            data-severity={error.severity || 'warning'}
        >
            {/* アイコン */}
            <div className="inline-error-icon">
                <IconComponent />
            </div>

            {/* コンテンツ */}
            <div className="inline-error-body">
                {/* タイトルと説明 */}
                <div className="inline-error-title">{error.title}</div>
                <div className="inline-error-desc">{error.description}</div>

                {/* Auto-Retry ステータス */}
                {error.retryStrategy === 'auto-retry' && (
                    <div className="inline-error-retry-status">
                        {isRetrying ? (
                            <>
                                <div className="inline-error-spinner" />
                                <span>
                                    自動で再送信を試みています...
                                    {retryCountdown > 0 && ` (${retryCountdown}秒後)`}
                                </span>
                                {retryCount > 0 && (
                                    <span className="inline-error-retry-count">
                                        ({retryCount}/{error.maxRetries})
                                    </span>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="inline-error-spinner" />
                                <span>自動リトライ待機中...</span>
                            </>
                        )}
                    </div>
                )}

                {/* 詳細表示トグル */}
                {hasDetails && (
                    <button
                        className={`inline-error-details-toggle ${isDetailsOpen ? 'is-open' : ''}`}
                        onClick={() => setIsDetailsOpen(prev => !prev)}
                        aria-expanded={isDetailsOpen}
                    >
                        <span>エラーの詳細を確認する</span>
                        <ChevronDownIcon />
                    </button>
                )}

                {/* 詳細表示アコーディオン */}
                <AnimatePresence initial={false}>
                    {isDetailsOpen && hasDetails && (
                        <motion.div
                            key="inline-error-details"
                            variants={detailsVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            style={{ overflow: 'hidden' }}
                        >
                            <div className="inline-error-details-content">
                                {error.statusCode && (
                                    <div className="inline-error-details-status">
                                        HTTP {error.statusCode}
                                    </div>
                                )}
                                {error.rawErrorMessage && (
                                    <pre className="inline-error-details-raw">
                                        {error.rawErrorMessage}
                                    </pre>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default InlineErrorCard;
