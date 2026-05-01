/**
 * slideTypeMapper.js
 * スライドタイプ変更時のデータ引継ぎ（マッピング）ロジック
 *
 * 共通フィールド（title, subtitle, lead, speakerNotes, insight, footerNote）は
 * すべてのタイプで維持される。タイプ固有のデータは可能な限り変換し、
 * 非互換データは _preservedData に退避して非破壊的に保持する。
 */

// 全スライドタイプの共通フィールド
const COMMON_FIELDS = [
    'title', 'subtitle', 'lead', 'speakerNotes', 'insight', 'footerNote', 'kicker'
];

// タイプ固有のフィールド定義（これ以外は _preservedData に退避）
const TYPE_SPECIFIC_FIELDS = {
    title: ['kicker'],
    section: [],
    agenda: ['items'],
    bullet: ['bullets'],
    summary: ['summaryPoints', 'bullets'],
    'two-column': ['left', 'right'],
    table: ['headers', 'rows'],
    'chart-placeholder': ['chartType', 'chartTitle', 'categories', 'series'],
    'numbered-points': ['points'],
    'feature-cards': ['cards'],
    'pricing-table': ['plans', 'featureRows'],
    'chart-analysis': ['charts', 'insights'],
    'profile-fact-sheet': ['facts', 'profile'],
    'toc-list': ['items'],
};

/**
 * リストデータ（1次元配列）を抽出するヘルパー
 * スライドデータから箇条書き系の配列を見つけて返す
 */
const extractListData = (slide) => {
    if (slide.bullets && slide.bullets.length > 0) return slide.bullets;
    if (slide.items && slide.items.length > 0) {
        // items がオブジェクト配列（toc-list等）の場合は文字列に変換
        if (typeof slide.items[0] === 'object') {
            return slide.items.map(item => item.label || item.title || JSON.stringify(item));
        }
        return slide.items;
    }
    if (slide.summaryPoints && slide.summaryPoints.length > 0) return slide.summaryPoints;
    // two-column の bodyPoints を結合
    if (slide.left?.bodyPoints || slide.right?.bodyPoints) {
        return [...(slide.left?.bodyPoints || []), ...(slide.right?.bodyPoints || [])];
    }
    // numbered-points の titles
    if (slide.points && slide.points.length > 0) {
        return slide.points.map(p => p.title || '');
    }
    // feature-cards の titles
    if (slide.cards && slide.cards.length > 0) {
        return slide.cards.map(c => c.title || '');
    }
    return [];
};

/**
 * mapSlideData - スライドタイプ変更時のデータマッピング
 *
 * @param {Object} currentSlide - 現在のスライドデータ
 * @param {string} newType - 変更先のスライドタイプ
 * @returns {Object} 新タイプに適合したスライドデータ
 */
export const mapSlideData = (currentSlide, newType) => {
    const oldType = currentSlide.type;

    // 同じタイプへの変更は何もしない
    if (oldType === newType) return currentSlide;

    // 1. 共通フィールドを維持
    const newSlide = { type: newType };
    COMMON_FIELDS.forEach(field => {
        if (currentSlide[field] !== undefined) {
            newSlide[field] = currentSlide[field];
        }
    });

    // 2. 以前に保存された _preservedData があれば復元を試みる
    const preserved = currentSlide._preservedData || {};
    if (preserved[newType]) {
        // 以前このタイプだった時のデータがある場合、復元
        const restoredFields = preserved[newType];
        Object.keys(restoredFields).forEach(key => {
            newSlide[key] = restoredFields[key];
        });
        // 復元したタイプのデータを _preservedData から除去
        const newPreserved = { ...preserved };
        delete newPreserved[newType];
        // 現在のタイプ固有データを退避
        const currentSpecificData = {};
        const currentSpecificFields = TYPE_SPECIFIC_FIELDS[oldType] || [];
        currentSpecificFields.forEach(field => {
            if (currentSlide[field] !== undefined) {
                currentSpecificData[field] = currentSlide[field];
            }
        });
        if (Object.keys(currentSpecificData).length > 0) {
            newPreserved[oldType] = currentSpecificData;
        }
        if (Object.keys(newPreserved).length > 0) {
            newSlide._preservedData = newPreserved;
        }
        return newSlide;
    }

    // 3. 現在のタイプ固有データを _preservedData に退避
    const newPreserved = { ...preserved };
    const currentSpecificData = {};
    const currentSpecificFields = TYPE_SPECIFIC_FIELDS[oldType] || [];
    currentSpecificFields.forEach(field => {
        if (currentSlide[field] !== undefined) {
            currentSpecificData[field] = currentSlide[field];
        }
    });
    if (Object.keys(currentSpecificData).length > 0) {
        newPreserved[oldType] = currentSpecificData;
    }
    if (Object.keys(newPreserved).length > 0) {
        newSlide._preservedData = newPreserved;
    }

    // 4. データマッピング（可能な限り変換）
    const listData = extractListData(currentSlide);

    switch (newType) {
        case 'bullet':
            newSlide.bullets = listData.length > 0 ? listData : [''];
            break;

        case 'agenda':
            newSlide.items = listData.length > 0 ? listData : [''];
            break;

        case 'summary':
            newSlide.summaryPoints = listData.length > 0 ? listData : [''];
            break;

        case 'two-column': {
            const half = Math.ceil(listData.length / 2);
            newSlide.left = {
                heading: '左カラム',
                bodyPoints: listData.length > 0 ? listData.slice(0, half) : [''],
            };
            newSlide.right = {
                heading: '右カラム',
                bodyPoints: listData.length > 0 ? listData.slice(half) : [''],
            };
            break;
        }

        case 'table':
            newSlide.headers = ['項目', '内容'];
            newSlide.rows = listData.length > 0
                ? listData.map(item => [item, ''])
                : [['', '']];
            break;

        case 'numbered-points':
            newSlide.points = listData.length > 0
                ? listData.map((item, i) => ({
                    number: String(i + 1),
                    title: item,
                    description: '',
                }))
                : [{ number: '1', title: '', description: '' }];
            break;

        case 'feature-cards':
            newSlide.cards = listData.length > 0
                ? listData.map(item => ({
                    title: item,
                    description: '',
                    iconHint: '',
                }))
                : [{ title: '', description: '', iconHint: '' }];
            break;

        case 'toc-list':
            newSlide.items = listData.length > 0
                ? listData.map((item, i) => ({
                    index: String(i + 1).padStart(2, '0'),
                    label: item,
                    page: '',
                }))
                : [{ index: '01', label: '', page: '' }];
            break;

        case 'chart-placeholder':
            newSlide.chartType = 'bar';
            newSlide.chartTitle = currentSlide.title || 'グラフ';
            newSlide.categories = ['カテゴリ1', 'カテゴリ2', 'カテゴリ3'];
            newSlide.series = [{ name: '系列1', values: [0, 0, 0] }];
            break;

        case 'chart-analysis':
            newSlide.charts = [{
                chartType: 'bar',
                chartTitle: currentSlide.title || 'グラフ',
                categories: ['カテゴリ1', 'カテゴリ2'],
                series: [{ name: '系列1', values: [0, 0] }],
            }];
            newSlide.insights = listData.length > 0 ? listData.slice(0, 3) : [];
            break;

        case 'pricing-table':
            newSlide.plans = [
                { name: 'プラン1', price: '¥0', highlight: false },
                { name: 'プラン2', price: '¥0', highlight: true },
            ];
            newSlide.featureRows = [{ label: '機能', values: ['○', '○'] }];
            break;

        case 'profile-fact-sheet':
            newSlide.facts = [{ label: '項目', value: '' }];
            newSlide.profile = { name: '', role: '', bio: '' };
            break;

        case 'title':
        case 'section':
            // 特に固有データは不要
            break;

        default:
            break;
    }

    return newSlide;
};

