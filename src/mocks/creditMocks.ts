export interface MockUserCredit {
  balance: number;
  limit: number;
  lastResetTime: number; // エポックミリ秒（前回月曜日リセットが適用された日時）
}

// 初期モックデータ
// Firebaseに移行するまでの間、ローカルメモリでクレジット残高をエミュレーションします。
const now = Date.now();
export const mockUserCredits: Record<string, MockUserCredit> = {
  // 代表的なモックユーザー（mockUsers.ts 等のIDと一致させる想定）
  'user_123': { balance: 5000, limit: 10000, lastResetTime: now },
  'admin_456': { balance: 10000, limit: 10000, lastResetTime: now },
  'general_789': { balance: 50, limit: 5000, lastResetTime: now }, // もうすぐ枯渇
  'empty_000': { balance: 0, limit: 5000, lastResetTime: now },    // 枯渇済み
};
