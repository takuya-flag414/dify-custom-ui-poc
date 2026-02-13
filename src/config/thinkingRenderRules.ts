/**
 * Thinking Process Rendering Rules
 * 思考プロセスの各ステップをどのように表示するかを定義するルールセット
 */

export type RenderMode = 'monologue' | 'action' | 'silent';

interface ThinkingStep {
    id?: string;
    title?: string;
    nodeType?: string;
    iconType?: string;
    status?: 'pending' | 'processing' | 'done' | 'error';
    thinking?: string;
    resultValue?: string;
    errorMessage?: string;
    renderMode?: 'silent' | 'action' | 'monologue';
}

export const THINKING_RENDER_RULES = {
    // 1. Silent Mode: これらに一致する場合は表示しない（最終回答生成など）
    silentPatterns: [
        /final_response/i,
        /parameter_extraction/i
    ],

    // 2. Action Mode: ツール実行や検索など、明確なアクション
    actionTypes: [
        'tool',
        'knowledge-retrieval',
        'retriever',
        'search',
        'request',
        'document-extractor',
        'llm',
        'http-request',
        'iteration',
        'writing'
    ],

    // タイトルに以下のキーワードが含まれる場合もActionとみなす
    actionTitleKeywords: [
        'Web検索',
        'Search',
        '検索',
        'Tool',
        'ツール',
        'Retrieving',
        'Fetching',
        'HTTP',
        'ファイル検索ストア',
        '社内データ'
    ]
};

/**
 * ノード情報からレンダリングモードを決定するヘルパー関数
 */
export const determineRenderMode = (step: ThinkingStep): RenderMode => {
    // 0. 明示的なモード指定のチェック (最優先)
    if (step.renderMode) {
        return step.renderMode;
    }

    // エラーがある場合は必ず表示（Actionとして扱い、エラーアイコンを出すのが適切）
    if (step.status === 'error') return 'action';

    const title = step.title || '';
    const nodeType = step.nodeType || '';
    const iconType = step.iconType || '';

    // 1. Silent Check
    if (THINKING_RENDER_RULES.silentPatterns.some(pattern => pattern.test(title))) {
        return 'silent';
    }

    // 2. Action Check
    if (
        THINKING_RENDER_RULES.actionTypes.includes(nodeType) ||
        THINKING_RENDER_RULES.actionTypes.includes(iconType) ||
        THINKING_RENDER_RULES.actionTitleKeywords.some(keyword => title.includes(keyword))
    ) {
        return 'action';
    }

    // Default to Monologue
    return 'monologue';
};
