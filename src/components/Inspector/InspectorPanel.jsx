// src/components/Inspector/InspectorPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, FileText, Code, ExternalLink } from 'lucide-react';
import { SourceIcon } from '../Shared/FileIcons';
import './InspectorPanel.css';

/**
 * InspectorPanel - Context Layer (Right Panel)
 * DESIGN_RULE.md v3.0 準拠
 * - Glass Sandwich: bg-layer-1/80, backdrop-blur-macos
 * - High Density: text-admin-body (13px)
 * - タブ: 思考 / 出典 / 成果物
 */

const TABS = [
    { id: 'thought', label: '思考', icon: Brain },
    { id: 'citations', label: '出典', icon: FileText },
    { id: 'artifacts', label: '成果物', icon: Code },
];

const InspectorPanel = ({
    isOpen,
    onClose,
    // 思考プロセスデータ
    thinkingSteps = [],
    isStreaming = false,
    // 出典データ
    citations = [],
    messageId,
    // 成果物データ
    artifacts = [],
    activeArtifact,
    onArtifactSelect,
    // 外部から指定されたタブ・ハイライト
    initialTab,
    highlightedCitationIndex,
}) => {
    const [activeTab, setActiveTab] = useState(initialTab || 'thought');
    const [highlighted, setHighlighted] = useState(null);
    const citationRefs = useRef({});

    // 外部からのタブ指定に対応
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    // Citation ハイライト＆スクロール
    useEffect(() => {
        if (highlightedCitationIndex != null) {
            setHighlighted(highlightedCitationIndex);
            setActiveTab('citations');

            // スクロール
            setTimeout(() => {
                const ref = citationRefs.current[highlightedCitationIndex];
                if (ref) {
                    ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);

            // ハイライト解除
            const timer = setTimeout(() => setHighlighted(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [highlightedCitationIndex]);

    // カスタムイベントリスナー（Citation クリック連携）
    useEffect(() => {
        const handleOpenCitation = (e) => {
            const { citationIndex } = e.detail || {};
            if (citationIndex != null) {
                setActiveTab('citations');
                setHighlighted(citationIndex);

                setTimeout(() => {
                    const ref = citationRefs.current[citationIndex];
                    if (ref) {
                        ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);

                setTimeout(() => setHighlighted(null), 3000);
            }
        };

        window.addEventListener('openInspectorCitation', handleOpenCitation);
        return () => window.removeEventListener('openInspectorCitation', handleOpenCitation);
    }, []);

    // タブごとのバッジ数
    const getTabCount = (tabId) => {
        switch (tabId) {
            case 'thought': return thinkingSteps.length;
            case 'citations': return citations.length;
            case 'artifacts': return artifacts.length;
            default: return 0;
        }
    };

    return (
        <div className="inspector-panel bg-bg-layer-1/80 backdrop-blur-macos backdrop-saturate-vibrant border-l border-white/10">
            {/* Header */}
            <div className="inspector-header">
                <div className="inspector-title">
                    <span>詳細情報</span>
                </div>
                <button className="inspector-close-btn" onClick={onClose} title="閉じる">
                    <X size={16} />
                </button>
            </div>

            {/* Tabs */}
            <div className="inspector-tabs">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const count = getTabCount(tab.id);
                    return (
                        <button
                            key={tab.id}
                            className={`inspector-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon size={14} />
                            <span>{tab.label}</span>
                            {count > 0 && (
                                <span className="inspector-tab-badge">{count}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="inspector-content scrollbar-overlay">
                <AnimatePresence mode="wait">
                    {activeTab === 'thought' && (
                        <motion.div
                            key="thought"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ThoughtContent steps={thinkingSteps} isStreaming={isStreaming} />
                        </motion.div>
                    )}

                    {activeTab === 'citations' && (
                        <motion.div
                            key="citations"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CitationsContent
                                citations={citations}
                                highlighted={highlighted}
                                citationRefs={citationRefs}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'artifacts' && (
                        <motion.div
                            key="artifacts"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ArtifactsContent
                                artifacts={artifacts}
                                activeArtifact={activeArtifact}
                                onSelect={onArtifactSelect}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// --- Thought Content ---
const ThoughtContent = ({ steps, isStreaming }) => {
    if (!steps || steps.length === 0) {
        return (
            <div className="inspector-empty">
                <Brain size={48} className="inspector-empty-icon" />
                <div className="inspector-empty-text">
                    思考プロセスはまだありません
                </div>
            </div>
        );
    }

    return (
        <div className="inspector-section">
            <div className="inspector-section-header">
                思考プロセス {isStreaming && '(処理中...)'}
            </div>
            {steps.map((step, index) => (
                <div key={step.id || index} className="inspector-thought-step">
                    <div className={`inspector-thought-icon ${step.status}`}>
                        {step.status === 'done' ? (
                            <CheckIcon />
                        ) : step.status === 'processing' ? (
                            <SpinnerIcon />
                        ) : (
                            <CircleIcon />
                        )}
                    </div>
                    <div className="inspector-thought-content">
                        <div className="inspector-thought-title">{step.title}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Citations Content ---
const CitationsContent = ({ citations, highlighted, citationRefs }) => {
    if (!citations || citations.length === 0) {
        return (
            <div className="inspector-empty">
                <FileText size={48} className="inspector-empty-icon" />
                <div className="inspector-empty-text">
                    出典情報はまだありません
                </div>
            </div>
        );
    }

    // グループ分け
    const groups = {
        web: { label: 'WEB', items: [] },
        rag: { label: '社内ナレッジ', items: [] },
        document: { label: '添付ファイル', items: [] },
    };

    citations.forEach((cite, index) => {
        const originalIndex = index + 1;
        const itemWithIndex = { ...cite, originalIndex };
        let type = cite.type || 'document';
        if (type === 'dataset') type = 'rag';
        if (groups[type]) {
            groups[type].items.push(itemWithIndex);
        } else {
            groups['document'].items.push(itemWithIndex);
        }
    });

    const groupOrder = ['web', 'rag', 'document'];

    return (
        <>
            {groupOrder.map(groupKey => {
                const group = groups[groupKey];
                if (group.items.length === 0) return null;

                return (
                    <div key={groupKey} className="inspector-section">
                        <div className="inspector-section-header">{group.label}</div>
                        {group.items.map((cite) => (
                            <div
                                key={cite.originalIndex}
                                ref={(el) => (citationRefs.current[cite.originalIndex] = el)}
                                className={`inspector-citation-item ${highlighted === cite.originalIndex ? 'highlighted' : ''}`}
                                onClick={() => cite.url && window.open(cite.url, '_blank')}
                            >
                                <div className="inspector-citation-badge">
                                    {cite.originalIndex}
                                </div>
                                <div className="inspector-citation-content">
                                    <div className="inspector-citation-source" title={cite.source}>
                                        {cite.source.replace(/^\[\d+\]\s*/, '')}
                                    </div>
                                    {cite.url && (
                                        <div className="inspector-citation-url">{cite.url}</div>
                                    )}
                                </div>
                                {cite.url && <ExternalLink size={12} style={{ opacity: 0.5 }} />}
                            </div>
                        ))}
                    </div>
                );
            })}
        </>
    );
};

// --- Artifacts Content ---
const ArtifactsContent = ({ artifacts, activeArtifact, onSelect }) => {
    if (!artifacts || artifacts.length === 0) {
        return (
            <div className="inspector-empty">
                <Code size={48} className="inspector-empty-icon" />
                <div className="inspector-empty-text">
                    成果物はまだありません
                </div>
            </div>
        );
    }

    return (
        <div className="inspector-section">
            <div className="inspector-section-header">生成された成果物</div>
            {artifacts.map((artifact, index) => (
                <div
                    key={artifact.id || index}
                    className={`inspector-artifact-item ${activeArtifact?.id === artifact.id ? 'active' : ''}`}
                    onClick={() => onSelect && onSelect(artifact)}
                >
                    <div className="inspector-artifact-icon">
                        <Code size={16} />
                    </div>
                    <div className="inspector-artifact-info">
                        <div className="inspector-artifact-title">
                            {artifact.title || 'Untitled'}
                        </div>
                        <div className="inspector-artifact-type">
                            {artifact.type || 'MARKDOWN'}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Helper Icons ---
const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const SpinnerIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
);

const CircleIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="4" />
    </svg>
);

export default InspectorPanel;
