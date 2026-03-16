// src/hooks/chat/nodeEventHandlers.js
// useChat.js から分離したノードイベント処理

import { NODE_DISPLAY_MAP, HIDDEN_NODE_PREFIXES } from './constants';
import { extractJsonFromLlmOutput } from '../../utils/llmOutputParser';

/**
 * ファイル名を動的に取得するヘルパー関数
 * @param {Object} inputs - ノードの入力パラメータ
 * @param {Array} sessionFiles - セッションファイル
 * @param {Array} displayFiles - 表示用ファイル
 * @returns {string} ファイル名
 */
const getFileNameToDisplay = (inputs, sessionFiles, displayFiles) => {
    if (inputs.target_file) {
        return inputs.target_file;
    }

    const allActiveFiles = [...sessionFiles, ...displayFiles];
    const inputValues = JSON.stringify(inputs);
    const matchedFile = allActiveFiles.find(f => inputValues.includes(f.name) || inputValues.includes(f.id));

    if (matchedFile) {
        return matchedFile.name;
    } else if (allActiveFiles.length === 1) {
        return allActiveFiles[0].name;
    } else if (allActiveFiles.length > 1) {
        return `${allActiveFiles.length}件のファイル`;
    }
    return '添付ファイル';
};

/**
 * node_started イベントを処理する
 * @param {Object} data - SSEイベントデータ
 * @param {Object} context - コンテキストオブジェクト
 * @returns {Object|null} { displayTitle, iconType, detectedTraceMode } または null（非表示ノード）
 */
export const processNodeStarted = (data, context) => {
    const { sessionFiles, displayFiles, capturedOptimizedQuery, userText } = context;

    const nodeType = data.data?.node_type;
    const title = data.data?.title;
    const inputs = data.data?.inputs || {};

    // 1. 非表示ノードのチェック
    const isHiddenNode = HIDDEN_NODE_PREFIXES.some(prefix => title?.startsWith(prefix));
    if (isHiddenNode) {
        return null;
    }

    // 2. マッピングテーブルから表示情報を取得
    const mapping = title ? NODE_DISPLAY_MAP[title] : null;

    let displayTitle = null;
    let iconType = 'default';
    let detectedTraceMode = null;
    let renderMode = null;
    let thinkingText = null; // ★追加: Thinkingプレースホルダーのテキスト

    if (mapping) {
        // マッピングテーブルにマッチした場合
        displayTitle = mapping.title;
        iconType = mapping.icon;
        renderMode = mapping.renderMode;
        thinkingText = mapping.thinkingText; // ★追加: マッピングから取得

        // 動的タイトル生成
        if (mapping.dynamic === 'document') {
            const fileNameToDisplay = getFileNameToDisplay(inputs, sessionFiles, displayFiles);
            displayTitle = `ドキュメント「${fileNameToDisplay}」を解析中...`;
            detectedTraceMode = 'document';
        } else if (mapping.dynamic === 'search') {
            const query = inputs.query || capturedOptimizedQuery || userText;
            displayTitle = `Web検索: "${query}"`;
            detectedTraceMode = 'search';
        }
    } else if (nodeType === 'document-extractor') {
        // マッピングにないが document-extractor タイプの場合
        const fileNameToDisplay = getFileNameToDisplay(inputs, sessionFiles, displayFiles);
        displayTitle = `ドキュメント「${fileNameToDisplay}」を解析中...`;
        detectedTraceMode = 'document';
        iconType = 'document';
    } else if (nodeType === 'tool' && title?.includes('Perplexity')) {
        // Perplexity検索のフォールバック
        const query = inputs.query || capturedOptimizedQuery || userText;
        displayTitle = `Web検索: "${query}"`;
        detectedTraceMode = 'search';
        iconType = 'search';
    } else if (nodeType === 'tool' && title?.includes('ファイル検索ストア')) {
        // ファイル検索ストアツールのフォールバック
        displayTitle = '📂 社内データを検索中...';
        detectedTraceMode = 'knowledge';
        iconType = 'file-search';
        thinkingText = '社内データに接続中...';
    } else if (nodeType === 'knowledge-retrieval' || (title && title.includes('ナレッジ'))) {
        // ナレッジ検索
        const query = inputs.query || capturedOptimizedQuery;
        displayTitle = query ? `社内知識を検索: "${query}"` : '社内ナレッジベースを検索中...';
        detectedTraceMode = 'knowledge';
        iconType = 'retrieval';
    } else if (nodeType === 'iteration') {
        // イテレーションノードのフォールバック（並列検索など）
        displayTitle = title || '並列処理中...';
        iconType = 'iteration';
    } else if (nodeType === 'llm') {
        // LLMノード (マッピングにない場合のフォールバック)
        displayTitle = '情報を整理して回答を生成中...';
        iconType = 'writing';
        renderMode = 'silent';
        thinkingText = '回答を生成中...'; // ★追加: フォールバック
    }

    if (!displayTitle) {
        return null;
    }

    return {
        nodeId: data.data?.node_id || `node_${Date.now()}`,
        displayTitle,
        iconType,
        detectedTraceMode,
        renderMode,
        thinkingText // ★追加
    };
};

