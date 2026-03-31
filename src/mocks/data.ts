// src/mocks/data.ts

/**
 * FEモード検証用のモックデータ定義 (全8パターン網羅版)
 * Updated: 2025-12-25
 */

/**
 * Smart Action タイプの型定義
 */
export type SmartActionType = 'retry_mode' | 'suggested_question' | 'web_search' | 'deep_dive' | 'navigate';

/**
 * Smart Action の型定義
 */
export interface SmartAction {
    type: SmartActionType;
    label: string;
    icon: string;
    payload: Record<string, unknown>;
}

/**
 * 引用の種類
 */
export type CitationType = 'web' | 'rag' | 'document';

/**
 * 引用情報の型定義
 */
export interface Citation {
    id: string;
    type: CitationType;
    source: string;
    url: string | null;
}

/**
 * 会話アイテムの型定義
 */
export interface ConversationItem {
    id: string;
    name: string;
}

/**
 * メッセージの型定義
 */
export interface MockMessage {
    id: string;
    role: 'user' | 'ai';
    text: string;
    rawContent?: string;
    timestamp?: string;
    files?: unknown[];
    citations?: Citation[];
    suggestions?: string[];
    isStreaming?: boolean;
    traceMode?: string;
    thoughtProcess?: unknown[];
    artifact?: {
        artifact_title: string;
        artifact_type: string;
        artifact_content: string;
        citations?: Citation[];
    } | null;
    smartActions?: unknown[];
}

/**
 * モックレスポンスの型定義
 */
export interface MockResponse {
    text: string;
    citations: Citation[];
    suggestions: string[];
}

/**
 * Smart Actions モックデータ (設計書 v2.0 準拠)
 * 全5種類のAction Typeを網羅
 */
export const MOCK_SMART_ACTIONS: SmartAction[] = [
    // 1. retry_mode: モードを変更して再検索
    {
        type: 'retry_mode',
        label: '社内データのみで再検索',
        icon: 'database',
        payload: { mode: 'rag_only' }
    },
    // 2. suggested_question: テキストをそのまま送信
    {
        type: 'suggested_question',
        label: '申請書のテンプレートは？',
        icon: 'file-text',
        payload: { text: '申請書のテンプレートはどこにありますか？' }
    },
    // 3. web_search: Web検索モードで再検索
    {
        type: 'web_search',
        label: 'Web検索で再確認',
        icon: 'globe',
        payload: {}
    },
    // 4. deep_dive: より詳しく解説を求める
    {
        type: 'deep_dive',
        label: 'もっと詳しく解説',
        icon: 'sparkles',
        payload: {}
    },
    // 5. navigate: 外部URLを別タブで開く
    {
        type: 'navigate',
        label: '公式ドキュメントを開く',
        icon: 'external-link',
        payload: { url: 'https://docs.dify.ai/' }
    }
];

// サイドバー用の会話リスト
export const mockConversations: ConversationItem[] = [
    { id: 'mock_1', name: '🤖 AI Assistant Demo' },
    { id: 'mock_2', name: '💻 Code Generation Test' },
    { id: 'mock_3', name: '📊 Market Analysis (Table)' },
    { id: 'mock_4', name: '🎨 Creative Studio (MD)' },
    { id: 'mock_5', name: '🐛 Error Simulation' },
    { id: 'mock_6', name: '📦 Artifacts Demo' },
    { id: 'mock_7', name: '📄 HTML Artifact Demo' },
    { id: 'mock_8', name: '📊 Slide Artifact Demo' },
];

