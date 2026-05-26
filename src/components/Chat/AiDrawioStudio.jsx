/* src/components/Chat/AiDrawioStudio.jsx */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInput from './ChatInput';
import {
    ChevronLeft,
    Workflow,
    Network,
    GitBranch,
    Briefcase,
    Settings,
    FileText
} from 'lucide-react';
import './AiSlideStudio.css'; // スタイルはAiSlideStudioを流用・拡張

const AiDrawioStudio = ({ onBack, onGenerate, mockMode, backendBApiKey, backendBApiUrl, sendKey = 'enter' }) => {
    // カスタマイズ状態
    const [flowTarget, setFlowTarget] = useState('汎用・その他');
    const [detailLevel, setDetailLevel] = useState('標準（一般的な粒度）');
    const [selectedConstraints, setSelectedConstraints] = useState(['使用するシステム・ツール名をステップ内に明記する']);
    const [customConstraints, setCustomConstraints] = useState('');

    // ChatInput用の状態
    const [searchSettings, setSearchSettings] = useState({
        webEnabled: false,
        ragEnabled: false,
        selectedStoreId: null,
        domainFilters: []
    });

    const flowTargetsConfig = [
        { name: '汎用・その他', icon: <Workflow size={20} /> },
        { name: '経理・財務', icon: <Briefcase size={20} /> },
        { name: '人事・総務', icon: <FileText size={20} /> },
        { name: 'IT・システム', icon: <Settings size={20} /> },
        { name: '営業・マーケ', icon: <Network size={20} /> }
    ];

    const detailLevels = [
        '大まか（概要レベル）',
        '標準（一般的な粒度）',
        '詳細（例外処理も含む）'
    ];

    const constraintsList = [
        '外部関係者（顧客やベンダー等）のレーンも含める',
        '使用するシステム・ツール名をステップ内に明記する',
        '意思決定（条件分岐）の条件を詳細に記述する',
        '承認やダブルチェックのステップを明記する',
        '自動化（RPA等）と手作業のプロセスを区別する'
    ];

    const toggleConstraint = (c) => {
        setSelectedConstraints(prev =>
            prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]
        );
    };

    const handleGenerateFromInput = (text, files, options) => {
        if (!text.trim() && (!files || files.length === 0)) return;

        const finalPrompt = `
# 指示
あなたは優秀なビジネスアナリスト・システムコンサルタントです。
以下の入力情報をもとに、業務プロセスを整理し、Draw.ioで読み込み可能なXML形式（mxGraphModel）の業務フロー図を出力してください。

# 描画要件
・必ずスイムレーン（担当部署・担当者別の水平レーン）を用いてプロセスを整理・分割してください。
・対象領域: ${flowTarget}
・詳細度: ${detailLevel}

# 制約事項
${selectedConstraints.map(c => `・${c}`).join('\n')}
${customConstraints ? `・${customConstraints}` : ''}

# 入力内容
${text}
        `.trim();

        // ChatAreaの onGenerate を呼ぶ
        onGenerate(finalPrompt, files, { ...options, searchSettings });
    };

    return (
        <div className="ai-slide-studio-container studio-drawio">
            {/* Header */}
            <header className="ai-slide-studio-header">
                <div className="header-left">
                    <button className="ai-slide-back-button" onClick={onBack}>
                        <ChevronLeft size={20} />
                        <span>戻る</span>
                    </button>
                </div>
                <div className="header-right"></div>
            </header>

            {/* Main Content */}
            <main className="studio-inner">
                {/* ヒーロー・入力エリア */}
                <div className="ai-slide-studio-hero">
                    <motion.div
                        className="studio-welcome-text"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="studio-logo-badge">
                            Draw.io XML Generator
                        </div>
                        <h1 className="studio-title">AI 業務フロー・手順図</h1>
                        <p className="studio-subtitle">
                            普段のメモや業務の手順書から、無料の図解ツール「Draw.io（ドロー・アイオー）」で編集できる業務フロー図を自動で作成します。<br />
                            「誰が」「どの順番で」作業を行うのか、複雑な業務の流れもすっきり整理して図解できます。
                        </p>
                    </motion.div>

                    <ChatInput
                        isCentered={true}
                        onSendMessage={handleGenerateFromInput}
                        searchSettings={searchSettings}
                        setSearchSettings={setSearchSettings}
                        isLoading={false}
                        placeholder="可視化したい業務プロセスや手順を入力してください..."
                        mockMode={mockMode}
                        backendBApiKey={backendBApiKey}
                        backendBApiUrl={backendBApiUrl}
                        sendKey={sendKey}
                    />
                </div>

                {/* チューニング・パネル */}
                <div className="studio-tuning-panel">
                    <div className="ai-slide-options-label" style={{ marginBottom: '12px' }}>対象領域</div>

                    {/* Target Selector Cards */}
                    <div className="ai-slide-mode-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                        {flowTargetsConfig.map(target => (
                            <button
                                key={target.name}
                                className={`ai-slide-mode-card ${flowTarget === target.name ? 'active' : ''}`}
                                onClick={() => setFlowTarget(target.name)}
                                style={{ padding: '12px', minHeight: 'auto' }}
                            >
                                <div className="mode-card-icon" style={{ marginBottom: '8px' }}>{target.icon}</div>
                                <div className="mode-card-title" style={{ fontSize: '13px' }}>{target.name}</div>
                            </button>
                        ))}
                    </div>

                    <div className="ai-slide-options-group" style={{ marginTop: '24px' }}>
                        <div className="ai-slide-options-label">粒度・詳細度</div>
                        <div className="ai-slide-chips-row">
                            {detailLevels.map(level => (
                                <button
                                    key={level}
                                    className={`ai-slide-option-chip ${detailLevel === level ? 'active' : ''}`}
                                    onClick={() => setDetailLevel(level)}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 制約事項 */}
                    <div className="ai-slide-options-group">
                        <div className="ai-slide-options-label">カスタマイズ・制約事項</div>
                        <div className="ai-slide-chips-row">
                            {constraintsList.map(c => (
                                <button
                                    key={c}
                                    className={`ai-slide-option-chip ${selectedConstraints.includes(c) ? 'active' : ''}`}
                                    onClick={() => toggleConstraint(c)}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                        <textarea
                            className="ai-slide-custom-textarea"
                            placeholder="その他の要望（例：承認者は必ずマネージャーとする、〇〇システムへの入力処理を含める等）"
                            value={customConstraints}
                            onChange={(e) => setCustomConstraints(e.target.value)}
                        />
                    </div>

                </div>
            </main>
        </div>
    );
};

export default AiDrawioStudio;
