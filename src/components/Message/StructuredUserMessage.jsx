// src/components/Message/StructuredUserMessage.jsx
import React from 'react';
import { motion } from 'framer-motion';
import './StructuredUserMessage.css';
import MarkdownRenderer from '../Shared/MarkdownRenderer';

// Animation config
const contentVariants = {
    hidden: { opacity: 0, y: 5 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 25
        }
    }
};

/**
 * StructuredUserMessage - テキストコンテンツのみを表示
 * 
 * ※ バッジと添付ファイルチップはContextChipsコンポーネントに移行済み
 * ※ このコンポーネントはテキスト部分のみを担当
 */
const StructuredUserMessage = ({ parsedMessage, onOpenArtifact }) => {
    const { content } = parsedMessage;
    const [isExpanded, setIsExpanded] = React.useState(false);

    // 折り畳みの判定基準: 400文字以上または10行以上
    const FOLD_THRESHOLD_CHAR = 400;
    const FOLD_THRESHOLD_LINES = 10;

    const lines = content.text.split('\n').length;
    const isLongMessage = content.text.length > FOLD_THRESHOLD_CHAR || lines > FOLD_THRESHOLD_LINES;

    const toggleExpand = () => setIsExpanded(!isExpanded);

    return (
        <motion.div
            className={`structured-user-message ${isLongMessage && !isExpanded ? 'is-folded' : ''}`}
            variants={contentVariants}
            initial="hidden"
            animate="show"
        >
            {/* Text Content */}
            <div className="structured-content">
                <MarkdownRenderer
                    content={content.text}
                    renderMode="normal"
                    onOpenArtifact={onOpenArtifact}
                />
            </div>

            {/* Expand / Collapse Button */}
            {isLongMessage && (
                <button 
                    className="message-fold-toggle" 
                    onClick={toggleExpand}
                    aria-expanded={isExpanded}
                >
                    <span className="toggle-text">
                        {isExpanded ? '閉じる' : 'もっと見る'}
                    </span>
                    <span className={`toggle-icon ${isExpanded ? 'is-rotated' : ''}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </span>
                </button>
            )}
        </motion.div>
    );
};


export default StructuredUserMessage;

