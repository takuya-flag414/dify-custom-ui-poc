// src/components/Chat/WelcomeScreen.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './WelcomeScreen.css';
import { getTimeBasedGreeting } from '../../utils/timeUtils';
import SuggestionCard from './SuggestionCard';
import { SearchIcon, PenToolIcon, FileTextIcon, SparklesIcon } from '../Shared/SystemIcons';

// --- Wizard Integration ---
import CapabilityWizard from './Wizard/CapabilityWizard';
import { WIZARD_SCENARIOS } from './Wizard/WizardConfig';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { type: "spring", stiffness: 200, damping: 24, mass: 1 }
    }
};

// 検索モード設定のマッピング（ContextSelectorのMODESに対応）
const MODE_SETTINGS = {
    standard: { ragEnabled: false, webMode: 'auto' },
    fast: { ragEnabled: false, webMode: 'off' },
    hybrid: { ragEnabled: true, webMode: 'auto' },
    enterprise: { ragEnabled: true, webMode: 'off' },
    deep: { ragEnabled: false, webMode: 'force' }
};

const WelcomeScreen = ({ userName, onSendMessage, onStartTutorial, setSearchSettings }) => {
    const { greeting, subMessage } = getTimeBasedGreeting(userName);

    // Wizard State
    const [activeWizardId, setActiveWizardId] = useState(null);

    // Suggestion Cards Definition (ID must match WIZARD_SCENARIOS keys)
    const suggestions = [
        {
            id: 'search',
            icon: SearchIcon,
            title: '社内規定・マニュアル検索',
            description: '就業規則や経費精算の手順を検索します',
            // prompt: ... (Wizardを使うので直接のPromptは不要になりました)
        },
        {
            id: 'draft',
            icon: PenToolIcon,
            title: 'メール・文書作成',
            description: '状況に応じたビジネスメールの下書きを作成',
        },
        {
            id: 'summary',
            icon: FileTextIcon,
            title: '議事録・資料の要約',
            description: '長いテキストや資料のポイントを抽出',
        },
        {
            id: 'idea',
            icon: SparklesIcon,
            title: 'アイデア出し・壁打ち',
            description: 'AIと一緒に新しい企画や解決策を考えます',
            isAiSuggested: true
        },
    ];

    // Handle Card Click -> Open Wizard with Auto Mode Switching
    const handleCardClick = (id) => {
        // 設定が存在する場合のみウィザードを開く
        if (WIZARD_SCENARIOS[id]) {
            const scenario = WIZARD_SCENARIOS[id];

            // 推奨モードが定義されている場合、検索設定を自動変更
            if (scenario.recommendedMode && setSearchSettings) {
                const modeSettings = MODE_SETTINGS[scenario.recommendedMode];
                if (modeSettings) {
                    setSearchSettings(prev => ({
                        ...prev,
                        ...modeSettings
                    }));
                    console.log(`🔄 検索モードを自動変更: ${scenario.recommendedMode}`);
                }
            }

            setActiveWizardId(id);
        } else {
            console.warn(`Wizard scenario not found for: ${id}`);
        }
    };

    // Handle Wizard Submit -> Send Message to Chat
    const handleWizardSubmit = (formData) => {
        const scenario = WIZARD_SCENARIOS[activeWizardId];
        if (scenario && onSendMessage) {
            const prompt = scenario.generatePrompt(formData);

            // ファイルがあれば抽出
            const files = scenario.getFiles ? scenario.getFiles(formData) : [];

            // Console Log for Mock confirmation
            console.log("🤖 Generating Prompt via Wizard:", prompt);
            if (files.length > 0) {
                console.log("📎 Attached Files:", files.map(f => f.name));
            }

            // 実際のチャット送信処理（ファイル付き）
            onSendMessage(prompt, files);

            // Close Wizard
            setActiveWizardId(null);
        }
    };

    return (
        <div className="welcome-container">
            <motion.div
                className="welcome-inner"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.header className="welcome-header" variants={itemVariants}>
                    <div className="welcome-logo-badge">
                        Desktop Intelligence
                    </div>
                    <h1 className="welcome-title">{greeting}</h1>
                    <p className="welcome-subtitle">
                        {subMessage}<br />
                        どのようなお手伝いが必要ですか？
                    </p>
                </motion.header>

                {/* Grid */}
                <motion.main className="welcome-grid-section" variants={itemVariants}>
                    <p className="welcome-section-label">Suggestions</p>
                    <div className="welcome-grid">
                        {suggestions.map((item) => (
                            <SuggestionCard
                                key={item.id}
                                icon={item.icon}
                                title={item.title}
                                description={item.description}
                                isAiSuggested={item.isAiSuggested}
                                // IDを渡してハンドリング
                                onClick={() => handleCardClick(item.id)}
                            />
                        ))}
                    </div>
                </motion.main>

                {/* Footer */}
                <motion.footer className="welcome-footer-links" variants={itemVariants}>
                    <button className="link-button" onClick={onStartTutorial}>
                        使い方ガイドを見る
                    </button>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <button className="link-button" onClick={() => window.open('https://wiki.company.local', '_blank')}>
                        システム更新情報
                    </button>
                </motion.footer>
            </motion.div>

            {/* --- Wizard Overlay --- */}
            {/* ポータルを使わず、WelcomeScreen上にオーバーレイさせることでコンテキストを維持 */}
            <CapabilityWizard
                isOpen={!!activeWizardId}
                onClose={() => setActiveWizardId(null)}
                scenarioData={activeWizardId ? WIZARD_SCENARIOS[activeWizardId] : null}
                onSubmit={handleWizardSubmit}
            />
        </div>
    );
};

export default WelcomeScreen;