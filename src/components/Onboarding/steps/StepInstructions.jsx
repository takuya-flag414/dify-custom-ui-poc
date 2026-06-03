// src/components/Onboarding/steps/StepInstructions.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

// 矢印アイコン
const ArrowRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

// ルールアイコン
const RulesIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
);

const PLACEHOLDER_EXAMPLES = [
    '常に箇条書きで答えてください',
    '結論を最初に、根拠を後から書いてください',
    '専門用語は使わず、平易な言葉で説明してください',
].join('\n');

/**
 * ステップ5: カスタム指示入力（スキップ可能）
 */
const StepInstructions = ({ instructions, onInstructionsChange, onNext, onPrev }) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleKeyDown = (e) => {
        // Ctrl+Enter または Cmd+Enter で次へ
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            onNext();
        }
    };

    return (
        <div className="onboarding-step-new">
            {/* アイコン */}
            <motion.div
                className="onboarding-icon-new"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                style={{ width: '80px', height: '80px', marginBottom: '24px' }}
            >
                <RulesIcon />
            </motion.div>

            {/* タイトル */}
            <motion.h1
                className="onboarding-title-new"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                style={{ fontSize: '28px', marginBottom: '16px' }}
            >
                文章の好みや、回答のルールはありますか？
            </motion.h1>

            {/* サブタイトル */}
            <motion.p
                className="onboarding-subtitle-new"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                style={{ marginBottom: '32px' }}
            >
                設定しておくと、毎回のやり取りに反映されます。
            </motion.p>

            {/* Textarea */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
            >
                <textarea
                    className={`onboarding-textarea${isFocused ? ' focused' : ''}`}
                    placeholder={PLACEHOLDER_EXAMPLES}
                    value={instructions}
                    onChange={(e) => onInstructionsChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    rows={5}
                    maxLength={500}
                    style={{
                        background: 'var(--glass-bg, rgba(255, 255, 255, 0.45))',
                        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.5))',
                        borderRadius: '16px',
                        padding: '16px',
                        width: '100%',
                        resize: 'none',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03) inset',
                        color: 'var(--color-text-main)',
                        fontSize: '15px'
                    }}
                />
                <p className="onboarding-input-hint" style={{ textAlign: 'right', marginTop: '12px', fontSize: '12px' }}>
                    {instructions.length} / 500　　後から設定で変更できます
                </p>
            </motion.div>

            {/* アクションバー（Sticky Footer） */}
            <motion.div
                className="onboarding-footer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
            >
                <div className="onboarding-footer-left">
                    <button
                        type="button"
                        className="onboarding-btn-new onboarding-btn-secondary-new"
                        onClick={onPrev}
                        style={{ minWidth: '100px' }}
                    >
                        戻る
                    </button>
                    <button
                        type="button"
                        className="onboarding-btn-new onboarding-btn-ghost-new"
                        onClick={onNext}
                        style={{ marginLeft: '12px' }}
                    >
                        スキップ
                    </button>
                </div>

                <div className="onboarding-pagination">
                    <div className="pagination-dot active" />
                </div>

                <div className="onboarding-footer-right">
                    <motion.button
                        className="onboarding-btn-new onboarding-btn-primary-new"
                        onClick={onNext}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ minWidth: '140px', height: '40px', fontSize: '14px' }}
                    >
                        次へ
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default StepInstructions;
