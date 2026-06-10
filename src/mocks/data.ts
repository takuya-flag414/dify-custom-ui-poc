// src/mocks/data.ts
import { scenarios } from './scenarios';

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

/**
 * scenarios.js 内 of json_slide_advanced シナリオから、
 * スライド設計書全体の完全な JSON 文字列を動的に抽出して同期する
 */
const getAdvancedSlideContent = (): string => {
    try {
        const scenario = (scenarios as any)['json_slide_advanced'];
        if (Array.isArray(scenario)) {
            // event: 'message' で answer (JSON文字列) を持っているステップを検索
            const msgStep = scenario.find(step => step.event === 'message' && step.answer);
            if (msgStep && typeof msgStep.answer === 'string') {
                return msgStep.answer;
            }
        }
    } catch (e) {
        console.error('Failed to extract advanced slide content dynamically:', e);
    }
    return '';
};

/**
 * scenarios.js 内の json_document シナリオから、
 * ドキュメントの内容を動的に抽出して同期する
 */
const getJsonDocumentArtifact = () => {
    try {
        const scenario = (scenarios as any)['json_document'];
        const steps = scenario?.partner || scenario?.efficient;
        if (Array.isArray(steps)) {
            const msgStep = steps.find(step => step.event === 'message' && step.answer);
            if (msgStep && typeof msgStep.answer === 'string') {
                const parsed = JSON.parse(msgStep.answer);
                if (parsed.artifact) {
                    return {
                        artifact_title: parsed.artifact.artifact_title,
                        artifact_type: parsed.artifact.artifact_type,
                        artifact_content: parsed.artifact.artifact_content,
                        citations: []
                    };
                }
            }
        }
    } catch (e) {
        console.error('Failed to extract json document content dynamically:', e);
    }
    return null;
};

/**
 * scenarios.js 内の json_document_letter シナリオから、
 * レタードキュメントの内容を動的に抽出して同期する
 */
