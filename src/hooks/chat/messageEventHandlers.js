// src/hooks/chat/messageEventHandlers.js
// useChat.js から分離したメッセージイベント処理

import { parseLlmResponse } from '../../utils/responseParser';
import { mapCitationsFromApi, mapCitationsFromLLM } from '../../utils/citationMapper';

/**
 * プロトコルモードを判定する
 * @param {string} contentBuffer - 現在のコンテンツバッファ
 * @returns {string} 'JSON' | 'RAW' | 'PENDING'
 */
export const determineProtocolMode = (contentBuffer) => {
    const trimmed = contentBuffer.trimStart();
    if (trimmed.length === 0) {
        return 'PENDING';
    }

    // 構造的特徴: { で始まる OR ```json で始まる
    const structuralJson = trimmed.startsWith('{') ||
        trimmed.startsWith('```json') ||
        trimmed.startsWith('```\n{');

    // フィールド検知: thinking/answerフィールドの有無
    const hasThinkingField = trimmed.includes('"thinking"');
    const hasAnswerField = trimmed.includes('"answer"');

    if (structuralJson || hasThinkingField || hasAnswerField) {
        return 'JSON';
    }

    return 'RAW';
};

/**
 * message イベントからテキストを抽出する
 * @param {string} contentBuffer - コンテンツバッファ
 * @param {string} protocolMode - 現在のプロトコルモード
 * @param {number} messageStartTime - メッセージ開始時刻
 * @param {number} displayDelayMs - 表示遅延時間（ミリ秒）
 * @returns {Object} { textToDisplay, thinkingToDisplay, newProtocolMode }
 */
export const extractMessageContent = (contentBuffer, protocolMode, messageStartTime, displayDelayMs) => {
    const elapsedMs = Date.now() - messageStartTime;
    const isDelayPeriod = elapsedMs < displayDelayMs;

    let textToDisplay = '';
    let thinkingToDisplay = '';
    let newProtocolMode = protocolMode;
    let artifactToDisplay = null; // ★追加: ストリーミング中のArtifact中間データ

    if (isDelayPeriod) {
        // 待機時間中は表示しない（JSONフィールド検知を待つ）
        // ただし、既にthinking/answerが検知されていれば表示開始可能
        const parsed = parseLlmResponse(contentBuffer);
        if (parsed.isParsed && (parsed.answer || parsed.thinking)) {
            textToDisplay = parsed.answer;
            thinkingToDisplay = parsed.thinking || '';
            newProtocolMode = 'JSON';
            artifactToDisplay = parsed.artifact || null; // ★追加
        } else {
            textToDisplay = '';
        }
    } else if (protocolMode === 'PENDING') {
        // 待機時間経過後でもPENDINGの場合はRAWモードへ移行
        newProtocolMode = 'RAW';
        textToDisplay = contentBuffer;
    } else if (protocolMode === 'JSON') {
        const parsed = parseLlmResponse(contentBuffer);
        textToDisplay = parsed.isParsed ? parsed.answer : '';
        thinkingToDisplay = parsed.thinking || '';
        artifactToDisplay = parsed.isParsed ? (parsed.artifact || null) : null; // ★追加
    } else {
        // RAWモードでも、JSON構造が検出されたらパースを試みる（誤判定対策）
        const trimmed = contentBuffer.trim();
        if ((trimmed.includes('"answer"') || trimmed.includes('"thinking"')) &&
            (trimmed.startsWith('{') || trimmed.startsWith('```'))) {
            const parsed = parseLlmResponse(contentBuffer);
            if (parsed.isParsed) {
                textToDisplay = parsed.answer;
                thinkingToDisplay = parsed.thinking || '';
                newProtocolMode = 'JSON';
                artifactToDisplay = parsed.artifact || null; // ★追加
            } else {
                textToDisplay = '';
            }
        } else {
            textToDisplay = contentBuffer;
        }
    }

    return { textToDisplay, thinkingToDisplay, newProtocolMode, artifactToDisplay };
};

