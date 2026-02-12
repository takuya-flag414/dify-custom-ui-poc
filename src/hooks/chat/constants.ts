// src/hooks/chat/constants.ts
// useChat.js から分離した定数・設定

/**
 * 検索設定の型定義
 */
export interface SearchSettings {
    ragEnabled: 'auto' | boolean;
    webMode: 'auto' | 'on' | 'off' | 'force';
    domainFilters: string[];
    reasoningMode: 'fast' | 'deep';
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
    domainFilters: [],
    reasoningMode: 'fast'
};

/**
 * ノード名マッピングテーブル: YMLのノード名 → 表示テキスト・アイコン
 */
export const NODE_DISPLAY_MAP: Record<string, NodeDisplayInfo> = {
    // LLM処理ノード - クエリ処理
    'LLM_Query_Rewrite': { title: '質問の要点を整理中...', icon: 'reasoning' },
    'LLM_Intent_Analysis': { title: '質問の意図を解析中...', icon: 'router' },

    // LLM処理ノード - 回答生成 (Partner スタイル)
    'LLM_Hybrid': { title: '情報を統合して回答を生成中...', icon: 'writing' },
    'LLM_Doc': { title: 'ドキュメントを分析して回答を生成中...', icon: 'writing' },
    'LLM_Search': { title: '検索結果から回答を生成中...', icon: 'writing' },
    'LLM_General': { title: '回答を生成中...', icon: 'writing' },
    'LLM_Chat': { title: '応答を準備中...', icon: 'writing' },
    'LLM_Fast_Doc': { title: 'ドキュメントを高速分析中...', icon: 'writing' },
    'LLM_Fast_General': { title: '高速回答を生成中...', icon: 'writing' },

    // ツールノード (動的タイトル生成)
    'TOOL_Doc_Extractor': { title: 'ドキュメントを解析中...', icon: 'document', dynamic: 'document' },
    'TOOL_Perplexity_Search': { title: 'Web検索中...', icon: 'search', dynamic: 'search' },

    // Devルート用ノード
    'LLM_Search_Strategy': { title: '検索戦略を策定中...', icon: 'reasoning' },
    'HTTP_TOOL_Perplexity_Search': { title: 'Web検索中...', icon: 'search', dynamic: 'search' },
    'HTTP_TOOL_Perplexity_Search_Parallel': { title: 'Web検索中...', icon: 'search', dynamic: 'search' },
    'Parallel_Web_Search': { title: '詳細Web検索中（並列処理）...', icon: 'iteration' },
    'LLM_Synthesis': { title: '検索結果を統合中...', icon: 'writing' },

    // Devルート用ノード - FASTモード/Partner系
    'HTTP_TOOL_Perplexity_Search (1)': { title: 'Web検索中...', icon: 'search', dynamic: 'search' },
    'HTTP_LLM_Search': { title: '回答を生成中...', icon: 'writing' },

    // ファイル検索ストアツール (社内データ検索)
    'ファイル検索ストアを指定して検索': { title: '📂 社内データを検索中...', icon: 'file-search' },
};

/**
 * 表示対象外のノード接頭辞 (ゲート、変数操作、コード、出力など)
 */
export const HIDDEN_NODE_PREFIXES: string[] = ['GATE_', 'ROUTER_', 'STYLE_Check_', 'SET_', 'CLEAR_', 'CODE_', 'ANSWER_', 'Check ', 'イテレーション', 'Build_', 'Parse_', 'Dev ', 'DEV', 'Deep_', 'Fast_', 'Check_Search_Mode'];
