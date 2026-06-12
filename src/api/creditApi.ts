import { mockUserCredits, mockSystemSettings } from '../mocks/creditMocks';
import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { isStrictFEMode } from '../config/env';

// 非同期通信のネットワーク遅延をシミュレート
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- 疑似クーロン用ロジック ---
const _getNextMonday = (date: Date): Date => {
  const dayOfWeek = date.getDay(); // 0:Sun, 1:Mon, ..., 6:Sat
  const daysUntilNextMonday = (1 + 7 - dayOfWeek) % 7;
  const daysToAdd = daysUntilNextMonday === 0 ? 7 : daysUntilNextMonday;
  const nextMonday = new Date(date.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
};

const _checkAndApplyWeeklyReset = (userId: string) => {
  const now = Date.now();
  if (!mockUserCredits[userId]) {
    // 新規ユーザーにはデフォルト上限（Tier 2）を付与
    mockUserCredits[userId] = { 
      balance: mockSystemSettings.default_tier2_limit, 
      limit: mockSystemSettings.default_tier2_limit, 
      lastResetTime: now,
      tier: 2
    };
    return;
  }
  
  const lastReset = new Date(mockUserCredits[userId].lastResetTime);
  const nextMondayAfterLastReset = _getNextMonday(lastReset);

  // もし前回の更新日時から見て「次の月曜の0時」を過ぎていればリセット
  if (now >= nextMondayAfterLastReset.getTime()) {
    console.log(`[Mock Backend] Applying weekly reset for user ${userId}`);
    mockUserCredits[userId].balance = mockUserCredits[userId].limit;
    mockUserCredits[userId].lastResetTime = now;
  }
};

export interface FetchCreditResponse {
  balance: number;
  nextResetDateStr: string;
  tier: number;
}

export const creditApi = {
  fetchUserCredit: async (userId: string): Promise<FetchCreditResponse> => {
    if (isStrictFEMode) {
      await delay(300); // ネットワーク遅延のシミュレーション
      _checkAndApplyWeeklyReset(userId);
      const nextMonday = _getNextMonday(new Date());
      const nextResetDateStr = `${nextMonday.getMonth() + 1}月${nextMonday.getDate()}日`;
      return {
        balance: mockUserCredits[userId].balance,
        nextResetDateStr,
        tier: mockUserCredits[userId].tier // ← 下のコードからtierを追加
      };
    }
    // ← 上のコードから本番API呼び出しを残す
    const fetchCreditFn = httpsCallable<void, FetchCreditResponse>(functions, 'fetchUserCredit');
    const { data } = await fetchCreditFn();
    return data;
  },

  deductUserCredit: async (userId: string, amount: number): Promise<number> => {
    if (isStrictFEMode) {
      await delay(100); 
      _checkAndApplyWeeklyReset(userId);
      const newBalance = Math.max(0, mockUserCredits[userId].balance - amount);
      mockUserCredits[userId].balance = newBalance;
      return newBalance;
    }
    const deductCreditFn = httpsCallable<{ amount: number }, { success: boolean }>(functions, 'deductUserCredit');
    await deductCreditFn({ amount });
    return 0;
  },
  
  addUserCredit: async (userId: string, amount: number): Promise<number> => {
    if (isStrictFEMode) {
      await delay(100);
      _checkAndApplyWeeklyReset(userId);
      const newBalance = mockUserCredits[userId].balance + amount;
      mockUserCredits[userId].balance = newBalance;
      return newBalance;
    }
    const addCreditFn = httpsCallable<{ amount: number }, { success: boolean }>(functions, 'addUserCredit');
    await addCreditFn({ amount });
    return 0;
  },

  grantBonusCredit: async (adminUserId: string, targetUserId: string, amount: number): Promise<void> => {
    if (isStrictFEMode) {
      await delay(200);
      console.log(`[Mock Backend] Admin ${adminUserId} granted ${amount} CR to ${targetUserId}`);
      _checkAndApplyWeeklyReset(targetUserId);
      mockUserCredits[targetUserId].balance += amount;
      return;
    }
    const grantBonusFn = httpsCallable<{ targetUserId: string, amount: number }, { success: boolean }>(functions, 'grantBonusCredit');
    await grantBonusFn({ targetUserId, amount });
  },

  updateUserTier: async (adminUserId: string, targetUserId: string, newTier: number): Promise<void> => {
    if (isStrictFEMode) {
      await delay(200);
      console.log(`[Mock Backend] Admin ${adminUserId} updated tier for ${targetUserId} to ${newTier}`);
      return;
    }
    const updateTierFn = httpsCallable<{ targetUserId: string, newTier: number }, { success: boolean }>(functions, 'updateUserTier');
    await updateTierFn({ targetUserId, newTier });
  },

  updateSystemSettings: async (adminUserId: string, tiers: any): Promise<void> => {
    if (isStrictFEMode) {
      await delay(200);
      console.log(`[Mock Backend] Admin ${adminUserId} updated system settings`, tiers);
      return;
    }
    const updateSettingsFn = httpsCallable<{ tiers: any }, { success: boolean }>(functions, 'updateSystemSettings');
    await updateSettingsFn({ tiers });
  },

  /**
   * 【管理者用】システム全体のデフォルト上限を更新する（モック）
   */
  updateSystemCreditLimit: async (newTier2Limit: number): Promise<void> => {
    // 下のコード（incoming）の変数名変更を採用
    await delay(200);
    console.log(`[Mock Backend] Global Tier 2 limit updated to ${newTier2Limit}`);
    mockSystemSettings.default_tier2_limit = newTier2Limit;
  }, // ← カンマを忘れないように注意してください

  // 下のコードで消されかけていた、上のコード（HEAD）の大事な関数を丸ごと復活させる
  adminGetUserCreditsList: async (): Promise<{ users: any[] }> => {
    if (isStrictFEMode) {
      await delay(300);
      const usersList = Object.keys(mockUserCredits).map(uid => ({
        user_id: uid,
        name: `User ${uid}`,
        email: `user${uid}@example.com`,
        tier: mockUserCredits[uid].tier || 2, // ← せっかくなのでモックのtier情報も使えるように微修正
        credit_balance: mockUserCredits[uid].balance,
        last_reset_time: mockUserCredits[uid].lastResetTime
      }));
      return { users: usersList };
    }
    const getListFn = httpsCallable<void, { users: any[] }>(functions, 'adminGetUserCreditsList');
    const { data } = await getListFn();
    return data;
  }
};
  

