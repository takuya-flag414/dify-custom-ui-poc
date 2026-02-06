// src/mocks/storeData.js
// Gemini File Search ストアのモックデータ
// Phase A: UIモック用、Phase B: API経由に置き換え予定

/**
 * カテゴリ別アイコンマッピング（SF Symbols風）
 * 将来的にはSVGコンポーネントに置き換え可能
 */
export const STORE_ICONS = {
    sales: 'chart.bar.fill',       // 営業
    tech: 'terminal.fill',         // 技術
    hr: 'person.2.crop.square.stack', // 人事
    rules: 'text.book.closed.fill', // 規定
    default: 'folder.fill'
};

/**
 * Backend Bからのレスポンスを模したモックデータ
 * 実際のBackend BのGemini File Search Plugin list_stores出力形式に準拠
 * 
 * @see public/Backend B - Gemini File Search PoC.yml
 * @see public/dify-gemini-file-search-plugin-manual.md
 */
export const MOCK_STORES = [
    {
        id: 'fileSearchStores/mock_sales_001',
        display_name: '営業・マーケティング本部',
        category: 'sales',
        description: '顧客提案書、営業マニュアル、市場調査レポート',
        create_time: '2026-01-15T09:00:00Z'
    },
    {
        id: 'fileSearchStores/mock_tech_002',
        display_name: '開発・技術部',
        category: 'tech',
        description: 'API仕様書、アーキテクチャ設計図、技術検証ログ',
        create_time: '2026-01-20T10:30:00Z'
    },
    {
        id: 'fileSearchStores/mock_rules_003',
        display_name: '全社規定・コンプライアンス',
        category: 'rules',
        description: '就業規則、経費精算ガイドライン、セキュリティポリシー',
        create_time: '2026-01-10T08:00:00Z'
    }
];

/**
 * ストアのカテゴリからアイコン識別子を取得
 * @param {string} category - ストアのカテゴリ
 * @returns {string} アイコン識別子
 */
export const getStoreIcon = (category) => {
    return STORE_ICONS[category] || STORE_ICONS.default;
};
