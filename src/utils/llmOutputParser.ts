// src/utils/llmOutputParser.ts
// LLMノードの出力からJSONを抽出するユーティリティ

/**
 * LLMノードの出力テキストからJSONを抽出
 * 
 * LLM_intent_analysis、LLM_query_rewrite等のノードは
 * Markdownコードブロック形式（```json ... ```）でJSONを出力する。
 * この関数はその形式からJSONを抽出してパースする。
 * 
 * @param textOutput - outputs.textの値
 * @returns パースされたJSON、失敗時はnull
 * 
 * @example
 * // 入力例:
 * // "```json\n{\"thinking\":\"...\",\"category\":\"SEARCH\"}\n```"
 * const result = extractJsonFromLlmOutput(text);
 * // result = { thinking: "...", category: "SEARCH" }
 */
export const extractJsonFromLlmOutput = (textOutput: string | null | undefined): Record<string, unknown> | null => {
    if (!textOutput || typeof textOutput !== 'string') return null;

    // ```json ... ``` 形式を処理
    const codeBlockMatch = textOutput.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
        try {
            return JSON.parse(codeBlockMatch[1].trim());
        } catch (e) {
            console.warn('[llmOutputParser] JSON parse failed for code block:', (e as Error).message);
            return null;
        }
    }

    // ``` ... ``` 形式（言語指定なし）を試行
    const genericBlockMatch = textOutput.match(/```\s*([\s\S]*?)\s*```/);
    if (genericBlockMatch) {
        try {
            return JSON.parse(genericBlockMatch[1].trim());
        } catch {
            // 言語指定なしブロックはJSON以外の可能性もあるため、警告なし
            return null;
        }
    }

    // プレーンJSON形式を試行（{ で始まる場合のみ）
    const trimmed = textOutput.trim();
    if (trimmed.startsWith('{')) {
        try {
            return JSON.parse(trimmed);
        } catch {
            return null;
        }
    }

    return null;
};