/**
 * Intent分析結果のユーザーフレンドリーな表現を生成
 * @param {string} category - カテゴリー
 * @param {boolean} requiresRag - RAGが必要か
 * @param {boolean} requiresWeb - Web検索が必要か
 * @returns {Object} { title, resultValue }
 */
const getIntentDisplayInfo = (category, requiresRag, requiresWeb) => {
    // ベースカテゴリーの表現
    const categoryLabels = {
        'TASK': { emoji: '🛠️', label: 'タスク実行' },
        'CHAT': { emoji: '💬', label: 'おしゃべり' },
        'QUESTION': { emoji: '❓', label: '質問回答' },
        'ANALYSIS': { emoji: '📊', label: '分析' },
        // 旧フォーマット互換
        'SEARCH': { emoji: '🔍', label: 'Web検索' },
        'LOGICAL': { emoji: '🧠', label: '論理回答' },
        'ANSWER': { emoji: '💡', label: '内部知識' },
        'HYBRID': { emoji: '🔍', label: 'ハイブリッド検索' },
    };

    // RAG/Webフラグの組み合わせ表現
    const searchModeLabels = {
        'rag_web': { emoji: '🔍', suffix: '社内＋Webを調査します' },
        'rag_only': { emoji: '📁', suffix: '社内データを確認します' },
        'web_only': { emoji: '🌐', suffix: 'Webで情報を探します' },
        'none': { emoji: '💡', suffix: 'AIが直接お答えします' },
    };

    const base = categoryLabels[category] || { emoji: '🤖', label: '処理' };

    // 新フォーマットの場合のみRAG/Web判定
    if (requiresRag !== undefined || requiresWeb !== undefined) {
        const searchKey = requiresRag && requiresWeb ? 'rag_web' :
            requiresRag ? 'rag_only' :
                requiresWeb ? 'web_only' : 'none';
        const search = searchModeLabels[searchKey];

        return {
            title: `${base.emoji} ${base.label}`,
            resultValue: `${search.emoji} ${search.suffix}`,
        };
    }

    // 旧フォーマットの場合はカテゴリーのみ表示
    return {
        title: `${base.emoji} ${base.label}`,
        resultValue: null,
    };
};

/**
 * node_finished イベントを処理する (LLM_Query_Rewrite)
 * @param {Object} outputs - ノード出力
 * @param {string} nodeId - ノードID
 * @param {Function} addLog - ログ関数
 * @returns {Object|null} { optimizedQuery, thoughtProcessUpdate } または null
 */
export const processQueryRewriteFinished = (outputs, nodeId, addLog) => {
    const rawText = outputs?.text;
    const parsedJson = extractJsonFromLlmOutput(rawText);

    if (parsedJson) {
        const optimizedQuery = parsedJson.optimized_query || '';
        const targetDomains = parsedJson.target_domains || [];

        addLog(`[LLM_Query_Rewrite] thinking: ${parsedJson.thinking || 'N/A'}`, 'info');
        addLog(`[LLM_Query_Rewrite] optimized_query: ${optimizedQuery || 'N/A'}`, 'info');
        addLog(`[LLM_Query_Rewrite] target_domains: ${JSON.stringify(targetDomains)}`, 'info');

        // target_domains をカンマ区切りの表示文字列に変換
        const domainsDisplay = targetDomains.length > 0
            ? targetDomains.join(', ')
            : null;

        return {
            optimizedQuery,
            thoughtProcessUpdate: (t) => t.id === nodeId ? {
                ...t,
                status: 'done',
                thinking: parsedJson.thinking || '',
                resultLabel: '最適化クエリ',
                resultValue: optimizedQuery,
                additionalResults: domainsDisplay ? [
                    { label: '検索対象ドメイン', value: domainsDisplay }
                ] : []
            } : t
        };
    } else if (rawText) {
        addLog(`[LLM_Query_Rewrite] RAW出力: ${rawText}`, 'warn');
        return {
            optimizedQuery: rawText.trim(),
            thoughtProcessUpdate: (t) => t.id === nodeId ? { ...t, status: 'done' } : t
        };
    }

    return null;
};

