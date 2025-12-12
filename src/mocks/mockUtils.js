// src/mocks/mockUtils.js

/**
 * 指定時間待機する (ミリ秒)
 * @param {number} ms 
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * ランダムな待機時間を生成する
 * @param {number} min 最小時間(ms)
 * @param {number} max 最大時間(ms)
 */
export const randomDelay = (min = 20, max = 80) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};