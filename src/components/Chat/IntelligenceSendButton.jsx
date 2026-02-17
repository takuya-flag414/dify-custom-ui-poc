import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Icons ---
const SendIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

const StopIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <rect x="2" y="2" width="20" height="20" rx="4" ry="4"></rect>
    </svg>
);

const ArrowUpIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
    </svg>
);

// --- Component ---
const IntelligenceSendButton = ({
    isTyping,
    isStreaming,
    canSend,
    onSend,
    onStop,
    disabled
}) => {
    // 状態の決定
    const mode = useMemo(() => {
        if (isStreaming) return 'streaming';
        if (isTyping && canSend) return 'typing';
        if (canSend) return 'active';
        return 'idle';
    }, [isTyping, isStreaming, canSend]);

    return (
        <div className="relative w-9 h-9 flex items-center justify-center">
            <AnimatePresence mode="wait">
                {/* --- 1. Streaming State (Stop Button) --- */}
                {mode === 'streaming' && (
                    <motion.button
                        key="streaming"
                        onClick={onStop}
                        className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 focus:outline-none"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        title="生成を停止"
                    >
                        <StopIcon />
                    </motion.button>
                )}

                {/* --- 2. Typing/Active State (Simple Blue Button) --- */}
                {(mode === 'typing' || mode === 'active') && !isStreaming && (
                    <motion.button
                        key="typing"
                        onClick={onSend}
                        disabled={disabled}
                        className="w-9 h-9 rounded-full bg-[#007AFF] text-white flex items-center justify-center shadow-sm hover:bg-[#0062CC] focus:outline-none"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        title="送信"
                    >
                        <ArrowUpIcon />
                    </motion.button>
                )}

                {/* --- 3. Idle State (Gray Send Icon) --- */}
                {mode === 'idle' && !isStreaming && (
                    <motion.button
                        key="idle"
                        onClick={onSend}
                        disabled={true} // Idle usually means can't send
                        className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ArrowUpIcon />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default IntelligenceSendButton;
