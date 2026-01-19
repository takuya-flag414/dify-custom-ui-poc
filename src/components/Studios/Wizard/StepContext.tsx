/**
 * StepContext - コンテキスト設定ステップ
 * 
 * システムプロンプトとナレッジベースを設定
 */

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload } from 'lucide-react';

interface StepContextProps {
    data: {
        systemPrompt: string;
        inputPlaceholder: string;
        welcomeMessage: string;
    };
    onChange: (updates: Partial<StepContextProps['data']>) => void;
}

/**
 * StepContext
 */
export const StepContext: React.FC<StepContextProps> = ({
    data,
    onChange,
}) => {
    return (
        <div className="wizard-step">
            {/* System Prompt */}
            <div className="wizard-field">
                <label className="wizard-label" htmlFor="system-prompt">
                    システムプロンプト
                </label>
                <p className="wizard-hint">
                    AIに与える指示を入力してください
                </p>
                <textarea
                    id="system-prompt"
                    className="wizard-textarea wizard-textarea--large"
                    value={data.systemPrompt}
                    onChange={(e) => onChange({ systemPrompt: e.target.value })}
                    placeholder="例: あなたは経験豊富な翻訳者です。ユーザーが入力したテキストを、文脈やニュアンスを考慮して自然な表現に翻訳してください..."
                    rows={5}
                />
            </div>

            {/* Knowledge Base (Mock) */}
            <div className="wizard-field">
                <label className="wizard-label">
                    ナレッジベース（Phase B予定）
                </label>
                <motion.div
                    className="wizard-dropzone"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    <Upload size={24} className="wizard-dropzone__icon" />
                    <span className="wizard-dropzone__text">
                        ファイルをドロップ、またはクリックして選択
                    </span>
                    <span className="wizard-dropzone__hint">
                        PDF, TXT, MD (Phase Bで実装予定)
                    </span>
                </motion.div>
            </div>

            {/* Input Placeholder */}
            <div className="wizard-field">
                <label className="wizard-label" htmlFor="input-placeholder">
                    入力欄のプレースホルダー
                </label>
                <input
                    id="input-placeholder"
                    type="text"
                    className="wizard-input"
                    value={data.inputPlaceholder}
                    onChange={(e) => onChange({ inputPlaceholder: e.target.value })}
                    placeholder="例: 翻訳したいテキストを入力..."
                />
            </div>

            {/* Welcome Message */}
            <div className="wizard-field">
                <label className="wizard-label" htmlFor="welcome-message">
                    ウェルカムメッセージ
                </label>
                <textarea
                    id="welcome-message"
                    className="wizard-textarea"
                    value={data.welcomeMessage}
                    onChange={(e) => onChange({ welcomeMessage: e.target.value })}
                    placeholder="例: 翻訳のお手伝いをします。テキストを入力してください。"
                    rows={2}
                />
            </div>
        </div>
    );
};

export default StepContext;
