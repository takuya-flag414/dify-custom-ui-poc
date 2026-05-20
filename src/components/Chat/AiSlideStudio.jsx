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
    // ★ボリューム指定タイプ: 'fuzzy' (ざっくり) | 'strict' (厳格)
    const [volumeType, setVolumeType] = useState('fuzzy');
    const [fuzzyVolume, setFuzzyVolume] = useState('10枚程度 (標準)');
    const [strictVolume, setStrictVolume] = useState(10);
    const [theme, setTheme] = useState('modern-indigo');
    const [target, setTarget] = useState('顧客・クライアント');
    const [customTarget, setCustomTarget] = useState('');
    const [selectedConstraints, setSelectedConstraints] = useState([]);
    const [customConstraints, setCustomConstraints] = useState('');
    
    // ★ユーザー手動設定の除外スライド
    const [manualExcludeTitle, setManualExcludeTitle] = useState(false);
    const [manualExcludeAgenda, setManualExcludeAgenda] = useState(false);
    const [manualExcludeEnding, setManualExcludeEnding] = useState(false);

    // ★1〜2枚指定時の強制除外判定 (UIとプロンプト用)
    const isStrictLowVolume = volumeType === 'strict' && strictVolume <= 2;
    const excludeTitle = isStrictLowVolume ? true : manualExcludeTitle;
    const excludeAgenda = isStrictLowVolume ? true : manualExcludeAgenda;
    const excludeEnding = isStrictLowVolume ? true : manualExcludeEnding;
    
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

        // ★追加: ボリューム指定タイプに応じたプロンプト指示の動的変更
        const volumeText = volumeType === 'fuzzy'
            ? `${fuzzyVolume}`
            : `目標枚数: ${strictVolume} 枚（極力この枚数に近づけてください）`;

        const volumeInstruction = volumeType === 'fuzzy'
            ? `・スライド全体の構成ボリュームは「${fuzzyVolume}」を目安にしてください。内容の論理性やバランスに応じて、AIが最適な枚数に微調整して構いません。`
            : `・【目標】生成するプレゼンテーションスライドの総数は、極力【${strictVolume}枚】前後になるように構成してください。
・構成テーマのボリュームに応じて、可能な限りこの指定枚数に近づくようスライドの分割やまとめ方を調整してください。`;

        // ★追加: スライド構成の除外指示の組み立て
        const exclusions = [];
        if (excludeTitle) {
            exclusions.push('・【表紙不要】1枚目のタイトル（表紙）スライドは作成せず、直接コンテンツ本編スライドから開始してください。');
        }
        if (excludeAgenda) {
            exclusions.push('・【目次不要】アジェンダや目次、全体の流れを説明するスライドは作成しないでください。');
        }
        if (excludeEnding) {
            exclusions.push('・【終了スライド不要】「ご清聴ありがとうございました」や「Q&A」等の締めくくりのスライドは作成しないでください。');
        }
        const exclusionsText = exclusions.length > 0
            ? `\n# スライド構成の除外指示\n${exclusions.join('\n')}`
            : '';

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
・想定ボリューム: ${volumeText}
・適用デザインテーマ: ${theme}

# 制約事項
${selectedConstraints.map(c => `・${c}`).join('\n')}
${customConstraints ? `・${customConstraints}` : ''}
${volumeInstruction}
${exclusionsText}
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

                {/* Options Chips & Input */}
                <div className="ai-slide-options-group">
                    <div className="ai-slide-options-label">ボリューム</div>
                    
                    {/* ボリューム指定方式の切り替えトグル */}
                    <div className="ai-slide-volume-toggle-group">
                        <button 
                            className={`ai-slide-volume-toggle-btn ${volumeType === 'fuzzy' ? 'active' : ''}`}
                            onClick={() => setVolumeType('fuzzy')}
                        >
                            ざっくり指定
                        </button>
                        <button 
                            className={`ai-slide-volume-toggle-btn ${volumeType === 'strict' ? 'active' : ''}`}
                            onClick={() => setVolumeType('strict')}
                        >
                            目標枚数を数値で指定
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {volumeType === 'fuzzy' ? (
                            <motion.div 
                                key="fuzzy-selector"
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.2 }}
                                className="ai-slide-chips-row"
                            >
                                {volumes.map(v => (
                                    <button 
                                        key={v} 
                                        className={`ai-slide-option-chip ${fuzzyVolume === v ? 'active' : ''}`}
                                        onClick={() => setFuzzyVolume(v)}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="strict-selector"
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.2 }}
                                className="ai-slide-strict-row"
                            >
                                <span className="ai-slide-strict-label">作成するスライドの枚数:</span>
                                <div className="ai-slide-number-stepper">
                                    <button 
                                        type="button"
                                        className="stepper-btn"
                                        onClick={() => setStrictVolume(prev => Math.max(1, prev - 1))}
                                        disabled={strictVolume <= 1}
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="number"
                                        className="stepper-input"
                                        min="1"
                                        max="30"
                                        value={strictVolume}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            if (!isNaN(val)) {
                                                setStrictVolume(Math.min(30, Math.max(1, val)));
                                            }
                                        }}
                                    />
                                    <button 
                                        type="button"
                                        className="stepper-btn"
                                        onClick={() => setStrictVolume(prev => Math.min(30, prev + 1))}
                                        disabled={strictVolume >= 30}
                                    >
                                        +
                                    </button>
                                </div>
                                <span className="ai-slide-strict-unit">枚</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
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

                {/* ★追加: 除外スライドオプション */}
                <div className="ai-slide-options-group">
                    <div className="ai-slide-options-label">含めないスライド（除外設定）</div>
                    <div className="ai-slide-chips-row">
                        <button 
                            className={`ai-slide-option-chip exclude-chip ${excludeTitle ? 'active' : ''}`}
                            onClick={() => setManualExcludeTitle(!manualExcludeTitle)}
                            disabled={isStrictLowVolume}
                            title={isStrictLowVolume ? "1〜2枚の目標指定時は自動的に表紙が除外されます" : ""}
                        >
                            表紙 (タイトル) 不要 {isStrictLowVolume && " (必須)"}
                        </button>
                        <button 
                            className={`ai-slide-option-chip exclude-chip ${excludeAgenda ? 'active' : ''}`}
                            onClick={() => setManualExcludeAgenda(!manualExcludeAgenda)}
                            disabled={isStrictLowVolume}
                            title={isStrictLowVolume ? "1〜2枚の目標指定時は自動的にアジェンダが除外されます" : ""}
                        >
                            アジェンダ (目次) 不要 {isStrictLowVolume && " (必須)"}
                        </button>
                        <button 
                            className={`ai-slide-option-chip exclude-chip ${excludeEnding ? 'active' : ''}`}
                            onClick={() => setManualExcludeEnding(!manualExcludeEnding)}
                            disabled={isStrictLowVolume}
                            title={isStrictLowVolume ? "1〜2枚の目標指定時は自動的に終了スライドが除外されます" : ""}
                        >
                            終了・Q&A不要 {isStrictLowVolume && " (必須)"}
                        </button>
                    </div>

                    {/* ★追加: ロック時のフレンドリーな理由説明 */}
                    <AnimatePresence>
                        {isStrictLowVolume && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="ai-slide-options-notice"
                                style={{ overflow: 'hidden' }}
                            >
                                💡 目標スライド数が 1〜2 枚の場合、本編スライドの内容を十分に確保するため、表紙やアジェンダ（目次）などのスライドは自動的に除外（不要にロック）されます。
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
