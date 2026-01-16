// src/utils/timeUtils.ts

/**
 * 時刻に基づく挨拶メッセージの型定義
 */
export interface TimeBasedGreeting {
    greeting: string;
    subMessage: string;
}

/**
 * 現在の時刻に基づいて適切な挨拶メッセージを返す
 * @param userName - ユーザー名（オプション）
 * @param currentTime - テスト用の時刻（省略時は現在時刻を使用）
 * @returns { greeting: string, subMessage: string }
 */
export const getTimeBasedGreeting = (userName: string = '', currentTime: Date = new Date()): TimeBasedGreeting => {
    const hour = currentTime.getHours();

    // ユーザー名がある場合は「〇〇さん」を追加
    const nameSuffix = userName ? `、${userName}さん` : '';

    // 時間帯別の挨拶メッセージ
    if (hour >= 5 && hour < 10) {
        // 早朝 (05:00 - 10:00)
        return {
            greeting: `おはようございます${nameSuffix}`,
            subMessage: '今日も1日頑張りましょう。'
        };
    } else if (hour >= 10 && hour < 17) {
        // 日中 (10:00 - 17:00)
        return {
            greeting: `こんにちは${nameSuffix}`,
            subMessage: '何かお手伝いできることはありますか？'
        };
    } else if (hour >= 17 && hour < 22) {
        // 夕方 (17:00 - 22:00)
        return {
            greeting: `お疲れ様です${nameSuffix}`,
            subMessage: '残りの業務もサポートします。'
        };
    } else {
        // 深夜 (22:00 - 05:00)
        return {
            greeting: `遅くまでお疲れ様です${nameSuffix}`,
            subMessage: '無理なさらないでくださいね。'
        };
    }
};
