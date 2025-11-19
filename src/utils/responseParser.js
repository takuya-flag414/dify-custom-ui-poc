// src/utils/responseParser.js

/**
 * LLMのレスポンス（テキスト）を解析し、JSONであれば回答と出典を抽出する。
 * マークダウンのコードブロック (```json ... ```) に対応。
 * * @param {string} rawText - LLMからの生のテキスト
 * @returns {object} { answer, citations, isParsed }
 */
export const parseLlmResponse = (rawText) => {
  if (!rawText) {
    return { answer: '', citations: [], isParsed: false };
  }

  let textToParse = rawText.trim();
  let isParsed = false;

  // 1. マークダウンのコードブロック (```json ... ```) の除去
  // 行頭・行末の空白や改行を許容してマッチさせる
  const codeBlockRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
  const match = textToParse.match(codeBlockRegex);
  
  if (match) {
    textToParse = match[1].trim();
  }

  // 2. JSONパースの試行
  try {
    // 先頭が { で終わるが } であるか簡易チェック (高速化のため)
    if (textToParse.startsWith('{') && textToParse.endsWith('}')) {
      const parsed = JSON.parse(textToParse);
      
      // 期待する構造 (answer キーがあるか) チェック
      if (parsed && typeof parsed === 'object' && 'answer' in parsed) {
        return {
          answer: parsed.answer || '',
          citations: Array.isArray(parsed.citations) ? parsed.citations : [],
          isParsed: true
        };
      }
    }
  } catch (e) {
    // パース失敗時は無視して、生のテキストを返す
    // console.warn('JSON Parse failed:', e);
  }

  // 3. JSONでない、またはパース失敗時
  // コードブロックを除去したテキストがあればそれを、なければ元のテキストを返す
  // (例: JSONパースには失敗したが、マークダウン記法だけは剥がしたい場合など)
  // ここでは安全のため、パース成功時以外は元の rawText を返す方針とするが、
  // コードブロックの中身だけ返す方が親切な場合もある。
  // 今回の要件「識別子が含まれていた場合、これを取り除き」に従い、
  // matchがあった場合は中身を採用する。
  
  const fallbackText = match ? textToParse : rawText;

  return {
    answer: fallbackText,
    citations: [],
    isParsed: false
  };
};