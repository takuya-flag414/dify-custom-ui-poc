// src/utils/responseParser.ts

/**
 * Smart Action の型定義
 */
export interface SmartAction {
    label: string;
    action: string;
    [key: string]: unknown;
}

/**
 * LLM応答のパース結果の型定義
 */
export interface ParsedLlmResponse {
    answer: string;
    citations: LlmCitation[];
    smartActions: SmartAction[];
    thinking: string;
    isParsed: boolean;
}

/**
 * LLM応答内の引用情報の型定義
 */
export interface LlmCitation {
    id?: string;
    type?: string;
    source?: string;
    url?: string | null;
}

/**
 * 汎用的な部分JSON抽出関数
 * 壊れた（生成途中の）JSON文字列から、指定フィールドの中身を可能な限り抽出する
 * @param text - 解析対象のテキスト
 * @param fieldName - 抽出するフィールド名（例: "answer", "thinking"）
 * @returns 抽出できたテキスト（見つからない場合はnull）
 */
const extractPartialField = (text: string, fieldName: string): string | null => {
    // 1. "fieldName": " の開始位置を探す
    const startPattern = new RegExp(`"${fieldName}"\\s*:\\s*"`);
    const match = text.match(startPattern);

    if (!match || match.index === undefined) return null;

    const startIndex = match.index + match[0].length;
    let rawContent = text.substring(startIndex);

    // 2. 終了位置（次の閉じクォート）を探す
    // ただし、エスケープされたクォート (\") は無視する
    let endIndex = -1;
    for (let i = 0; i < rawContent.length; i++) {
        if (rawContent[i] === '"' && (i === 0 || rawContent[i - 1] !== '\\')) {
            endIndex = i;
            break;
        }
    }

    // 閉じクォートが見つかればそこまで、見つからなければ末尾まで（ストリーミング中）
    let fragment = endIndex !== -1 ? rawContent.substring(0, endIndex) : rawContent;

    // 3. JSONのエスケープシーケンス（\n, \", \uXXXX 等）をデコードする
    // 断片が途中で切れている場合（例: "こんにちは\）、JSON.parseは失敗する。
    // その場合、末尾から1文字ずつ削ってパースできるまで試行する（Heuristic repair）。
    while (fragment.length > 0) {
        try {
            // JSON文字列として有効にするためにクォートで囲んでパース
            return JSON.parse(`"${fragment}"`);
        } catch {
            // パース失敗（末尾がエスケープ文字の途中など）の場合、最後の文字を削って再トライ
            fragment = fragment.slice(0, -1);
        }
    }

    return ""; // 何も抽出できなかった場合
};

/**
 * 壊れた（生成途中の）JSON文字列から、answerフィールドの中身を可能な限り抽出する
 * @param text - 解析対象のテキスト
 * @returns 抽出できた回答テキスト（見つからない場合はnull）
 */
const extractPartialJson = (text: string): string | null => extractPartialField(text, 'answer');

/**
 * 壊れた（生成途中の）JSON文字列から、thinkingフィールドの中身を可能な限り抽出する
 * @param text - 解析対象のテキスト
 * @returns 抽出できた思考テキスト（見つからない場合はnull）
 */
const extractPartialThinking = (text: string): string | null => extractPartialField(text, 'thinking');

/**
 * LLMのレスポンス（テキスト）を解析し、JSONであれば回答と出典、Smart Actionsを抽出する。
 * ストリーミング中の不完全なJSONにも対応。
 * @param rawText - LLMからの生のテキスト
 * @returns { answer, citations, smartActions, thinking, isParsed }
 */
export const parseLlmResponse = (rawText: string | null | undefined): ParsedLlmResponse => {
    if (!rawText) {
        return { answer: '', citations: [], smartActions: [], thinking: '', isParsed: false };
    }

    let textToParse = rawText.trim();

    // 1. マークダウンのコードブロック除去（改善版）
    // ストリーミング中は閉じの ``` がない場合も対応
    if (textToParse.startsWith('```')) {
        // 開始の ```json や ``` を除去
        textToParse = textToParse.replace(/^```(?:json)?\s*\n?/, '');
        // 末尾の ``` を除去（あれば）
        textToParse = textToParse.replace(/\n?```\s*$/, '');
        textToParse = textToParse.trim();
    }

    // 2. 厳密な JSONパースの試行 (完了後の完全なJSON用)
    try {
        if (textToParse.startsWith('{') && textToParse.endsWith('}')) {
            const parsed = JSON.parse(textToParse);
            if (parsed && typeof parsed === 'object') {
                // ★変更: smart_actionsをJSONから直接抽出
                let smartActions: SmartAction[] = [];
                if (Array.isArray(parsed.smart_actions)) {
                    smartActions = parsed.smart_actions;
                } else if (parsed.smart_actions && Array.isArray(parsed.smart_actions.suggested_actions)) {
                    // 後方互換: { smart_actions: { suggested_actions: [...] } } 形式にも対応
                    smartActions = parsed.smart_actions.suggested_actions;
                }

                return {
                    answer: parsed.answer || '',
                    citations: Array.isArray(parsed.citations) ? parsed.citations : [],
                    smartActions: smartActions,
                    thinking: parsed.thinking || '',
                    isParsed: true
                };
            }
        }
    } catch {
        // 失敗しても無視して次へ
    }

    // 3. ストリーミング用: 部分抽出ロジック (New!)
    // ★改善: thinkingを先に抽出（answerより先に出力される可能性があるため）
    const partialThinking = extractPartialThinking(textToParse);
    const partialAnswer = extractPartialJson(textToParse);

    // ★改善: answerまたはthinkingのどちらかが見つかれば、JSONとして処理
    if (partialAnswer !== null || partialThinking !== null) {
        // answerまたはthinkingが見つかった場合
        // citations も同様に部分抽出を試みるのが理想だが、
        // citationsは通常answerの後にあるため、回答中は空でもUX上問題ない

        // citationsの簡易抽出（もし完了していれば）
        let extractedCitations: LlmCitation[] = [];
        try {
            const citationsMatch = textToParse.match(/"citations"\s*:\s*(\[[\s\S]*?\])/);
            if (citationsMatch) {
                extractedCitations = JSON.parse(citationsMatch[1]);
            }
        } catch { }

        // smart_actionsの簡易抽出（もし完了していれば）
        let extractedSmartActions: SmartAction[] = [];
        try {
            const smartActionsMatch = textToParse.match(/"smart_actions"\s*:\s*(\[[\s\S]*?\])/);
            if (smartActionsMatch) {
                extractedSmartActions = JSON.parse(smartActionsMatch[1]);
            }
        } catch { }

        return {
            answer: partialAnswer || '',  // ★改善: nullの場合は空文字を返す
            citations: extractedCitations,
            smartActions: extractedSmartActions,
            thinking: partialThinking || '',
            isParsed: true
        };
    }

    // 4. どうしてもJSONとして読めない場合 (通常のチャットなど)
    // コードブロックを除去したテキストがあればそれを返す
    return {
        answer: textToParse, // 生テキストをそのまま返す
        citations: [],
        smartActions: [],
        thinking: '',
        isParsed: false
    };
};
