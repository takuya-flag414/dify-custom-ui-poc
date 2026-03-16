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
            setActiveTab('citations'); // Auto-switch tab if needed

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

    // Spring Animation Variants
    const panelVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            x: 20,
            transition: { duration: 0.2, ease: "easeOut" }
        },
        visible: {
            opacity: 1,
            scale: 1,
            x: 0,
            transition: { type: "spring", stiffness: 300, damping: 25 }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            x: 20,
            transition: { duration: 0.15 }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="inspector-container"
                    variants={panelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Glowing Border for Streaming Activity */}
                    {isStreaming && (
                        <div className="absolute inset-0 pointer-events-none rounded-[24px] overflow-hidden">
                            <motion.div
                                className="absolute inset-[-50%] w-[200%] h-[200%]"
                                style={{
                                    background: 'conic-gradient(from 0deg, #00FFFF, #FF00FF, #FFD60A, #007AFF, #00FFFF)',
                                    opacity: 0.3,
                                    filter: 'blur(20px)'
                                }}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            />
                        </div>
                    )}

                    <div className="inspector-panel">
                        {/* Header: Segmented Control */}
                        <div className="inspector-header">
                            <div className="inspector-segmented-control">
                                <button
                                    className={`inspector-segment-btn ${activeTab === 'thought' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('thought')}
                                >
                                    <Brain size={14} />
                                    <span>思考</span>
                                    {thinkingSteps.length > 0 && <span className="text-[10px] opacity-70">({thinkingSteps.length})</span>}
                                </button>
                                <button
                                    className={`inspector-segment-btn ${activeTab === 'citations' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('citations')}
                                >
                                    <FileText size={14} />
                                    <span>出典</span>
                                    {citations.length > 0 && <span className="text-[10px] opacity-70">({citations.length})</span>}
                                </button>
                                <button
                                    className={`inspector-segment-btn ${activeTab === 'artifacts' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('artifacts')}
                                >
                                    <Code size={14} />
                                    <span>成果物</span>
                                    {artifacts.length > 0 && <span className="text-[10px] opacity-70">({artifacts.length})</span>}
                                </button>
                            </div>
                            <button className="close-btn-floating" onClick={onClose} title="閉じる">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="inspector-content scrollbar-overlay">
                            <AnimatePresence mode="wait">
                                {activeTab === 'thought' && (
                                    <motion.div
                                        key="thought"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ThoughtTimeline steps={thinkingSteps} isStreaming={isStreaming} />
                                    </motion.div>
                                )}
                                {activeTab === 'citations' && (
                                    <motion.div
                                        key="citations"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <CitationsContent citations={citations} citationRefs={citationRefs} highlighted={highlighted} />
                                    </motion.div>
                                )}
                                {activeTab === 'artifacts' && (
                                    <motion.div
                                        key="artifacts"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ArtifactsContent artifacts={artifacts} activeArtifact={activeArtifact} onSelect={onArtifactSelect} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- Thought Timeline ---
const ThoughtTimeline = ({ steps, isStreaming }) => {
    if (!steps || steps.length === 0) {
        return (
            <div className="inspector-empty">
                <Brain size={48} className="inspector-empty-icon" />
                <div className="inspector-empty-text">思考プロセス待機中...</div>
            </div>
        );
    }

    // Scroll to bottom on new step
    const bottomRef = useRef(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [steps.length, isStreaming]);

    return (
        <div className="timeline-container">
            {/* The continuous line background */}
            <div className="timeline-line"></div>

            {steps.map((step, index) => {
                const isError = step.status === 'error';
                const hasDetail = step.thinking || step.resultValue || step.errorMessage || (step.additionalResults && step.additionalResults.length > 0);

                return (
                    <motion.div
                        key={step.id || index}
                        className="timeline-item"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        {/* Status Node */}
                        <div className={`timeline-node ${step.status}`}>
                            {step.status === 'done' ? (
                                <CheckIcon />
                            ) : step.status === 'processing' ? (
                                <SpinnerIcon />
                            ) : isError ? (
                                <div className="text-red-500 font-bold">!</div>
                            ) : (
                                <div className="w-2 h-2 rounded-full bg-current opacity-50" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="timeline-content-box">
                            <div className="timeline-title">{step.title}</div>

                            {/* Detailed Content */}
                            {hasDetail && (step.status === 'done' || step.status === 'error' || step.status === 'processing') && (() => {
                                // ★出し分けロジック
                                // 1. 判定・戦略系ノードは internalLog を優先し、思考は非表示にする
                                const isStrategicNode = step.title?.includes('判定') || step.title?.includes('戦略');
                                const showLog = isStrategicNode && step.internalLog;
                                const showThinking = !isStrategicNode && step.thinking;

                                return (
                                    <div className={`timeline-details ${isError ? 'error' : ''}`}>
                                        {/* Error Message */}
                                        {isError && step.errorMessage && (
                                            <div className="timeline-detail-row error">
                                                <span className="timeline-detail-icon">⚠️</span>
                                                <span className="timeline-detail-text">{step.errorMessage}</span>
                                            </div>
                                        )}

                                        {/* Internal Log (Exclusive for Strategic Nodes) */}
                                        {showLog && (
                                            <div className="timeline-detail-row log">
                                                <span className="timeline-detail-icon">📋</span>
                                                <span className="timeline-detail-text">{step.internalLog}</span>
                                            </div>
                                        )}

                                        {/* Thinking Monologue (Exclusive for Synthesis/Other Nodes) */}
                                        {showThinking && !isError && (
                                            <div className="timeline-detail-row thinking">
                                                <span className="timeline-detail-icon">🧠</span>
                                                <span className="timeline-detail-text">{step.thinking}</span>
                                            </div>
                                        )}

                                        {/* Main Result (Always show if exists) */}
                                        {step.resultLabel && step.resultValue && !isError && (
                                            <div className="timeline-detail-row result">
                                                <span className="timeline-detail-label">{step.resultLabel}:</span>
                                                <span className="timeline-detail-value">{step.resultValue}</span>
                                            </div>
                                        )}

                                        {/* Additional Results (Always show if exists) */}
                                        {step.additionalResults && !isError && step.additionalResults.map((result, i) => (
                                            <div key={i} className="timeline-detail-row result">
                                                <span className="timeline-detail-label">{result.label}:</span>
                                                <span className="timeline-detail-value">{result.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}

                            {step.timestamp && (
                                <div className="timeline-meta">{step.timestamp}</div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
};

// --- Reusing Citations and Artifacts content just with new styles applied via CSS ---
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
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const SpinnerIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-spin">
        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
);

export default InspectorPanel;
