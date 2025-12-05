// src/utils/citationMapper.js

/**
 * Dify APIのretriever_resourcesをマッピングするヘルパー関数
 * @param {Array} resources - APIからのretriever_resources配列
 * @returns {Array} マッピングされた引用情報の配列
 */
export const mapCitationsFromApi = (resources) => {
  if (!resources || !Array.isArray(resources) || resources.length === 0) return [];

  return resources.map((res, index) => {
    const sourceName = res.document_name || res.dataset_name || '不明な出典';
    const url = res.document_url || null;

    let displayText = `[${index + 1}] ${sourceName}`;

    return {
      id: res.document_id || res.segment_id || `cite_${index}`,
      // 修正: APIからの標準引用でURLがないものは「RAG(Knowledge)」として扱う
      type: url ? 'web' : 'rag',
      source: displayText,
      url: url,
    };
  });
};

/**
 * LLM内JSONのcitationsをマッピングするヘルパー関数
 * @param {Array} citations - LLM応答内のcitations配列
 * @returns {Array} マッピングされた引用情報の配列
 */
export const mapCitationsFromLLM = (citations) => {
  if (!citations || !Array.isArray(citations)) return [];

  return citations.map((cite, index) => {
    // ★修正: LLMが指定した type を最優先する
    // typeがない場合のみ、URLの有無で web/file を推論するフォールバックを行う
    const type = cite.type || (cite.url ? 'web' : 'file');

    return {
      id: cite.id || `cite_llm_hist_${index}`,
      type: type,
      // 表示名に連番を付与（[n] SourceName）
      source: `[${index + 1}] ${cite.source || '不明な出典'}`,
      url: cite.url || null,
    };
  });
};