// 会話履歴データ (サイドバーのIDとキーを一致させる)
export const mockMessages: Record<string, MockMessage[]> = {
    'mock_1': [
        {
            id: 'msg_1_1',
            role: 'user',
            text: 'こんにちは、AIアシスタントのデモを見せてください。',
            timestamp: '2025-12-06T10:00:00Z',
            files: []
        },
        {
            id: 'msg_1_2',
            role: 'ai',
            text: 'はい、承知いたしました。私は社内情報やWeb情報を統合して回答するAIアシスタントです。\n\n何か調べたいことや、ドキュメントの解析など、お手伝いできることはありますか？',
            rawContent: 'はい、承知いたしました。私は社内情報やWeb情報を統合して回答するAIアシスタントです。\n\n何か調べたいことや、ドキュメントの解析など、お手伝いできることはありますか？',
            citations: [],
            suggestions: ['社内規定を検索', 'Webで最新ニュースを検索', 'ファイルを要約'],
            isStreaming: false,
            traceMode: 'knowledge',
            thoughtProcess: []
        }
    ],
    'mock_2': [
        {
            id: 'msg_2_1',
            role: 'user',
            text: 'Reactでボタンコンポーネントを作るコードを書いて。',
            timestamp: '2025-12-06T11:00:00Z',
            files: []
        },
        {
            id: 'msg_2_2',
            role: 'ai',
            text: 'Reactのボタンコンポーネントの例です。\n\n```jsx\nconst Button = ({ label, onClick }) => {\n  return (\n    <button className=\"btn-primary\" onClick={onClick}>\n      {label}\n    </button>\n  );\n};\nexport default Button;\n```\n\nこのように実装できます。',
            rawContent: 'Reactのボタンコンポーネントの例です。\n\n```jsx\nconst Button = ({ label, onClick }) => {\n  return (\n    <button className=\"btn-primary\" onClick={onClick}>\n      {label}\n    </button>\n  );\n};\nexport default Button;\n```\n\nこのように実装できます。',
            citations: [],
            suggestions: ['TypeScript版は？', 'スタイルを追加したい'],
            isStreaming: false,
            traceMode: 'knowledge',
            thoughtProcess: []
        }
    ],
    'mock_3': [
        {
            id: 'msg_3_1',
            role: 'user',
            text: '市場分析の結果を表形式でまとめて。',
            timestamp: '2025-12-06T12:00:00Z',
            files: []
        },
        {
            id: 'msg_3_2',
            role: 'ai',
            text: '2025年の市場分析結果は以下の通りです。\n\n| 項目 | 成長率 | 規模 (億円) | 備考 |\n| :--- | :---: | :---: | :--- |\n| AIソリューション | 150% | 5,000 | 急成長中 |\n| クラウド基盤 | 120% | 8,500 | 安定成長 |\n| レガシーシステム | 90% | 3,000 | 縮小傾向 |\n\n[1] 市場調査レポート2025 より',
            rawContent: '2025年の市場分析結果は以下の通りです。\n\n| 項目 | 成長率 | 規模 (億円) | 備考 |\n| :--- | :---: | :---: | :--- |\n| AIソリューション | 150% | 5,000 | 急成長中 |\n| クラウド基盤 | 120% | 8,500 | 安定成長 |\n| レガシーシステム | 90% | 3,000 | 縮小傾向 |\n\n[1] 市場調査レポート2025 より',
            citations: [{ id: 'w1', type: 'web', source: 'Market Report 2025', url: 'https://example.com' }],
            suggestions: ['詳細な内訳は？', '競合他社は？'],
            isStreaming: false,
            traceMode: 'search',
            thoughtProcess: []
        }
    ],
    'mock_4': [
        {
            id: 'msg_4_1',
            role: 'user',
            text: 'Markdownの表示テスト',
            timestamp: '2025-12-06T13:00:00Z',
            files: []
        },
        {
            id: 'msg_4_2',
            role: 'ai',
            text: '# 見出し1\n## 見出し2\n### 見出し3\n\n- リストアイテム1\n- リストアイテム2\n  - ネスト\n\n> 引用文です。\n> ここに重要な情報が入ります。\n\n**太字** や *イタリック* も表示可能です。',
            rawContent: '# 見出し1\n## 見出し2\n### 見出し3\n\n- リストアイテム1\n- リストアイテム2\n  - ネスト\n\n> 引用文です。\n> ここに重要な情報が入ります。\n\n**太字** や *イタリック* も表示可能です。',
            citations: [],
            suggestions: [],
            isStreaming: false,
            traceMode: 'knowledge',
            thoughtProcess: []
        }
    ],
    'mock_5': [
        {
            id: 'msg_5_1',
            role: 'user',
            text: 'エラー発生時のシミュレーション',
            timestamp: '2025-12-06T14:00:00Z',
            files: []
        },
        {
            id: 'msg_5_2',
            role: 'ai',
            text: '申し訳ありません。一時的なシステムエラーが発生しました。\nしばらく経ってから再試行してください。',
            rawContent: '申し訳ありません。一時的なシステムエラーが発生しました。\nしばらく経ってから再試行してください。',
            citations: [],
            suggestions: ['再試行'],
            isStreaming: false,
            traceMode: 'knowledge',
            thoughtProcess: []
        }
    ],

    'mock_6': [
        {
            id: 'msg_6_1',
            role: 'user',
            text: '新プロジェクト「Alpha」のキックオフ議事録を作成して。レポート形式で出力してほしい。',
            timestamp: '2025-12-06T15:00:00Z',
            files: []
        },
        {
            id: 'msg_6_2',
            role: 'ai',
            text: 'プロジェクト「Alpha」のキックオフ議事録をレポートとして作成しました！📋 右側のArtifactパネルでご確認ください。コピーボタンで内容をそのままクリップボードに保存できます。',
            rawContent: JSON.stringify({
                artifact_title: '議事録: Project Alpha キックオフ',
                artifact_type: 'meeting_minutes',
                artifact_content: '# 議事録: Project Alpha キックオフ\n\n**日時**: 2025年12月6日 10:00 - 11:00  \n**場所**: オンライン (Zoom)  \n**参加者**: 佐藤(PM)、田中(Dev)、鈴木(Design)、高橋(Sales)\n\n---\n\n## 1. プロジェクト概要\n**Project Alpha** は、社内業務の効率化を目指す次世代AIアシスタントの開発プロジェクトです。既存のチャットボットをリプレイスし、RAG（検索拡張生成）とWeb検索を統合したハイブリッドな検索体験を提供します。\n\n## 2. 決定事項\n* **リリース目標**: 2026年3月末日（β版は1月末）\n* **開発体制**: アジャイル（2週間スプリント）\n* **使用技術**: \n    * Frontend: React + Vite\n    * Backend: Python (FastAPI) + Dify\n    * Infra: AWS\n\n## 3. アクションアイテム\n| タスク | 担当者 | 期限 |\n| :--- | :--- | :--- |\n| 要件定義書の初稿作成 | 佐藤 | 12/10 |\n| Dify環境の構築 | 田中 | 12/13 |\n| UIデザイン案の作成 | 鈴木 | 12/15 |\n\n## 4. 次回予定\n* **日時**: 12月13日(金) 10:00〜\n* **議題**: UIデザインレビュー、環境構築状況の確認',
                answer: 'プロジェクト「Alpha」のキックオフ議事録をレポートとして作成しました！📋 右側のArtifactパネルでご確認ください。コピーボタンで内容をそのままクリップボードに保存できます。',
                citations: [
                    { id: 'cite_1', type: 'rag', source: 'プロジェクト管理規定.pdf', url: null },
                    { id: 'cite_2', type: 'rag', source: '社内会議テンプレート集.xlsx', url: null }
                ]
            }),
            citations: [
                { id: 'cite_1', type: 'rag', source: 'プロジェクト管理規定.pdf', url: null },
                { id: 'cite_2', type: 'rag', source: '社内会議テンプレート集.xlsx', url: null }
            ],
            // ★新: Artifactデータ（App.jsxの自動展開で使用）
            artifact: {
                artifact_title: '議事録: Project Alpha キックオフ',
                artifact_type: 'meeting_minutes',
                artifact_content: '# 議事録: Project Alpha キックオフ\n\n**日時**: 2025年12月6日 10:00 - 11:00  \n**場所**: オンライン (Zoom)  \n**参加者**: 佐藤(PM)、田中(Dev)、鈴木(Design)、高橋(Sales)\n\n---\n\n## 1. プロジェクト概要\n**Project Alpha** は、社内業務の効率化を目指す次世代AIアシスタントの開発プロジェクトです。\n\n## 2. 決定事項\n* **リリース目標**: 2026年3月末日（β版は1月末）\n* **開発体制**: アジャイル（2週間スプリント）\n\n## 3. アクションアイテム\n| タスク | 担当者 | 期限 |\n| :--- | :--- | :--- |\n| 要件定義書の初稿作成 | 佐藤 | 12/10 |\n| Dify環境の構築 | 田中 | 12/13 |\n| UIデザイン案の作成 | 鈴木 | 12/15 |\n\n## 4. 次回予定\n* **日時**: 12月13日(金) 10:00〜\n* **議題**: UIデザインレビュー、環境構築状況の確認',
                citations: [
                    { id: 'cite_1', type: 'rag', source: 'プロジェクト管理規定.pdf', url: null },
                    { id: 'cite_2', type: 'rag', source: '社内会議テンプレート集.xlsx', url: null }
                ]
            },
            smartActions: [
                { type: 'suggested_question', label: 'アジェンダを追加して', icon: 'file-text', payload: { text: '議事録にアジェンダセクションを追加してください' } },
                { type: 'generate_document', label: '📋 チェックリスト形式に変換', icon: 'file-text', payload: { text: 'この議事録をチェックリスト形式に変換して', artifact_type: 'checklist' } }
            ],
            suggestions: [],
            isStreaming: false,
            traceMode: 'knowledge',
            thoughtProcess: []
        }
    ],

    'mock_7': [
        {
            id: 'msg_7_1',
            role: 'user',
            text: '売上分析レポートをグラフ付きのHTMLで作成して。',
            timestamp: '2025-12-06T16:00:00Z',
            files: []
        },
        {
            id: 'msg_7_2',
            role: 'ai',
            text: '2025年度Q4の売上分析レポートを作成しました！📄 Chart.jsグラフを含むリッチなHTMLドキュメントです。右側のパネルでご確認ください。',
            rawContent: '',
            citations: [
                { id: 'cite_1', type: 'rag', source: '2025年度_四半期業績報告.xlsx', url: null },
                { id: 'cite_2', type: 'rag', source: '経営企画_KPIダッシュボード.pdf', url: null }
            ],
            artifact: {
                artifact_title: '2025年度 Q4 売上分析レポート',
                artifact_type: 'html_document',
                artifact_content: '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>Q4レポート</title><style>:root{--font-body:\'Hiragino Mincho ProN\',\'Yu Mincho\',\'MS Mincho\',serif;--font-heading:\'Hiragino Sans\',\'Yu Gothic Medium\',\'Meiryo\',sans-serif;--text-base:10.5pt;--text-sm:9pt;--text-h1:22pt;--text-h2:16pt;--text-h3:12pt;--leading-body:1.9;--leading-heading:1.3;--primary:#1e5f8e;--primary-light:#dce4eb;--accent:#e67e22;--text:#333333;--text-sub:#777777;--bg:#ffffff;--bg-section:#f0f4f8;--border:#cccccc}*{margin:0;padding:0;box-sizing:border-box}body{font-family:var(--font-body);font-size:var(--text-base);line-height:var(--leading-body);color:var(--text);background:var(--bg);-webkit-print-color-adjust:exact;print-color-adjust:exact}h1,h2,h3,th,.kpi-value{font-family:var(--font-heading)}h1{font-size:var(--text-h1);font-weight:800;margin-bottom:16px;line-height:var(--leading-heading)}h2{font-size:var(--text-h2);font-weight:700;color:var(--primary);margin:32px 0 16px;padding-bottom:8px;border-bottom:2px solid var(--primary);line-height:var(--leading-heading);break-before:avoid;break-after:avoid}.kpi{display:flex;gap:20px;margin:24px 0}.kpi-card{flex:1;padding:24px;background:var(--bg-section);border:1px solid var(--border);border-radius:12px;text-align:center}.kpi-value{font-size:32px;font-weight:800;color:var(--primary);margin-bottom:4px}.kpi-label{font-size:13px;color:var(--text-sub);font-weight:500}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{padding:12px 16px;border-bottom:1px solid var(--border);text-align:left;font-size:14px}th{background:var(--bg-section);font-weight:600;color:var(--text-sub);font-size:12px}</style></head><body><div style="page-break-after: always; padding: 20mm 18mm; text-align: center; display: flex; flex-direction: column; justify-content: center; height: 60vh;"><h1>2025年度 Q4 売上分析レポート</h1><p style="color:var(--text-sub);font-size:var(--text-h2);font-family:var(--font-heading);">第4四半期 業績サマリーと詳細データ</p></div><div style="padding: 20mm 18mm;"><p>第4四半期は前年同期比で売上高が<strong>15.3%増</strong>と堅調に推移しました。</p><div class="kpi"><div class="kpi-card"><div class="kpi-value">¥42.8億</div><div class="kpi-label">売上高 ▲ 15.3%</div></div></div><h2>事業セグメント別実績</h2><table><thead><tr><th>セグメント</th><th>売上高</th></tr></thead><tbody><tr><td>SaaS事業</td><td>¥25.2億</td></tr></tbody></table></div><script>document.addEventListener("DOMContentLoaded",()=>window.parent.postMessage({type:"artifact-resize",height:document.documentElement.scrollHeight},"*"));</script></body></html>',
                citations: [
                    { id: 'cite_1', type: 'rag', source: '2025年度_四半期業績報告.xlsx', url: null },
                    { id: 'cite_2', type: 'rag', source: '経営企画_KPIダッシュボード.pdf', url: null }
                ]
            },
            suggestions: [],
            isStreaming: false,
            traceMode: 'knowledge',
            thoughtProcess: []
        }
    ],

    'mock_8': [
        {
            id: 'msg_8_1',
            role: 'user',
            text: '中期経営計画案をスライド形式で作成して。',
            timestamp: '2025-12-06T17:00:00Z',
            files: []
        },
        {
            id: 'msg_8_2',
            role: 'ai',
            text: '2026年度の中期経営計画案を16:9スライド形式で作成しました！📽️ 右側のパネルで、各ページのスライド構成をご確認いただけます。印刷ボタンからPDF保存も可能です。',
            rawContent: '',
            citations: [
                { id: 'cite_1', type: 'rag', source: '中期経営計画_骨子.docx', url: null }
            ],
            artifact: {
                artifact_title: '2026年度 中期経営計画案',
                artifact_type: 'html_slide',
                artifact_content: '', // sample_slide_01.htmlの内容が入る前提だが、実際の読み込みは scenarios.js 経由
                citations: [
                    { id: 'cite_1', type: 'rag', source: '中期経営計画_骨子.docx', url: null }
                ]
            },
            suggestions: [],
            isStreaming: false,
            traceMode: 'knowledge',
            thoughtProcess: []
        }
    ]
};

