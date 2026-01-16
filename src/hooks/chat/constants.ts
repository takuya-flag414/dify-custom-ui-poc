// src/hooks/chat/constants.ts
// useChat.js から分離した定数・設定

/**
 * 検索設定の型定義
 */
export interface SearchSettings {
    ragEnabled: 'auto' | boolean;
    webMode: 'auto' | 'on' | 'off';
    domainFilters: string[];
}

/**
 * ノード表示情報の型定義
 */
export interface NodeDisplayInfo {
    title: string;
    icon: string;
    dynamic?: 'document' | 'search';
}

/**
 * 検索設定のデフォルト値
 */
export const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
    ragEnabled: 'auto',
    webMode: 'auto',
    domainFilters: []
};

/**
 * ノード名マッピングテーブル: YMLのノード名 → 表示テキスト・アイコン
 */
export const NODE_DISPLAY_MAP: Record<string, NodeDisplayInfo> = {
    // LLM処理ノード - クエリ処理
    'LLM_Query_Rewrite': { title: '質問の要点を整理中...', icon: 'reasoning' },
    'LLM_Intent_Analysis': { title: '質問の意図を解析中...', icon: 'router' },

    // LLM処理ノード - 回答生成 (Efficient スタイル)
    'LLM_Hybrid_Efficient': { title: '情報を統合して回答を生成中...', icon: 'writing' },
    'LLM_Doc_Efficient': { title: 'ドキュメントを分析して回答を生成中...', icon: 'writing' },
    'LLM_Search_Efficient': { title: '検索結果から回答を生成中...', icon: 'writing' },
    'LLM_General_Efficient': { title: '回答を生成中...', icon: 'writing' },
    'LLM_Chat_Efficient': { title: '応答を準備中...', icon: 'writing' },
    'LLM_Fast_Doc_Efficient': { title: 'ドキュメントを高速分析中...', icon: 'writing' },
    'LLM_Fast_General_Efficient': { title: '高速回答を生成中...', icon: 'writing' },

    // LLM処理ノード - 回答生成 (Partner スタイル)
    'LLM_Hybrid_Partner': { title: '情報を統合して回答を生成中...', icon: 'writing' },
    'LLM_Doc_Partner': { title: 'ドキュメントを分析して回答を生成中...', icon: 'writing' },
    'LLM_Search_Partner': { title: '検索結果から回答を生成中...', icon: 'writing' },
    'LLM_General_Partner': { title: '回答を生成中...', icon: 'writing' },
    'LLM_Chat_Partner': { title: '応答を準備中...', icon: 'writing' },
    'LLM_Fast_Doc_Partner': { title: 'ドキュメントを高速分析中...', icon: 'writing' },
    'LLM_Fast_General_Partner': { title: '高速回答を生成中...', icon: 'writing' },

    // ツールノード (動的タイトル生成)
    'TOOL_Doc_Extractor': { title: 'ドキュメントを解析中...', icon: 'document', dynamic: 'document' },
    'TOOL_Perplexity_Search': { title: 'Web検索中...', icon: 'search', dynamic: 'search' },
};

/**
 * 表示対象外のノード接頭辞 (ゲート、変数操作、コード、出力など)
 */
export const HIDDEN_NODE_PREFIXES: string[] = ['GATE_', 'ROUTER_', 'STYLE_Check_', 'SET_', 'CLEAR_', 'CODE_', 'ANSWER_', 'Check '];