/**
 * getDefaultSlideData - 新規スライド追加時のデフォルトデータ
 *
 * @param {string} type - スライドタイプ
 * @returns {Object} デフォルトのスライドデータ
 */
export const getDefaultSlideData = (type) => {
    const base = { type, title: '' };

    switch (type) {
        case 'title':
            return { ...base, title: '新しいスライド', subtitle: '', kicker: '' };
        case 'section':
            return { ...base, title: 'セクション', subtitle: '' };
        case 'agenda':
            return { ...base, title: 'アジェンダ', items: ['項目1'] };
        case 'bullet':
            return { ...base, title: '箇条書きスライド', bullets: ['ポイント1'] };
        case 'summary':
            return { ...base, title: '要約', summaryPoints: ['ポイント1'] };
        case 'two-column':
            return {
                ...base, title: '2カラム比較',
                left: { heading: '左カラム', bodyPoints: [''] },
                right: { heading: '右カラム', bodyPoints: [''] },
            };
        case 'table':
            return { ...base, title: 'テーブル', headers: ['項目', '内容'], rows: [['', '']] };
        case 'chart-placeholder':
            return {
                ...base, title: 'グラフ', chartType: 'bar', chartTitle: 'グラフタイトル',
                categories: ['カテゴリ1', 'カテゴリ2'],
                series: [{ name: '系列1', values: [0, 0] }],
            };
        case 'numbered-points':
            return {
                ...base, title: '番号付きポイント',
                points: [{ number: '1', title: '', description: '' }],
            };
        case 'feature-cards':
            return {
                ...base, title: '特長カード',
                cards: [{ title: '', description: '', iconHint: '' }],
            };
        case 'pricing-table':
            return {
                ...base, title: '料金プラン',
                plans: [{ name: 'プラン', price: '¥0', highlight: false }],
                featureRows: [{ label: '機能', values: ['○'] }],
            };
        case 'chart-analysis':
            return {
                ...base, title: 'グラフ分析',
                charts: [{
                    chartType: 'bar', chartTitle: 'グラフ',
                    categories: ['カテゴリ1'], series: [{ name: '系列1', values: [0] }],
                }],
                insights: [],
            };
        case 'profile-fact-sheet':
            return {
                ...base, title: '会社概要',
                facts: [{ label: '項目', value: '' }],
                profile: { name: '', role: '', bio: '' },
            };
        case 'toc-list':
            return {
                ...base, title: '目次',
                items: [{ index: '01', label: '', page: '' }],
            };
        default:
            return { ...base, title: '新しいスライド' };
    }
};

// 利用可能なスライドタイプ一覧（セレクトボックス用）
export const SLIDE_TYPES = [
    { value: 'title', label: '表紙 (Title)' },
    { value: 'section', label: 'セクション区切り' },
    { value: 'agenda', label: 'アジェンダ' },
    { value: 'bullet', label: '箇条書き' },
    { value: 'summary', label: '要約' },
    { value: 'two-column', label: '2カラム' },
    { value: 'table', label: 'テーブル' },
    { value: 'chart-placeholder', label: 'グラフ' },
    { value: 'numbered-points', label: '番号付き説明' },
    { value: 'feature-cards', label: '特長カード' },
    { value: 'pricing-table', label: '料金プラン' },
    { value: 'chart-analysis', label: 'グラフ分析' },
    { value: 'profile-fact-sheet', label: '会社概要' },
    { value: 'toc-list', label: '目次一覧' },
];
