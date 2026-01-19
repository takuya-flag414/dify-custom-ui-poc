/**
 * StepIdentity - スタジオのアイデンティティ設定ステップ
 * 
 * 名前、アイコン、テーマカラーを設定
 */

import React from 'react';
import { motion } from 'framer-motion';
import { IntelligenceColor } from '../../../types/studio';

interface StepIdentityProps {
    data: {
        name: string;
        icon: string;
        themeColor: IntelligenceColor;
        description: string;
    };
    onChange: (updates: Partial<StepIdentityProps['data']>) => void;
}

// 利用可能なアイコン（絵文字）
const AVAILABLE_ICONS = [
    '✨', '💡', '🚀', '💻', '✍️', '🌏', '📊', '🎨',
    '📝', '🔬', '📚', '🎯', '⚙️', '🤖', '💬', '🧠',
];

// Apple Intelligence カラー
const INTELLIGENCE_COLORS: { value: IntelligenceColor; label: string; hex: string }[] = [
    { value: 'blue', label: 'ブルー', hex: '#007AFF' },
    { value: 'cyan', label: 'シアン', hex: '#00FFFF' },
    { value: 'magenta', label: 'マゼンタ', hex: '#FF00FF' },
    { value: 'purple', label: 'パープル', hex: '#BF5AF2' },
    { value: 'orange', label: 'オレンジ', hex: '#FF9500' },
    { value: 'yellow', label: 'イエロー', hex: '#FFD60A' },
    { value: 'green', label: 'グリーン', hex: '#30D158' },
];

/**
 * StepIdentity
 */
export const StepIdentity: React.FC<StepIdentityProps> = ({
    data,
    onChange,
}) => {
    return (
        <div className="wizard-step">
            {/* Name Input */}
            <div className="wizard-field">
                <label className="wizard-label" htmlFor="studio-name">
                    スタジオ名
                </label>
                <input
                    id="studio-name"
                    type="text"
                    className="wizard-input"
                    value={data.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    placeholder="例: 翻訳スタジオ"
                    autoFocus
                />
            </div>

            {/* Icon Picker */}
            <div className="wizard-field">
                <label className="wizard-label">
                    アイコン
                </label>
                <div className="wizard-icon-grid">
                    {AVAILABLE_ICONS.map((icon) => (
                        <motion.button
                            key={icon}
                            type="button"
                            className={`wizard-icon-btn ${data.icon === icon ? 'selected' : ''}`}
                            onClick={() => onChange({ icon })}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {icon}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Color Picker */}
            <div className="wizard-field">
                <label className="wizard-label">
                    テーマカラー
                </label>
                <div className="wizard-color-grid">
                    {INTELLIGENCE_COLORS.map((color) => (
                        <motion.button
                            key={color.value}
                            type="button"
                            className={`wizard-color-btn ${data.themeColor === color.value ? 'selected' : ''}`}
                            style={{ '--color-value': color.hex } as React.CSSProperties}
                            onClick={() => onChange({ themeColor: color.value })}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label={color.label}
                            title={color.label}
                        />
                    ))}
                </div>
            </div>

            {/* Description */}
            <div className="wizard-field">
                <label className="wizard-label" htmlFor="studio-description">
                    説明（任意）
                </label>
                <textarea
                    id="studio-description"
                    className="wizard-textarea"
                    value={data.description}
                    onChange={(e) => onChange({ description: e.target.value })}
                    placeholder="このスタジオの目的を簡単に説明..."
                    rows={2}
                />
            </div>
        </div>
    );
};

export default StepIdentity;
