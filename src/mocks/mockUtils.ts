// src/mocks/mockUtils.ts

/**
 * 指定時間待機する (ミリ秒)
 * @param ms - 待機時間（ミリ秒）
 */
export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * ランダムな待機時間を生成する
 * @param min - 最小時間(ms)
 * @param max - 最大時間(ms)
 * @returns ランダムな待機時間
 */
export const randomDelay = (min: number = 20, max: number = 80): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
