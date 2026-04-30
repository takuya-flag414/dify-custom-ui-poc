// src/utils/citationFormatter.ts

export interface CitationSource {
  id: number;
  category: 'web' | 'file' | 'rag';
  title: string;
  url?: string;
  index: number;
}

/**
 * URLからドメインを抽出します
 * @param url 
 * @returns domain name
 */
export const extractDomain = (url: string): string => {
  if (!url) return '';
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, '');
  } catch (e) {
    return url;
  }
};

/**
 * 長い文字列の中間を省略します
 * @param text 
 * @param maxLength 
 * @returns truncated text
 */
export const truncateMiddle = (text: string, maxLength: number = 15): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  const charsToShow = maxLength - 3; // "..." の分を引く
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  
  return `${text.substring(0, frontChars)}...${text.substring(text.length - backChars)}`;
};

/**
 * 連続する引用番号を含む文字列のチャンクを受け取り、
 * メタデータに基づいてカテゴリ別のグループに分類します。
 * @param numbersStr "[1][2][3]" や "1, 2, 3" などの文字列や数値の配列
 * @param citations 引用情報の配列
 * @returns カテゴリごとに分類されたソースのマップ
 */
export const groupCitationsByCategory = (
  numbers: number[],
  citations: any[]
): Record<'web' | 'file' | 'rag', CitationSource[]> => {
  const groups: Record<'web' | 'file' | 'rag', CitationSource[]> = {
    web: [],
    file: [],
    rag: [],
  };

  if (!citations || citations.length === 0) return groups;

  numbers.forEach((num) => {
    // 引用番号は1-indexed
    if (num > 0 && num <= citations.length) {
      const citation = citations[num - 1];
      
      // category判定 (APIまたはLLMのtypeを優先。typeがない場合はurlの形式から推論)
      let category: 'web' | 'file' | 'rag';
      
      if (citation.type) {
        // typeが明示されている場合はその指定を尊重する
        if (citation.type === 'web') {
          category = 'web';
        } else if (citation.type === 'rag' || citation.type === 'dataset') {
          category = 'rag';
        } else {
          // 'file' またはそれ以外の未知のタイプは 'file' として扱う
          category = 'file';
        }
      } else {
        // typeがない場合のみ、URLの有無や形式から推論する（フォールバック）
        // httpで始まる場合はweb、それ以外でURLがある場合は一旦web（従来互換）だが
        // 判定を厳格にするなら startsWith('http') を見る
        if (citation.url && (citation.url.startsWith('http') || citation.url.startsWith('/'))) {
          category = 'web';
        } else {
          category = 'file';
        }
      }

      groups[category].push({
        id: citation.id || `cite-${num}`,
        category,
        title: citation.source || `出典 ${num}`,
        url: citation.url || undefined,
        index: num,
      });
    }
  });

  return groups;
};
