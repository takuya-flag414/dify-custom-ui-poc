// src/hooks/useSeasonalBackground.ts
import { useState, useEffect } from 'react';
import { seasonalBackgrounds } from '../config/seasonalBackgrounds';

/**
 * 現在の日付が設定された季節イベント期間内にあるかを判定し、
 * 該当する場合は対応するCSSクラス名を、該当しない場合はnullを返します。
 */
export const useSeasonalBackground = (): string | null => {
    const [seasonalClass, setSeasonalClass] = useState<string | null>(null);

    useEffect(() => {
        const today = new Date();
        // MM-DD 形式の文字列を作成（例: '03-15'）
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${month}-${day}`;

        // 期間内に該当するイベントを検索
        // ※今回は年またぎ（12-25〜01-05など）は考慮せず単純な文字列比較としています
        const currentEvent = seasonalBackgrounds.find(event => {
            // 期間が通常の場合 (start <= end)
            if (event.start <= event.end) {
                return todayStr >= event.start && todayStr <= event.end;
            }
            // もし年またぎのイベントを入れる場合 (start > end) への簡易対応
            return todayStr >= event.start || todayStr <= event.end;
        });

        if (currentEvent) {
            setSeasonalClass(currentEvent.cssClass);
        } else {
            setSeasonalClass(null);
        }
    }, []);

    return seasonalClass;
};
