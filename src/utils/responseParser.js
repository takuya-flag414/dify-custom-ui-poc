// src/utils/responseParser.js

/**
 * 壊れた（生成途中の）JSON文字列から、answerフィールドの中身を可能な限り抽出する
 * @param {string} text - 解析対象のテキスト
 * @returns {string|null} 抽出できた回答テキスト（見つからない場合はnull）
 */
const extractPartialJson = (text) => {
  // 1. "answer": " の開始位置を探す
  const startPattern = /"answer"\s*:\s*"/;
  const match = text.match(startPattern);

  if (!match) return null;

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
    } catch (e) {
      // パース失敗（末尾がエスケープ文字の途中など）の場合、最後の文字を削って再トライ
      fragment = fragment.slice(0, -1);
    }
  }

  return ""; // 何も抽出できなかった場合
};

/**
 * LLMのレスポンス（テキスト）を解析し、JSONであれば回答と出典を抽出する。
 * ストリーミング中の不完全なJSONにも対応。
 * @param {string} rawText - LLMからの生のテキスト
 * @returns {object} { answer, citations, isParsed }
 */
export const parseLlmResponse = (rawText) => {
  if (!rawText) {
    return { answer: '', citations: [], isParsed: false };
  }

  let textToParse = rawText.trim();

  // 1. マークダウンのコードブロック除去
  const codeBlockRegex = /^```(?:json)?\s*([\s\S]*?)\s*(?:```)?$/i;
  // 末尾の ``` はストリーミング中はまだ無い可能性があるので optional に変更
  const match = textToParse.match(codeBlockRegex);
  if (match && match[1]) {
    textToParse = match[1].trim();
  }

  // 2. 厳密な JSONパースの試行 (完了後の完全なJSON用)
  try {
    if (textToParse.startsWith('{') && textToParse.endsWith('}')) {
      const parsed = JSON.parse(textToParse);
      if (parsed && typeof parsed === 'object') {
        return {
          answer: parsed.answer || '',
          citations: Array.isArray(parsed.citations) ? parsed.citations : [],
          isParsed: true
        };
      }
    }
  } catch (e) {
    // 失敗しても無視して次へ
  }

  // 3. ストリーミング用: 部分抽出ロジック (New!)
  const partialAnswer = extractPartialJson(textToParse);
  if (partialAnswer !== null) {
    // answerが見つかった場合
    // citations も同様に部分抽出を試みるのが理想だが、
    // citationsは通常answerの後にあるため、回答中は空でもUX上問題ない

    // citationsの簡易抽出（もし完了していれば）
    let extractedCitations = [];
    try {
      const citationsMatch = textToParse.match(/"citations"\s*:\s*(\[[\s\S]*?\])/);
      if (citationsMatch) {
        extractedCitations = JSON.parse(citationsMatch[1]);
      }
    } catch (e) { }

    return {
      answer: partialAnswer,
      citations: extractedCitations,
      isParsed: true
    };
  }

  // 4. どうしてもJSONとして読めない場合 (通常のチャットなど)
  // コードブロックを除去したテキストがあればそれを返す
  return {
    answer: textToParse, // 生テキストをそのまま返す
    citations: [],
    isParsed: false
  };
};