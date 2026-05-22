/* src/components/Chat/AiMermaidStudio.jsx */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInput from './ChatInput';
import MermaidViewer from '../Artifacts/MermaidViewer'; // ★追加
import {
    ChevronLeft,
    GitBranch,
    MessageSquare,
    Database,
    Calendar,
    Cloud,
    Box,
    Activity,
    Sparkles,
    Map,
    GitMerge,
    PieChart,
    ListChecks,
    Layers
} from 'lucide-react';
import './AiSlideStudio.css'; // スタイルはAiSlideStudioを流用・拡張

const AiMermaidStudio = ({ onBack, onGenerate, mockMode, backendBApiKey, backendBApiUrl }) => {
    const [diagramType, setDiagramType] = useState('おまかせ');
    const [hoveredDiagramType, setHoveredDiagramType] = useState(null);

    // レイアウト方向
    const [direction, setDirection] = useState('TD'); // TD or LR

    // 制約事項
    const [selectedConstraints, setSelectedConstraints] = useState(['日本語ラベルを使用する']);
    const [customConstraints, setCustomConstraints] = useState('');

    // ChatInput用の状態
    const [searchSettings, setSearchSettings] = useState({
        webEnabled: false,
        ragEnabled: false,
        selectedStoreId: null,
        domainFilters: []
    });

    const diagramTypesConfig = {
        'おまかせ': {
            icon: <Sparkles size={20} />,
            desc: 'AIが最適解を判断',
            instruction: '入力された内容を分析し、最も適したMermaid図（フローチャート、シーケンス図、ER図、ガントチャートなど）を自動的に選択して生成してください。選んだ図タイプとその理由を簡潔に添えてから、Mermaidコードを出力してください。',
            sampleCode: null
        },
        'フローチャート': {
            icon: <GitBranch size={20} />,
            desc: '業務フロー・プロセス',
            instruction: `graph を使用してフローチャートを作成してください。
【文法ルール】
- 宣言: \`graph TD\`（上から下）または \`graph LR\`（左から右）で開始する。
- ノード形状: 処理=[角括弧]、判断={波括弧}、開始/終了=(丸括弧)、データベース=[(DBシリンダー)]、サブルーチン=[[二重角括弧]]。
- 矢印: \`-->\`（実線）、\`-.->\`（点線）、\`==>\`（太線）、\`-- ラベル -->\`（ラベル付き）。
- グループ: \`subgraph グループ名 ... end\` でノードをグループ化できる。
- 日本語ノードラベルは \`A["日本語テキスト"]\` のようにダブルクォートで囲む（記号・改行を含む場合は必須）。`,
            sampleCode: `graph TD
    A[開始] --> B{判定}
    B -- Yes --> C[完了]
    B -- No --> D[終了]`
        },
        'シーケンス図': {
            icon: <MessageSquare size={20} />,
            desc: 'API連携・通信フロー',
            instruction: `sequenceDiagram を使用して、システム間やアクター間のメッセージのやり取りを時系列で表現してください。
【文法ルール】
- \`participant 参加者名\` または \`actor 参加者名\` で参加者を宣言する。
- メッセージ: \`A->>B: 内容\`（実線矢印）、\`A-->>B: 内容\`（点線矢印）、\`A->>+B: 内容\` / \`B-->>-A: 結果\`（アクティベーション付き）。
- 条件分岐: \`alt 条件 ... else 代替 ... end\`。
- ループ: \`loop 説明 ... end\`。
- 並行: \`par ... and ... end\`。
- メモ: \`Note over A,B: 補足説明\` または \`Note right of A: 補足\`。`,
            sampleCode: `sequenceDiagram
    User->>App: 要求
    App->>API: 処理
    API-->>App: 結果
    App-->>User: 表示`
        },
        'ER図': {
            icon: <Database size={20} />,
            desc: 'データベース設計',
            instruction: `erDiagram を使用して、エンティティとその関係性を表現してください。
【文法ルール】
- エンティティ定義: \`エンティティ名 { データ型 カラム名 "制約(PK/FK/オプション)" }\`。
- 関係線: \`ENTITY1 関係記号 ENTITY2 : "ラベル"\`。
  - 関係記号の例: \`||--o{\`（一対多、必須-省略可）、\`}|--|{\`（多対多、必須）、\`||--||:\`（一対一）。
- ラベルは必ずダブルクォートで囲む。
- テーブル名・カラム名はアルファベット推奨（日本語はクォートが必要な場合がある）。`,
            sampleCode: `erDiagram
    USER ||--o{ ORDER : places
    USER {
        int id
        string name
    }
    ORDER {
        int id
        string status
    }`
        },
        'ガントチャート': {
            icon: <Calendar size={20} />,
            desc: 'スケジュール管理',
            instruction: `gantt を使用して、タスク、期間、依存関係を表現してください。
【文法ルール】
- 必ず \`title タイトル名\` と \`dateFormat YYYY-MM-DD\` を先頭に記述する。
- \`section セクション名\` でタスクをグループ化する。
- タスク書式: \`タスク名 : [状態,] [タスクID,] [開始日または "after タスクID",] 期間または終了日\`。
  - 状態: \`done\`（完了）、\`active\`（進行中）、\`crit\`（重要）、省略時は未着手。
  - マイルストーン: \`タスク名 : milestone, タスクID, 日付, 0d\`。
- 日付形式は必ず dateFormat で指定したフォーマットに揃える。`,
            sampleCode: `gantt
    title SaaS開発プロジェクトスケジュール
    dateFormat YYYY-MM-DD
    
    section Phase 1: 基盤構築
    要件定義           :done,    req1, 2025-01-01, 2025-01-15
    基本設計           :done,    design1, 2025-01-16, 2025-02-15
    インフラ構築       :active,  infra1, 2025-02-01, 2025-02-28
    
    section Phase 2: コア機能開発
    認証・認可実装     :         auth1, 2025-02-15, 2025-03-15
    テナント管理実装   :         tenant1, 2025-03-01, 2025-03-31
    ユーザー管理実装   :         user1, 2025-03-15, 2025-04-15
    
    section Phase 3: ビジネス機能
    プロジェクト機能   :         proj1, 2025-04-01, 2025-05-15
    タスク管理機能     :         task1, 2025-04-15, 2025-05-31
    レポート機能       :         report1, 2025-05-01, 2025-06-15
    
    section Phase 4: リリース準備
    統合テスト         :         test1, 2025-06-01, 2025-06-30
    セキュリティ監査   :         sec1, 2025-06-15, 2025-06-30
    本番環境構築       :         prod1, 2025-06-20, 2025-07-05
    
    section マイルストーン
    MVP完成           :milestone, m1, 2025-04-30, 0d
    β版リリース      :milestone, m2, 2025-06-30, 0d
    正式リリース      :milestone, m3, 2025-07-15, 0d`
        },
        'アーキテクチャ図': {
            icon: <Cloud size={20} />,
            desc: 'クラウド構成',
            instruction: `architecture-beta を使用して構成図を表現してください。
【文法ルール・制約】
- グループ: \`group グループID(アイコン名)[タイトル]\`、入れ子は \`in 親グループID\` を末尾に追加。
- サービス: \`service サービスID(アイコン名)[タイトル]\`、グループ内配置は \`in グループID\` を末尾に追加。
- 利用可能なアイコン: \`cloud\`, \`database\`, \`disk\`, \`internet\`, \`server\` のみ（その他は使用しない）。
- エッジ（接続線）: \`サービスID:方向 --> 方向:サービスID\`（例: \`web:R --> L:db\`）。方向は T(上), B(下), L(左), R(右)。
- ★重要★ ラベル \`[ ]\` の中には、改行・コロン(:)・括弧・スラッシュなどの記号を絶対に含めないこと。シンプルな単語または短い文字列のみ使用する。`,
            sampleCode: `architecture-beta
    group api(cloud)[API Layer]
    service web(internet)[Web] 
    service db(database)[DB] in api
    web:R --> L:db`
        },
        'クラス図': {
            icon: <Box size={20} />,
            desc: 'オブジェクト関係',
            instruction: `classDiagram を使用して、クラスの属性、メソッド、関係性を表現してください。
【文法ルール】
- クラス定義: \`class クラス名 { +型 属性名 +メソッド名() }\`。可視性: \`+\`(public), \`-\`(private), \`#\`(protected), \`~\`(package)。
- 継承: \`親クラス <|-- 子クラス\`。
- 実装: \`インタフェース <|.. 実装クラス\`。
- 集約: \`全体 o-- 部分\`（弱い所有）、コンポジション: \`全体 *-- 部分\`（強い所有）。
- 依存: \`クラスA ..> クラスB\`。
- 多重度: \`クラスA "1" --> "多" クラスB : 関連名\`。
- ジェネリクス: \`List~型~\` のように表記する。`,
            sampleCode: `classDiagram
    class User {
        +String name
        +login()
    }
    class Admin
    User <|-- Admin`
        },
        '状態遷移図': {
            icon: <Activity size={20} />,
            desc: '状態遷移',
            instruction: `stateDiagram-v2 を使用して、システムやプロセスの状態遷移を表現してください。
【文法ルール】
- 開始/終了状態: \`[*]\` を使用する（\`[*] --> 状態名\` で開始、\`状態名 --> [*]\` で終了）。
- 遷移: \`状態A --> 状態B: イベント/条件\`。
- 状態の詳細定義: \`state "説明付き状態名" as 状態ID\`。
- 複合状態（ネスト）: \`state 状態名 { ... }\` でサブ状態を内包できる。
- 並行状態: \`state 状態名 { 状態A \n -- \n 状態B }\`（\`--\` で区切る）。
- 日本語状態名に記号が含まれる場合は \`state "日本語名" as state1\` でエイリアスを使用する。`,
            sampleCode: `stateDiagram-v2
    [*] --> 処理中
    処理中 --> 完了
    処理中 --> エラー
    エラー --> 処理中
    完了 --> [*]`
        },
        'ジャーニーチャート': {
            icon: <Map size={20} />,
            desc: 'ユーザー体験の可視化',
            instruction: `journey を使用して、ユーザー体験の各ステップと満足度を表現してください。
【文法ルール】
- \`title タイトル名\` で図のタイトルを設定する。
- \`section セクション名\` でフェーズを区切る。
- ステップ書式: \`ステップ名: 満足度スコア(1〜5): 担当者1, 担当者2\`（担当者は複数可）。
- 満足度スコアは整数で 1（非常に低い）〜 5（非常に高い）の範囲で指定する。`,
            sampleCode: `journey
    title ユーザー旅行記
    section ログイン
      アカウント作成: 5: ユーザー
      初回ログイン: 5: ユーザー
    section 製品利用
      製品検索: 3: ユーザー
      カートに追加: 5: ユーザー`
        },
        'Gitグラフ': {
            icon: <GitMerge size={20} />,
            desc: 'ブランチと履歴',
            instruction: `gitGraph を使用して、Gitのブランチやコミット履歴を視覚化してください。
【文法ルール】
- \`commit\`: 現在のブランチにコミットを追加（\`commit id: "コミットID" tag: "タグ名" type: NORMAL|REVERSE|HIGHLIGHT\`）。
- \`branch ブランチ名\`: 新しいブランチを作成。
- \`checkout ブランチ名\`: ブランチを切り替え（\`git switch\` 相当）。
- \`merge ブランチ名\`: 現在のブランチに指定ブランチをマージ（\`merge ブランチ名 id: "マージコミットID" tag: "タグ"\`）。
- デフォルトブランチは \`main\`。別名にする場合は先頭に \`gitGraph LR:\` のように方向とデフォルトブランチを指定できる。`,
            sampleCode: `gitGraph
    commit
    branch develop
    checkout develop
    commit
    checkout main
    merge develop`
        },
        'パイチャート': {
            icon: <PieChart size={20} />,
            desc: 'データの比率・円グラフ',
            instruction: `pie を使用して、データの比率を円グラフで表現してください。
【文法ルール】
- 先頭に \`pie\`（オプションで \`pie showData\` とすると実数値も表示）と \`title タイトル名\` を記述する。
- 各セグメントは \`"ラベル名" : 数値\` の形式で定義する（ラベルは必ずダブルクォートで囲む）。
- 数値は実数（パーセンテージに換算される）または整数。合計が100になる必要はない（割合で自動計算される）。`,
            sampleCode: `pie
    title 言語別使用割合
    "JavaScript" : 45.2
    "Python" : 32.5
    "Java" : 10.3`
        },
        '要件図': {
            icon: <ListChecks size={20} />,
            desc: 'システム要件と関連',
            instruction: `requirementDiagram を使用して、システム要件とその関連性を表現してください。
【文法ルール・制約】
- 要件定義: \`requirement 要件ID { id: 識別子番号  text: "要件の説明文（必ずダブルクォートで囲む）"  risk: low|medium|high  verifymethod: analysis|inspection|test|demonstration }\`。
- 要素定義: \`element 要素ID { type: 要素の種別 }\`。★重要★ element ブロック内に \`text:\` 属性は存在しない（使用するとエラーになる）。必要なら \`docref: "参照文書名"\` を使用する。
- 関係記述: \`要素ID - 関係名 -> 要件ID\` の形式のみ使用する。★重要★ \`-->\` などの矢印記号は絶対に使用しない。
  - 使用可能な関係名: \`satisfies\`（満足）, \`relates\`（関連）, \`derives\`（派生）, \`refines\`（精緻化）, \`verifies\`（検証）, \`traces\`（追跡）, \`contains\`（包含）。
- 要件IDと要素IDの命名は英数字（例: R1, E1, req_login）のみ使用する。`,
            sampleCode: `requirementDiagram
    requirement auth_req {
        id: 1
        text: "認証機能を備える"
        risk: high
        verifymethod: test
    }
    element auth_system {
        type: system
    }
    auth_system - satisfies -> auth_req`
        },
        'C4図': {
            icon: <Layers size={20} />,
            desc: 'システムアーキテクチャ',
            instruction: `C4Context を使用して、システムのコンテキスト、コンテナ、コンポーネントを階層的に表現してください。
【文法ルール・制約】
- 利用可能な図タイプ: \`C4Context\`（コンテキスト図）、\`C4Container\`（コンテナ図）、\`C4Component\`（コンポーネント図）。
- 定義は必ず関数呼び出し形式を使用する（波括弧 { } によるブロック形式は使用しない）:
  - 人: \`Person(id, "名前", "説明")\` または \`Person_Ext(id, "名前", "説明")\`（外部ユーザー）
  - システム: \`System(id, "名前", "説明")\` または \`System_Ext(id, "名前", "説明")\`（外部システム）
  - コンテナ: \`Container(id, "名前", "技術", "説明")\`
  - コンポーネント: \`Component(id, "名前", "技術", "説明")\`
- 関係: \`Rel(送り元ID, 送り先ID, "説明")\` または \`Rel(送り元ID, 送り先ID, "説明", "技術")\`。★重要★ \`-->\` などの矢印は絶対に使用しない。
- タイトルは \`title タイトル名\` で記述する。
- バウンダリグループ: \`System_Boundary(id, "名前") { ... }\`（C4Container/C4Component で使用）。`,
            sampleCode: `C4Context
    title システムコンテキスト図
    Person(customer, "顧客", "システムを利用するユーザー")
    System(system, "予約システム", "予約を管理するシステム")
    Rel(customer, system, "予約の作成と管理")`
        }
    };
    const types = Object.keys(diagramTypesConfig);

    const constraintsList = [
        '日本語ラベルを使用する',
        'シンプルにまとめる',
        '詳細に記述する',
        '図の装飾(色付け)を提案する',
        '専門用語を避ける'
    ];

    const toggleConstraint = (c) => {
        setSelectedConstraints(prev =>
            prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]
        );
    };

    const handleGenerateFromInput = (text, files, options) => {
        if (!text.trim() && (!files || files.length === 0)) return;

        const currentType = diagramTypesConfig[diagramType];

        let directionInstruction = '';
        if (diagramType === 'フローチャート') {
            directionInstruction = `・レイアウト方向: ${direction === 'TD' ? '上から下 (graph TD)' : '左から右 (graph LR)'}\n`;
        } else if (diagramType === 'おまかせ') {
            directionInstruction = `・フローチャートを選択した場合の優先レイアウト: ${direction === 'TD' ? '上から下 (TD)' : '左から右 (LR)'}\n`;
        }

        const finalPrompt = `
# 指示
あなたは優秀なシステムエンジニア・ビジネスアナリストです。
以下の入力情報をもとに、情報を整理し、Mermaid記法で図表を出力してください。

# 描画要件
・指定図タイプ: ${diagramType}
・基本指示: ${currentType.instruction}
${directionInstruction}
# 制約事項
${selectedConstraints.map(c => `・${c}`).join('\n')}
${customConstraints ? `・${customConstraints}` : ''}

# 入力内容
${text}
        `.trim();

        // ChatAreaの onGenerate を呼ぶ (ここで ChatArea 側で artifact type などをよしなに設定してもらうか、ここでプロンプトだけ渡す)
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
                        <div className="studio-logo-badge" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                            Mermaid Diagram Engine
                        </div>
                        <h1 className="studio-title">AI 思考・業務整理</h1>
                        <p className="studio-subtitle">
                            テキストやファイルから、業務フローやシステム設計図を自動生成します。<br />
                            複雑なMermaid記法を覚える必要はありません。
                        </p>
                    </motion.div>

                    <ChatInput
                        isCentered={true}
                        onSendMessage={handleGenerateFromInput}
                        searchSettings={searchSettings}
                        setSearchSettings={setSearchSettings}
                        isLoading={false}
                        placeholder="整理したい業務内容やシステム構成を入力してください..."
                        mockMode={mockMode}
                        backendBApiKey={backendBApiKey}
                        backendBApiUrl={backendBApiUrl}
                    />
                </div>

                {/* チューニング・パネル */}
                <div className="studio-tuning-panel">
                    <div className="ai-slide-options-label" style={{ marginBottom: '12px' }}>図の種類</div>

                    {/* Mode Selector Cards */}
                    <div className="ai-slide-mode-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        {types.map(m => (
                            <button
                                key={m}
                                className={`ai-slide-mode-card ${diagramType === m ? 'active' : ''}`}
                                onClick={() => setDiagramType(m)}
                                onMouseEnter={() => setHoveredDiagramType(m)}
                                onMouseLeave={() => setHoveredDiagramType(null)}
                                style={{ padding: '12px', minHeight: 'auto', position: 'relative' }}
                            >
                                <div className="mode-card-icon" style={{ marginBottom: '8px' }}>{diagramTypesConfig[m].icon}</div>
                                <div className="mode-card-content" style={{ gap: '2px' }}>
                                    <div className="mode-card-title" style={{ fontSize: '13px' }}>{m}</div>
                                    <div className="mode-card-desc" style={{ fontSize: '11px' }}>{diagramTypesConfig[m].desc}</div>
                                </div>

                                {/* ホバーポップアッププレビュー */}
                                <AnimatePresence>
                                    {hoveredDiagramType === m && diagramTypesConfig[m].sampleCode && (
                                        <motion.div
                                            className="mermaid-hover-preview"
                                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 250,
                                                damping: 25,
                                                mass: 1
                                            }}
                                        >
                                            <div className="hover-preview-header">
                                                <span>サンプルイメージ ({m})</span>
                                            </div>
                                            <div className="hover-preview-body">
                                                <MermaidViewer chartCode={
                                                    m === 'フローチャート' && direction === 'LR'
                                                        ? diagramTypesConfig[m].sampleCode.replace('graph TD', 'graph LR')
                                                        : diagramTypesConfig[m].sampleCode
                                                } />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        ))}
                    </div>

                    {/* Options Chips & Input */}
                    <AnimatePresence>
                        {(diagramType === 'フローチャート' || diagramType === 'おまかせ') && (
                            <motion.div
                                className="ai-slide-options-group"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div className="ai-slide-options-label">フローチャートのレイアウト方向</div>
                                <div className="ai-slide-chips-row">
                                    <button
                                        className={`ai-slide-option-chip ${direction === 'TD' ? 'active' : ''}`}
                                        onClick={() => setDirection('TD')}
                                    >
                                        上から下 (TD)
                                    </button>
                                    <button
                                        className={`ai-slide-option-chip ${direction === 'LR' ? 'active' : ''}`}
                                        onClick={() => setDirection('LR')}
                                    >
                                        左から右 (LR)
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

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
                            placeholder="その他の要望（例：〇〇のシステムをメインに描いてほしい、〇〇色は避ける等）"
                            value={customConstraints}
                            onChange={(e) => setCustomConstraints(e.target.value)}
                        />
                    </div>


                </div>
            </main>
        </div>
    );
};

export default AiMermaidStudio;