/**
 * node_finished イベントを処理する (LLM_Intent_Analysis)
 * @param {Object} outputs - ノード出力
 * @param {string} nodeId - ノードID
 * @param {Function} addLog - ログ関数
 * @returns {Object|null} thoughtProcessUpdate または null
 */
export const processIntentAnalysisFinished = (outputs, nodeId, addLog) => {
    const rawText = outputs?.text;
    const parsedJson = extractJsonFromLlmOutput(rawText);

    if (parsedJson) {
        // ログ出力
        addLog(`[Intent_Analysis] thinking: ${parsedJson.thinking || 'N/A'}`, 'info');
        addLog(`[Intent_Analysis] category: ${parsedJson.category || 'N/A'}`, 'info');
        if (parsedJson.session_title) {
            addLog(`[Intent_Analysis] session_title: ${parsedJson.session_title}`, 'info');
        }

        if (parsedJson.requires_rag !== undefined || parsedJson.requires_web !== undefined) {
            addLog(`[Intent_Analysis] requires_rag: ${parsedJson.requires_rag}, requires_web: ${parsedJson.requires_web}`, 'info');
        }
        if (parsedJson.confidence !== undefined) {
            addLog(`[Intent_Analysis] confidence: ${parsedJson.confidence}`, 'info');
        }

        const displayInfo = getIntentDisplayInfo(
            parsedJson.category,
            parsedJson.requires_rag,
            parsedJson.requires_web
        );

        const confidenceText = parsedJson.confidence ? ` (信頼度: ${parsedJson.confidence})` : '';
        const finalResultValue = displayInfo.resultValue
            ? displayInfo.resultValue
            : `${displayInfo.title}${confidenceText}`;

        addLog(`[Intent_Analysis] 判定: ${displayInfo.title}${displayInfo.resultValue ? ' → ' + displayInfo.resultValue : ''}`, 'info');

        // ★追加: internal_log をキャプチャ
        const internalLog = parsedJson.internal_log || '';
        if (internalLog) {
            addLog(`[InternalLog] [Intent_Analysis] ${internalLog}`, 'info');
        }

        return {
            sessionTitle: parsedJson.session_title || null,
            thoughtProcessUpdate: (t) => t.id === nodeId ? {
                ...t,
                title: `判定: ${displayInfo.title}`,
                status: 'done',
                thinking: parsedJson.thinking || '',
                resultLabel: '検索方針',
                resultValue: finalResultValue,
                internalLog: internalLog // ★メッセージデータとして保持
            } : t
        };
    } else if (rawText) {
        addLog(`[Intent_Analysis] RAW出力: ${rawText}`, 'warn');

        // extractJsonFromLlmOutput が失敗した場合のフォールバック
        // RAW出力からJSONを手動で再抽出を試みる
        let fallbackThinking = '';
        let fallbackCategory = null;
        let fallbackRequiresRag = undefined;
        let fallbackRequiresWeb = undefined;

        try {
            // { ... } を直接抽出
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const manualParsed = JSON.parse(jsonMatch[0]);
                fallbackThinking = manualParsed.thinking || '';
                fallbackCategory = manualParsed.category || null;
                fallbackRequiresRag = manualParsed.requires_rag;
                fallbackRequiresWeb = manualParsed.requires_web;
                addLog(`[Intent_Analysis] フォールバックJSON抽出成功: category=${fallbackCategory}`, 'info');
            }
        } catch (e) {
            addLog(`[Intent_Analysis] フォールバックJSON抽出も失敗: ${e.message}`, 'warn');
        }

        // フォールバックからも session_title を抽出
        let fallbackSessionTitle = null;
        try {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const manualParsed = JSON.parse(jsonMatch[0]);
                fallbackSessionTitle = manualParsed.session_title || null;
            }
        } catch (e) {
            // session_title 抽出失敗は無視
        }

        // カテゴリー判定（パース成功時はそちらを優先、失敗時はテキストマッチ）
        const decision = rawText.trim();
        let resultText = '';
        if (fallbackCategory) {
            const displayInfo = getIntentDisplayInfo(fallbackCategory, fallbackRequiresRag, fallbackRequiresWeb);
            resultText = `判定: ${displayInfo.title}`;
        } else {
            if (decision.includes('SEARCH')) resultText = '判定: 🔍 Web検索モード';
            else if (decision.includes('CHAT')) resultText = '判定: 💬 おしゃべりモード';
            else if (decision.includes('LOGICAL')) resultText = '判定: 🧠 論理回答モード';
            else if (decision.includes('ANSWER')) resultText = '判定: 💡 内部知識モード';
            else if (decision.includes('HYBRID')) resultText = '判定: 🔍 ハイブリッド検索モード';
            else if (decision.includes('TASK')) resultText = '判定: 🛠️ タスク実行モード';
        }

        return {
            sessionTitle: fallbackSessionTitle,
            thoughtProcessUpdate: (t) => t.id === nodeId ? {
                ...t,
                title: resultText || t.title,
                status: 'done',
                ...(fallbackThinking ? { thinking: fallbackThinking } : {})
            } : t
        };
    }

    return null;
};

