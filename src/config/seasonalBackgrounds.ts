// src/config/seasonalBackgrounds.ts

export interface SeasonalBackground {
    id: string;
    start: string; // 'MM-DD'形式
    end: string;   // 'MM-DD'形式
    cssClass: string;
}

export const seasonalBackgrounds: SeasonalBackground[] = [
    {
        id: 'spring-sakura',
        start: '02-15', // 3月15日〜
        end: '04-10',   // 4月10日まで
        cssClass: 'bg-spring',
    },
    // 今後、夏や冬のイベントなどを追加していく
];
