// src/utils/dateUtils.ts

/**
 * 日付入力の型定義
 */
type DateInput = Date | string | number | null | undefined;

/**
 * 会話アイテムの型定義
 */
interface ConversationItem {
    id: string;
    name?: string;
    created_at?: number | string;
    updated_at?: number | string;
    [key: string]: unknown;
}

/**
 * グループ化された会話の型定義
 */
interface ConversationGroup {
    title: string;
    key: string;
    items: ConversationItem[];
}

/**
 * タイムスタンプまたは日付文字列をDateオブジェクトに正規化
 */
export const normalizeDate = (dateInput: DateInput): Date => {
    if (!dateInput) return new Date();

    // 数値かつ10桁（秒単位）の場合はミリ秒に変換 (Dify API対応)
    if (typeof dateInput === 'number' && dateInput.toString().length === 10) {
        return new Date(dateInput * 1000);
    }

    return new Date(dateInput);
};

/**
 * 会話リストを時系列（今日、昨日...）にグルーピングする
 * @param conversations - { id, name, created_at, ... }
 * @returns [{ title: '今日', items: [...] }, ...]
 */
export const groupConversationsByDate = (conversations: ConversationItem[]): ConversationGroup[] => {
    if (!conversations || conversations.length === 0) return [];

    const groups: Record<string, ConversationItem[]> = {
        today: [],
        yesterday: [],
        previous7Days: [],
        previous30Days: [],
        older: []
    };

    const now = new Date();

    // 今日の0:00
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // 昨日の0:00
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);
    // 7日前の0:00
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - 7);
    // 30日前の0:00
    const monthStart = new Date(todayStart);
    monthStart.setDate(todayStart.getDate() - 30);

    conversations.forEach((conv) => {
        const date = normalizeDate(conv.created_at || conv.updated_at);

        if (date >= todayStart) {
            groups.today.push(conv);
        } else if (date >= yesterdayStart) {
            groups.yesterday.push(conv);
        } else if (date >= weekStart) {
            groups.previous7Days.push(conv);
        } else if (date >= monthStart) {
            groups.previous30Days.push(conv);
        } else {
            groups.older.push(conv);
        }
    });

    // 結果を配列形式で返す
    const result: ConversationGroup[] = [];

    if (groups.today.length > 0) result.push({ title: '今日', key: 'today', items: groups.today });
    if (groups.yesterday.length > 0) result.push({ title: '昨日', key: 'yesterday', items: groups.yesterday });
    if (groups.previous7Days.length > 0) result.push({ title: '過去7日間', key: 'week', items: groups.previous7Days });
    if (groups.previous30Days.length > 0) result.push({ title: '過去30日間', key: 'month', items: groups.previous30Days });
    if (groups.older.length > 0) result.push({ title: 'それ以前', key: 'older', items: groups.older });

    return result;
};
