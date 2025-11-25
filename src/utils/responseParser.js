// src/utils/responseParser.js

/**
 * LLMのレスポンス（テキスト）を解析し、JSONであれば回答と出典を抽出する。
 * マークダウンのコードブロック除去に加え、正規表現による救済ロジックを搭載。
 * * @param {string} rawText - LLMからの生のテキスト
 * @returns {object} { answer, citations, isParsed }
 */
export const parseLlmResponse = (rawText) => {
  if (!rawText) {
    return { answer: '', citations: [], isParsed: false };
  }

  let textToParse = rawText.trim();

  // 1. マークダウンのコードブロック (```json ... ```) の除去
  const codeBlockRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
  const match = textToParse.match(codeBlockRegex);
  if (match) {
    textToParse = match[1].trim();
  }

  // 2. 厳密な JSONパースの試行 (最優先)
  try {
    // パフォーマンスのため、明らかにオブジェクトでないものはスキップ
    if (textToParse.startsWith('{')) {
      const parsed = JSON.parse(textToParse);
      if (parsed && typeof parsed === 'object' && 'answer' in parsed) {
        return {
          answer: parsed.answer || '',
          citations: Array.isArray(parsed.citations) ? parsed.citations : [],
          isParsed: true
        };
      }
    }
  } catch (e) {
    // JSONパース失敗時はログを吐かずにフォールバックへ進む
  }

  // 3. フォールバック: 正規表現による救済 (Hybrid Parsing)
  // JSON構造が壊れていても、"answer": "..." のパターンが生きていれば抽出する
  // 改行を含む値に対応するため s フラグ等は使わず、[\s\S]で対応
  const answerRegex = /"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/;
  const answerMatch = textToParse.match(answerRegex);

  if (answerMatch) {
    try {
      // 抽出した文字列はJSON文字列のエスケープ規則に従っているため、
      // JSON.parseを使って正しくアンエスケープする（例: \n -> 改行コード）
      const extractedAnswer = JSON.parse(`"${answerMatch[1]}"`);

      // citations も救出を試みる
      let extractedCitations = [];
      const citationsRegex = /"citations"\s*:\s*(\[[\s\S]*?\])/;
      const citationsMatch = textToParse.match(citationsRegex);
      if (citationsMatch) {
        try {
          extractedCitations = JSON.parse(citationsMatch[1]);
        } catch (e) {
          // citationsのパースに失敗しても、本文さえあれば良しとする
        }
      }

      return {
        answer: extractedAnswer,
        citations: extractedCitations,
        isParsed: true
      };
    } catch (e) {
      // 正規表現マッチ後のアンエスケープなどで失敗した場合
    }
  }

  // 4. どうしても解析できない場合
  // コードブロックを除去したテキストがあればそれを、なければ元のテキストを返す
  const fallbackText = match ? textToParse : rawText;

  return {
    answer: fallbackText,
    citations: [],
    isParsed: false
  };
};