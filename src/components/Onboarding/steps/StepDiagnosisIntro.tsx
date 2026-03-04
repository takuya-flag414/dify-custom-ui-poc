// src/components/Onboarding/steps/StepDiagnosisIntro.tsx
import React from 'react';
import { motion } from 'framer-motion';
import './StepDiagnosis.css';

// 矢印アイコン
const ChevronIcon: React.FC = () => (
    <svg className="diagnosis-choice-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

// 脳アイコン（診断を象徴）
const BrainIcon: React.FC = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2a3.5 3.5 0 0 0-3.2 2.1A3.5 3.5 0 0 0 4 7.5a3.5 3.5 0 0 0 .8 2.3A3.5 3.5 0 0 0 4 12.5a3.5 3.5 0 0 0 2.3 3.3A3.5 3.5 0 0 0 9.5 19" />
        <path d="M14.5 2a3.5 3.5 0 0 1 3.2 2.1A3.5 3.5 0 0 1 20 7.5a3.5 3.5 0 0 1-.8 2.3 3.5 3.5 0 0 1 .8 2.7 3.5 3.5 0 0 1-2.3 3.3A3.5 3.5 0 0 1 14.5 19" />
        <path d="M12 2v20" />
    </svg>
);

interface Props {
    onSelectDiagnosis: () => void;
    onSelectManual: () => void;
    onSelectSkip: () => void;
    onPrev: () => void;
}

/**
 * ステップ5: 診断開始画面（3つの選択肢）
 */
const StepDiagnosisIntro: React.FC<Props> = ({
    onSelectDiagnosis,
    onSelectManual,
    onSelectSkip,
    onPrev,
}) => {
    return (
        <div className="onboarding-step-new split-layout">
            <div className="onboarding-step-left">
                {/* アイコン */}
                <motion.div
                    className="onboarding-icon-new"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    style={{ width: '96px', height: '96px', marginBottom: '32px' }}
                >
                    <BrainIcon />
                </motion.div>

                {/* タイトル */}
                <motion.h1
                    className="onboarding-title-new"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '24px' }}
                >
                    AIをあなた好みに<br />カスタマイズ
                </motion.h1>
                <div className="title-decoration-line" style={{ marginBottom: 0 }} />
            </div>

            <div className="onboarding-step-right">
                {/* サブタイトル */}
                <motion.p
                    className="onboarding-subtitle-new"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    style={{ fontSize: '1.15rem', marginBottom: '28px' }}
                >
                    簡単な質問に答えるだけで、あなたに最適なAIの応答スタイルを自動設定します。
                </motion.p>

                {/* 3つの選択肢 */}
                <motion.div
                    className="diagnosis-intro-choices"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                >
                    {/* 診断で設定（推奨） */}
                    <motion.button
                        type="button"
                        className="diagnosis-choice-card recommended"
                        onClick={onSelectDiagnosis}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <div className="diagnosis-choice-icon">🧠</div>
                        <div className="diagnosis-choice-text">
                            <h3>
                                パーソナリティ診断で設定
                                <span className="diagnosis-recommended-badge">推奨</span>
                            </h3>
                            <p>4つの質問に答えるだけ（約30秒）。AIがあなたの好みを学習します。</p>
                        </div>
                        <ChevronIcon />
                    </motion.button>

                    {/* 手動入力 */}
                    <motion.button
                        type="button"
                        className="diagnosis-choice-card"
                        onClick={onSelectManual}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <div className="diagnosis-choice-icon">✏️</div>
                        <div className="diagnosis-choice-text">
                            <h3>自分で手動入力する</h3>
                            <p>カスタム指示を自由に記述できます。</p>
                        </div>
                        <ChevronIcon />
                    </motion.button>

                    {/* スキップ */}
                    <motion.button
                        type="button"
                        className="diagnosis-choice-card"
                        onClick={onSelectSkip}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <div className="diagnosis-choice-icon">⏭️</div>
                        <div className="diagnosis-choice-text">
                            <h3>スキップ（標準設定を使用）</h3>
                            <p>後から設定画面で変更できます。</p>
                        </div>
                        <ChevronIcon />
                    </motion.button>
                </motion.div>

                {/* 戻るボタン */}
                <motion.div
                    className="onboarding-actions-new"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    style={{ flexDirection: 'row', maxWidth: 'none', justifyContent: 'flex-start', paddingTop: '24px' }}
                >
                    <button
                        type="button"
                        className="onboarding-btn-new onboarding-btn-secondary-new"
                        onClick={onPrev}
                        style={{ minWidth: '100px' }}
                    >
                        戻る
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default StepDiagnosisIntro;
