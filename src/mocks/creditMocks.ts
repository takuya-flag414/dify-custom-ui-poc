export interface MockUserCredit {
  balance: number;
  limit: number;
  lastResetTime: number; // エポックミリ秒（前回月曜日リセットが適用された日時）
}

// モック用のシステム全体設定（Global Config）
export const mockSystemSettings = {
  defaultLightLimit: 5000,
  defaultStandardLimit: 10000,
  defaultHeavyLimit: 20000,
  usdToCreditRate: 10000,
  fallbackCosts: {
    rag_search: 50,
    db_lookup: 10
  },
  billableNodeTypes: ["llm", "http-request", "tool"]
};

// 初期モックデータ
// Firebaseに移行するまでの間、ローカルメモリでクレジット残高をエミュレーションします。
const now = Date.now();
export const mockUserCredits: Record<string, MockUserCredit> = {
  // 代表的なモックユーザー（mockUsers.ts 等のIDと一致させる想定）
  'user_123': { balance: 10000, limit: 10000, lastResetTime: now },
  'admin_456': { balance: 20000, limit: 20000, lastResetTime: now },
  'general_789': { balance: 50, limit: 10000, lastResetTime: now }, // もうすぐ枯渇
  'empty_000': { balance: 0, limit: 10000, lastResetTime: now },    // 枯渇済み
};