// --- 8 Patterns of Mock Responses ---

// P1: Pure (File:×, RAG:×, Web:×)
export const mockResPure: MockResponse = {
    text: `ご質問ありがとうございます。私の学習データに基づいて回答します。

ご質問の内容については、一般的に以下のことが言えます。
* **基本概念**: 目的を達成するための体系的なアプローチが重要です。
* **一般的な手法**: 計画、実行、評価、改善のサイクル（PDCA）を回すことが推奨されます。

なお、私は現在、**外部ネットワーク**や**社内データベース**には接続しておらず、アップロードされたファイルもありません。
最新情報や固有の規定については、検索設定を有効にするか、ファイルを添付してください。`,
    citations: [],
    suggestions: ['Web検索を有効にするには？', '社内情報を検索したい', 'ファイルを添付する']
};

// P2: Web Only (File:×, RAG:×, Web:○)
export const mockResWebOnly: MockResponse = {
    text: `Web検索を実行し、最新情報を収集しました。

## 🌐 Web検索結果
最新のトレンドによると、以下の点が注目されています。

1.  **市場の動向**: 2025年にかけて、AI技術の統合が加速すると予測されています[1]。
2.  **主要なニュース**: 大手テック企業が新たなプラットフォームを発表しました[2]。

※社内情報は参照していません。`,
    citations: [
        { id: 'w1', type: 'web', source: 'Tech News Daily 2025', url: 'https://example.com/news' },
        { id: 'w2', type: 'web', source: 'Global Market Report', url: 'https://example.com/market' }
    ],
    suggestions: ['さらに詳しく検索', '関連企業は？']
};

