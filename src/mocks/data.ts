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
            text: '「次世代エンタープライズDX戦略」に関する戦略スライドを作成しました！🪄\n\nご要望通り、表やグラフ（ROI）、Mermaidを用いたアーキテクチャ図などをふんだんに盛り込み、コンサルティングファーム水準の全7枚の長大スライドとして構成しています。\n新しい動的レイアウトエンジン（Dynamic Slide Engine）が、各スライドの要素量や重み（Weight）に応じて最適なグリッド（左右分割、3カラムなど）を自動選択して美しく描画しています。右側のパネルでご確認ください。',
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
                                    active_index: 0,
                                    items: [
                                        { title: "1. 経営環境の変化と生成AI導入の必要性", subtitle: "競合動向および社内オペレーションの課題", duration: "10 min" },
                                        { title: "2. コスト管理とセキュリティ設計方針", subtitle: "RAGアーキテクチャとセキュリティ緩和策", duration: "20 min" },
                                        { title: "3. 3段階の導入ロードマップと推進体制（AI CoE）", subtitle: "フェーズ別マイルストーンと組織改編", duration: "15 min" },
                                        { title: "4. リスク要因と投資対効果（ROI）予測", subtitle: "ハルシネーション対策と3年間のコスト削減効果", duration: "15 min" }
                                    ]
                                }
                            ],
                            speaker_notes: "本日の全体アジェンダと各パートの時間配分です。まずは第1パートから入ります。"
                        },
                        {
                            key_message: "生成AIの全社導入により、定型業務を極限まで自動化し、創造的なコア業務へのリソース集中を実現する。",
                            blocks: [
                                {
                                    type: "text",
                                    content: "【エグゼクティブ・サマリー】\n現在の労働市場の縮小とコスト増大に対応するため、従来のRPAやSaaS導入といった局所的な改善から、LLM（大規模言語モデル）を中核とした「全社プロセスの自律化」へパラダイムシフトを図る必要があります。"
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
                            key_message: "現状のオペレーションは限界を迎えつつあり、人的リソースの枯渇が事業成長の最大のボトルネックとなっている。",
                            blocks: [
                                {
                                    type: "text",
                                    content: "社内ヒアリングおよび業務量調査の結果、特にバックオフィス部門と営業支援部門において、深刻なリソース不足が顕在化しています。\n日々の「検索」「集計」「転記」といった非付加価値業務に多大な時間が割かれており、既存のシステムでは対応しきれない非構造化データの処理が課題です。"
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
                            key_message: "本戦略を実行することで、圧倒的な生産性向上とコスト削減のダブルインパクトをもターンす。",
                            blocks: [
                                {
                                    type: "key_value_card",
                                    title: "定型業務の自動化率",
                                    value: "+40%"
                                },
                                {
                                    type: "key_value_card",
                                    title: "社内ナレッジ検索時間",
                                    value: "-70%"
                                },
                                {
                                    type: "key_value_card",
                                    title: "顧客対応キャパシティ",
                                    value: "3倍"
                                }
                            ],
                            speaker_notes: "AI導入によって得られる定量インパクトのハイライトです。"
                        },
                        {
                            key_message: "競合他社は既にAI投資を加速しており、自社のみが旧来のプロセスに留まることは致命的な競争力低下を招く。",
                            blocks: [
                                {
                                    type: "text",
                                    content: "市場の主要プレイヤーとのケイパビリティ比較です。\nトップランナーであるA社は既に全社規模でのLLM展開を完了しており、商品企画からカスタマーサポートに至るまでAIネイティブなプロセスを構築しています。"
                                },
                                {
                                    type: "comparison_table",
                                    headers: ["評価軸", "自社 (現状)", "自社 (AI導入後)", "A社 (競合)", "B社 (競合)"],
                                    rows: [
                                        ["情報検索スピード", "手動 (数時間)", "即時 (数秒)", "即時 (数秒)", "部分自動化"],
                                        ["文書作成の自動化", "未対応", "80%自動化", "75%自動化", "未対応"],
                                        ["顧客対応の24時間化", "未対応", "対応済", "対応済", "未対応"],
                                        ["システム開発アジリティ", "低い", "極めて高い", "高い", "中程度"],
                                        ["データ活用レベル", "限定的", "予測・最適化", "予測・最適化", "集計レベル"]
                                    ]
                                }
                            ],
                            speaker_notes: "競合比較です。"
                        },
                        {
                            key_message: "フロントオフィス（営業部門）においては、提案活動の品質向上とリードタイムの大幅短縮を実現する。",
                            blocks: [
                                {
                                    type: "text",
                                    content: "最も収益に直結する営業部門では、セールス担当者の本来の業務である「顧客との対話」に時間を割けるよう、バックグラウンド業務をLLMに委譲します。"
                                },
                                {
                                    type: "list",
                                    items: [
                                        "【提案書ドラフトの自動生成】: 過去の類似案件や顧客企業の最新IR情報を読み込み、骨子を自動作成",
                                        "【商談議事録とCRM連携】: 商談の音声データからネクストアクションを抽出し、SFA/CRMへ自動入力",
                                        "【見積書チェック】: 過去の受注データと照合し、リスクや原価異常を自動で検知・アラート"
                                    ]
                                }
                            ],
                            speaker_notes: "営業部門でのユースケース詳細です。"
                        },
                        {
                            key_message: "バックオフィス（管理部門）においては、膨大な規定照会とドキュメント作成作業をAIが代替する。",
                            blocks: [
                                {
                                    type: "text",
                                    content: "人事、法務、経理などのコストセンターにおいては、属人化しやすい専門知識の共有と定型処理のスピードアップが急務です。"
                                },
                                {
                                    type: "list",
                                    items: [
                                        "【法務】: 契約書の一次レビュー自動化と、自社有利・不利条項の瞬時ハイライト",
                                        "【人事】: 社員からの「就業規則」「福利厚生」に関する問い合わせを24時間対応チャットボットで一次対応",
                                        "【経理】: 請求書のPDFから必要な項目をOCRとLLMの組み合わせで高精度に抽出し、ERPへ自動起票"
                                    ]
                                }
                            ],
                            speaker_notes: "バックオフィス部門でのユースケース詳細です。"
                        },
                        {
                            key_message: "本日の検討アジェンダ",
                            blocks: [
                                {
                                    type: "agenda",
                                    active_index: 1,
                                    items: [
                                        { title: "1. 経営環境の変化と生成AI導入の必要性", subtitle: "競合動向および社内オペレーションの課題", duration: "10 min" },
                                        { title: "2. コスト管理とセキュリティ設計方針", subtitle: "RAGアーキテクチャとセキュリティ緩和策", duration: "20 min" },
                                        { title: "3. 3段階の導入ロードマップと推進体制（AI CoE）", subtitle: "フェーズ別マイルストーンと組織改編", duration: "15 min" },
                                        { title: "4. リスク要因と投資対効果（ROI）予測", subtitle: "ハルシネーション対策と3年間のコスト削減効果", duration: "15 min" }
                                    ]
                                }
                            ],
                            speaker_notes: "第2パートである「コスト管理とセキュリティ設計方針」についてご説明します。"
                        },
                        {
                            key_message: "社内データを統合し、セキュアな環境でLLMを活用する「AI基盤アーキテクチャ」を構築する。",
                            blocks: [
                                {
                                    type: "text",
                                    content: "既存の社内データベースやドキュメントストレージ（SharePoint, Google Drive等）をクローリングし、ベクトルデータベースにインデックス化します。\nこれにより、従業員は社内の独自ナレッジに基づいた回答をセキュアに引き出すことが可能となります（RAGアプローチ）。"
                                },
                                {
                                    type: "mermaid",
                                    code: "graph TD\n    A[ユーザーUI] --> B(API Gateway)\n    B --> C{LLM Orchestrator}\n    C --> D[Vector DB / RAG]\n    D -.-> E[(社内システム)]\n    D -.-> F[(社内ドキュメント)]\n    C --> G[OpenAI / Anthropic]\n    C --> H[社内規定フィルター]\n    style A fill:#f9f,stroke:#333,stroke-width:2px"
                                }
                            ],
                            speaker_notes: "システムアーキテクチャです。"
                        },
                        {
                            key_message: "エンタープライズでの導入に必須となる強固なセキュリティ・コンプライアンス要件を完全に満たす。",
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
                            speaker_notes: "セキュリティとコンプライアンスについてです。"
                        },
                        {
                            key_message: "本日の検討アジェンダ",
                            blocks: [
                                {
                                    type: "agenda",
                                    active_index: 2,
                                    items: [
                                        { title: "1. 経営環境の変化と生成AI導入の必要性", subtitle: "競合動向および社内オペレーションの課題", duration: "10 min" },
                                        { title: "2. コスト管理とセキュリティ設計方針", subtitle: "RAGアーキテクチャとセキュリティ緩和策", duration: "20 min" },
                                        { title: "3. 3段階の導入ロードマップと推進体制（AI CoE）", subtitle: "フェーズ別マイルストーンと組織改編", duration: "15 min" },
                                        { title: "4. リスク要因と投資対効果（ROI）予測", subtitle: "ハルシネーション対策と3年間のコスト削減効果", duration: "15 min" }
                                    ]
                                }
                            ],
                            speaker_notes: "第3パートである「3段階の導入ロードマップと推進体制」についてご説明します。"
                        },
                        {
                            key_message: "本質的な変革を実現するため、3段階のフェーズに分けた着実なロードマップを推進する。",
                            blocks: [
                                {
                                    type: "content_card",
                                    title: "Phase 1: PoC・基盤構築 (1-3ヶ月)",
                                    description: "一部の先行部門（IT・人事）に限定してAIアシスタントを導入し、セキュリティ要件のクリアと基本機能の検証を行う。",
                                    points: [
                                        "セキュアなLLM環境の構築",
                                        "社内ガイドラインの策定",
                                        "キーユーザーの育成"
                                    ]
                                },
                                {
                                    type: "content_card",
                                    title: "Phase 2: 全社展開 (4-9ヶ月)",
                                    description: "全社員向けにAIツールを開放し、部門特有の業務（営業資料作成、契約書チェック等）へのユースケースを拡大する。",
                                    points: [
                                        "説明会およびプロンプト研修",
                                        "社内ナレッジ（RAG）の拡充",
                                        "利用ログの分析と改善"
                                    ]
                                },
                                {
                                    type: "content_card",
                                    title: "Phase 3: 自律化 (10ヶ月~)",
                                    description: "単なる「対話型AI」から脱却し、社内システムとAPI連携してタスクを自動実行する「AIエージェント」へと進化させる。",
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
                            key_message: "全社的なAI活用を牽引するため、部門横断型の「AI CoE (Center of Excellence)」を設置する。",
                            blocks: [
                                {
                                    type: "text",
                                    content: "現場にツールの利用を丸投げするのではなく、経営直下に推進組織を設置し、各事業部との橋渡しを行います。"
                                },
                                {
                                    type: "mermaid",
                                    code: "graph TD\n    A[経営層 (Sponsor)] --> B{AI CoE (推進組織)}\n    B --> C[IT部門 (インフラ提供)]\n    B --> D[法務・リスク管理 (ガバナンス)]\n    B --> E[各事業部アンバサダー]\n    E --> F[営業部門]\n    E --> G[バックオフィス]\n    E --> H[開発部門]\n    style B fill:#3b82f6,color:#fff,stroke:#1d4ed8,stroke-width:2px"
                                }
                            ],
                            speaker_notes: "推進体制とAI CoEについてです。"
                        },
                        {
                            key_message: "本日の検討アジェンダ",
                            blocks: [
                                {
                                    type: "agenda",
                                    active_index: 3,
                                    items: [
                                        { title: "1. 経営環境の変化と生成AI導入の必要性", subtitle: "競合動向および社内オペレーションの課題", duration: "10 min" },
                                        { title: "2. コスト管理とセキュリティ設計方針", subtitle: "RAGアーキテクチャとセキュリティ緩和策", duration: "20 min" },
                                        { title: "3. 3段階の導入ロードマップと推進体制（AI CoE）", subtitle: "フェーズ別マイルストーンと組織改編", duration: "15 min" },
                                        { title: "4. リスク要因と投資対効果（ROI）予測", subtitle: "ハルシネーション対策と3年間のコスト削減効果", duration: "15 min" }
                                    ]
                                }
                            ],
                            speaker_notes: "第4パートである「リスク要因と投資対効果（ROI）予測」についてご説明します。"
                        },
                        {
                            key_message: "導入プロジェクトにおける主要な想定リスクと、それに対する具体的かつ実効性のある緩和策を定義。",
                            blocks: [
                                {
                                    type: "comparison_table",
                                    headers: ["リスク要因", "影響度", "発生確率", "緩和策 (Mitigation)"],
                                    rows: [
                                        ["ハルシネーションによる誤った意思決定", "高", "中", "RAGによる自社データへのグラウンディング徹底、および人間による最終確認(HITL)ルールの制定"],
                                        ["従業員のITリテラシー不足・活用低迷", "中", "高", "各部門のアンバサダーを通じた定期的なプロンプト共有会、および業務フローへの組み込み(API化)"],
                                        ["予期せぬAPIコストの高騰", "中", "低", "トークン使用量のダッシュボード監視と、部門別の上限アラート設定の導入"]
                                    ]
                                }
                            ],
                            speaker_notes: "リスク要因とその緩和策についてのまとめです。"
                        },
                        {
                            key_message: "初期投資は初年度に集中するものの、2年目以降から大幅なコスト削減効果が発現し、3年目で投資回収を完了する。",
                            blocks: [
                                {
                                    type: "text",
                                    content: "システム構築およびライセンス費用として初年度に約1.5億円を投下します。\nしかし、2年目からは定型業務の自動化による人件費抑制効果（年間約2.2億円）が初期投資を上回り、大きなフリーキャッシュフローを生み出します。"
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
                            // テスト: key_value_card の unit / change / trend
                            key_message: "AI導入12ヶ月後、主要KPIはすべて計画値を上回り、ROI目標を早期達成した。",
                            blocks: [
                                {
                                    type: "key_value_card",
                                    label: "業務自動化率",
                                    value: "43",
                                    unit: "%",
                                    change: "+3pt (計画比)",
                                    trend: "up"
                                },
                                {
                                    type: "key_value_card",
                                    label: "ナレッジ検索時間",
                                    value: "-72",
                                    unit: "%",
                                    change: "目標値: -70%",
                                    trend: "down"
                                },
                                {
                                    type: "key_value_card",
                                    label: "月間APIコスト",
                                    value: "218",
                                    unit: "万円",
                                    change: "前月比 +2%",
                                    trend: "flat"
                                }
                            ],
                            speaker_notes: "key_value_card の unit/change/trend のテストスライドです。"
                        },
                        {
                            // テスト: list の style: numbered
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
                            speaker_notes: "list style: numbered のテストスライドです。"
                        },
                        {
                            // テスト: quote ブロック
                            key_message: "",
                            blocks: [
                                {
                                    type: "quote",
                                    text: "AIは私たちの仕事を奪うのではなく、私たちが本当にやるべき仕事に集中させてくれる道具だ。",
                                    author: "山田 太郎",
                                    role: "代表取締役社長 / 株式会社 未来テクノロジー"
                                }
                            ],
                            speaker_notes: "quote ブロックのテストスライドです。"
                        },
                        {
                            key_message: "メンター・メンティーのマッチングにおいては、メンタリングの質向上のため、メンターの希望を基準としつつ、メンティーの希望もプロセスに組み込んだマッチングフローを構築する。",
                            blocks: [
                                {
                                    type: "timeline",
                                    direction: "horizontal",
                                    show_arrows: true,
                                    steps: [
                                        {
                                            title: "1. ショートリスト作成",
                                            owner: "事務局",
                                            content: [
                                                "以下の条件でショートリストを作成\n  - 業界(異業種)\n  - 所在地(近接所在地)\n  - 社会人年数(年次逆転NG)\n  - メンタリング経験(未経験同士は可能な限り回避)",
                                                "各メンター・メンティーにショートリストを送付"
                                            ]
                                        },
                                        {
                                            title: "2. マッチング希望者の選定",
                                            owner: "メンター・メンティー",
                                            content: [
                                                "ショートリストをもとに、マッチング希望者の上位5名を選定",
                                                "順位を記入し事務局へショートリストを返送"
                                            ]
                                        },
                                        {
                                            title: "3. マッチング最終化",
                                            owner: "事務局",
                                            content: [
                                                "以下の優先順位でマッチングを最終化(詳細後述)\n  - 両者の希望が一致\n  - メンターの希望\n  - メンティーの希望や話題の互換性等",
                                                "マッチング相手をメンター・メンティーに連絡\n  - 連絡先は個別案内\n  - プロフィール集を全員へ送付"
                                            ]
                                        }
                                    ]
                                }
                            ],
                            speaker_notes: "マッチングフローの手順説明スライドです。"
                        },
                        {
                            key_message: "自社のポジショニングを明確化し、価格と品質のバランスにおいて競合に対する優位性を確立する。",
                            blocks: [
                                {
                                    type: "matrix_2x2",
                                    title: "競合マトリックス",
                                    xAxisLabel: "価格",
                                    yAxisLabel: "品質",
                                    items: [
                                        { label: "自社", x: 0.8, y: 0.9 },
                                        { label: "A社", x: 0.3, y: 0.4 },
                                        { label: "B社", x: 0.9, y: 0.6 }
                                    ]
                                }
                            ],
                            speaker_notes: "競合マトリックスを用いた価格・品質ポジショニング分析スライドです。"
                        },
                        {
                            key_message: "主要な事業継続KPIは順調に推移しており、特にMAU（月間アクティブユーザー）が大幅な増加傾向を示している。",
                            blocks: [
                                {
                                    type: "card",
                                    title: "主要KPI概要 (コンテナ)",
                                    emphasis: "high",
                                    blocks: [
                                        {
                                            type: "kpi_metrics",
                                            metrics: [
                                                { label: "MAU", value: "120万", trend: "up", trendValue: "+15%" },
                                                { label: "チャーンレート", value: "1.2%", trend: "down", trendValue: "-0.3pt" }
                                            ]
                                        },
                                        {
                                            type: "text",
                                            content: "ネストされたKPIとテキストです。順調に推移しています。"
                                        }
                                    ]
                                }
                            ],
                            speaker_notes: "ネスト対応コンテナのテストスライドです。"
                        },
                        {
                            key_message: "次世代サービスのメインターゲット層として、若年層・高所得層・テック層の3つのセグメントを定義する。",
                            blocks: [
                                {
                                    type: "venn_diagram",
                                    title: "ターゲット層",
                                    items: ["若年層", "高所得層", "テック層"]
                                }
                            ],
                            speaker_notes: "ターゲット層のベン図テストスライドです。"
                        },
                        {
                            key_message: "認知から受注に至るセールスファネルの歩留まり率を改善し、最終コンバージョン率の底上げを図る。",
                            blocks: [
                                {
                                    type: "funnel",
                                    title: "セールスファネル推移",
                                    stages: [
                                        { label: "リード獲得", value: 10000 },
                                        { label: "MQL", value: 4500 },
                                        { label: "受注", value: 300 }
                                    ]
                                }
                            ],
                            speaker_notes: "ファネル図のテストスライドです。"
                        },
                        {
                            key_message: "投資効率（ROI）が最も高いDX推進施策へ優先的に予算を集中し、全体の生産性を極大化させる。",
                            blocks: [
                                {
                                    type: "comparison_table",
                                    emphasis_row: 1,
                                    headers: ["施策", "コスト", "見込み効果"],
                                    rows: [
                                        ["SNS広告", "中", "小"],
                                        ["DX推進", "高", "大 (ROI 300%)"],
                                        ["展示会", "高", "中"]
                                    ]
                                }
                            ],
                            speaker_notes: "比較表のハイライトテストスライドです。"
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
