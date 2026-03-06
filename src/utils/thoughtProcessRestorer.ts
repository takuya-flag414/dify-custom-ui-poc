// src/utils/thoughtProcessRestorer.ts
// process_logs から thoughtProcess 配列を再構築するユーティリティ
//
// 会話復元時に、最終回答LLMが出力した process_logs フィールドから
// リアルタイム実行時と同一の ThinkingProcess ステップ配列を再構築する。

import type { ProcessLogs } from './responseParser';

/**
 * ThinkingProcess のステップ型
 * ThinkingProcess.jsx が受け取る steps 配列の各要素と同一構造
 */
export interface ThoughtStep {
    id: string;
    title: string;
    status: 'done';
    iconType: string;
    renderMode?: 'silent' | 'action' | 'monologue';
    thinkingText?: string;
    thinking?: string;
    reasoning?: string;
    resultLabel?: string;
    resultValue?: string;
}

/**
 * used_rag / used_web フラグから Intent Analysis の判定ラベルとresultValueを決定する
 */
const getIntentDisplayInfo = (usedRag: boolean, usedWeb: boolean): { title: string; resultValue: string } => {
    if (usedRag && usedWeb) {
        return { title: '判定: 🛠️ タスク実行', resultValue: '🔍 社内＋Webを調査します' };
    } else if (usedRag) {
        return { title: '判定: 🛠️ タスク実行', resultValue: '🔍 社内＋Webを調査します' };
    } else if (usedWeb) {
        return { title: '判定: 🔍 Web検索モード', resultValue: '🌐 Webから情報を取得します' };
    } else {
        return { title: '判定: 💬 会話モード', resultValue: '💡 内部知識で回答します' };
    }
};

/**
 * 最終回答ステップのタイトルを決定する
 */
const getFinalStepTitle = (usedRag: boolean, usedWeb: boolean): string => {
    if (usedRag && usedWeb) return '検索結果から回答を生成中...';
    if (usedRag) return '検索結果から回答を生成中...';
    if (usedWeb) return '検索結果から回答を生成中...';
    return '回答を生成中...';
};

/**
 * boolean | string 型の値を boolean に変換するヘルパー
 * Dify の conversation variable は文字列 "true"/"false" で返ることがある
 */
const toBool = (value: boolean | string | undefined): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return false;
};

/**
 * process_logs から ThinkingProcess の steps 配列を再構築する
 *
 * 生成されるステップの順序はリアルタイム実行時と同一:
 * 1. Intent Analysis (常に)
 * 2. ストア要約 (is_store_summary_executed == true)
 * 3. RAG戦略 (rag_strategy.thinking が存在)
 * 4. RAG検索 (is_rag_search_executed == true)
 * 5. Web検索戦略 (web_search_strategy.reasoning が存在)
 * 6. Web検索 (is_web_search_executed == true)
 * 7. 最終回答生成 (常に)
 *
 * @param processLogs - LLM出力の process_logs オブジェクト
 * @param usedRag - RAGが使用されたか
 * @param usedWeb - Web検索が使用されたか
 * @returns ThoughtStep[] - 再構築された thoughtProcess 配列
 */
export const rebuildThoughtProcess = (
    processLogs: ProcessLogs,
    usedRag: boolean,
    usedWeb: boolean
): ThoughtStep[] => {
    const steps: ThoughtStep[] = [];
    let stepIndex = 0;

    const generateId = () => `restored_${stepIndex++}_${Date.now()}`;

    // 1. Intent Analysis (常に生成)
    const intentDisplay = getIntentDisplayInfo(usedRag, usedWeb);
    steps.push({
        id: generateId(),
        title: intentDisplay.title,
        status: 'done',
        iconType: 'router',
        renderMode: 'monologue',
        thinkingText: '質問の意図を解析しています...',
        thinking: processLogs.intent_analysis?.thinking || '',
        resultLabel: '検索方針',
        resultValue: intentDisplay.resultValue,
    });

    // 2. ストア要約 (is_store_summary_executed == true)
    if (toBool(processLogs.is_store_summary_executed)) {
        steps.push({
            id: generateId(),
            title: '社内データに接続中',
            status: 'done',
            iconType: 'file-search',
            renderMode: 'action',
        });
    }

    // 3. RAG戦略 (rag_strategy.thinking が存在する場合のみ)
    if (processLogs.rag_strategy?.thinking) {
        steps.push({
            id: generateId(),
            title: '検索戦略を策定中...',
            status: 'done',
            iconType: 'reasoning',
            renderMode: 'monologue',
            thinkingText: '検索戦略を策定中...',
            thinking: processLogs.rag_strategy.thinking,
        });
    }

    // 4. RAG検索 (is_rag_search_executed == true)
    if (toBool(processLogs.is_rag_search_executed)) {
        steps.push({
            id: generateId(),
            title: '📂 社内データを検索中...',
            status: 'done',
            iconType: 'file-search',
        });
    }

    // 5. Web検索戦略 (web_search_strategy.reasoning が存在する場合のみ)
    if (processLogs.web_search_strategy?.reasoning) {
        steps.push({
            id: generateId(),
            title: '検索戦略を策定中...',
            status: 'done',
            iconType: 'reasoning',
            renderMode: 'monologue',
            thinkingText: '検索戦略を策定中...',
            reasoning: processLogs.web_search_strategy.reasoning,
        });
    }

    // 6. Web検索 (is_web_search_executed == true)
    if (toBool(processLogs.is_web_search_executed)) {
        steps.push({
            id: generateId(),
            title: 'Web検索中...',
            status: 'done',
            iconType: 'search',
        });
    }

    // 7. 最終回答生成 (常に生成)
    steps.push({
        id: generateId(),
        title: getFinalStepTitle(usedRag, usedWeb),
        status: 'done',
        iconType: 'writing',
        renderMode: 'silent',
        thinkingText: '回答を生成中...',
    });

    return steps;
};
