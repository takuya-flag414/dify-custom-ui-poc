import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ChatInput from './ChatInput';
import { 
    ChevronLeft, 
    Monitor, 
    FileText, 
    Layout as LayoutIcon, 
    Sparkles,
    GitBranch,
    MessageSquare,
    Database,
    Calendar,
    Cloud,
    Box,
    Activity,
    GitMerge,
    Layers,
    Mail,
    AlignLeft,
    CheckSquare
} from 'lucide-react';
import './AiSlideStudio.css';
import { getArtifactColor } from '../../utils/artifactIconHelper';

// 16進数カラーコードをRGBのカンマ区切り文字列に変換する関数
const hexToRgb = (hex) => {
    if (!hex || !hex.startsWith('#')) return '255, 149, 0';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
};

// 16進数カラーコードの明度を一定割合下げたホバー用カラーを算出する関数
const darkenColor = (hex, percent) => {
    if (!hex || !hex.startsWith('#')) return '#e08400';
    const num = parseInt(hex.slice(1), 16),
          amt = Math.round(2.55 * percent),
          R = (num >> 16) - amt,
          G = (num >> 8 & 0x00FF) - amt,
          B = (num & 0x0000FF) - amt;
    const rOut = Math.max(0, Math.min(255, R));
    const gOut = Math.max(0, Math.min(255, G));
    const bOut = Math.max(0, Math.min(255, B));
    return "#" + (0x1000000 + rOut * 0x10000 + gOut * 0x100 + bOut).toString(16).slice(1);
};

