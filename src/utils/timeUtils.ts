// src/utils/timeUtils.ts

/**
 * 時刻に基づく挨拶メッセージの型定義
 */
export interface TimeBasedGreeting {
    greeting: string;
    subMessage: string;
}

/**
 * Smart Greeting: 曜日・時間帯を考慮したインテリジェントな挨拶メッセージを返す
 * 
 * @param userName - ユーザー名（オプション）
 * @param currentTime - テスト用の時刻（省略時は現在時刻を使用）
 * @returns { greeting: string, subMessage: string }
 */
export const getTimeBasedGreeting = (userName: string = '', currentTime: Date = new Date()): TimeBasedGreeting => {
    const hour = currentTime.getHours();
    const day = currentTime.getDay(); // 0 = Sunday, 1 = Monday, ...

    // 曜日判定
    const isMonday = day === 1;
    const isFriday = day === 5;
    const isWeekend = day === 0 || day === 6;

    // ユーザー名がある場合は「〇〇さん」を追加
    const nameSuffix = userName ? `、${userName}さん` : '';

    // === Smart Greeting Matrix ===

    // 月曜朝: スタートダッシュ
    if (isMonday && hour >= 5 && hour < 10) {
        return {
            greeting: `おはようございます${nameSuffix}`,
            subMessage: '今週も良いスタートを切りましょう。'
        };
    }

    // 深夜 (22:00 - 05:00): ヘルスケア
    if (hour >= 22 || hour < 5) {
        return {
            greeting: `こんばんは${nameSuffix}`,
            subMessage: '遅くまでありがとうございます。無理をなさらずに。'
        };
    }

    // 金曜夕方以降: 達成感
    if (isFriday && hour >= 17) {
        return {
            greeting: `今週もお疲れ様でした${nameSuffix}`,
            subMessage: '週末まであと少しです。'
        };
    }

    // 平日ランチタイム (11:00 - 14:00): 休憩
    if (!isWeekend && hour >= 11 && hour < 14) {
        return {
            greeting: `こんにちは${nameSuffix}`,
            subMessage: 'ランチ休憩はとれましたか？'
        };
    }

    // 平日午後 (14:00 - 17:00): フォーカスサポート
    if (!isWeekend && hour >= 14 && hour < 17) {
        return {
            greeting: `お疲れ様です${nameSuffix}`,
            subMessage: '午後の業務も無理なく進めましょう。'
        };
    }

    // 夕方 (17:00 - 22:00): 標準
    if (hour >= 17 && hour < 22) {
        return {
            greeting: `お疲れ様です${nameSuffix}`,
            subMessage: '残りの業務もサポートします。'
        };
    }

    // 早朝 (05:00 - 10:00): 標準
    if (hour >= 5 && hour < 10) {
        return {
            greeting: `おはようございます${nameSuffix}`,
            subMessage: '今日も1日頑張りましょう。'
        };
    }

    // 日中フォールバック (10:00 - 11:00)
    return {
        greeting: `こんにちは${nameSuffix}`,
        subMessage: '何かお手伝いできることはありますか？'
    };
};
