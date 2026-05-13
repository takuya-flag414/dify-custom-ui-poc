/* src/components/Chat/AiSlideStudio.jsx */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideRenderer from '../Artifacts/JsonSlide/SlideRenderer'; // ★追加
import '../Artifacts/JsonSlide/PresentationPanel.css'; // ★追加
import ChatInput from './ChatInput'; // ★追加: WelcomeScreen踏襲のため
import { 
    ChevronLeft, 
    Monitor, 
    Type, 
    Layout as LayoutIcon, 
    Users, 
    AlertCircle,
    Sparkles,
    FileText,
    Palette
} from 'lucide-react';
import './AiSlideStudio.css';

const AiSlideStudio = ({ onBack, onGenerate, mockMode, backendBApiKey, backendBApiUrl }) => {
    const [mode, setMode] = useState('ロジカル'); // ★初期値を新しい日本語名に変更
    const [volume, setVolume] = useState('10枚程度 (標準)');
    const [theme, setTheme] = useState('modern-indigo');
    const [target, setTarget] = useState('顧客・クライアント');
    const [customTarget, setCustomTarget] = useState('');
    const [selectedConstraints, setSelectedConstraints] = useState([]);
    const [customConstraints, setCustomConstraints] = useState('');
    
    // ChatInput用の状態
    const [searchSettings, setSearchSettings] = useState({
        webEnabled: false,
        ragEnabled: false,
        selectedStoreId: null,
        domainFilters: []
    });

    // モードの設定（アイコン、説明文、プロンプト指示）
    const modesConfig = {
        'ロジカル': {
            icon: <FileText size={20} />,
            desc: '論理的でビジネス向け。',
            instruction: 'ビジネスフレームワーク（PREP法等）を意識し、事実に基づいた論理的な構成にしてください。箇条書きを活用し、一目で論点が伝わるようにしてください。'
        },
        'クリエイティブ': {
            icon: <Palette size={20} />,
            desc: '企画やピッチに。',
            instruction: 'エモーショナルなキャッチコピーやストーリーテリングの手法を取り入れ、聴衆の印象に残る構成にしてください。シンプルでインパクトのある言葉選びをしてください。'
        },
        'おまかせ': {
            icon: <Sparkles size={20} />,
            desc: 'AIが最適解を判断。',
            instruction: '入力されたテーマの性質を分析し、ビジネス向けなら論理的に、提案ならクリエイティブに、最適な構成とトーンを自動的に選択してください。'
        }
    };
    const modes = Object.keys(modesConfig);
    const volumes = ['5枚程度 (短め)', '10枚程度 (標準)', '15枚以上 (詳細)'];
    const targets = ['顧客・クライアント', '役員・経営陣', '新入社員', '一般向け', 'その他'];
    
    // ★追加: 制約条件の選択肢
    const constraintsList = [
        '専門用語を避ける', 
        '具体例を盛り込む', 
        '図解・表を提案する', 
        '結論から述べる', 
        '3行以内でまとめる',
        '英語を併記する'
    ];

    const toggleConstraint = (c) => {
        setSelectedConstraints(prev => 
            prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]
        );
    };
    
    const themes = [
        { id: 'modern-indigo', name: 'Modern Indigo' },
        /* 他のテーマは一旦非表示
        { id: 'corporate-modern', name: 'Corporate Modern' },
        { id: 'creative-vibrant', name: 'Creative Vibrant (Coming Soon)', disabled: true },
        { id: 'elegant-minimal', name: 'Elegant Minimal (Coming Soon)', disabled: true },
        */
    ];

    // プレビュー用のサンプルデータ
    const sampleSlide = {
        layout_type: 'title_slide',
        content: {
            title: '次世代 AI プラットフォームの導入戦略',
            subtitle: '業務効率化と新規事業創出に向けたロードマップの策定',
            eyebrow: '2024 年度事業計画',
            tags: ['戦略', 'AI', 'DX推進'],
            author: '山田 太郎 / DX推進部長',
            logo_text: 'AI STRATEGY',
            date: '2024.05.20'
        }
    };

    const handleGenerateFromInput = (text, files, options) => {
        if (!text.trim() && (!files || files.length === 0)) return;

        const currentMode = modesConfig[mode];

        // プロンプトを組み立てる
        const finalPrompt = `
# 指示
あなたはプロフェッショナルな資料作成のエキスパートです。
以下のテーマと要件に基づいて、高品質なプレゼンテーションスライドの構成案を作成してください。

# プレゼン要件
・テーマ: ${text}
・スタイル方針: ${mode}
・具体的指示: ${currentMode.instruction}
・ターゲット: ${target === 'その他' ? customTarget : target}
・想定ボリューム: ${volume}
・適用デザインテーマ: ${theme}

# 制約事項
${selectedConstraints.map(c => `・${c}`).join('\n')}
${customConstraints ? `・${customConstraints}` : ''}
・各スライドの「タイトル」と「内容の要点（3-5点）」を箇条書きで明記してください。
・スライドの流れ（ストーリーライン）が論理的であることを確認してください。
・最終的にスライドとしてレンダリングするため、構造化された情報を出力してください。
        `.trim();

        // 呼び出し元へ生成リクエスト（ファイル、現在の検索設定、およびオプションを渡す）
        onGenerate(finalPrompt, files, { ...options, searchSettings });
    };

    return (
        <div className="ai-slide-studio-container">
            {/* Header */}
            <header className="ai-slide-studio-header">
                <div className="header-left">
                    <button className="ai-slide-back-button" onClick={onBack}>
                        <ChevronLeft size={20} />
                        <span>戻る</span>
                    </button>
                </div>

                <div className="header-right">
                    {/* 生成ボタンはChatInputへ移譲したため空に */}
                </div>
            </header>

            {/* Main Content (WelcomeScreen Style) */}
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
                            Slide Generation Engine
                        </div>
                        <h1 className="studio-title">AI スライドスタジオ</h1>
                        <p className="studio-subtitle">
                            トピックを入力するか、資料をアップロードして始めましょう。<br />
                            AI がプロフェッショナルな構成案を瞬時に作成します。
                        </p>
                    </motion.div>

                    <ChatInput 
                        isCentered={true}
                        onSendMessage={handleGenerateFromInput}
                        searchSettings={searchSettings}
                        setSearchSettings={setSearchSettings}
                        isLoading={false}
                        placeholder="どのようなスライドを作成しますか？トピックの入力や資料の添付をしてください..."
                        mockMode={mockMode}
                        backendBApiKey={backendBApiKey}
                        backendBApiUrl={backendBApiUrl}
                    />
                </div>

                {/* チューニング・パネル */}
                <div className="studio-tuning-panel">
                    {/* Mode Selector Cards */}
                <div className="ai-slide-mode-cards">
                    {modes.map(m => (
                        <button 
                            key={m} 
                            className={`ai-slide-mode-card ${mode === m ? 'active' : ''}`}
                            onClick={() => setMode(m)}
                        >
                            <div className="mode-card-icon">{modesConfig[m].icon}</div>
                            <div className="mode-card-content">
                                <div className="mode-card-title">{m}</div>
                                <div className="mode-card-desc">{modesConfig[m].desc}</div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Options Chips */}
                <div className="ai-slide-options-group">
                    <div className="ai-slide-options-label">ボリューム</div>
                    <div className="ai-slide-chips-row">
                        {volumes.map(v => (
                            <button 
                                key={v} 
                                className={`ai-slide-option-chip ${volume === v ? 'active' : ''}`}
                                onClick={() => setVolume(v)}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>


                <div className="ai-slide-options-group">
                    <div className="ai-slide-options-label">ターゲット</div>
                    <div className="ai-slide-chips-row">
                        {targets.map(t => (
                            <button 
                                key={t} 
                                className={`ai-slide-option-chip ${target === t ? 'active' : ''}`}
                                onClick={() => {
                                    setTarget(t);
                                    if (t !== 'その他') setCustomTarget('');
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    
                    <AnimatePresence>
                        {target === 'その他' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <input 
                                    className="ai-slide-custom-input"
                                    placeholder="その他の詳細なターゲット（例：IT部門の決裁者など）"
                                    value={customTarget}
                                    onChange={(e) => setCustomTarget(e.target.value)}
                                    autoFocus
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ★追加: 制約事項 */}
                <div className="ai-slide-options-group">
                    <div className="ai-slide-options-label">制約事項</div>
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
                        placeholder="その他の制約事項やこだわりを入力してください"
                        value={customConstraints}
                        onChange={(e) => setCustomConstraints(e.target.value)}
                    />
                </div>

                {/* Theme Selection Gallery */}
                <div className="ai-slide-themes-gallery">
                    <div className="ai-slide-options-label">デザインテーマを選択</div>
                    <div className="ai-slide-theme-grid">
                        {themes.map(t => (
                            <div 
                                key={t.id} 
                                className={`ai-slide-theme-card ${theme === t.id ? 'active' : ''} ${t.disabled ? 'disabled' : ''}`}
                                onClick={() => !t.disabled && setTheme(t.id)}
                            >
                                <div className="ai-slide-theme-preview-container">
                                    <div className="ai-slide-theme-scaler">
                                        {/* 実際のスライドをレンダリング */}
                                        <div className="presentation-panel" data-theme={t.id} data-palette="blue">
                                            <SlideRenderer 
                                                slide={sampleSlide} 
                                                themeId={t.id} 
                                                slideIndex={0} 
                                                totalSlides={1}
                                                isStatic={true}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="ai-slide-theme-info">
                                    <div className="ai-slide-theme-name">{t.name}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                </div> {/* End of studio-tuning-panel */}
            </main>
        </div>
    );
};

export default AiSlideStudio;