const UniversalStudio = ({ type, onBack, onGenerate, mockMode, backendBApiKey, backendBApiUrl, sendKey = 'enter' }) => {
    // -------------------------
    // 共通ステート
    // -------------------------
    const [searchSettings, setSearchSettings] = useState({
        webEnabled: false,
        ragEnabled: false,
        selectedStoreId: null,
        domainFilters: []
    });
    const [selectedConstraints, setSelectedConstraints] = useState([]);
    const [customConstraints, setCustomConstraints] = useState('');

    // -------------------------
    // フォーマット固有のステート
    // -------------------------

    // --- Slide ---
    const [slideMode, setSlideMode] = useState('ロジカル');
    const [slideCount, setSlideCount] = useState(10);
    const [slideTarget, setSlideTarget] = useState('顧客・クライアント');
    const [slideExclusions, setSlideExclusions] = useState({ title: false, agenda: false, ending: false });

    // スライド除去の自動判定（枚数に基づいて算出）
    const autoExcludeTitle = slideCount <= 1;
    const autoExcludeAgenda = slideCount <= 3;
    const autoExcludeEnding = slideCount <= 3;
    const effectiveExclusions = {
        title: autoExcludeTitle || slideExclusions.title,
        agenda: autoExcludeAgenda || slideExclusions.agenda,
        ending: autoExcludeEnding || slideExclusions.ending,
    };

    // --- Document ---
    const [docTemplate, setDocTemplate] = useState('レポート・企画書');
    const [docTone, setDocTone] = useState('標準的・客観的');

    // --- Mermaid ---
    const [mermaidType, setMermaidType] = useState('おまかせ');

    // --- Drawio ---
    const [drawioType, setDrawioType] = useState('業務フロー');
    const [drawioTheme, setDrawioTheme] = useState('Kennedy');

    // --- Meeting Minutes 固有 ---
    const [minutesInputFormat, setMinutesInputFormat] = useState('メモ書き・箇条書き');
    const [minutesOutputStyle, setMinutesOutputStyle] = useState('標準');
    const [minutesNextActionFormat, setMinutesNextActionFormat] = useState('テーブル形式（担当/期日/優先度）');

    // --- Summary 固有 ---
    const [summaryRatio, setSummaryRatio] = useState('25%（標準）');
    const [summaryFocus, setSummaryFocus] = useState('キーメッセージ重視');
    const [summaryStructure, setSummaryStructure] = useState('サマリー＋詳細');

    // --- Comparison Table 固有 ---
    const [comparisonAxis, setComparisonAxis] = useState('AIが自動設定');
    const [comparisonEvalFormat, setComparisonEvalFormat] = useState('スコア（◎○△×）付き');
    const [comparisonTotal, setComparisonTotal] = useState('追加する');

    // --- Checklist 固有 ---
    const [checklistCategory, setChecklistCategory] = useState('フェーズ別（準備/実施/完了確認）');
    const [checklistPriority, setChecklistPriority] = useState('付ける（必須/推奨/オプション）');
    const [checklistFormat, setChecklistFormat] = useState('- [ ] Markdown形式');

    // --- FAQ 固有 ---
    const [faqAudience, setFaqAudience] = useState('混合（初級〜中級）');
    const [faqCount, setFaqCount] = useState('10問（標準）');
    const [faqStyle, setFaqStyle] = useState('ステップバイステップ（詳細）');

    // -------------------------
    // マスタデータ定義
    // -------------------------
    const studioConfig = {
        slide_creation: {
            title: 'AI プレゼンスライド',
            subtitle: 'テーマを入力するか、資料をアップロードしてください。McKinsey流のPyramid Principleに基づいた、説得力の高いスライドを自動構成します。',
            badge: 'Slide Generation Engine',
            artifactType: 'json_slide',
            artifactLabel: 'プレゼンスライド'
        },
        document_studio: {
            title: 'AI ドキュメントスタジオ',
            subtitle: 'トピックを入力するか、資料をアップロードしてください。コンサルティングファーム品質のプロフェッショナルな文書を作成します。',
            badge: 'Document Generation Engine',
            artifactType: 'json_document',
            artifactLabel: 'AIドキュメント'
        },
        mermaid_studio: {
            title: 'AI 構成・設計図',
            subtitle: '文法ガードレール付きで正確なMermaid図を自動生成します。システム構成・フロー・ER図・ガントチャートに対応。',
            badge: 'Mermaid Diagram Engine',
            artifactType: 'mermaid',
            artifactLabel: '設計・構成図'
        },
        drawio_studio: {
            title: 'AI 業務フロー・手順図',
            subtitle: 'BPMNエキスパートの思考でDrawio形式の業務フロー・システム構成図を自動生成します。',
            badge: 'Drawio Generation Engine',
            artifactType: 'drawio',
            artifactLabel: '業務フロー・手順図'
        },
        meeting_minutes: {
            title: 'AI 議事録',
            subtitle: '会議メモや文字起こしから、決定事項・Next Actionが明確な構造化議事録を自動生成します。',
            badge: 'Markdown Engine',
            artifactType: 'meeting_minutes',
            artifactLabel: '議事録'
        },
        summarize_text: {
            title: 'AI サマリーレポート',
            subtitle: '「So What?（だから何なのか）」を常に明示した、エグゼクティブレベルのサマリーを作成します。',
            badge: 'Markdown Engine',
            artifactType: 'summary_report',
            artifactLabel: 'サマリーレポート'
        },
        comparison_table: {
            title: 'AI 比較表作成',
            subtitle: '複数の要素を多角的に比較し、スコア付き・総合評価付きの意思決定支援表を作成します。',
            badge: 'Markdown Engine',
            artifactType: 'comparison_table',
            artifactLabel: '比較表'
        },
        checklist: {
            title: 'AI チェックリスト化',
            subtitle: 'PMO品質の「動詞＋目的語」形式で、フェーズ別・優先度付きの実践的チェックリストを生成します。',
            badge: 'Markdown Engine',
            artifactType: 'checklist',
            artifactLabel: 'チェックリスト'
        },
        faq_creation: {
            title: 'AI FAQ生成',
            subtitle: '「実際のユーザーの言葉」で問いを立て、結論ファーストの分かりやすいFAQを生成します。',
            badge: 'Markdown Engine',
            artifactType: 'faq',
            artifactLabel: 'FAQ'
        },
    };

    const currentConfig = studioConfig[type] || studioConfig.summarize_text;

    // --- Slide マスタ ---
    const slideModes = [
        { id: 'ロジカル', icon: <LayoutIcon size={20} />, desc: 'Pyramid Principle適用。結論→根拠→詳細のMECE構造で意思決定を加速させる' },
        { id: 'ストーリー型', icon: <Sparkles size={20} />, desc: '課題提示→共感→解決策→未来ビジョンの感情的ストーリーラインで聴衆を動かす' },
        { id: 'おまかせ', icon: <Monitor size={20} />, desc: 'AIがコンテンツを分析し、ロジカルとストーリーを最適な割合でブレンド' }
    ];
    const slideTargets = ['顧客・クライアント', '社内役員・経営陣', '一般社員・チーム', '一般消費者（BtoC）', '学生・初学者', '専門家・エンジニア'];
    const SLIDE_MARKS = [1, 5, 10, 15, 20, 25, 30];

    // --- Document マスタ ---
    const docTemplates = [
        { id: 'レポート・企画書', icon: <FileText size={20} />, desc: 'エグゼクティブサマリー必須。MECE分析と提言アクションを含む資料' },
        { id: 'ビジネスレター', icon: <Mail size={20} />, desc: '時候の挨拶・頭語/結語・敬語体系を厳守した社外向けフォーマルレター' },
        { id: '議事録・サマリー', icon: <CheckSquare size={20} />, desc: '決定事項/保留事項/Next Actionの3区分を必ず含む会議記録' }
    ];
    const docTones = ['標準的・客観的', '丁寧・フォーマル', '簡潔・ストレート', '学術的・論文調'];

    // --- Mermaid マスタ ---
    const mermaidTypes = [
        { id: 'おまかせ', icon: <Sparkles size={20} />, desc: 'AIが最適な図を自動選択' },
        { id: 'フローチャート', icon: <GitBranch size={20} />, desc: '業務の流れ・手順' },
        { id: 'シーケンス図', icon: <MessageSquare size={20} />, desc: 'システム間のやり取り' },
        { id: 'ER図', icon: <Database size={20} />, desc: 'テーブル設計・DB構造' },
        { id: 'ガントチャート', icon: <Calendar size={20} />, desc: 'スケジュール管理' },
        { id: 'アーキテクチャ図', icon: <Cloud size={20} />, desc: 'クラウド・インフラ構成' },
        { id: 'クラス図', icon: <Box size={20} />, desc: 'OOP設計・クラス関係' },
        { id: '状態遷移図', icon: <Activity size={20} />, desc: '状態の移り変わり' },
        { id: 'C4図', icon: <Layers size={20} />, desc: 'アーキテクチャ階層図' },
        { id: 'マインドマップ', icon: <GitMerge size={20} />, desc: 'アイデアの構造化' },
        { id: 'タイムライン', icon: <AlignLeft size={20} />, desc: '時系列・年表' },
    ];

    // --- Drawio マスタ ---
    const drawioTypes = [
        { id: '業務フロー', icon: <GitBranch size={20} />, desc: 'BPMN風の業務の流れ' },
        { id: 'システム構成', icon: <Cloud size={20} />, desc: 'インフラ・アーキテクチャ' },
        { id: 'ネットワーク図', icon: <Activity size={20} />, desc: 'ネットワーク構成・トポロジ' },
        { id: '組織図', icon: <Layers size={20} />, desc: '組織構造・レポートライン' },
        { id: 'BPMNフロー', icon: <GitMerge size={20} />, desc: 'BPMN標準記法のフロー' },
        { id: 'ER図', icon: <Database size={20} />, desc: 'データベース設計' },
    ];
    const drawioThemes = ['Kennedy', 'Simple', 'Dark', 'Sketch'];

    // --- 共通制約チップ ---
    const getConstraintsList = () => {
        if (type === 'slide_creation') return [
            '1スライド1メッセージを厳守する',
            '結論から述べる（Pyramid Principle）',
            '数値・データで根拠を示す',
            '専門用語を避け平易な言葉を使う',
        ];
        if (type === 'document_studio') return [
            '箇条書きと表を積極的に活用する',
            '専門用語を避け平易な言葉を使う',
            '曖昧な表現（〜かもしれない等）を排除する',
            '重複した記述を省く',
        ];
        if (type === 'mermaid_studio') return [
            '図の中のラベルをすべて日本語にする',
            'ノード数を15個以内に収める',
            '色分けで要素を区別する',
            '主要な要素のみに絞り込む',
        ];
        if (type === 'drawio_studio') return [
            'スイムレーンで役割を分類する',
            '判断分岐を明確にする',
            'シンプルなアイコンを使用する',
            'レイアウトを左→右の流れに統一する',
        ];
        return [
            '専門用語を避け平易な言葉を使う',
            '要点を太字で強調する',
            '箇条書きを積極的に使用する',
            '重複した記述を省く',
        ];
    };

    const toggleConstraint = (c) => {
        setSelectedConstraints(prev => prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]);
    };

    // スライドカウント変更（1〜30の範囲にクランプ）
    const handleSlideCountChange = (value) => {
        const num = Math.max(1, Math.min(30, parseInt(value) || 1));
        setSlideCount(num);
    };

    // -------------------------
    // プロンプト生成ロジック
    // -------------------------
    const handleGenerateFromInput = (text, files, options) => {
        if (!text.trim() && (!files || files.length === 0)) return;

        let finalPrompt = '';

        // =============================================
        // slide_creation プロンプト
        // =============================================
        if (type === 'slide_creation') {
            const exclusionNotes = [
                effectiveExclusions.title && '表紙スライドは不要',
                effectiveExclusions.agenda && 'アジェンダスライドは不要',
                effectiveExclusions.ending && '終了・まとめスライドは不要',
            ].filter(Boolean);

            const targetSpecific = {
                '顧客・クライアント': '- 課題解決のBefore/Afterを明確にする\n- ROI・投資対効果を数値で可視化する\n- 競合との差別化ポイントを具体的に示す',
                '社内役員・経営陣': '- エグゼクティブサマリーを先頭に配置する\n- 数値・KPI・リスク情報を最重視する\n- 意思決定に直結する情報のみに絞り込む',
                '専門家・エンジニア': '- 技術的詳細・アーキテクチャ・トレードオフを明示する\n- 前提条件と制約事項を明確にする\n- 代替案の比較を含める',
                '一般社員・チーム': '- 行動変容を促す実践的な内容にする\n- 専門用語は必ず平易な言葉で補足する\n- 具体的なNext Actionで締めくくる',
                '学生・初学者': '- 概念を段階的に積み上げる（簡単→複雑）\n- 例え話・身近なケースを多用する\n- 要点を繰り返して記憶に定着させる',
                '一般消費者（BtoC）': '- 専門的な知見を平易に表現する\n- 感情・共感に訴えかけるメッセージにする\n- シンプルで直感的なコンテンツにする',
            }[slideTarget] || '- ターゲットの関心事に合わせてコンテンツを最適化する';

            const modeInstruction = {
                'ロジカル': `【ロジカル（MECE構成）スタイル】
- 「1スライド1メッセージ」を厳守し、タイトルは結論を含むメッセージ型（動詞を含む断定文）にする
- 結論→根拠→詳細のPyramid Principleを維持する
- すべての主張にデータ・数値・事実を根拠として添える
- 感情的・装飾的な表現を一切排除する`,
                'ストーリー型': `【ストーリー型スタイル】
- 課題提示→共感の醸成→解決策の提示→未来ビジョンの感情的ストーリーラインを構築する
- 読み手が「自分ごと」として感じられるような問いかけを織り交ぜる
- ビジュアルイメージを喚起するタイトルを使う（比喩・問い形式も可）
- 数字よりも具体的なストーリーや事例でコンテンツを組み立てる`,
                'おまかせ': `【おまかせ（AIが最適化）スタイル】
- コンテンツの性質を分析し、ロジカルとストーリー型を最適な割合でブレンドする
- 論拠が必要な箇所はロジカルに、感情を動かしたい箇所はストーリー的に構成する
- テーマ全体として一つの説得力あるナラティブが成立するよう設計する`,
            }[slideMode];

            finalPrompt = `あなたはMcKinsey/BCGで10年以上の経験を持つシニアコンサルタント兼プレゼンテーションデザイナーです。Pyramid Principleを必ず適用し、MECE（漏れなく・ダブりなく）な情報構造で説得力の高いプレゼンテーションを設計してください。

## 思考プロセス（必ずこの順序で考えてから出力すること）
Step 1: テーマの核心メッセージ（Big Idea）を1文で定義する
Step 2: ターゲット（${slideTarget}）の関心事・懸念事項・判断基準を推測する
Step 3: Pyramid Principleに従い、結論→根拠→詳細のスライド構成を設計する
Step 4: 各スライドの「メッセージ型タイトル」と「コンテンツタイプ」を決定する
Step 5: 全体として一つの一貫したストーリーが成立するか検証する

## 作成要件
- テーマ・入力内容: ${text}
- 対象読者（ターゲット）: ${slideTarget}
- 作成スタイル: ${slideMode}
- スライド枚数: ${slideCount}枚
${exclusionNotes.length > 0 ? `- 除外スライド: ${exclusionNotes.join('、')}` : ''}

## スタイル指示
${modeInstruction}

## ターゲット層への重点事項
${targetSpecific}

## 品質基準・制約事項（必ず守ること）
- 1枚のスライドに主要メッセージを3つ以上詰め込まない
- 「〇〇について説明します」という説明型タイトルを使わない（必ずメッセージ型にする）
- 「素晴らしい」「画期的な」等の根拠のない形容詞を使わない
- スライドのタイトルは主語＋述語の完結した断定文で書く
${selectedConstraints.map(c => `- ${c}`).join('\n')}
${customConstraints ? `- ${customConstraints}` : ''}

## 出力形式
json_slideスキーマに従って出力してください。`.trim();

        // =============================================
        // document_studio プロンプト
        // =============================================
        } else if (type === 'document_studio') {
            const templateInstruction = {
                'レポート・企画書': '- エグゼクティブサマリーを冒頭に必ず配置する\n- MECE分析で情報を整理し、論理の飛躍をなくす\n- 文書末尾に具体的な提言・アクションプランを明示する\n- 見出し階層は最大3段階まで',
                'ビジネスレター': '- 時候の挨拶から始め、頭語（拝啓等）と結語（敬具等）を正確に使う\n- 敬語体系を統一する（謙譲語・丁寧語・尊敬語を混在させない）\n- 本文は「目的の明示→詳細説明→依頼・結び」の3構成にする\n- 1通のレターに複数の主題を混在させない',
                '議事録・サマリー': '- 会議概要（日時・参加者・目的・場所）を冒頭に記載する\n- アジェンダ別にサマリーをまとめる\n- 「決定事項」「保留・継続検討事項」「Next Action（担当者・期日付き）」の3区分を必ず設ける\n- 参加者の発言の意図を変えず、正確に要約する',
            }[docTemplate];

            const toneInstruction = {
                '標準的・客観的': '- 客観的な事実と論理に基づいて記述する\n- 個人的な感情・意見を混入させない\n- 中立的な語尾（「〜である」「〜と考えられる」）を使用する',
                '丁寧・フォーマル': '- 敬語（丁寧語）を一貫して使用する\n- 断定的な表現を避け、配慮のある表現を選ぶ\n- 読み手への敬意を文体全体で表現する',
                '簡潔・ストレート': '- 結論を最初に述べる\n- 1文を50文字以内に収める\n- 接続表現を最小限にし、箇条書きを多用する',
                '学術的・論文調': '- 客観的エビデンスに基づき記述する\n- 引用・参照を明示する（[出典: 〇〇]形式）\n- 仮説・主張・事実の区別を明確にする\n- 専門用語を正確に使用し、初出時に定義を説明する',
            }[docTone];

            finalPrompt = `あなたは大手コンサルティングファーム出身のシニアライターです。日本のビジネス文書の体裁・敬語体系・論理構造に精通し、読み手の期待を超えるプロフェッショナルな文書を作成してください。

## 思考プロセス（必ずこの順序で考えてから出力すること）
Step 1: 文書の目的と読み手の最大の関心事を明確化する
Step 2: 論理的な情報構造を設計する（見出し階層・段落構成をMECEで設計）
Step 3: ${docTone}のトーンに合わせた語彙・表現を選択する
Step 4: 自己検証する（主語述語の不一致・重複表現・曖昧表現を排除）

## 作成要件
- テーマ・入力内容: ${text}
- 文書テンプレート: ${docTemplate}
- トーン・文体: ${docTone}

## テンプレート別の詳細指示
${templateInstruction}

## トーン別の文体指示
${toneInstruction}

## 品質基準・制約事項（必ず守ること）
- 「〜だと思います」「〜かもしれません」等の曖昧な表現を排除する
- 同じ情報を重複して記載しない
- 1段落に複数の主題を混在させない
- 見出しは内容を正確に表す具体的なタイトルにする
${selectedConstraints.map(c => `- ${c}`).join('\n')}
${customConstraints ? `- ${customConstraints}` : ''}

## 出力形式
json_documentスキーマに従って出力してください。`.trim();

        // =============================================
        // mermaid_studio プロンプト
        // =============================================
        } else if (type === 'mermaid_studio') {
            const diagramGuardrail = {
                'おまかせ': '- 入力内容を分析し、最も適切なMermaid図の種類を自動選択する\n- 選択した図の種類を最初のコメント行（%%）で明示する',
                'フローチャート': '- graph TD（上から下）またはgraph LR（左から右）で開始する\n- 日本語を含むノードラベルは必ずダブルクォートで囲む（例: A["開始処理"]）\n- -->（実線）、-.->（点線）、==>（太線）、-- ラベル -->（ラベル付き）を使い分ける\n- 判断ノードは{波括弧}形式、開始/終了は(丸括弧)形式を使う',
                'シーケンス図': '- sequenceDiagramで開始し、すべての参加者をparticipantまたはactorで宣言する\n- ->>（実線矢印）、-->>（点線矢印）を使い分ける\n- activate/deactivateでアクティベーション期間を表現する',
                'ER図': '- erDiagramで開始する\n- 関係記法: ||--o{（1対多）、}|--|{（多対多）、||--||（1対1）\n- ラベルは必ず : "ラベル" とダブルクォートで記述する\n- 属性にはデータ型（string、int、date等）を必ず明示する',
                'ガントチャート': '- ganttで開始し、先頭にtitleとdateFormat YYYY-MM-DDを必ず記述する\n- sectionでフェーズ・チームを分類する\n- すべての日付をYYYY-MM-DD形式に揃える',
                'アーキテクチャ図': '- architecture-beta記法を使用する\n- service サービスID(アイコン)[タイトル]形式で定義する\n- 使用可能アイコン: cloud、database、disk、internet、server のみ\n- エッジ: サービスID:方向 --> 方向:サービスID（方向: T/B/L/R）',
                'クラス図': '- classDiagramで開始する\n- +（public）、-（private）、#（protected）の可視性を必ず付ける\n- ジェネリクスはList~型~ 形式で記述する\n- 継承: 親 <|-- 子、実装: インタフェース <|.. クラス',
                '状態遷移図': '- stateDiagram-v2で開始する\n- 開始・終了は[*]で表す\n- 日本語の状態名に記号が含まれる場合はstate "名前" as stateIDのエイリアスを使用する',
                'C4図': '- C4Context、C4Container、C4Componentのいずれかで開始する\n- Person(id, "名前", "説明")等の関数呼び出し形式のみ使用する\n- ★重要★ ブロック{ }形式は絶対に使用しない\n- 関係: Rel(送り元, 送り先, "説明")のみ使用し、-->は使わない',
                'マインドマップ': '- mindmapで開始する\n- rootで中心ノードを定義する\n- インデントで階層を表現する（最大4階層まで）',
                'タイムライン': '- timelineで開始する\n- titleでタイトルを設定する\n- sectionで大きな時代/フェーズを区切る\n- 各イベントは 時期 : イベント名 形式で記述する',
            }[mermaidType] || '- AIが最適な図の種類を選択し、正確な文法で出力する';

            finalPrompt = `あなたはエンタープライズシステムのアーキテクト兼Mermaid図表の専門家です。複雑な情報をMECEに整理し、文法的に正確で視覚的に分かりやすいMermaid図を生成してください。

## 思考プロセス（必ずこの順序で考えてから出力すること）
Step 1: 入力から主要な「エンティティ（要素）」と「関係性」を洗い出す
Step 2: 指定された図の種類（${mermaidType}）に最適なMermaid記法を決定する
Step 3: ノード数を5〜15個の適切な範囲に収め、超過する場合はsubgraphで整理する
Step 4: 日本語ラベルを含むすべてのノードをダブルクォートで囲む
Step 5: 文法エラーがないか自己検証してから出力する

## 描画要件
- 指定図タイプ: ${mermaidType}
- 入力内容: ${text}

## 図タイプ別の文法ガードレール
${diagramGuardrail}

## 共通の品質基準（必ず守ること）
- コードブロック（\`\`\`）で囲まずMermaidコードのみを出力する
- 日本語ラベルをダブルクォートなしで使用しない（必ず "日本語" と囲む）
- ノード数が20個を超えないようにする（超える場合はsubgraphで階層化）
- IDには英数字・アンダースコアのみを使用する（日本語IDは禁止）
${selectedConstraints.map(c => `- ${c}`).join('\n')}
${customConstraints ? `- ${customConstraints}` : ''}`.trim();

        // =============================================
        // drawio_studio プロンプト
        // =============================================
        } else if (type === 'drawio_studio') {
            const drawioTypeInstruction = {
                '業務フロー': '- swimLaneコンテナで部門・役割ごとにレーンを設ける\n- BPMN風の標準形状: 開始/終了(楕円)、処理(角丸四角)、判断(菱形)\n- 判断ノードにはYes/NoまたはOK/NGのラベル付き分岐矢印を配置する\n- 全体の流れを左→右に統一する',
                'システム構成': '- サービス・コンポーネントはroundedRectangleで表現する\n- データベースはshape=mxgraph.flowchart.databaseで表現する\n- 矢印の方向でデータフロー・依存関係を示し、プロトコルをラベルに明記する',
                'ネットワーク図': '- セキュリティゾーン（DMZ・内部NW・外部NW）をグループコンテナで区切る\n- IPアドレス帯やVLAN IDをノードラベルに含める\n- ファイアウォールには適切なネットワーク図形を使用する',
                '組織図': '- 上位→下位の階層構造を上から下に配置する\n- 各ノードに「役職名」と「氏名」を2行で表示する\n- レポートライン（正式）は実線、点線報告は点線矢印で表現する',
                'BPMNフロー': '- BPMN 2.0の標準記法に従う\n- Pool（プール）とLane（レーン）で組織・役割を区切る\n- イベント: 開始(細円)、終了(太円)、ゲートウェイ(菱形)で排他的分岐(X)・並行分岐(+)を使い分ける',
                'ER図': '- エンティティは四角形、属性は楕円で表現する\n- カーディナリティ（1:1、1:N、M:N）を関係線の両端に必ず明示する\n- 主キーには下線付きテキストを使用する',
            }[drawioType] || '- 指定された図タイプに適した形状・スタイルを選択して出力する';

            finalPrompt = `あなたはBPMNエキスパート兼エンタープライズアーキテクトです。mxGraph XML形式で正確かつ視覚的に分かりやすい${drawioType}を生成してください。

## 思考プロセス（必ずこの順序で考えてから出力すること）
Step 1: 入力から主要なプロセス・コンポーネント・関係者を特定する
Step 2: 役割分担がある場合はswimLane（スイムレーン）の構成を設計する
Step 3: 各要素に適切なmxGraph形状（shape）を割り当てる
Step 4: エッジ（矢印）のsource・target属性を正確に設定する
Step 5: 全体レイアウトが左→右または上→下の一方向の流れになるよう配置する

## 描画要件
- 指定図タイプ: ${drawioType}
- デザインテーマ: ${drawioTheme}
- 入力内容: ${text}

## 図タイプ別の詳細指示
${drawioTypeInstruction}

## mxGraph XML 品質基準（必ず守ること）
- すべての<mxCell>にid属性を付与し、一意の文字列にする（重複禁止）
- エッジのsource属性とtarget属性を必ず設定し、存在するidを参照する
- style属性はセミコロン区切りで正確に記述する（引用符を省略しない）
- geometry要素でx,y,width,heightを必ず指定する
${selectedConstraints.map(c => `- ${c}`).join('\n')}
${customConstraints ? `- ${customConstraints}` : ''}

## 出力形式
mxGraph XML（drawio形式）のみを出力してください。XMLの外側に説明文を付けないこと。`.trim();

        // =============================================
        // meeting_minutes プロンプト
        // =============================================
        } else if (type === 'meeting_minutes') {
            const naFormatStr = minutesNextActionFormat === 'テーブル形式（担当/期日/優先度）'
                ? '| # | アクション | 担当者 | 期日 | 優先度 |\n|---|---|---|---|---|\n| 1 | | | | 高/中/低 |'
                : '- [ ] アクション（担当者 / 期日 / 優先度: 高/中/低）';

            finalPrompt = `あなたは経営会議のベテランファシリテーター兼コンサルタントです。提供された情報から、意思決定・アクション管理に直結する構造化議事録を作成してください。

## 思考プロセス（必ずこの順序で考えてから出力すること）
Step 1: 入力テキストから会議の目的・議題・参加者情報を抽出する
Step 2: 各議題の議論内容をアジェンダ別に整理する
Step 3: 「決定事項」「保留・継続検討事項」「Next Action」を分類する
Step 4: Next Actionには担当者・期日・優先度を付与する
Step 5: 全体が一貫した記録として完結しているか検証する

## 作成要件
- 入力形式: ${minutesInputFormat}
- 出力スタイル: ${minutesOutputStyle}
- Next Action形式: ${minutesNextActionFormat}

## 必須出力構造（この順序で出力すること）
# 議事録
## 会議概要
- 日時: [入力から抽出、不明の場合は「要確認」]
- 参加者: [入力から抽出、不明の場合は「要確認」]
- 目的・テーマ:

## アジェンダ別サマリー
### [議題1]
### [議題2]

## 【決定事項】
（担当者または部門を必ず明記）

## 【保留・継続検討事項】
（理由と次回の検討予定を付記）

## 【Next Action】
${naFormatStr}

## 品質基準・制約事項（必ず守ること）
- 「〜かもしれません」「〜と思われます」等の憶測表現を排除する
- 参加者の発言の意図・内容を変えずに正確に要約する
- Next Actionには必ず担当者を特定する（「要検討」のままにしない）
- 決定事項と保留事項を混在させない
${selectedConstraints.map(c => `- ${c}`).join('\n')}
${customConstraints ? `- ${customConstraints}` : ''}

## 入力内容
${text}`.trim();

        // =============================================
        // summarize_text プロンプト
        // =============================================
        } else if (type === 'summarize_text') {
            const structureInstruction = {
                'エグゼクティブサマリーのみ': '核心メッセージを3行以内にまとめた「エグゼクティブサマリー」セクションのみを出力する',
                'サマリー＋詳細': '「エグゼクティブサマリー（3行以内）」と「キーポイント（5点以内の箇条書き）」の2セクションを出力する',
                'フル構造（示唆付き）': '「エグゼクティブサマリー」「キーポイント」「詳細説明」「示唆・Implication（原文から導き出せる洞察）」の4セクションを出力する',
            }[summaryStructure];

            const ratioText = summaryRatio === '10%（エッセンスのみ）' ? '上位10%' : summaryRatio === '25%（標準）' ? '上位25%程度' : '約50%';

            finalPrompt = `あなたはエグゼクティブコミュニケーションの専門家です。読み手が最短時間で本質を理解し、意思決定に活かせるサマリーを作成してください。

## 思考プロセス（必ずこの順序で考えてから出力すること）
Step 1: 入力文書全体を読み、最も重要な「So What?（だから何なのか）」を1文で特定する
Step 2: 重要度の高い情報を${ratioText}の情報量に圧縮する
Step 3: ${summaryFocus}の観点で情報の優先順位を決める
Step 4: 指定された出力構造に従って整理する

## 作成要件
- 要約比率: ${summaryRatio}（元文書に対する情報量の目安）
- 重点: ${summaryFocus}
- 出力構造: ${summaryStructure}

## 出力構造の指示
${structureInstruction}

## 品質原則（必ず守ること）
- 「So What?」を必ず明示する（「このことから〇〇が示唆される」等の形で）
- 数値・固有名詞・日付は原文から正確に引用し、改変しない
- 原文に存在しない情報・推測を追加しない（ハルシネーション防止）
- 「〜について述べられています」等のメタ表現を使わず、内容そのものを書く
${selectedConstraints.map(c => `- ${c}`).join('\n')}
${customConstraints ? `- ${customConstraints}` : ''}

## 入力内容
${text}`.trim();

        // =============================================
        // comparison_table プロンプト
        // =============================================
        } else if (type === 'comparison_table') {
            const axisInstruction = comparisonAxis === 'AIが自動設定'
                ? '比較の目的に最適な比較軸を設計する（定性軸と定量軸を明確に区別する）'
                : '入力内容に含まれる比較軸をそのまま使用する';

            const evalInstruction = {
                'スコア（◎○△×）付き': '◎（優れている）○（良い）△（やや劣る）×（劣る）の4段階スコアを使用する',
                'テキストのみ': '各セルにテキストのみで評価を記述する（スコアは付けない）',
                'スコア＋説明文': '各セルにスコア（◎○△×）と1〜2行の簡潔な説明文を記載する',
            }[comparisonEvalFormat];

            finalPrompt = `あなたは製品・サービス・技術の評価を専門とするシニアアナリストです。読み手が意思決定できるレベルの客観的・多角的な比較表を作成してください。

## 思考プロセス（必ずこの順序で考えてから出力すること）
Step 1: 比較対象の要素（製品・サービス・技術等）をすべて特定する
Step 2: ユーザーの意図（購入決定・技術選定・ベンダー評価等）を推測する
Step 3: ${axisInstruction}
Step 4: 各要素を各軸で評価し、${comparisonEvalFormat}で表現する
Step 5: ${comparisonTotal === '追加する' ? '総合評価コメントと推奨事項を追加する' : '比較表のみで出力する'}

## 作成要件
- 比較軸の設計: ${comparisonAxis}
- 評価形式: ${comparisonEvalFormat}
- 総合評価: ${comparisonTotal}

## 出力形式の指示
- マークダウンのテーブル形式で出力する
- ${evalInstruction}
${comparisonTotal === '追加する' ? '- 表の後に「## 総合評価」セクションを設け、各要素の推奨度と理由を記述する' : ''}

## 品質基準・制約事項（必ず守ること）
- マークダウンテーブルのセル内に改行を含めない（表崩れの原因になる）
- 比較対象が存在しない軸を作らない
- 主観的な感想・感情的な表現を排除し、客観的・事実ベースの評価にする
- 定性評価と定量評価を同一セルに混在させない
${selectedConstraints.map(c => `- ${c}`).join('\n')}
${customConstraints ? `- ${customConstraints}` : ''}

## 入力内容
${text}`.trim();

        // =============================================
        // checklist プロンプト
        // =============================================
        } else if (type === 'checklist') {
            finalPrompt = `あなたはPMO（プロジェクトマネジメントオフィス）のシニアマネージャーです。実際の現場で使える、検証可能で具体的なチェックリストを作成してください。

## 思考プロセス（必ずこの順序で考えてから出力すること）
Step 1: 入力内容から必要なチェック項目の全体像を把握する
Step 2: ${checklistCategory}で項目を分類する
Step 3: 各項目を「動詞＋目的語」の形式に統一する（「設定を確認」→「本番DBの接続文字列が.envに正しく設定されていることを確認する」）
Step 4: ${checklistPriority === '付ける（必須/推奨/オプション）' ? '各項目に優先度（必須/推奨/オプション）を付与する' : '優先度は付けずフラットなリストにする'}
Step 5: 曖昧な表現・複合項目がないか自己検証する

## 作成要件
- 分類方法: ${checklistCategory}
- 優先度表示: ${checklistPriority}
- チェック形式: ${checklistFormat}

## チェック項目の品質基準（必ず守ること）
- 各項目は「動詞＋目的語」の形式で書く（名詞節で終わらせない）
  × 悪い例: 「設定の確認」「バックアップ」
  ○ 良い例: 「本番環境の設定ファイルに正しい接続先が設定されていることを確認する」
- 「適切に」「しっかりと」「十分に」等の曖昧な表現を使わない
- 1項目に複数の確認事項を含めない（必要に応じて分割する）
- 各項目が「検証可能」であること（判断基準が明確であること）
${selectedConstraints.map(c => `- ${c}`).join('\n')}
${customConstraints ? `- ${customConstraints}` : ''}

## 入力内容
${text}`.trim();

        // =============================================
        // faq_creation プロンプト
        // =============================================
        } else if (type === 'faq_creation') {
            const audienceInstruction = {
                '初心者向け': '- 専門用語を一切使わずに説明する\n- 「なぜ」「どうして」から始まる疑問を重点的に取り上げる\n- 回答は短く・シンプルに（長い場合は箇条書きで段階的に）',
                '中級者向け': '- 基本的な概念の説明は省略し、中級者が詰まるポイントを重点的に取り上げる\n- 技術的な詳細・エッジケース・注意点を含める\n- ベストプラクティスやアンチパターンを含める',
                '混合（初級〜中級）': '- 初心者でも理解できるよう基本から説明しつつ、中級者にも価値のある詳細も含める\n- セクション分け（基本/応用）または難易度表示を付ける\n- 前提知識への案内も含める',
            }[faqAudience];

            const countInstruction = {
                '5問（重要度上位）': '最も重要度・頻度が高い5問に絞り込む',
                '10問（標準）': '重要度・頻度の高い順に10問を生成する',
                '20問（網羅的）': 'あらゆる角度から網羅的に20問を生成する（基本・応用・よくある誤解・注意点を含む）',
            }[faqCount];

            const styleInstruction = faqStyle === '結論ファースト（短め）'
                ? '- 回答は結論の1文から始め、必要最低限の補足のみを付ける\n- 1つの回答は5行以内に収める'
                : '- 「結論（1文）→ 理由（なぜそうなのか）→ 具体的な手順/例 → 補足・注意点」の順で書く\n- 手順がある場合は番号付きリストを使用する';

            finalPrompt = `あなたはカスタマーサポートの品質管理スペシャリストです。実際のユーザーが感じる疑問を的確に捉え、迷わず理解できるFAQを作成してください。

## 思考プロセス（必ずこの順序で考えてから出力すること）
Step 1: 入力内容を読み、ユーザーが疑問に感じそうなポイントを洗い出す
Step 2: ${countInstruction}
Step 3: 各質問を「実際のユーザーの言葉」で表現する（専門用語を避ける）
Step 4: 各回答を「結論→理由→具体的な手順・例→補足・注意点」の構造で書く
Step 5: よくある誤解がある場合は「注意」セクションを追加する

## 作成要件
- 想定読者: ${faqAudience}
- 生成件数: ${faqCount}
- 回答スタイル: ${faqStyle}

## 想定読者への対応指示
${audienceInstruction}

## 回答スタイルの指示
${styleInstruction}

## 出力形式
**Q. [質問文]**
A. [回答文]
（上記を繰り返す）

## 品質基準・制約事項（必ず守ること）
- 質問は自然な言葉で書く（「〇〇はどうすればいいですか？」等）
- 「はい、できます」のみで終わる回答を作らない
- 質問と回答が同じ内容の言い換えにならないようにする
- 専門用語をそのまま使って説明しない（初出時は必ず平易な言葉で補足する）
${selectedConstraints.map(c => `- ${c}`).join('\n')}
${customConstraints ? `- ${customConstraints}` : ''}

## 入力内容
${text}`.trim();
        }

        // ChatAreaの onGenerate を呼ぶ
        onGenerate(finalPrompt, files, { ...options, searchSettings }, {
            type: currentConfig.artifactType,
            label: currentConfig.artifactLabel
        });
    };

    // -------------------------
    // スライド枚数スライダーコンポーネント
    // -------------------------
    const SlideCountSlider = () => {
        const fillPercent = ((slideCount - 1) / 29) * 100;
        return (
            <div className="ai-slide-options-group">
                <div className="ai-slide-options-label">スライド枚数</div>
                <div style={{ padding: '0 4px' }}>
                    {/* カウント表示 & 手入力 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text-main)', lineHeight: 1 }}>
                            {slideCount}
                            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', marginLeft: '4px' }}>枚</span>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>直接入力</span>
                            <input
                                type="number"
                                min={1} max={30}
                                value={slideCount}
                                onChange={(e) => handleSlideCountChange(e.target.value)}
                                style={{
                                    width: '60px',
                                    padding: '5px 8px',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    border: '1.5px solid var(--color-border)',
                                    borderRadius: '8px',
                                    background: 'var(--color-bg-secondary)',
                                    color: 'var(--color-text-main)',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'textfield',
                                }}
                            />
                        </div>
                    </div>

                    {/* スライダー本体 */}
                    <input
                        type="range"
                        min={1} max={30} step={1}
                        value={slideCount}
                        onChange={(e) => handleSlideCountChange(e.target.value)}
                        style={{
                            width: '100%',
                            height: '4px',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            background: `linear-gradient(to right, var(--studio-primary) ${fillPercent}%, var(--color-border) ${fillPercent}%)`,
                            borderRadius: '4px',
                            outline: 'none',
                            cursor: 'pointer',
                        }}
                    />

                    {/* 目盛りボタン */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                        {SLIDE_MARKS.map(m => (
                            <button
                                key={m}
                                onClick={() => handleSlideCountChange(m)}
                                style={{
                                    fontSize: '11px',
                                    color: slideCount === m ? 'var(--studio-primary)' : 'var(--color-text-tertiary)',
                                    fontWeight: slideCount === m ? 700 : 400,
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '2px 4px',
                                    fontFamily: 'inherit',
                                    lineHeight: 1,
                                }}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 自動除外の警告メッセージ */}
                {slideCount <= 3 && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            padding: '10px 14px',
                            marginTop: '12px',
                            background: 'rgba(255, 159, 10, 0.1)',
                            border: '1px solid rgba(255, 159, 10, 0.35)',
                            borderRadius: '10px',
                            fontSize: '12px',
                            color: 'var(--color-text-secondary)',
                            lineHeight: 1.5,
                        }}
                    >
                        <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
                        <span>
                            {slideCount <= 1
                                ? '1枚のスライドでは表紙・アジェンダ・終了スライドはすべて不要なため、自動で省略されます。内容スライドの最大化に集中した構成になります。'
                                : `${slideCount}枚（3枚以下）のため、アジェンダと終了スライドは自動で省略されます。内容に集中したコンパクトな構成になります。`
                            }
                        </span>
                    </motion.div>
                )}
            </div>
        );
    };

    // スライド除去ボタンの定義
    const exclusionButtons = [
        { key: 'title', label: '表紙を除く', auto: autoExcludeTitle },
        { key: 'agenda', label: 'アジェンダを除く', auto: autoExcludeAgenda },
        { key: 'ending', label: '終了スライドを除く', auto: autoExcludeEnding },
    ];

    // -------------------------
    // 描画部
    // -------------------------
    const themeColor = getArtifactColor(currentConfig.artifactType);
    const themeColorRgb = hexToRgb(themeColor);
    const themeColorHover = darkenColor(themeColor, 10);

    return (
        <div 
            className="ai-slide-studio-container"
            style={{
                '--studio-primary': themeColor,
                '--studio-primary-rgb': themeColorRgb,
                '--studio-primary-hover': themeColorHover
            }}
        >
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
                        <div className="studio-logo-badge">
                            {currentConfig.badge}
                        </div>
                        <h1 className="studio-title">{currentConfig.title}</h1>
                        <p className="studio-subtitle">{currentConfig.subtitle}</p>
                    </motion.div>

                    <ChatInput 
                        isCentered={true}
                        onSendMessage={handleGenerateFromInput}
                        searchSettings={searchSettings}
                        setSearchSettings={setSearchSettings}
                        isLoading={false}
                        placeholder="どのような内容で作成しますか？"
                        mockMode={mockMode}
                        backendBApiKey={backendBApiKey}
                        backendBApiUrl={backendBApiUrl}
                        sendKey={sendKey}
                    />
                </div>

                <div className="studio-tuning-panel">

                    {/* ============================================================ */}
                    {/* Slide Tuning */}
                    {/* ============================================================ */}
                    {type === 'slide_creation' && (
                        <>
                            {/* 作成スタイル */}
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">作成スタイル</div>
                                <div className="ai-slide-mode-cards">
                                    {slideModes.map(m => (
                                        <button 
                                            key={m.id} 
                                            className={`ai-slide-mode-card ${slideMode === m.id ? 'active' : ''}`}
                                            onClick={() => setSlideMode(m.id)}
                                        >
                                            <div className="mode-card-icon">{m.icon}</div>
                                            <div className="mode-card-content">
                                                <div className="mode-card-title">{m.id}</div>
                                                <div className="mode-card-desc">{m.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ターゲット層 */}
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">ターゲット層（誰に向けた資料か）</div>
                                <div className="ai-slide-chips-row">
                                    {slideTargets.map(t => (
                                        <button 
                                            key={t} 
                                            className={`ai-slide-option-chip ${slideTarget === t ? 'active' : ''}`}
                                            onClick={() => setSlideTarget(t)}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* スライド枚数スライダー */}
                            <SlideCountSlider />

                            {/* スライド除外設定 */}
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">スライドの除外設定</div>
                                <div className="ai-slide-chips-row">
                                    {exclusionButtons.map(({ key, label, auto }) => (
                                        <button
                                            key={key}
                                            className={`ai-slide-option-chip ${(auto || slideExclusions[key]) ? 'active' : ''}`}
                                            onClick={() => {
                                                if (!auto) {
                                                    setSlideExclusions(prev => ({ ...prev, [key]: !prev[key] }));
                                                }
                                            }}
                                            disabled={auto}
                                            title={auto ? '枚数が少ないため自動で除外されています' : ''}
                                            style={auto ? { opacity: 0.65, cursor: 'not-allowed' } : {}}
                                        >
                                            {label}
                                            {auto && <span style={{ marginLeft: '5px', fontSize: '10px', opacity: 0.8 }}>（自動）</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ============================================================ */}
                    {/* Document Tuning */}
                    {/* ============================================================ */}
                    {type === 'document_studio' && (
                        <>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">文書テンプレート</div>
                                <div className="ai-slide-mode-cards">
                                    {docTemplates.map(t => (
                                        <button 
                                            key={t.id} 
                                            className={`ai-slide-mode-card ${docTemplate === t.id ? 'active' : ''}`}
                                            onClick={() => setDocTemplate(t.id)}
                                        >
                                            <div className="mode-card-icon">{t.icon}</div>
                                            <div className="mode-card-content">
                                                <div className="mode-card-title">{t.id}</div>
                                                <div className="mode-card-desc">{t.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">トーン・文体</div>
                                <div className="ai-slide-chips-row">
                                    {docTones.map(t => (
                                        <button 
                                            key={t} 
                                            className={`ai-slide-option-chip ${docTone === t ? 'active' : ''}`}
                                            onClick={() => setDocTone(t)}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ============================================================ */}
                    {/* Mermaid Tuning */}
                    {/* ============================================================ */}
                    {type === 'mermaid_studio' && (
                        <div className="ai-slide-options-group">
                            <div className="ai-slide-options-label">図の種類</div>
                            <div className="ai-slide-mode-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
                                {mermaidTypes.map(m => (
                                    <button 
                                        key={m.id} 
                                        className={`ai-slide-mode-card ${mermaidType === m.id ? 'active' : ''}`}
                                        onClick={() => setMermaidType(m.id)}
                                    >
                                        <div className="mode-card-icon">{m.icon}</div>
                                        <div className="mode-card-content">
                                            <div className="mode-card-title" style={{ fontSize: '13px' }}>{m.id}</div>
                                            <div className="mode-card-desc" style={{ fontSize: '11px' }}>{m.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* Drawio Tuning */}
                    {/* ============================================================ */}
                    {type === 'drawio_studio' && (
                        <>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">図の種類</div>
                                <div className="ai-slide-mode-cards">
                                    {drawioTypes.map(m => (
                                        <button 
                                            key={m.id} 
                                            className={`ai-slide-mode-card ${drawioType === m.id ? 'active' : ''}`}
                                            onClick={() => setDrawioType(m.id)}
                                        >
                                            <div className="mode-card-icon">{m.icon}</div>
                                            <div className="mode-card-content">
                                                <div className="mode-card-title">{m.id}</div>
                                                <div className="mode-card-desc">{m.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">デザインテーマ</div>
                                <div className="ai-slide-chips-row">
                                    {drawioThemes.map(t => (
                                        <button 
                                            key={t} 
                                            className={`ai-slide-option-chip ${drawioTheme === t ? 'active' : ''}`}
                                            onClick={() => setDrawioTheme(t)}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ============================================================ */}
                    {/* Meeting Minutes 固有 Tuning */}
                    {/* ============================================================ */}
                    {type === 'meeting_minutes' && (
                        <>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">入力形式</div>
                                <div className="ai-slide-chips-row">
                                    {['メモ書き・箇条書き', '会話テキスト（文字起こし）', '音声要約テキスト'].map(t => (
                                        <button key={t} className={`ai-slide-option-chip ${minutesInputFormat === t ? 'active' : ''}`} onClick={() => setMinutesInputFormat(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">出力スタイル</div>
                                <div className="ai-slide-chips-row">
                                    {['コンパクト（1ページ）', '標準', '詳細版'].map(t => (
                                        <button key={t} className={`ai-slide-option-chip ${minutesOutputStyle === t ? 'active' : ''}`} onClick={() => setMinutesOutputStyle(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">Next Action形式</div>
                                <div className="ai-slide-chips-row">
                                    {['テーブル形式（担当/期日/優先度）', '箇条書き'].map(t => (
                                        <button key={t} className={`ai-slide-option-chip ${minutesNextActionFormat === t ? 'active' : ''}`} onClick={() => setMinutesNextActionFormat(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ============================================================ */}
                    {/* Summary 固有 Tuning */}
                    {/* ============================================================ */}
                    {type === 'summarize_text' && (
                        <>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">要約比率（元文書に対する情報量）</div>
                                <div className="ai-slide-chips-row">
                                    {['10%（エッセンスのみ）', '25%（標準）', '50%（詳細保持）'].map(t => (
                                        <button key={t} className={`ai-slide-option-chip ${summaryRatio === t ? 'active' : ''}`} onClick={() => setSummaryRatio(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">重点</div>
                                <div className="ai-slide-chips-row">
                                    {['キーメッセージ重視', '数値・データ重視', 'アクション重視'].map(t => (
                                        <button key={t} className={`ai-slide-option-chip ${summaryFocus === t ? 'active' : ''}`} onClick={() => setSummaryFocus(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">出力構造</div>
                                <div className="ai-slide-chips-row">
                                    {['エグゼクティブサマリーのみ', 'サマリー＋詳細', 'フル構造（示唆付き）'].map(t => (
                                        <button key={t} className={`ai-slide-option-chip ${summaryStructure === t ? 'active' : ''}`} onClick={() => setSummaryStructure(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ============================================================ */}
                    {/* Comparison Table 固有 Tuning */}
                    {/* ============================================================ */}
                    {type === 'comparison_table' && (
                        <>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">比較軸の設計</div>
                                <div className="ai-slide-chips-row">
                                    {['AIが自動設定', '入力内容の軸を使用'].map(t => (
                                        <button key={t} className={`ai-slide-option-chip ${comparisonAxis === t ? 'active' : ''}`} onClick={() => setComparisonAxis(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">評価形式</div>
                                <div className="ai-slide-chips-row">
                                    {['スコア（◎○△×）付き', 'テキストのみ', 'スコア＋説明文'].map(t => (
                                        <button key={t} className={`ai-slide-option-chip ${comparisonEvalFormat === t ? 'active' : ''}`} onClick={() => setComparisonEvalFormat(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">総合評価・推奨事項</div>
                                <div className="ai-slide-chips-row">
                                    {['追加する', '追加しない'].map(t => (
                                        <button key={t} className={`ai-slide-option-chip ${comparisonTotal === t ? 'active' : ''}`} onClick={() => setComparisonTotal(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ============================================================ */}
                    {/* Checklist 固有 Tuning */}
                    {/* ============================================================ */}
                    {type === 'checklist' && (
                        <>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">分類方法</div>
                                <div className="ai-slide-chips-row">
                                    {['フェーズ別（準備/実施/完了確認）', 'カテゴリ別', '優先度別'].map(t => (
                                        <button key={t} className={`ai-slide-option-chip ${checklistCategory === t ? 'active' : ''}`} onClick={() => setChecklistCategory(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">優先度表示</div>
                                <div className="ai-slide-chips-row">
                                    {['付ける（必須/推奨/オプション）', '付けない'].map(t => (
                                        <button key={t} className={`ai-slide-option-chip ${checklistPriority === t ? 'active' : ''}`} onClick={() => setChecklistPriority(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">チェック形式</div>
                                <div className="ai-slide-chips-row">
                                    {['- [ ] Markdown形式', '番号付きリスト'].map(t => (
                                        <button key={t} className={`ai-slide-option-chip ${checklistFormat === t ? 'active' : ''}`} onClick={() => setChecklistFormat(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ============================================================ */}
                    {/* FAQ 固有 Tuning */}
                    {/* ============================================================ */}
                    {type === 'faq_creation' && (
                        <>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">想定読者</div>
                                <div className="ai-slide-chips-row">
                                    {['初心者向け', '中級者向け', '混合（初級〜中級）'].map(t => (
                                        <button key={t} className={`ai-slide-option-chip ${faqAudience === t ? 'active' : ''}`} onClick={() => setFaqAudience(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">生成件数</div>
                                <div className="ai-slide-chips-row">
                                    {['5問（重要度上位）', '10問（標準）', '20問（網羅的）'].map(t => (
                                        <button key={t} className={`ai-slide-option-chip ${faqCount === t ? 'active' : ''}`} onClick={() => setFaqCount(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="ai-slide-options-group">
                                <div className="ai-slide-options-label">回答スタイル</div>
                                <div className="ai-slide-chips-row">
                                    {['結論ファースト（短め）', 'ステップバイステップ（詳細）'].map(t => (
                                        <button key={t} className={`ai-slide-option-chip ${faqStyle === t ? 'active' : ''}`} onClick={() => setFaqStyle(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ============================================================ */}
                    {/* 共通の制約事項・カスタマイズ */}
                    {/* ============================================================ */}
                    <div className="ai-slide-options-group">
                        <div className="ai-slide-options-label">カスタマイズ・制約事項</div>
                        <div className="ai-slide-chips-row">
                            {getConstraintsList().map(c => (
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
                            placeholder="その他の要望（例：〇〇色をベースにしてほしい、〇〇の表現は避ける等）"
                            value={customConstraints}
                            onChange={(e) => setCustomConstraints(e.target.value)}
                        />
                    </div>

                </div>
            </main>
        </div>
    );
};

export default UniversalStudio;
