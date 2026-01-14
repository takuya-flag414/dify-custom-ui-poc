import React from 'react';
import { motion } from 'framer-motion';
import './IntelligenceOrb.css';

/**
 * IntelligenceOrb Component
 * 
 * Displays a glowing, breathing orb used for loading states or AI processing indicators.
 * Follows the "Apple Intelligence" semantic gradient guidelines from DESIGN_RULE.md.
 * 
 * @param {string} mode - 'loading' | 'processing' | 'idle'
 * @param {string} label - Optional text label to display below the orb
 */
const IntelligenceOrb = ({ mode = 'loading', label = 'Initializing...' }) => {
    return (
        <motion.div
            className="intelligence-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="orb-wrapper">
                <div className="orb-core"></div>
                <div className="orb-glow-1"></div>
                <div className="orb-glow-2"></div>
            </div>

            {label && (
                <motion.p
                    className="intelligence-label"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    {label}
                </motion.p>
            )}
        </motion.div>
    );
};

export default IntelligenceOrb;
