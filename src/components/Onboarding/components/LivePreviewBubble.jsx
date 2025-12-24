// src/components/Onboarding/components/LivePreviewBubble.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBlock from '../../Message/MessageBlock';
import './LivePreviewBubble.css';

/**
 * スタイル選択時のライブプレビュー
 * スケルトンローダー + スムーズな切り替えアニメーション
 */

const STYLE_PREVIEWS = {
    efficient: {
        role: 'ai',
        text: `**結論**: 3つのポイントがあります。

1. 要点を先に伝えます
2. 箇条書きで整理します
3. 必要最小限の説明です

ご質問があればどうぞ。`,
        isStreaming: false,
        id: 'preview-efficient',
        tone: '簡潔・直接的',
        icon: '⚡'
    },
    partner: {
        role: 'ai',
        text: `なるほど、それは興味深い視点ですね。

少し深掘りして考えてみましょう。まず背景として、この問題にはいくつかの側面があります。

あなたはどのようにお考えですか？`,
        isStreaming: false,
        id: 'preview-partner',
        tone: '対話的・丁寧',
        icon: '💭'
    }
};

/**
 * スケルトンローダー
 */
const SkeletonLoader = () => (
    <div className="preview-skeleton">
        <div className="preview-skeleton-avatar" />
        <div className="preview-skeleton-content">
            <div className="preview-skeleton-line" style={{ width: '80%' }} />
            <div className="preview-skeleton-line" style={{ width: '60%' }} />
            <div className="preview-skeleton-line" style={{ width: '90%' }} />
            <div className="preview-skeleton-line" style={{ width: '40%' }} />
        </div>
    </div>
);

const LivePreviewBubble = ({ style }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [displayStyle, setDisplayStyle] = useState(style);
    const preview = STYLE_PREVIEWS[displayStyle] || STYLE_PREVIEWS.partner;

    // スタイル変更時にローディング表示
    useEffect(() => {
        if (style !== displayStyle) {
            setIsLoading(true);
            const timer = setTimeout(() => {
                setDisplayStyle(style);
                setIsLoading(false);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [style, displayStyle]);

    // MessageBlock用のメッセージオブジェクト
    const previewMessage = {
        role: preview.role,
        text: preview.text,
        isStreaming: preview.isStreaming,
        id: preview.id
    };

    return (
        <div className="live-preview-container">
            <div className="live-preview-header">
                <span className="live-preview-badge">
                    <span className="live-preview-dot" />
                    AI Preview
                </span>
            </div>

            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="skeleton"
                        className="live-preview-message-wrapper"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        <SkeletonLoader />
                    </motion.div>
                ) : (
                    <motion.div
                        key={displayStyle}
                        className="live-preview-message-wrapper"
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{
                            duration: 0.35,
                            ease: [0.4, 0, 0.2, 1]
                        }}
                    >
                        {/* 実際のMessageBlockを使用 */}
                        <MessageBlock
                            message={previewMessage}
                            className="preview-message-block"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                className="live-preview-tone-badge"
                key={`badge-${displayStyle}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.25 }}
            >
                <span className="tone-icon">{preview.icon}</span>
                <span className="tone-text">{preview.tone}</span>
            </motion.div>
        </div>
    );
};

export default LivePreviewBubble;
