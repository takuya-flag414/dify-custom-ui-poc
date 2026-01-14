// src/hooks/useOnboarding.js
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

/**
 * オンボーディング状態管理Hook
 * 
 * ★ Phase A 認証対応:
 * - userId ごとにオンボーディング完了フラグを管理
 * - 新規アカウント作成時のみオンボーディングを表示
 * - 既存アカウントでログイン時はスキップ
 * 
 * @param {string} userId - 認証済みユーザーID
 */
export const useOnboarding = (userId) => {
    // ストレージキーをユーザーIDに紐づけ
    const storageKey = userId ? `onboarding_completed_${userId}` : null;

    // オンボーディング完了フラグ
    const [isCompleted, setIsCompleted] = useState(() => {
        if (!storageKey) return true; // userIdがない場合はスキップ
        try {
            return localStorage.getItem(storageKey) === 'true';
        } catch (e) {
            console.error('[useOnboarding] Failed to read completion flag:', e);
            return false;
        }
    });

    // アプリ本体の描画準備完了フラグ
    const [isAppReady, setIsAppReady] = useState(() => {
        if (!storageKey) return true; // userIdがない場合は即座にtrue
        try {
            return localStorage.getItem(storageKey) === 'true';
        } catch (e) {
            return false;
        }
    });

    // userIdが変更されたら状態を再評価
    useEffect(() => {
        if (!storageKey) {
            setIsCompleted(true);
            setIsAppReady(true);
            return;
        }

        try {
            const completed = localStorage.getItem(storageKey) === 'true';
            setIsCompleted(completed);
            setIsAppReady(completed);
            console.log(`[useOnboarding] User ${userId}: completed=${completed}`);
        } catch (e) {
            console.error('[useOnboarding] Failed to check completion:', e);
        }
    }, [storageKey, userId]);

    // 現在のステップ (0: Welcome, 1: Name, 2: Style, 3: Ready)
    const [currentStep, setCurrentStep] = useState(0);
    
    // ステップ遷移中のロック用Ref（レンダリングに依存せず即座にロック）
    const transitionLockRef = useRef(false);

    // 一時プロファイル（完了時に useSettings に渡す）
    const [tempProfile, setTempProfile] = useState({
        name: '',
        style: 'partner' // 'efficient' | 'partner'
    });

    // ステップ定義
    const steps = useMemo(() => [
        { id: 'welcome', title: 'ようこそ' },
        { id: 'name', title: 'お名前' },
        { id: 'style', title: 'スタイル' },
        { id: 'ready', title: '準備完了' }
    ], []);

    const totalSteps = steps.length;
    const step = steps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    // 次のステップへ
    const nextStep = useCallback(() => {
        if (transitionLockRef.current) return;
        
        if (currentStep < totalSteps - 1) {
            transitionLockRef.current = true;
            setCurrentStep(prev => prev + 1);
            setTimeout(() => {
                transitionLockRef.current = false;
            }, 400); // Animation duration + buffer
        }
    }, [currentStep, totalSteps]);

    // 前のステップへ
    const prevStep = useCallback(() => {
        if (transitionLockRef.current) return;
        
        if (currentStep > 0) {
            transitionLockRef.current = true;
            setCurrentStep(prev => prev - 1);
            setTimeout(() => {
                transitionLockRef.current = false;
            }, 400); // Animation duration + buffer
        }
    }, [currentStep]);

    // 名前を一時保存
    const setTempName = useCallback((name) => {
        setTempProfile(prev => ({ ...prev, name }));
    }, []);

    // スタイルを一時保存
    const setTempStyle = useCallback((style) => {
        setTempProfile(prev => ({ ...prev, style }));
    }, []);

    // オンボーディング完了
    const completeOnboarding = useCallback((updateSettingsFn) => {
        if (!storageKey) return;

        try {
            // プロファイルを永続化（updateSettingsFn は App.jsx から渡される）
            if (updateSettingsFn && tempProfile.name) {
                updateSettingsFn('profile', 'displayName', tempProfile.name);
                // aiStyleはpromptカテゴリに保存（プロンプト設定画面でも変更可能）
                updateSettingsFn('prompt', 'aiStyle', tempProfile.style);
            }

            // 完了フラグを保存（ユーザーIDに紐づけ）
            localStorage.setItem(storageKey, 'true');
            setIsCompleted(true);

            // OnboardingScreenのexit animation完了後にアプリ描画開始
            setTimeout(() => {
                setIsAppReady(true);
            }, 600); // exit animation duration (500ms) + buffer

            console.log('[useOnboarding] Onboarding completed for user:', userId, tempProfile);
        } catch (e) {
            console.error('[useOnboarding] Failed to complete onboarding:', e);
        }
    }, [storageKey, tempProfile, userId]);

    // オンボーディングをリセット（デバッグ/設定用）
    const resetOnboarding = useCallback(() => {
        if (!storageKey) return;

        try {
            localStorage.removeItem(storageKey);
            setIsCompleted(false);
            setIsAppReady(false);
            setCurrentStep(0);
            setTempProfile({ name: '', style: 'partner' });
            console.log('[useOnboarding] Onboarding reset for user:', userId);
        } catch (e) {
            console.error('[useOnboarding] Failed to reset onboarding:', e);
        }
    }, [storageKey, userId]);

    return {
        // 状態
        isCompleted,
        isAppReady,
        currentStep,
        step,
        totalSteps,
        tempProfile,
        isFirstStep,
        isLastStep,

        // アクション
        nextStep,
        prevStep,
        setTempName,
        setTempStyle,
        completeOnboarding,
        resetOnboarding
    };
};
