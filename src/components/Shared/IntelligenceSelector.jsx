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
        id: 'pro',
        label: 'Pro',
        desc: '深い推論'
    }
];

/**
 * IntelligenceSelector - Brain（思考深度）選択コンポーネント（プルダウン形式）
 * 
 * @param {string} mode - 現在のモード ('fast' | 'pro')
 * @param {function} onChange - モード変更コールバック
 */
const IntelligenceSelector = ({ mode = 'fast', onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const isPro = mode === 'pro';
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
                className={`intelligence-trigger ${isPro ? 'pro-active' : ''} ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title={currentMode.desc}
            >
                {/* Pro モード時の発光エフェクト背景 */}
                {isPro && (
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
                            const isProMode = brainMode.id === 'pro';
                            return (
                                <button
                                    key={brainMode.id}
                                    className={`intelligence-mode-item ${isActive ? 'active' : ''} ${isProMode ? 'pro' : ''}`}
                                    onClick={() => handleSelect(brainMode.id)}
                                >
                                    {/* Pro モード時の発光エフェクト */}
                                    {isProMode && isActive && (
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
