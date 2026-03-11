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
        start: '03-20', // 3月20日〜
        end: '04-10',   // 4月10日まで
        cssClass: 'bg-spring',
    },
    {
        id: 'early-summer-carp',
        start: '04-15', // 4月15日〜
        end: '05-10',   // 5月10日まで
        cssClass: 'bg-early-summer',
    },
    // 今後、夏や冬のイベントなどを追加していく
];