// P3: RAG Only (File:×, RAG:○, Web:×)
export const mockResRagOnly: MockResponse = {
    text: `社内ナレッジベースを検索しました。

## 📚 社内規定に基づく回答
社内データベースによると、以下の規定が該当します。

1.  **申請フロー**: ワークフローシステムから「申請A」を選択してください[1]。
2.  **承認権限**: 課長以上の承認が必要です[2]。

※Web上の情報は参照していません。`,
    citations: [
        { id: 'r1', type: 'rag', source: '社内規定集_第3版.pdf', url: null },
        { id: 'r2', type: 'rag', source: '業務マニュアル_v2.docx', url: null }
    ],
    suggestions: ['申請書のフォーマットは？', '緊急時の連絡先']
};

// P4: Hybrid (File:×, RAG:○, Web:○)
export const mockResHybrid: MockResponse = {
    text: `社内情報とWeb情報を統合して回答します。

## 🔍 調査結果

### 社内の状況
現在の社内規定では、クラウドサービスの利用にはセキュリティ審査が必要です[1]。

### 世の中の動向
一方、Web上の情報によると、同種のサービスでは多要素認証が標準化しています[2]。

これらを踏まえ、導入の際はセキュリティ設定を強化することをお勧めします。`,
    citations: [
        { id: 'r1', type: 'rag', source: 'ITセキュリティガイドライン.pdf', url: null },
        { id: 'w1', type: 'web', source: 'Cloud Security Trends', url: 'https://example.com/sec' }
    ],
    suggestions: ['審査の申請方法は？', '推奨設定は？']
};

