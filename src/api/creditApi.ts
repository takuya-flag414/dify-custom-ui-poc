import { mockUserCredits, mockSystemSettings } from '../mocks/creditMocks';

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
    // 新規ユーザーにはデフォルト上限（スタンダード）を付与
    mockUserCredits[userId] = { 
      balance: mockSystemSettings.defaultStandardLimit, 
      limit: mockSystemSettings.defaultStandardLimit, 
      lastResetTime: now 
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
}

export const creditApi = {
  /**
   * ユーザーのクレジット残高と次回リセット日を取得する（エミュレーション）
   */
  fetchUserCredit: async (userId: string): Promise<FetchCreditResponse> => {
    await delay(300); // ネットワーク遅延のシミュレーション
    
    _checkAndApplyWeeklyReset(userId);
    
    const nextMonday = _getNextMonday(new Date());
    const nextResetDateStr = `${nextMonday.getMonth() + 1}月${nextMonday.getDate()}日`;
    
    return {
      balance: mockUserCredits[userId].balance,
      nextResetDateStr
    };
  },

  /**
   * ユーザーのクレジットを減算する（エミュレーション）
   */
  deductUserCredit: async (userId: string, amount: number): Promise<number> => {
    await delay(100); 
    
    _checkAndApplyWeeklyReset(userId);
    
    const newBalance = Math.max(0, mockUserCredits[userId].balance - amount);
    mockUserCredits[userId].balance = newBalance;
    
    return newBalance;
  },
  
  /**
   * ユーザーのクレジットを加算する（エミュレーション）
   */
  addUserCredit: async (userId: string, amount: number): Promise<number> => {
    await delay(100);
    
    _checkAndApplyWeeklyReset(userId);
    
    const newBalance = mockUserCredits[userId].balance + amount;
    mockUserCredits[userId].balance = newBalance;
    
    return newBalance;
  },

  /**
   * 【管理者用】ユーザーに特別ボーナスクレジットを付与する
   */
  grantBonusCredit: async (adminUserId: string, targetUserId: string, amount: number): Promise<void> => {
    await delay(200);
    console.log(`[Mock Backend] Admin ${adminUserId} granted ${amount} CR to ${targetUserId}`);
    _checkAndApplyWeeklyReset(targetUserId);
    mockUserCredits[targetUserId].balance += amount;
  },

  /**
   * 【管理者用】システム全体のデフォルト上限を更新する（モック）
   */
  updateSystemCreditLimit: async (newStandardLimit: number): Promise<void> => {
    await delay(200);
    console.log(`[Mock Backend] Global standard limit updated to ${newStandardLimit}`);
    mockSystemSettings.defaultStandardLimit = newStandardLimit;
  }
};
