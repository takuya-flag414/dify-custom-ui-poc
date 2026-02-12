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

    return (
        <motion.div
            className="structured-user-message"
            variants={contentVariants}
            initial="hidden"
            animate="show"
        >
            {/* Text Content Only */}
            <div className="structured-content">
                <MarkdownRenderer
                    content={content.text}
                    renderMode="normal"
                    onOpenArtifact={onOpenArtifact}
                />
            </div>
        </motion.div>
    );
};

export default StructuredUserMessage;