const getJsonDocumentLetterArtifact = () => {
    try {
        const scenario = (scenarios as any)['json_document_letter'];
        const steps = scenario?.partner || scenario?.efficient;
        if (Array.isArray(steps)) {
            const msgStep = steps.find(step => step.event === 'message' && step.answer);
            if (msgStep && typeof msgStep.answer === 'string') {
                const parsed = JSON.parse(msgStep.answer);
                if (parsed.artifact) {
                    return {
                        artifact_title: parsed.artifact.artifact_title,
                        artifact_type: parsed.artifact.artifact_type,
                        artifact_content: parsed.artifact.artifact_content,
                        citations: []
                    };
                }
            }
        }
    } catch (e) {
        console.error('Failed to extract json letter document content dynamically:', e);
    }
    return null;
};

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
    { id: 'mock_9', name: '✨ 組織図・構成図スライド (Parity)' },
    { id: 'mock_10', name: '📄 事業戦略報告書 (JSON Doc)' },
    { id: 'mock_11', name: '✉️ 警告通知書 (JSON Letter)' },
    { id: 'mock_12', name: '🪄 動的スライド生成 (Dynamic)' }
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
    ],

    'mock_9': [
        {
            id: 'msg_9_1',
            role: 'user',
            text: 'プロジェクト体制図とシステム構成図を高度なスライドで生成して。',
            timestamp: '2026-05-18T13:58:00Z',
            files: []
        },
        {
            id: 'msg_9_2',
            role: 'ai',
            text: 'エンタープライズDX推進体制の組織図とシステム構成図スライドを作成しました！✨ 右側のパネルで、高密度で直角配線された美しいフラット・モダンデザインのスライド群をご確認いただけます。PowerPoint (pptx) へのエクスポートも完璧に同期・最適化されています。',
            rawContent: '',
            citations: [],
            artifact: {
                artifact_title: 'DX推進プロジェクト設計書',
                artifact_type: 'json_slide_advanced',
                artifact_content: getAdvancedSlideContent(),
                citations: []
            },
            suggestions: [],
            isStreaming: false,
            traceMode: 'knowledge',
            thoughtProcess: []
        }
    ],
    'mock_10': [
        {
            id: 'msg_10_1',
            role: 'user',
            text: '2026年度の事業戦略報告書をドラフトで作成してください。編集可能なドキュメント形式が良いです。',
            timestamp: '2026-05-19T19:00:00Z',
            files: []
        },
        {
            id: 'msg_10_2',
            role: 'ai',
            text: '2026年度の事業戦略報告書（ドラフト）を作成しました！📄 右側のドキュメントパネルで内容の確認や編集が可能です。',
            rawContent: '',
            citations: [],
            artifact: getJsonDocumentArtifact(),
            suggestions: [],
            isStreaming: false,
            traceMode: 'knowledge',
            thoughtProcess: []
        }
    ],
    'mock_11': [
        {
            id: 'msg_11_1',
            role: 'user',
            text: '商標権侵害についての警告通知書を作成してください。1ページ目から直接宛名や差出人が入るビジネスレター形式でお願いします。',
            timestamp: '2026-05-19T20:00:00Z',
            files: []
        },
        {
            id: 'msg_11_2',
            role: 'ai',
            text: '商標権侵害に関する警告通知書（ドラフト）を作成しました！✉️ 右側のドキュメントパネルでレター形式のレイアウトをご確認いただけます。Word出力（.docx）もレター形式に対応しています。',
            rawContent: '',
            citations: [],
            artifact: getJsonDocumentLetterArtifact(),
            suggestions: [],
            isStreaming: false,
            traceMode: 'knowledge',
            thoughtProcess: []
        }
    ],
    'mock_12': [
        {
            id: 'msg_12_1',
            role: 'user',
            text: '次世代エンタープライズDX戦略（生成AI導入）についての提案スライドを生成してください。表やグラフ、Mermaid図なども活用して長大で説得力のある構成にしてください。',
            timestamp: '2026-06-04T10:00:00Z',
            files: []
        },
        {
            id: 'msg_12_2',
            role: 'ai',
            text: `「次世代エンタープライズDX戦略」に関する戦略スライドを作成しました！🪄

ご要望通り、表やグラフ（ROI）、Mermaidを用いたアーキテクチャ図などをふんだんに盛り込み、コンサルティングファーム水準 of 全22枚の長大スライドとして構成しています。
新しい動的レイアウトエンジン（Dynamic Slide Engine）が、各スライドの要素量や重み（Weight）に応じて最適なグリッド（左右分割、3カラムなど）を自動選択して美しく描画しています。右側のパネルでご確認ください。`,
            rawContent: '',
            citations: [],
            artifact: {
                artifact_title: '次世代エンタープライズDX戦略_提案資料',
                artifact_type: 'json_slide',
                artifact_content: JSON.stringify({
                    theme: 'consulting-classic',
                    slides: [
                        {
                            key_message: "",
                            blocks: [
                                {
                                    type: "title_cover",
                                    title: "次世代エンタープライズDX戦略",
                                    subtitle: "生成AIを活用した業務プロセスの抜本的改革とROI最大化",
                                    presenter: "DX推進室",
                                    date: "2026年6月",
                                    organization: "株式会社 未来テクノロジー"
                                }
                            ],
                            speaker_notes: "本日は次世代エンタープライズDX戦略についてご説明します。"
                        },
                        {
                            key_message: "本日の検討アジェンダ",
                            blocks: [
                                {
                                    type: "agenda",
                                    active_index: -1,
                                    items: [
                                        { title: "1. 戦略的適用領域", subtitle: "現状課題と生成AIがもたらすシナジー", duration: "10 min" },
                                        { title: "2. システムとセキュリティ設計", subtitle: "AI基盤アーキテクチャとガバナンス", duration: "15 min" },
                                        { title: "3. ロードマップと推進体制", subtitle: "3段階の導入フェーズとAI CoE", duration: "15 min" },
                                        { title: "4. ROIと成果予測", subtitle: "投資対効果とリスク緩和策", duration: "10 min" }
                                    ]
                                }
                            ],
                            speaker_notes: "本日の全体アジェンダと各パートの時間配分です。まずはエグゼクティブサマリーと導入部からご説明します。"
                        },
                        {
                            key_message: "生成AIを全社導入し、定型業務を極限まで自動化することで、創造的なコア業務へのリソース集中を実現する。",
                            blocks: [
                                {
                                    type: "text",
                                    content: `【エグゼクティブ・サマリー】
現在の労働市場の縮小とコスト増大に対応するため、従来のRPAやSaaS導入といった局所的な改善から、LLM（大規模言語モデル）を中核とした「全社プロセスの自律化」へパラダイムシフトを図る必要があります。`
                                },
                                {
                                    type: "list",
                                    items: [
                                        "課題: 既存システムのサイロ化と非構造化データ（文書・メール）の処理コスト",
                                        "解決策: 社内データ連携RAGとAIエージェントによる業務プロセスの自動遂行",
                                        "財務インパクト: 3年間で営業利益率+3.2%の改善を見込む"
                                    ]
                                }
                            ],
                            speaker_notes: "全体のサマリーです。"
                        },
                        {
                            key_message: "既存オペレーションは限界を迎えており、非効率な業務プロセスが事業成長の最大のボトルネックとなっている。",
                            blocks: [
                                {
                                    type: "text",
                                    content: `社内ヒアリングおよび業務量調査の結果、特にバックオフィス部門と営業支援部門において深刻なリソース不足が顕在化しています。
日々の「検索」「集計」「転記」といった非付加価値業務に多大な時間が割かれており、既存のシステムでは対応しきれない非構造化データの処理が課題です。`
                                },
                                {
                                    type: "key_value_card",
                                    title: "定型業務の月間消費時間",
                                    value: "14,000h"
                                },
                                {
                                    type: "key_value_card",
                                    title: "人的オペレーションミス率",
                                    value: "4.2%"
                                },
                                {
                                    type: "key_value_card",
                                    title: "レガシーシステム維持費",
                                    value: "3.2億円"
                                }
                            ],
                            speaker_notes: "現状の課題とKPIです。"
                        },
                        {
                            key_message: "本日の検討アジェンダ",
                            blocks: [
                                {
                                    type: "agenda",
                                    active_index: 0,
                                    items: [
                                        { title: "1. 戦略的適用領域", subtitle: "現状課題と生成AIがもたらすシナジー", duration: "10 min" },
                                        { title: "2. システムとセキュリティ設計", subtitle: "AI基盤アーキテクチャとガバナンス", duration: "15 min" },
                                        { title: "3. ロードマップと推進体制", subtitle: "3段階の導入フェーズとAI CoE", duration: "15 min" },
                                        { title: "4. ROIと成果予測", subtitle: "投資対効果とリスク緩和策", duration: "10 min" }
                                    ]
                                }
                            ],
                            speaker_notes: "第1パートである「戦略的適用領域」についてご説明します。"
                        },
                        {
                            key_message: "定型度と専門性の軸で業務をマッピングし、自動化インパクトが最も高い領域から優先的に適用を開始する。",
                            blocks: [
                                {
                                    type: "text",
                                    content: "社内の全業務を定型度と専門性の2軸で評価しました。右上（定型・高専門）はAIによる高度な支援が可能な領域、右下（定型・低専門）は完全自動化が可能な領域です。これらの領域から優先的にAIソリューションを展開します。"
                                },
                                {
                                    type: "matrix_2x2",
                                    title: "社内業務の生成AI適用マトリックス",
                                    xAxisLabel: "業務の定型度",
                                    yAxisLabel: "業務の専門性",
                                    items: [
                                        { label: "定型レポーティング", x: 0.8, y: 0.2 },
                                        { label: "契約書レビュー", x: 0.7, y: 0.8 },
                                        { label: "高度な企画立案", x: 0.2, y: 0.9 },
                                        { label: "突発的なトラブル対応", x: 0.1, y: 0.4 }
                                    ]
                                }
                            ],
                            speaker_notes: "2x2マトリックスを用いた業務の適用領域分析です。"
                        },
                        {
                            key_message: "競合はすでにAI投資を本格化させており、自社のみが旧来のプロセスに留まることは致命的な競争力低下を招く。",
                            blocks: [
                                {
                                    type: "text",
                                    content: "市場の主要プレイヤーとのケイパビリティ比較です。トップランナーであるA社は既に全社規模でのLLM展開を完了しています。自社も本施策を導入することで、競合と同等以上の競争力を確保します。"
                                },
                                {
                                    type: "comparison_table",
                                    emphasis_cells: [
                                        [0, 1],
                                        [1, 1]
                                    ],
                                    emphasis_box: {
                                        start_row: 1,
                                        end_row: 2,
                                        start_col: 2,
                                        end_col: 3
                                    },
                                    headers: ["評価軸", "A社 (競合)", "自社 (現状)", "自社 (AI導入後)"],
                                    rows: [
                                        ["情報検索スピード", "即時 (数秒)", "手動 (数時間)", "即時 (数秒)"],
                                        ["文書作成の自動化", "75%自動化", "未対応", "80%自動化"],
                                        ["顧客対応の24時間化", "対応済", "未対応", "対応済"]
                                    ]
                                }
                            ],
                            speaker_notes: "競合他社との能力比較表です。自社の導入後をハイライトしています。"
                        },
                        {
                            key_message: "LLM基盤、独自データ(RAG)、および業務システムの統合こそが、持続的な競争優位とビジネス価値を創出する。",
                            blocks: [
                                {
                                    type: "text",
                                    content: "生成AI単体では一般的な回答しか得られません。真の価値は、LLMが社内の独自データ（RAG）を読み込み、さらに社内システムとAPIで連携することで初めて生まれます。これら3つの要素の重なりが、業務の自律化をもたらします。"
                                },
                                {
                                    type: "venn_diagram",
                                    title: "生成AI活用がもたらす価値のシナジー",
                                    items: ["LLM基盤", "社内データ (RAG)", "業務システム (API)"]
                                }
                            ],
                            speaker_notes: "生成AI活用のコアとなる3要素のベン図です。"
                        },
                        {
                            key_message: "本日の検討アジェンダ",
                            blocks: [
                                {
                                    type: "agenda",
                                    active_index: 1,
                                    items: [
                                        { title: "1. 戦略的適用領域", subtitle: "現状課題と生成AIがもたらすシナジー", duration: "10 min" },
                                        { title: "2. システムとセキュリティ設計", subtitle: "AI基盤アーキテクチャとガバナンス", duration: "15 min" },
                                        { title: "3. ロードマップと推進体制", subtitle: "3段階の導入フェーズとAI CoE", duration: "15 min" },
                                        { title: "4. ROIと成果予測", subtitle: "投資対効果とリスク緩和策", duration: "10 min" }
                                    ]
                                }
                            ],
                            speaker_notes: "第2パートである「システムとセキュリティ設計」についてご説明します。"
                        },
                        {
                            key_message: "社内データをセキュアに統合し、ハルシネーションを防止する「RAGハイブリッド基盤」を構築する。",
                            blocks: [
                                {
                                    type: "text",
                                    content: "既存の社内ドキュメント（SharePoint等）をベクトルデータベースにインデックス化し、従業員は社内の独自ナレッジに基づいた回答をセキュアに引き出すことが可能となります。"
                                },
                                {
                                    type: "mermaid",
                                    code: `graph TD
    A[ユーザーUI] --> B(API Gateway)
    B --> C{LLM Orchestrator}
    D -.-> E[(社内システム)]
    D -.-> F[(社内文書)]
    C --> G[OpenAI / Anthropic]
    C --> H[監査フィルター]
    style A fill:#f9f,stroke:#333,stroke-width:2px`
                                }
                            ],
                            speaker_notes: "システムアーキテクチャです。"
                        },
                        {
                            key_message: "AIエージェントは、コンテキスト抽出から監査までの一連のプロセスを自律的かつ安全に実行する。",
                            blocks: [
                                {
                                    type: "timeline",
                                    direction: "horizontal",
                                    show_arrows: true,
                                    steps: [
                                        {
                                            title: "1. コンテキスト収集",
                                            owner: "エージェント",
                                            content: [
                                                "ユーザーのプロンプトを解析",
                                                "必要な追加情報の特定と取得"
                                            ]
                                        },
                                        {
                                            title: "2. RAG検索＆統合",
                                            owner: "RAGエンジン",
                                            content: [
                                                "社内DBから関連文書を抽出",
                                                "情報の妥当性を検証・フィルタリング"
                                            ]
                                        },
                                        {
                                            title: "3. ガバナンス監査＆出力",
                                            owner: "LLM / 監査機構",
                                            content: [
                                                "機密情報・PIIのマスキング",
                                                "最終回答の生成とユーザーへの提供"
                                            ]
                                        }
                                    ]
                                }
                            ],
                            speaker_notes: "エージェントの処理プロセスを示すタイムライン図です。"
                        },
                        {
                            key_message: "エンタープライズ導入に必須となる強固なセキュリティ・ガバナンス要件を完全に担保する。",
                            blocks: [
                                {
                                    type: "text",
                                    content: "AI活用における最大の障壁である「情報漏洩」や「不適切利用」を防ぐため、システム・制度の両面からガバナンスを効かせます。"
                                },
                                {
                                    type: "list",
                                    items: [
                                        "学習データ利用のオプトアウト確約 (API利用モデルの選定)",
                                        "社内Active Directoryと連携したロールベースアクセス制御 (RBAC) の適用",
                                        "全プロンプト・回答ログの保存と定期監査機構の整備",
                                        "個人情報 (PII) マスキングフィルターの事前処理"
                                    ]
                                }
                            ],
                            speaker_notes: "セキュリティとコンプライアンス要件です。"
                        },
                        {
                            key_message: "本日の検討アジェンダ",
                            blocks: [
                                {
                                    type: "agenda",
                                    active_index: 2,
                                    items: [
                                        { title: "1. 戦略的適用領域", subtitle: "現状課題と生成AIがもたらすシナジー", duration: "10 min" },
                                        { title: "2. システムとセキュリティ設計", subtitle: "AI基盤アーキテクチャとガバナンス", duration: "15 min" },
                                        { title: "3. ロードマップと推進体制", subtitle: "3段階の導入フェーズとAI CoE", duration: "15 min" },
                                        { title: "4. ROIと成果予測", subtitle: "投資対効果とリスク緩和策", duration: "10 min" }
                                    ]
                                }
                            ],
                            speaker_notes: "第3パートである「ロードマップと推進体制」についてご説明します。"
                        },
                        {
                            key_message: "本質的な業務変革を遂げるため、3段階のフェーズに分けた着実なロードマップを推進する。",
                            blocks: [
                                {
                                    type: "content_card",
                                    title: "Phase 1: PoC・基盤構築 (1-3ヶ月)",
                                    description: "先行部門（IT・人事）に限定導入し、セキュリティ要件のクリアと基本機能の検証を行う。",
                                    points: [
                                        "セキュアなLLM環境の構築",
                                        "社内ガイドラインの策定",
                                        "キーユーザーの育成"
                                    ]
                                },
                                {
                                    type: "content_card",
                                    title: "Phase 2: 全社展開 (4-9ヶ月)",
                                    description: "全社員向けにAIツールを開放し、部門特有の業務へのユースケースを拡大する。",
                                    points: [
                                        "説明会およびプロンプト研修",
                                        "社内ナレッジ（RAG）の拡充",
                                        "利用ログの分析と改善"
                                    ]
                                },
                                {
                                    type: "content_card",
                                    title: "Phase 3: 自律化 (10ヶ月~)",
                                    description: "対話型AIから脱却し、システムとAPI連携してタスクを自動実行する「AIエージェント」へ進化。",
                                    points: [
                                        "既存SaaSとのAPI統合",
                                        "ワークフローの完全自動化",
                                        "AIネイティブな組織改編"
                                    ]
                                }
                            ],
                            speaker_notes: "導入ロードマップです。"
                        },
                        {
                            key_message: "全社的なAI活用を牽引し、セキュリティとアジリティを両立する部門横断型の「AI CoE」を組織する。",
                            blocks: [
                                {
                                    type: "text",
                                    content: "現場にツールの利用を丸投げするのではなく、経営直下に推進組織（Center of Excellence）を設置し、各事業部との橋渡しを行います。"
                                },
                                {
                                    type: "mermaid",
                                    code: `graph TD
    A[経営層 (Sponsor)] --> B{AI CoE (推進組織)}
    B --> C[IT部門 (インフラ提供)]
    B --> D[法務・リスク管理 (ガバナンス)]
    B --> E[各事業部アンバサダー]
    E --> F[営業部門]
    E --> G[バックオフィス]
    E --> H[開発部門]
    style B fill:#3b82f6,color:#fff,stroke:#1d4ed8,stroke-width:2px`
                                }
                            ],
                            speaker_notes: "推進体制とAI CoEについてです。"
                        },
                        {
                            key_message: "各事業部でのユースケース検証用に、具体的なAI CoE活動モデルを描いたイメージ図を配置予定。",
                            blocks: [
                                {
                                    type: "text",
                                    content: "AI CoEの具体的なコミュニケーションフローや、課題吸い上げからソリューション実装までのプロセスモデルを視覚的に表現する必要があります。この部分は将来的に図解デザイン画像を配置します。"
                                },
                                {
                                    type: "image_placeholder",
                                    label: "AI CoE 課題解決サイクル・イメージ図",
                                    prompt: "A circular flowchart showing problem intake, vector search, prompt tuning, and deployment with human feedback loop, McKinsey corporate classic slide style, vector illustration, white background, blue tones",
                                    search_query: "corporate business innovation process cycle diagram",
                                    aspect_ratio: "16:9"
                                }
                            ],
                            speaker_notes: "AI CoEの業務サイクルを示す図解用のプレースホルダーです。"
                        },
                        {
                            key_message: "本日の検討アジェンダ",
                            blocks: [
                                {
                                    type: "agenda",
                                    active_index: 3,
                                    items: [
                                        { title: "1. 戦略的適用領域", subtitle: "現状課題と生成AIがもたらすシナジー", duration: "10 min" },
                                        { title: "2. システムとセキュリティ設計", subtitle: "AI基盤アーキテクチャとガバナンス", duration: "15 min" },
                                        { title: "3. ロードマップと推進体制", subtitle: "3段階の導入フェーズとAI CoE", duration: "15 min" },
                                        { title: "4. ROIと成果予測", subtitle: "投資対効果とリスク緩和策", duration: "10 min" }
                                    ]
                                }
                            ],
                            speaker_notes: "第4パートである「ROIと成果予測」についてご説明します。"
                        },
                        {
                            key_message: "導入時の課題（誤回答やコスト高騰）を想定し、実効性のある回避策（Mitigation）をあらかじめ定義する。",
                            blocks: [
                                {
                                    type: "comparison_table",
                                    emphasis_row: 1,
                                    headers: ["リスク要因", "影響度", "発生確率", "緩和策 (Mitigation)"],
                                    rows: [
                                        ["ハルシネーションによる誤った意思決定", "高", "中", "RAGによる自社データへのグラウンディング徹底、および人間による最終確認(HITL)ルールの制定"],
                                        ["従業員のITリテラシー不足・活用低迷", "中", "高", "各部門のアンバサダーを通じた定期的なプロンプト共有会、および業務フローへの組み込み"],
                                        ["予期せぬAPIコストの高騰", "中", "低", "トークン使用量のダッシュボード監視と、部門別の上限アラート設定の導入"]
                                    ]
                                }
                            ],
                            speaker_notes: "リスク要因と緩和策の表です。"
                        },
                        {
                            key_message: "システム構築費は初年度に集中するが、2年目以降の業務削減効果により、3年目での投資回収を完了する。",
                            blocks: [
                                {
                                    type: "text",
                                    content: `システム構築およびライセンス費用として初年度に約1.5億円を投下します。
しかし、2年目からは定型業務の自動化による人件費抑制効果（年間約2.2億円）が初期投資を上回り、大きなフリーキャッシュフローを生み出します。`
                                },
                                {
                                    type: "chart",
                                    title: "3年間の累積コスト削減効果 (単位: 百万円)",
                                    data: [
                                        { label: "Year 1", value: 30, color: "#94a3b8" },
                                        { label: "Year 2", value: 180, color: "#3b82f6" },
                                        { label: "Year 3", value: 450, color: "#1d4ed8" }
                                    ]
                                }
                            ],
                            speaker_notes: "ROIについてです。"
                        },
                        {
                            key_message: "主要事業部門のパフォーマンス分析において、営業・開発・サポートの各KPIは計画を上回る推移を記録。",
                            blocks: [
                                {
                                    type: "card",
                                    title: "営業部門: 売上構成比率",
                                    blocks: [
                                        {
                                            type: "chart",
                                            chart_type: "donut",
                                            data: [
                                                { label: "AIソリューション", value: 55, color: "#00205B" },
                                                { label: "コンサルティング", value: 30, color: "#3b82f6" },
                                                { label: "保守・サポート", value: 15, color: "#10b981" }
                                            ]
                                        },
                                        {
                                            type: "text",
                                            content: "生成AIを活用した「AIソリューション」が全体の55%を占め、最重要成長ドライバーへ成長。コンサルティングと保守サービスがその導入と維持を強力に補完しています。"
                                        }
                                    ]
                                },
                                {
                                    type: "card",
                                    title: "開発部門: リリースリードタイム (日)",
                                    blocks: [
                                        {
                                            type: "chart",
                                            chart_type: "line",
                                            data: [
                                                { label: "4月", value: 20 },
                                                { label: "5月", value: 16 },
                                                { label: "6月", value: 14 }
                                            ]
                                        },
                                        {
                                            type: "text",
                                            content: "CI/CDパイプラインの自動化および開発プロセスの標準化により、平均リリースリードタイムが4月の20日から6月には14日（-30%）へ大幅に短縮され、リリース速度が加速しています。"
                                        }
                                    ]
                                },
                                {
                                    type: "card",
                                    title: "インフラ部門: サーバー可用性 (SLA%)",
                                    blocks: [
                                        {
                                            type: "chart",
                                            chart_type: "column",
                                            data: [
                                                { label: "東京", value: 99.9, color: "#10b981" },
                                                { label: "大阪", value: 99.5, color: "#3b82f6" },
                                                { label: "ソウル", value: 98.8, color: "#94a3b8" }
                                            ]
                                        },
                                        {
                                            type: "text",
                                            content: "東京・大阪リージョンでは目標SLA（99.5%以上）を安定してクリア。ソウルリージョンについては、ネットワーク経路の冗長化を進め、可用性の向上に努めています。"
                                        }
                                    ]
                                }
                            ],
                            speaker_notes: "部門別の詳細KPIを多角的に分析し、成長要因と今後の投資効率を可視化するスライドです。"
                        },
                        {
                            key_message: "先行導入したサポート部門では、問い合わせ対応の省力化と品質向上のダブルインパクトを実証。",
                            blocks: [
                                {
                                    type: "list",
                                    items: [
                                        "先行してAIアシスタントを導入したカスタマーサポート部門における12ヶ月目の実績データです。",
                                        "顧客対応スピードの大幅な向上と、エージェントの負荷軽減に成功しています。"
                                    ]
                                },
                                {
                                    type: "card",
                                    title: "カスタマーサポート部門 導入効果",
                                    emphasis: "high",
                                    blocks: [
                                        {
                                            type: "kpi_metrics",
                                            metrics: [
                                                { label: "AI自己解決率", value: "75%", trend: "up", trendValue: "+45pt" },
                                                { label: "初回応答時間", value: "1.2分", trend: "down", trendValue: "-90%" }
                                            ]
                                        },
                                        {
                                            type: "text",
                                            content: "AIによる一次受付が機能し、有人対応が必要な難易度の高い案件へのリソース集中が可能になりました。"
                                        }
                                    ]
                                }
                            ],
                            speaker_notes: "ネスト構造を用いた導入効果のハイライトスライドです。"
                        },
                        {
                            key_message: "流入する問い合わせの約8割をAIで自己解決させ、有人サポートを高度な個別対応に集中させる。",
                            blocks: [
                                {
                                    type: "text",
                                    content: `カスタマーサポート部門における月間の問い合わせ処理のファネル分析です。
AIエージェントが定型的な問い合わせの大部分を吸収し、有人エスカレーションを最小限に抑えています。`
                                },
                                {
                                    type: "funnel",
                                    title: "AI導入後の問い合わせ処理ファネル",
                                    stages: [
                                        { label: "総問い合わせ件数", value: 10000 },
                                        { label: "AIによる自己解決", value: 7500 },
                                        { label: "有人対応エスカレーション", value: 2500 }
                                    ]
                                }
                            ],
                            speaker_notes: "ファネル図による処理プロセスの可視化です。"
                        },
                        {
                            key_message: "全社導入を成功させるための重要マイルストーンは、以下の5ステップで順次遂行する。",
                            blocks: [
                                {
                                    type: "text",
                                    content: "プロジェクトの成否を左右する重要ステップを、依存関係を考慮した順序で整理しました。各フェーズのゲートレビューで承認を得てから次に進むことを必須とします。"
                                },
                                {
                                    type: "list",
                                    style: "numbered",
                                    items: [
                                        "AI CoE（推進組織）の設立とガバナンスポリシーの策定",
                                        "パイロット部門（営業・法務）でのPoC実施と効果測定",
                                        "データ基盤整備：社内ナレッジのベクトル化とRAG環境構築",
                                        "セキュリティ監査の実施とAI利用ガイドラインの全社展開",
                                        "全部門へのロールアウトと継続的なモニタリング体制の確立"
                                    ]
                                }
                            ],
                            speaker_notes: "番号付きリストを用いたアクションプランの提示です。"
                        },
                        {
                            key_message: "",
                            blocks: [
                                {
                                    type: "quote",
                                    text: "AIは私たちの仕事を奪うのではなく、私たちが本当にやるべき創造的な仕事に集中させてくれる強力なパートナーだ。",
                                    author: "山田 太郎",
                                    role: "代表取締役社長 / 株式会社 未来テクノロジー"
                                }
                            ],
                            speaker_notes: "社長からのメッセージによる締めくくりです。"
                        }
                    ]
                }),
                citations: []
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