/**
 * recency値をユーザーフレンドリーなラベルに変換
 * @param {string|null} recency - recency値
 * @returns {string} 表示ラベル
 */
const getRecencyLabel = (recency) => {
    const recencyLabels = {
        'day': '🗓️ 1日以内',
        'week': '🗓️ 1週間以内',
        'month': '🗓️ 1ヶ月以内',
        'year': '🗓️ 1年以内',
    };
    return recencyLabels[recency] || '🗓️ 期間指定なし';
};

/**
 * node_finished イベントを処理する (LLM_Search_Strategy)
 * @param {Object} outputs - ノード出力
 * @param {string} nodeId - ノードID
 * @param {Function} addLog - ログ関数
 * @returns {Object|null} thoughtProcessUpdate または null
 */
export const processSearchStrategyFinished = (outputs, nodeId, addLog) => {
    const rawText = outputs?.text;
    const parsedJson = extractJsonFromLlmOutput(rawText);

    if (parsedJson) {
        // ログ出力
        addLog(`[LLM_Search_Strategy] reasoning: ${parsedJson.reasoning || 'N/A'}`, 'info');
        addLog(`[LLM_Search_Strategy] query_main: ${parsedJson.query_main || 'N/A'}`, 'info');
        addLog(`[LLM_Search_Strategy] query_alt: ${parsedJson.query_alt || 'N/A'}`, 'info');
        addLog(`[LLM_Search_Strategy] recency: ${parsedJson.recency || 'N/A'}`, 'info');
        addLog(`[LLM_Search_Strategy] domain_filter: ${JSON.stringify(parsedJson.domain_filter || [])}`, 'info');

        // 追加結果を構築
        const additionalResults = [];

        // 検索モードの表示
        if (parsedJson.search_mode) {
            const modeLabel = parsedJson.search_mode === 'fast'
                ? '⚡ 高速モード'
                : '🔍 詳細モード';
            additionalResults.push({ label: '検索モード', value: modeLabel });
        }

        if (parsedJson.query_alt) {
            additionalResults.push({ label: '補助検索', value: parsedJson.query_alt });
        }

        additionalResults.push({ label: '検索範囲', value: getRecencyLabel(parsedJson.recency) });

        // target_domains を表示（domain_filter ではなく target_domains を使用）
        if (parsedJson.target_domains && parsedJson.target_domains.length > 0) {
            additionalResults.push({ label: '対象ドメイン', value: parsedJson.target_domains.join(', ') });
        }

        // ★追加: internal_log をキャプチャ
        const internalLog = parsedJson.internal_log || '';
        if (internalLog) {
            addLog(`[InternalLog] [Search_Strategy] ${internalLog}`, 'info');
        }

        return {
            thoughtProcessUpdate: (t) => t.id === nodeId ? {
                ...t,
                status: 'done',
                thinking: parsedJson.reasoning || '',
                resultLabel: 'メイン検索',
                resultValue: parsedJson.query_main || '',
                additionalResults,
                internalLog: internalLog // ★メッセージデータとして保持
            } : t
        };
    } else if (rawText) {
        addLog(`[LLM_Search_Strategy] RAW出力: ${rawText}`, 'warn');
        return {
            thoughtProcessUpdate: (t) => t.id === nodeId ? { ...t, status: 'done' } : t
        };
    }

    return null;
};

/**
 * node_finished イベントを処理する (LLM_Synthesis)
 * @param {Object} outputs - ノード出力
 * @param {string} nodeId - ノードID
 * @param {Function} addLog - ログ関数
 * @returns {Object|null} thoughtProcessUpdate または null
 */