/**
 * message_end イベントを処理する
 * @param {Object} data - SSEイベントデータ
 * @param {string} detectedTraceMode - 検出されたトレースモード
 * @returns {Object} { citations, traceMode, usage } 
 */
export const processMessageEnd = (data, detectedTraceMode) => {
    const citations = data.metadata?.retriever_resources || [];
    const usage = data.metadata?.usage || null;

    return {
        citations: citations.length > 0 ? mapCitationsFromApi(citations) : [],
        traceMode: detectedTraceMode,
        usage: usage
    };
};

export const processWorkflowFinished = (contentBuffer, protocolMode, addLog, rawData) => {
    let finalText = contentBuffer;
    let finalCitations = [];
    let smartActions = [];
    let finalThinking = '';
    let finalUsage = null;
    let finalArtifact = null; // ★追加: Artifactデータ

    // rawDataからtotal_tokensを取得 (Chatflowモード等でmessage_endが得られない場合のフォールバック)
    if (rawData?.data?.total_tokens) {
        finalUsage = {
            total_tokens: rawData.data.total_tokens,
            prompt_tokens: null,
            completion_tokens: null
        };
    }

    // protocolModeに関係なく、コンテンツがJSON形式かチェック
    const trimmedBuffer = contentBuffer.trim();
    const looksLikeJsonContent =
        trimmedBuffer.startsWith('{') ||
        trimmedBuffer.startsWith('```json') ||
        trimmedBuffer.startsWith('```\n{') ||
        (trimmedBuffer.includes('"answer"') && trimmedBuffer.includes('"citations"'));

    if (protocolMode === 'JSON' || looksLikeJsonContent) {
        const parsed = parseLlmResponse(contentBuffer);
        if (parsed.isParsed) {
            finalText = parsed.answer;
            finalThinking = parsed.thinking || '';
            if (parsed.citations.length > 0) {
                finalCitations = mapCitationsFromLLM(parsed.citations);
            }
            if (parsed.smartActions && parsed.smartActions.length > 0) {
                smartActions = parsed.smartActions;
                addLog(`[Workflow] Smart Actions detected: ${smartActions.length} actions`, 'info');
            }
            // ★追加: Artifact抽出
            if (parsed.artifact) {
                finalArtifact = parsed.artifact;
                addLog(`[Workflow] Artifact detected: "${finalArtifact.artifact_title}" (${finalArtifact.artifact_type})`, 'info');
            }
        }
    }

    return { finalText, finalCitations, smartActions, finalThinking, finalUsage, finalArtifact };
};

/**
 * 最終メッセージオブジェクトを構築する
 * @param {Object} currentStreamingMsg - 現在のストリーミングメッセージ
 * @param {Object} workflowResult - workflow_finished処理結果
 * @param {string} contentBuffer - コンテンツバッファ
 * @param {string} detectedTraceMode - 検出されたトレースモード
 * @returns {Object} 最終メッセージオブジェクト
 */
export const buildFinalMessage = (currentStreamingMsg, workflowResult, contentBuffer, detectedTraceMode) => {
    const { finalText, finalCitations, smartActions, finalThinking, finalUsage, finalArtifact } = workflowResult;

    return {
        ...currentStreamingMsg,
        text: finalText,
        rawContent: contentBuffer,
        citations: currentStreamingMsg.citations.length > 0 ? currentStreamingMsg.citations : finalCitations,
        smartActions: smartActions,
        thinking: finalThinking || currentStreamingMsg.thinking || '',
        isStreaming: false,
        traceMode: detectedTraceMode,
        // ★追加: HTTP_LLM_Search通過フラグを最終メッセージに伝播
        usedHttpLlmSearch: currentStreamingMsg.usedHttpLlmSearch || false,
        usage: finalUsage || currentStreamingMsg.usage || null,
        // ★追加: Artifact情報を最終メッセージに含める
        artifact: finalArtifact || null,
        thoughtProcess: currentStreamingMsg.thoughtProcess.map(t => {
            if (t.title === '情報を整理して回答を生成中...') {
                return { ...t, title: '回答の生成が完了しました', status: 'done', iconType: 'check' };
            }
            return { ...t, status: 'done' };
        })
    };
};
