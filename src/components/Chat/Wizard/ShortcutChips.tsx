import React from 'react';
import { motion } from 'framer-motion';
import { WIZARD_TEMPLATES } from './PromptWizardConfig';
import './ShortcutChips.css';

interface ShortcutChipsProps {
    onChipClick: (wizardId: string) => void;
}

const PresentationIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
);

const ShortcutChips: React.FC<ShortcutChipsProps> = ({ onChipClick }) => {
    // 現在は設定されたテンプレートをすべて表示
    const templates = Object.values(WIZARD_TEMPLATES);

    return (
        <div className="shortcut-chips-container">
            <div className="shortcut-chips-scroll">
                {templates.map((template) => (
                    <motion.button
                        key={template.id}
                        className="shortcut-chip"
                        onClick={() => onChipClick(template.id)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="shortcut-chip-content">
                            <PresentationIcon />
                            <span className="shortcut-chip-label">{template.title}</span>
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default ShortcutChips;
