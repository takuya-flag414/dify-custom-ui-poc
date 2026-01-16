// src/utils/citationMapper.ts

/**
 * 引用タイプの定義
 */
export type CitationType = 'web' | 'rag' | 'file';

/**
 * APIからのリソース情報の型定義
 */
export interface RetrieverResource {
    document_id?: string;
    segment_id?: string;
    document_name?: string;
    dataset_name?: string;
    document_url?: string | null;
    [key: string]: unknown;
}

/**
 * LLMからの引用情報の型定義
 */
export interface LLMCitation {
    id?: string;
    type?: CitationType;
    source?: string;
    url?: string | null;
}

/**
 * マッピング済み引用情報の型定義
 */
export interface MappedCitation {
    id: string;
    type: CitationType;
    source: string;
    url: string | null;
}

/**
 * Dify APIのretriever_resourcesをマッピングするヘルパー関数
 * @param resources - APIからのretriever_resources配列
 * @returns マッピングされた引用情報の配列
 */
export const mapCitationsFromApi = (resources: RetrieverResource[] | null | undefined): MappedCitation[] => {
    if (!resources || !Array.isArray(resources) || resources.length === 0) return [];

    return resources.map((res, index) => {
        const sourceName = res.document_name || res.dataset_name || '不明な出典';
        const url = res.document_url || null;

        const displayText = `[${index + 1}] ${sourceName}`;

        return {
            id: res.document_id || res.segment_id || `cite_${index}`,
            // 修正: APIからの標準引用でURLがないものは「RAG(Knowledge)」として扱う
            type: url ? 'web' : 'rag' as CitationType,
            source: displayText,
            url: url,
        };
    });
};

/**
 * LLM内JSONのcitationsをマッピングするヘルパー関数
 * @param citations - LLM応答内のcitations配列
 * @returns マッピングされた引用情報の配列
 */
export const mapCitationsFromLLM = (citations: LLMCitation[] | null | undefined): MappedCitation[] => {
    if (!citations || !Array.isArray(citations)) return [];

    return citations.map((cite, index) => {
        // ★修正: LLMが指定した type を最優先する
        // typeがない場合のみ、URLの有無で web/file を推論するフォールバックを行う
        const type: CitationType = cite.type || (cite.url ? 'web' : 'file');

        return {
            id: cite.id || `cite_llm_hist_${index}`,
            type: type,
            // 表示名に連番を付与（[n] SourceName）
            source: `[${index + 1}] ${cite.source || '不明な出典'}`,
            url: cite.url || null,
        };
    });
};
