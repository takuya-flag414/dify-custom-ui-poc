// src/components/Shared/IntelligenceSelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './IntelligenceSelector.css';

// --- Mode Definitions ---
const BRAIN_MODES = [
    {
        id: 'fast',
        label: 'Fast',
        desc: '高速・軽量'
    },
    {
        id: 'deep',
        label: 'Deep Think',
        desc: '高度な推論と分析'
    }
];

/**
 * IntelligenceSelector - Brain（思考深度）選択コンポーネント（プルダウン形式）
 * 
 * @param {string} mode - 現在のモード ('fast' | 'deep')
 * @param {function} onChange - モード変更コールバック
 */
const IntelligenceSelector = ({ mode = 'fast', onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const isDeep = mode === 'deep';
    const currentMode = BRAIN_MODES.find(m => m.id === mode) || BRAIN_MODES[0];

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (modeId) => {
        onChange(modeId);
        setIsOpen(false);
    };

    return (
        <div className="intelligence-selector-container" ref={containerRef}>
            {/* Trigger Button */}
            <button
                className={`intelligence-trigger ${isDeep ? 'deep-active' : ''} ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title={currentMode.desc}
            >
                {/* Deep Think モード時の発光エフェクト背景 */}
                {isDeep && (
                    <motion.div
                        className="trigger-glow-background"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    />
                )}
                <span className="trigger-label">{currentMode.label}</span>
            </button>

            {/* Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="intelligence-popover"
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30
                        }}
                    >
                        {BRAIN_MODES.map((brainMode) => {
                            const isActive = mode === brainMode.id;
                            const isDeepMode = brainMode.id === 'deep';
                            return (
                                <button
                                    key={brainMode.id}
                                    className={`intelligence-mode-item ${isActive ? 'active' : ''} ${isDeepMode ? 'deep' : ''}`}
                                    onClick={() => handleSelect(brainMode.id)}
                                >
                                    {/* Deep Think モード時の発光エフェクト */}
                                    {isDeepMode && isActive && (
                                        <div className="mode-glow-background" />
                                    )}
                                    <div className="mode-content">
                                        <span className="mode-label">{brainMode.label}</span>
                                        <span className="mode-desc">{brainMode.desc}</span>
                                    </div>
                                    {isActive && (
                                        <svg className="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default IntelligenceSelector;
