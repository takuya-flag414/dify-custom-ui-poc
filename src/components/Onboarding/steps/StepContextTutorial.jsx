// src/components/Onboarding/steps/StepContextTutorial.jsx
import React from 'react';
import { motion } from 'framer-motion';

// ---- アイコン ----

// 社内ナレッジアイコン（ドキュメント）
const DocumentIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

// Web検索アイコン（地球儀）
const GlobeIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

// ハイブリッドアイコン（マージ）
const MergeIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <path d="M13 6h3a2 2 0 0 1 2 2v7" />
        <line x1="6" y1="9" x2="6" y2="21" />
    </svg>
);

// 矢印アイコン
const ArrowRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

// ---- チュートリアルコンテンツ定義 ----
const TUTORIAL_CONTENT = {
    knowledge: {
        icon: DocumentIcon,
        badge: 'Knowledge',
        iconColorClass: 'tutorial-icon-knowledge',
        title: '社内文書から答えを探す',
        description: 'マニュアル、規約、過去の資料など、組織内のドキュメントをAIが横断的に検索します。「社内のルール」や「製品仕様」についての質問に威力を発揮します。',
        feature: '📂 社内ナレッジモード',
    },
    web: {
        icon: GlobeIcon,
        badge: 'Web Search',
        iconColorClass: 'tutorial-icon-web',
        title: 'インターネットの最新情報を調べる',
        description: 'リアルタイムのWeb検索でAIが最新情報を収集します。市場トレンド、競合情報、時事ニュースなど、社内文書には載っていない最新の答えが得られます。',
        feature: '🌐 Web検索モード',
    },
    hybrid: {
        icon: MergeIcon,
        badge: 'Hybrid',
        iconColorClass: 'tutorial-icon-hybrid',
        title: '社内知識とWebを掛け合わせる',
        description: '社内ドキュメントとWebの両方を活用し、より総合的な回答を生成します。「自社製品と市場のトレンドを比較したい」といった複合的なリサーチに最適です。',
        feature: '⚡ ハイブリッドモード',
    },
};

/**
 * ステップ1-3: コンテキストモード説明チュートリアル
 * Props:
 *   mode: 'knowledge' | 'web' | 'hybrid'
 *   onNext: () => void
 *   onPrev: () => void
 */
const StepContextTutorial = ({ mode, onNext, onPrev }) => {
    const content = TUTORIAL_CONTENT[mode];
    const IconComponent = content.icon;

    // ステップ番号に応じたアクティブなドットを計算 (Knowledge=1, Web=2, Hybrid=3)
    const getActiveDotIndex = () => {
        if (mode === 'knowledge') return 1;
        if (mode === 'web') return 2;
        if (mode === 'hybrid') return 3;
        return 1;
    };
    const activeIndex = getActiveDotIndex();

    return (
        <div className="onboarding-step-new">
            {/* フィーチャーバッジ */}
            <motion.div
                className="tutorial-badge"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                style={{ marginBottom: '16px' }}
            >
                {content.feature}
            </motion.div>

            {/* アイコン */}
            <motion.div
                className={`tutorial-icon-wrapper ${content.iconColorClass}`}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 250, damping: 20, delay: 0.05 }}
                style={{ width: '80px', height: '80px', marginBottom: '24px', borderRadius: '20px' }}
            >
                <IconComponent />
            </motion.div>

            {/* タイトル */}
            <motion.h1
                className="onboarding-title-new"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                style={{ fontSize: '28px', marginBottom: '16px' }}
            >
                {content.title}
            </motion.h1>

            {/* 説明文 */}
            <motion.p
                className="onboarding-subtitle-new"
                style={{ maxWidth: '480px', marginBottom: '32px' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
            >
                {content.description}
            </motion.p>

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
                </div>

                <div className="onboarding-pagination">
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <div key={idx} className={`pagination-dot ${idx === activeIndex ? 'active' : ''}`} />
                    ))}
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

export default StepContextTutorial;
