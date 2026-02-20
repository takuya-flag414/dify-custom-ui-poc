// src/components/Tools/ToolsGallery.tsx
// DESIGN_RULE.md v3.0 - Intelligence Gallery View

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import './ToolsGallery.css';

// Icons
import { SearchIcon, PenToolIcon, FileTextIcon, SparklesIcon, ChevronRightIcon } from '../Shared/SystemIcons';

// Wizard Integration
import CapabilityWizard from '../Chat/Wizard/CapabilityWizard';
import { WIZARD_SCENARIOS } from '../Chat/Wizard/WizardConfig';

// === Type Definitions ===

interface SearchSettings {
    ragEnabled: boolean;
    webEnabled: boolean;
}

interface ToolDefinition {
    id: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
    isAiSuggested?: boolean;
}

interface ToolsGalleryProps {
    /** Send message to chat */
    onSendMessage: (prompt: string, files?: File[]) => void;
    /** Update search settings */
    setSearchSettings?: React.Dispatch<React.SetStateAction<SearchSettings>>;
    /** Navigate to chat view after submission */
    onNavigateToChat?: () => void;
}

// === Animation Config (DESIGN_RULE.md) ===

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { type: "spring" as const, stiffness: 250, damping: 25 }
    }
};

// === Mode Settings Map (for auto-switching) ===

const MODE_SETTINGS: Record<string, Partial<SearchSettings>> = {
    standard: { ragEnabled: false, webEnabled: false },
    fast: { ragEnabled: false, webEnabled: false },
    hybrid: { ragEnabled: true, webEnabled: true },
    enterprise: { ragEnabled: true, webEnabled: false },
    deep: { ragEnabled: false, webEnabled: true }
};

// === Tool Definitions ===

const TOOLS: ToolDefinition[] = [
    {
        id: 'search',
        icon: SearchIcon,
        title: '社内規定・マニュアル検索',
        description: '就業規則や経費精算の手順を検索します',
        isAiSuggested: false
    },
    {
        id: 'draft',
        icon: PenToolIcon,
        title: 'メール・文書作成',
        description: '状況に応じたビジネスメールの下書きを作成',
        isAiSuggested: false
    },
    {
        id: 'summary',
        icon: FileTextIcon,
        title: '議事録・資料の要約',
        description: '長いテキストや資料のポイントを抽出',
        isAiSuggested: false
    },
    {
        id: 'idea',
        icon: SparklesIcon,
        title: 'アイデア出し・壁打ち',
        description: 'AIと一緒に新しい企画や解決策を考えます',
        isAiSuggested: true
    }
];

/**
 * ToolsGallery - Intelligence Tools Selection Screen
 */
const ToolsGallery: React.FC<ToolsGalleryProps> = ({
    onSendMessage,
    setSearchSettings,
    onNavigateToChat
}) => {
    const [activeWizardId, setActiveWizardId] = useState<string | null>(null);

    // Handle Tool Card Click
    const handleToolClick = (toolId: string): void => {
        const scenario = WIZARD_SCENARIOS[toolId];
        if (scenario) {
            // Auto-switch mode if recommended
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

            setActiveWizardId(toolId);
        } else {
            console.warn(`Wizard scenario not found for: ${toolId}`);
        }
    };

    // Handle Wizard Submit
    const handleWizardSubmit = (formData: Record<string, unknown>): void => {
        if (!activeWizardId) return;

        const scenario = WIZARD_SCENARIOS[activeWizardId];
        if (scenario && onSendMessage) {
            const prompt = scenario.generatePrompt(formData);
            const files: File[] = scenario.getFiles ? scenario.getFiles(formData) : [];

            console.log("🤖 Generating Prompt via Wizard:", prompt);
            if (files.length > 0) {
                console.log("📎 Attached Files:", files.map(f => f.name));
            }

            // Send message
            onSendMessage(prompt, files);

            // Close wizard
            setActiveWizardId(null);

            // Navigate to chat
            if (onNavigateToChat) {
                onNavigateToChat();
            }
        }
    };

    return (
        <div className="tools-gallery-container">
            <motion.div
                className="tools-gallery-inner"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.header className="tools-gallery-header" variants={itemVariants}>
                    <div className="tools-gallery-badge">
                        <SparklesIcon />
                        Desktop Intelligence
                    </div>
                    <h1 className="tools-gallery-title">どのツールを使いますか？</h1>
                    <p className="tools-gallery-subtitle">
                        タスクに最適なツールを選択してください
                    </p>
                </motion.header>

                {/* Tool Cards Grid */}
                <motion.div className="tools-gallery-grid" variants={itemVariants}>
                    {TOOLS.map((tool) => {
                        const IconComponent = tool.icon;
                        return (
                            <motion.button
                                key={tool.id}
                                className={`tool-card ${tool.isAiSuggested ? 'ai-suggested' : ''}`}
                                onClick={() => handleToolClick(tool.id)}
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="tool-card-icon">
                                    <IconComponent />
                                </div>
                                <h3 className="tool-card-title">{tool.title}</h3>
                                <p className="tool-card-description">{tool.description}</p>
                                <div className="tool-card-arrow">
                                    <ChevronRightIcon width={18} height={18} />
                                </div>
                            </motion.button>
                        );
                    })}
                </motion.div>
            </motion.div>

            {/* Wizard Overlay */}
            <CapabilityWizard
                isOpen={!!activeWizardId}
                onClose={() => setActiveWizardId(null)}
                scenarioData={activeWizardId ? WIZARD_SCENARIOS[activeWizardId] : null}
                onSubmit={handleWizardSubmit}
            />
        </div>
    );
};

export default ToolsGallery;
