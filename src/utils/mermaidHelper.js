// src/utils/mermaidHelper.js

/**
 * Mermaidのコードからダイアグラムの種類を判定します。
 * @param {string} codeText - Mermaidのコード文字列
 * @returns {string} ダイアグラムのサブタイプ (例: 'flowchart', 'sequence', 'generic' など)
 */
export const detectMermaidType = (codeText) => {
    if (!codeText) return 'generic';
    
    // コメント行 (%%) や空行を除去して先頭の有効なワードを取得
    const cleanCode = codeText.trim().replace(/^\s*%%[\s\S]*?\n/g, '').trim();
    const firstWord = cleanCode.split(/[\s\(\[\{]/)[0];

    if (firstWord.startsWith('graph') || firstWord.startsWith('flowchart')) {
        return 'flowchart';
    }
    if (firstWord === 'sequenceDiagram') return 'sequence';
    if (firstWord === 'classDiagram') return 'class';
    if (firstWord.startsWith('stateDiagram')) return 'state';
    if (firstWord === 'erDiagram') return 'er';
    if (firstWord === 'gantt') return 'gantt';
    if (firstWord === 'pie') return 'pie';
    if (firstWord === 'journey') return 'journey';
    if (firstWord === 'gitGraph') return 'git';
    if (firstWord === 'mindmap') return 'mindmap';
    if (firstWord === 'timeline') return 'timeline';
    
    return 'generic';
};

/**
 * サブタイプに応じた日本語の表示ラベルと絵文字のマッピング定義
 */
export const MERMAID_DIAGRAM_MAP = {
    flowchart: { emoji: '📊', label: '業務フロー図' },
    sequence: { emoji: '🔄', label: 'シーケンス連携図' },
    class: { emoji: '🏗️', label: '構造設計図' },
    state: { emoji: '⚙️', label: '状態遷移図' },
    er: { emoji: '🗄️', label: 'データベース設計図' },
    gantt: { emoji: '📅', label: 'プロジェクト工程表' },
    pie: { emoji: '🍕', label: '割合グラフ' },
    journey: { emoji: '🗺️', label: 'カスタマージャーニー' },
    git: { emoji: '🌿', label: '履歴管理図' },
    mindmap: { emoji: '🧠', label: 'アイデア整理図' },
    timeline: { emoji: '⏳', label: 'タイムライン表' },
    generic: { emoji: '📊', label: '構成図' }
};

/**
 * サブタイプに応じた日本語の表示ラベルを取得します。
 * @param {string} subType - ダイアグラムのサブタイプ
 * @returns {string} 日本語のラベル
 */
export const getMermaidLabel = (subType) => {
    return (MERMAID_DIAGRAM_MAP[subType] || MERMAID_DIAGRAM_MAP.generic).label;
};