export const processLlmSynthesisFinished = (outputs, nodeId, addLog) => {
    const rawText = outputs?.text;
    const parsedJson = extractJsonFromLlmOutput(rawText);

    if (parsedJson) {
        const thinking = parsedJson.thinking || '';
        const internalLog = parsedJson.internal_log || '';

        addLog(`[LLM_Synthesis] thinking: ${thinking || 'N/A'}`, 'info');
        addLog(`[LLM_Synthesis] internal_log: ${internalLog || 'N/A'}`, 'info');

        // ★追加: internal_log があれば特別なプレフィックスでシステムログに記録
        if (internalLog) {
            addLog(`[InternalLog] [LLM_Synthesis] ${internalLog}`, 'info');
        }

        return {
            thoughtProcessUpdate: (t) => t.id === nodeId ? {
                ...t,
                status: 'done',
                thinking: thinking,  // モノローグとして ThinkingProcess.jsx に表示される
                internalLog: internalLog // ★追加
            } : t
        };
    } else if (rawText) {
        addLog(`[LLM_Synthesis] RAW出力: ${rawText}`, 'warn');
        return {
            thoughtProcessUpdate: (t) => t.id === nodeId ? { ...t, status: 'done' } : t
        };
    }

    return null;
};

/**
 * node_finished イベントを処理する (LLM_RAG_Strategy)
 * @param {Object} outputs - ノード出力
 * @param {string} nodeId - ノードID
 * @param {Function} addLog - ログ関数
 * @returns {Object|null} thoughtProcessUpdate または null
 */
export const processRagStrategyFinished = (outputs, nodeId, addLog) => {
    const rawText = outputs?.text;
    const parsedJson = extractJsonFromLlmOutput(rawText);

    if (parsedJson) {
        const thinking = parsedJson.thinking || '';

        addLog(`[LLM_RAG_Strategy] thinking: ${thinking || 'N/A'}`, 'info');

        // ★追加: internal_log をキャプチャ
        const internalLog = parsedJson.internal_log || '';
        if (internalLog) {
            addLog(`[InternalLog] [RAG_Strategy] ${internalLog}`, 'info');
        }

        return {
            thoughtProcessUpdate: (t) => t.id === nodeId ? {
                ...t,
                status: 'done',
                thinking: thinking,  // モノローグとして ThinkingProcess.jsx に表示される
                internalLog: internalLog // ★追加
            } : t
        };
    } else if (rawText) {
        addLog(`[LLM_RAG_Strategy] RAW出力: ${rawText}`, 'warn');
        return {
            thoughtProcessUpdate: (t) => t.id === nodeId ? { ...t, status: 'done' } : t
        };
    }

    return null;
};

/**
 * ワークフローログ出力用の処理
 * @param {Object} outputs - ノード出力
 * @param {string} title - ノードタイトル
 * @param {Function} addLog - ログ関数
 */
export const logWorkflowOutput = (outputs, title, addLog) => {
    const outputText = outputs?.text;
    if (!outputText || !title) return;

    if (title === 'TOOL_Perplexity_Search') {
        addLog(`[Workflow] Perplexity結果:\n${outputText}`, 'info');
    } else if (title.startsWith('LLM_') && (
        title.includes('Hybrid') || title.includes('Doc') ||
        title.includes('Search') || title.includes('General') ||
        title.includes('Chat') || title.includes('Fast')
    )) {
        addLog(`[Workflow] ${title} 出力:\n${outputText}`, 'info');
    }
};

/**
 * node_finished でエラーが発生した場合の処理
 * @param {Object} data - SSEイベントデータ
 * @param {Function} addLog - ログ関数
 * @returns {Object|null} エラー情報 または null
 */
export const processNodeError = (data, addLog) => {
    const status = data.data?.status;
    const errorMessage = data.data?.error;
    const title = data.data?.title;
    const nodeId = data.data?.node_id;

    if (status !== 'failed' || !errorMessage) {
        return null;
    }

    addLog(`[Workflow] ❌ ノード「${title}」でエラー: ${errorMessage}`, 'error');

    return {
        nodeId,
        nodeTitle: title,
        errorMessage,
        thoughtProcessUpdate: (t) => t.id === nodeId
            ? { ...t, status: 'error', errorMessage }
            : t
    };
};

/**
 * workflow_finished でエラーが発生した場合の処理
 * @param {Object} data - SSEイベントデータ
 * @param {Function} addLog - ログ関数
 * @returns {Object|null} エラー情報 または null
 */
export const processWorkflowError = (data, addLog) => {
    const status = data.data?.status;
    const errorMessage = data.data?.error;

    if (status !== 'failed' || !errorMessage) {
        return null;
    }

    addLog(`[Workflow] ❌ ワークフロー全体がエラーで終了: ${errorMessage}`, 'error');

    return {
        status,
        errorMessage
    };
};