// P5: File Only (File:○, RAG:×, Web:×)
export const mockResFileOnly: MockResponse = {
    text: `アップロードされたファイル **{filename}** を解析しました。

## 📄 ファイル概要
このドキュメントには、以下の重要事項が記載されています。

* **売上目標**: 前年比120%増[1]
* **課題**: 人材不足とシステム老朽化[2]

※社内規定やWeb情報は参照せず、このファイルの内容のみに基づき分析しました。`,
    citations: [
        { id: 'f1', type: 'document', source: '{filename} (P.1)', url: null },
        { id: 'f2', type: 'document', source: '{filename} (P.5)', url: null }
    ],
    suggestions: ['課題の対策は？', 'スケジュールの詳細は？']
};

// P6: File + Web (File:○, RAG:×, Web:○)
export const mockResFileWeb: MockResponse = {
    text: `ファイル **{filename}** を解析し、Web情報で補完しました。

## 📄 ファイルの分析
ファイル内で言及されている技術「Quantum-X」について確認しました[1]。

## 🌐 Webでの評価
Web検索によると、「Quantum-X」は次世代の標準技術として注目されていますが、コスト面での課題も指摘されています[2]。

ファイルの提案内容は、市場のトレンドと合致していますが、コストについては再検討の余地があります。`,
    citations: [
        { id: 'f1', type: 'document', source: '{filename} (P.3)', url: null },
        { id: 'w1', type: 'web', source: 'Tech Review: Quantum-X', url: 'https://example.com/review' }
    ],
    suggestions: ['コスト削減案は？', '競合技術は？']
};

