// src/hooks/useOnboarding.ts
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

/**
 * オンボーディングステップの型
 */
export interface OnboardingStep {
    id: string;
    title: string;
}

/**
 * 一時プロファイルの型
 */
export interface TempProfile {
    name: string;
    style: 'efficient' | 'partner';
}

/**
 * 設定更新関数の型
 */
export type UpdateSettingsFunction = (category: string, key: string, value: unknown) => void;

/**
 * useOnboarding の戻り値の型
 */
export interface UseOnboardingReturn {
    isCompleted: boolean;
    isAppReady: boolean;
    currentStep: number;
    step: OnboardingStep;
    totalSteps: number;
    tempProfile: TempProfile;
    isFirstStep: boolean;
    isLastStep: boolean;
    nextStep: () => void;
    prevStep: () => void;
    setTempName: (name: string) => void;
    setTempStyle: (style: 'efficient' | 'partner') => void;
    completeOnboarding: (updateSettingsFn?: UpdateSettingsFunction) => void;
    resetOnboarding: () => void;
}

/**
 * オンボーディング状態管理Hook
 */
export const useOnboarding = (userId: string | null): UseOnboardingReturn => {
    const storageKey = userId ? `onboarding_completed_${userId}` : null;

    const [isCompleted, setIsCompleted] = useState<boolean>(() => {
        if (!storageKey) return true;
        try {
            return localStorage.getItem(storageKey) === 'true';
        } catch (e) {
            console.error('[useOnboarding] Failed to read completion flag:', e);
            return false;
        }
    });

    const [isAppReady, setIsAppReady] = useState<boolean>(() => {
        if (!storageKey) return true;
        try {
            return localStorage.getItem(storageKey) === 'true';
        } catch (e) {
            return false;
        }
    });

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

    const [currentStep, setCurrentStep] = useState<number>(0);
    const transitionLockRef = useRef<boolean>(false);

    const [tempProfile, setTempProfile] = useState<TempProfile>({
        name: '',
        style: 'partner'
    });

    const steps: OnboardingStep[] = useMemo(() => [
        { id: 'welcome', title: 'ようこそ' },
        { id: 'name', title: 'お名前' },
        { id: 'style', title: 'スタイル' },
        { id: 'ready', title: '準備完了' }
    ], []);

    const totalSteps = steps.length;
    const step = steps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    const nextStep = useCallback((): void => {
        if (transitionLockRef.current) return;

        if (currentStep < totalSteps - 1) {
            transitionLockRef.current = true;
            setCurrentStep(prev => prev + 1);
            setTimeout(() => {
                transitionLockRef.current = false;
            }, 400);
        }
    }, [currentStep, totalSteps]);

    const prevStep = useCallback((): void => {
        if (transitionLockRef.current) return;

        if (currentStep > 0) {
            transitionLockRef.current = true;
            setCurrentStep(prev => prev - 1);
            setTimeout(() => {
                transitionLockRef.current = false;
            }, 400);
        }
    }, [currentStep]);

    const setTempName = useCallback((name: string): void => {
        setTempProfile(prev => ({ ...prev, name }));
    }, []);

    const setTempStyle = useCallback((style: 'efficient' | 'partner'): void => {
        setTempProfile(prev => ({ ...prev, style }));
    }, []);

    const completeOnboarding = useCallback((updateSettingsFn?: UpdateSettingsFunction): void => {
        if (!storageKey) return;

        try {
            if (updateSettingsFn && tempProfile.name) {
                updateSettingsFn('profile', 'displayName', tempProfile.name);
                updateSettingsFn('prompt', 'aiStyle', tempProfile.style);
            }

            localStorage.setItem(storageKey, 'true');
            setIsCompleted(true);

            setTimeout(() => {
                setIsAppReady(true);
            }, 600);

            console.log('[useOnboarding] Onboarding completed for user:', userId, tempProfile);
        } catch (e) {
            console.error('[useOnboarding] Failed to complete onboarding:', e);
        }
    }, [storageKey, tempProfile, userId]);

    const resetOnboarding = useCallback((): void => {
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
        isCompleted,
        isAppReady,
        currentStep,
        step,
        totalSteps,
        tempProfile,
        isFirstStep,
        isLastStep,
        nextStep,
        prevStep,
        setTempName,
        setTempStyle,
        completeOnboarding,
        resetOnboarding
    };
};
