/* src/components/Chat/AiDocumentStudio.jsx */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInput from './ChatInput';
import { 
    ChevronLeft, 
    FileText, 
    Mail, 
    MessageSquare, 
    PenTool, 
    AlignLeft, 
    CheckSquare
} from 'lucide-react';
import './AiSlideStudio.css'; // UIの基本構造はSlideStudioを流用

const AiDocumentStudio = ({ onBack, onGenerate, mockMode, backendBApiKey, backendBApiUrl, sendKey = 'enter' }) => {
    // テンプレート(Mode)
    const [template, setTemplate] = useState('レポート・企画書');
    // トーン(文体)
    const [tone, setTone] = useState('標準的・客観的');
    // ボリューム
    const [volume, setVolume] = useState('A4 1枚程度 (要点のみ)');
    // 制約事項
    const [selectedConstraints, setSelectedConstraints] = useState([]);
    const [customConstraints, setCustomConstraints] = useState('');

    const [searchSettings, setSearchSettings] = useState({
        webEnabled: false,
        ragEnabled: false,
        selectedStoreId: null,
        domainFilters: []
    });

    const templatesConfig = {
        'レポート・企画書': {
            icon: <FileText size={20} />,
            desc: '社内向けや一般的な資料用。',
            internalTemplate: 'report',
            instruction: '見出し（H1/H2）、箇条書き、表などを活用し、論理的な構成でわかりやすく整理してください。'
        },
        'ビジネスレター': {
            icon: <Mail size={20} />,
            desc: '社外向けのフォーマルな手紙。',
            internalTemplate: 'letter',
            instruction: '宛名、差出人、時候の挨拶、頭語・結語を必ず含め、フォーマルな白黒基調のレター形式としてください。'
        },
        '議事録・サマリー': {
            icon: <CheckSquare size={20} />,
            desc: '会議の要約や決定事項の整理。',
            internalTemplate: 'report',
            instruction: '会議の目的、決定事項、Next Action（担当者と期限）を明確に分離し、簡潔にまとめてください。'
        }
    };
    const templates = Object.keys(templatesConfig);

    const tonesConfig = {
        '標準的・客観的': '事実を淡々と述べるビジネスの基本トーンで記述してください。',
        '丁寧・フォーマル': '顧客や目上の方に向けた、より丁寧な敬語・謙譲語を用いたトーンで記述してください。',
        '簡潔・ストレート': '回りくどい表現を避け、結論から端的に伝えるトーンで記述してください。'
    };
    const tones = Object.keys(tonesConfig);

    const volumes = ['A4 1枚程度 (要点のみ)', 'A4 数枚 (詳細に記述)'];

    const constraintsList = [
        '専門用語を避ける', 
        '表(テーブル)を用いて整理する', 
        '結論から述べる(PREP法)', 
        '具体的な数値や例を補足する',
        '箇条書きを多用する'
    ];

    const toggleConstraint = (c) => {
        setSelectedConstraints(prev => 
            prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]
        );
    };

    const handleGenerateFromInput = (text, files, options) => {
        if (!text.trim() && (!files || files.length === 0)) return;

        const currentTemplate = templatesConfig[template];
        const currentTone = tonesConfig[tone];

        const finalPrompt = `
# 指示
あなたはプロフェッショナルな文書作成のエキスパートです。
以下のテーマと要件に基づいてビジネスドキュメントを作成し、指定のJSONスキーマ（json_document）で出力してください。

# 文書要件
・テーマ: ${text}
・文書形式: ${template}
・トーン: ${tone}
・想定ボリューム: ${volume}

# 制約事項
${selectedConstraints.map(c => `・${c}`).join('\n')}
${customConstraints ? `・${customConstraints}` : ''}

# 形式特有の指示
・${currentTone}
・${currentTemplate.instruction}
・メタデータの \`template\` フィールドには必ず \`"${currentTemplate.internalTemplate}"\` を指定してください。
        `.trim();

        // ChatAreaのonGenerateを呼ぶ (ChatArea側で activeArtifact を json_document に設定)
        onGenerate(finalPrompt, files, { ...options, searchSettings });
    };

    return (
        <div className="ai-slide-studio-container">
            <header className="ai-slide-studio-header">
                <div className="header-left">
                    <button className="ai-slide-back-button" onClick={onBack}>
                        <ChevronLeft size={20} />
                        <span>戻る</span>
                    </button>
                </div>
                <div className="header-right"></div>
            </header>

            <main className="studio-inner">
                <div className="ai-slide-studio-hero">
                    <motion.div 
                        className="studio-welcome-text"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="studio-logo-badge" style={{ background: 'linear-gradient(135deg, #0A84FF 0%, #0056b3 100%)', color: '#ffffff' }}>
                            Document Generation Engine
                        </div>
                        <h1 className="studio-title">AI ドキュメントスタジオ</h1>
                        <p className="studio-subtitle">
                            トピックを入力するか、資料をアップロードしてください。<br />
                            AI が指定された形式に合わせたプロフェッショナルな文書を作成します。
                        </p>
                    </motion.div>

                    <ChatInput 
                        isCentered={true}
                        onSendMessage={handleGenerateFromInput}
                        searchSettings={searchSettings}
                        setSearchSettings={setSearchSettings}
                        isLoading={false}
                        placeholder="どのようなドキュメントを作成しますか？ (例: 新商品発表のお知らせ)"
                        mockMode={mockMode}
                        backendBApiKey={backendBApiKey}
                        backendBApiUrl={backendBApiUrl}
                        sendKey={sendKey}
                    />
                </div>

                <div className="studio-tuning-panel">
                    {/* Template Selector */}
                    <div className="ai-slide-options-group">
                        <div className="ai-slide-options-label">文書テンプレート</div>
                        <div className="ai-slide-mode-cards">
                            {templates.map(t => (
                                <button 
                                    key={t} 
                                    className={`ai-slide-mode-card ${template === t ? 'active' : ''}`}
                                    onClick={() => setTemplate(t)}
                                    style={template === t ? { borderColor: '#0A84FF', backgroundColor: 'rgba(10, 132, 255, 0.05)' } : {}}
                                >
                                    <div className="mode-card-icon">{templatesConfig[t].icon}</div>
                                    <div className="mode-card-content">
                                        <div className="mode-card-title">{t}</div>
                                        <div className="mode-card-desc">{templatesConfig[t].desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tone Selector */}
                    <div className="ai-slide-options-group">
                        <div className="ai-slide-options-label">トーン・文体</div>
                        <div className="ai-slide-chips-row">
                            {tones.map(t => (
                                <button 
                                    key={t} 
                                    className={`ai-slide-option-chip ${tone === t ? 'active' : ''}`}
                                    onClick={() => setTone(t)}
                                    style={tone === t ? { borderColor: '#0A84FF', color: '#0056b3', backgroundColor: 'rgba(10, 132, 255, 0.08)' } : {}}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Volume Selector */}
                    <div className="ai-slide-options-group">
                        <div className="ai-slide-options-label">ボリューム</div>
                        <div className="ai-slide-chips-row">
                            {volumes.map(v => (
                                <button 
                                    key={v} 
                                    className={`ai-slide-option-chip ${volume === v ? 'active' : ''}`}
                                    onClick={() => setVolume(v)}
                                    style={volume === v ? { borderColor: '#0A84FF', color: '#0056b3', backgroundColor: 'rgba(10, 132, 255, 0.08)' } : {}}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Constraints Selector */}
                    <div className="ai-slide-options-group">
                        <div className="ai-slide-options-label">制約事項・こだわり</div>
                        <div className="ai-slide-chips-row">
                            {constraintsList.map(c => (
                                <button 
                                    key={c} 
                                    className={`ai-slide-option-chip ${selectedConstraints.includes(c) ? 'active' : ''}`}
                                    onClick={() => toggleConstraint(c)}
                                    style={selectedConstraints.includes(c) ? { borderColor: '#0A84FF', color: '#0056b3', backgroundColor: 'rgba(10, 132, 255, 0.08)' } : {}}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                        <textarea 
                            className="ai-slide-custom-textarea"
                            placeholder="その他の制約事項や記載してほしい内容（例：必ず株式会社〇〇への言及を含めること）"
                            value={customConstraints}
                            onChange={(e) => setCustomConstraints(e.target.value)}
                            style={{ focusBorderColor: '#0A84FF' }}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AiDocumentStudio;
