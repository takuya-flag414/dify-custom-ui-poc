export const DEPARTMENTS: Record<string, string> = {
    '1': '商品企画部',
    '2': '営業部',
    '3': 'クリエイティブマーケティング部',
    '4': 'その他',
    '5': 'カスタマーリレーション部',
};

// ストア名の整形ユーティリティ
export const formatStoreDisplayName = (rawName: string) => {
    if (!rawName) return '';
    const parts = rawName.split('_');
    if (parts.length < 3) return rawName; // フォーマット外はそのまま

    const scopeMap: Record<string, string> = {
        'public': '全社公開',
        'private': '部署限定',
        'protected': 'システム保護'
    };

    const scopeStr = scopeMap[parts[0]] || parts[0];
    const deptStr = DEPARTMENTS[parts[1]] || `部署${parts[1]}`;
    const purposeStr = parts.slice(2).join('_');

    return `【${scopeStr}】${deptStr} - ${purposeStr}`;
};