// P7: File + RAG (File:○, RAG:○, Web:×)
export const mockResFileRag: MockResponse = {
    text: `ファイル **{filename}** と社内規定を照合しました。

## ✅ コンプライアンス・チェック結果

1.  **経費精算**: ファイル内の出張費規定[1]は、社内の旅費規定[2]と一致しています。
2.  **契約条件**: 支払いサイトについて、社内標準（月末締め翌月末払い）との乖離が見られます。

契約条件については、法務部への相談をお勧めします。`,
    citations: [
        { id: 'f1', type: 'document', source: '{filename} (P.8)', url: null },
        { id: 'r1', type: 'rag', source: '旅費交通費規定.pdf', url: null }
    ],
    suggestions: ['法務部の連絡先', '支払いサイトの修正案']
};

// P8: Full (File:○, RAG:○, Web:○)
export const mockResFull: MockResponse = {
    text: `ファイル **{filename}**、社内ナレッジ、Web情報を総合的に分析しました。

## 📊 総合分析レポート

### 1. 提案内容の妥当性 (File)
提案書のプロジェクト計画[1]は、概ね実行可能です。

### 2. 社内規定との整合性 (RAG)
社内のプロジェクト管理規定[2]に準拠しており、承認プロセスに進むことができます。

### 3. 市場競争力 (Web)
Web上の競合調査[3]と比較しても、本提案の独自性は高く評価できます。

**結論**: このプロジェクトを推進することを推奨します。`,
    citations: [
        { id: 'f1', type: 'document', source: '{filename} (P.2)', url: null },
        { id: 'r1', type: 'rag', source: 'プロジェクト管理規定.pdf', url: null },
        { id: 'w1', type: 'web', source: 'Market Insight 2025', url: 'https://example.com/insight' }
    ],
    suggestions: ['次のステップは？', 'リスク要因は？']
};
