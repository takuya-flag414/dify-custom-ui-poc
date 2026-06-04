export interface CoverViewModel {
    title: string;
    subtitle: string | null;
    author: string | null;
    date: string | null;
    org: string | null;
    badgeText: string | null;
    hasFooter: boolean;
}

export function createCoverViewModel(meta: any = {}): CoverViewModel {
    const year = meta.year || '';
    const label = meta.label || '';
    
    // バッジテキストの組み立て (UIとWordでロジックを統一)
    const badgeParts = [year, label].filter(Boolean);
    const badgeText = badgeParts.length > 0 ? badgeParts.join(' / ') : null;

    return {
        title: meta.title || '無題のドキュメント',
        subtitle: meta.subtitle || null,
        author: meta.author || null,
        date: meta.date || null,
        org: meta.org || null,
        badgeText,
        hasFooter: !!(meta.author || meta.date)
    };
}
