import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { creditApi } from '../api/creditApi';
import { useAuth } from '../context/AuthContext';

// クレジットの換算レート (1 USD = 10,000 CR)
export const CREDIT_RATE_USD = 10000;
// デフォルトの固定クレジット (RAG等の価格情報がないノード用)
export const DEFAULT_FALLBACK_CREDIT = 50;

interface CreditContextType {
  creditBalance: number;
  isLoadingCredit: boolean;
  deductCredit: (amount: number) => void;
  addCredit: (amount: number) => void;
  nextResetDate: string; // ★追加: 次回リセット日
  userTier: number | null; // ★追加: ユーザーTier
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

interface CreditProviderProps {
  children: ReactNode;
  initialBalance?: number;
}

export const CreditProvider: React.FC<CreditProviderProps> = ({ children, initialBalance = 0 }) => {
  const { user } = useAuth();
  const userId = user?.userId || user?.email || null; // ユーザーオブジェクトからIDを抽出

  const [creditBalance, setCreditBalance] = useState<number>(initialBalance);
  const [nextResetDate, setNextResetDate] = useState<string>(''); // ★APIから取得するように変更
  const [userTier, setUserTier] = useState<number | null>(null); // ★APIから取得
  const [isLoadingCredit, setIsLoadingCredit] = useState<boolean>(true);

  // 初回マウント時、またはuserId変更時にバックエンドから残高を取得
  useEffect(() => {
    let isMounted = true;
    const fetchBalance = async () => {
      if (!userId) {
        setIsLoadingCredit(false);
        return;
      }
      setIsLoadingCredit(true);
      try {
        const response = await creditApi.fetchUserCredit(userId);
        if (isMounted) {
          setCreditBalance(response.balance);
          setNextResetDate(response.nextResetDateStr); // ★APIからセット
          setUserTier(response.tier); // ★APIからセット
        }
      } catch (err) {
        console.error('[CreditContext] Failed to fetch credit:', err);
      } finally {
        if (isMounted) setIsLoadingCredit(false);
      }
    };

    fetchBalance();
    
    return () => { isMounted = false; };
  }, [userId]);

  const deductCredit = (amount: number) => {
    // オプティミスティック更新（UIを即座に反映）
    setCreditBalance((prev) => Math.max(0, prev - amount));
    
    // バックエンドへ非同期で同期
    if (userId) {
      creditApi.deductUserCredit(userId, amount).catch(err => {
        console.error('[CreditContext] Sync deduction failed:', err);
      });
    }
  };

  const addCredit = (amount: number) => {
    // オプティミスティック更新
    setCreditBalance((prev) => prev + amount);
    
    // バックエンドへ非同期で同期
    if (userId) {
      creditApi.addUserCredit(userId, amount).catch(err => {
        console.error('[CreditContext] Sync addition failed:', err);
      });
    }
  };

  return (
    <CreditContext.Provider value={{ creditBalance, isLoadingCredit, deductCredit, addCredit, nextResetDate, userTier }}>
      {children}
    </CreditContext.Provider>
  );
};

export const useCredit = (): CreditContextType => {
  const context = useContext(CreditContext);
  if (context === undefined) {
    throw new Error('useCredit must be used within a CreditProvider');
  }
  return context;
};
