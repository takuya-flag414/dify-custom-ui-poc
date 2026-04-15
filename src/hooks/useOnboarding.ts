// src/hooks/useOnboarding.ts
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { DiagnosisAnswers } from '../components/Onboarding/utils/promptGenerator';
import { UserProfile, authService } from '../services/AuthService';

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
    customInstructions: string;
    diagnosisAnswers?: Partial<DiagnosisAnswers>;
    personaName?: string;
}

/**
 * 診断モードの型
 */
export type DiagnosisMode = 'none' | 'diagnosis' | 'manual' | 'skip';

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
    skipTutorial: () => void;
    setTempName: (name: string) => void;
    setTempInstructions: (instructions: string) => void;
    completeOnboarding: (updateSettingsFn?: UpdateSettingsFunction) => Promise<void> | void;
    resetOnboarding: () => Promise<void> | void;
    // 診断機能
    diagnosisMode: DiagnosisMode;
    diagnosisSubStep: number;
    setDiagnosisMode: (mode: DiagnosisMode) => void;
    setDiagnosisAnswer: (axisKey: keyof DiagnosisAnswers, answer: 'A' | 'B') => void;
    nextDiagnosisSubStep: () => void;
    prevDiagnosisSubStep: () => void;
    resetDiagnosis: () => void;
}

/**
 * オンボーディング状態管理Hook
 */
export const useOnboarding = (user: UserProfile | null): UseOnboardingReturn => {
    // 既存ユーザー（DBにフラグが無い）の場合は true とみなし、新規ユーザー（false）のときのみオンボーディングを発火させる
    const isCompletedDB = user?.preferences?.isOnboardingCompleted ?? true;

    const [isCompleted, setIsCompleted] = useState<boolean>(isCompletedDB);
    const [isAppReady, setIsAppReady] = useState<boolean>(isCompletedDB);

    useEffect(() => {
        setIsCompleted(isCompletedDB);
        setIsAppReady(isCompletedDB);
    }, [isCompletedDB]);

    const [currentStep, setCurrentStep] = useState<number>(0);
    const transitionLockRef = useRef<boolean>(false);

    const [tempProfile, setTempProfile] = useState<TempProfile>({
        name: '',
        customInstructions: ''
    });

    // ─── 診断機能 state ───
    const [diagnosisMode, setDiagnosisModeState] = useState<DiagnosisMode>('none');
    const [diagnosisSubStep, setDiagnosisSubStep] = useState<number>(0); // 0=intro, 1~4=Q1~Q4, 5=result

    // Step IDs:
    // 0: welcome, 1: tutorial-knowledge, 2: tutorial-web, 3: tutorial-hybrid
    // 4: name, 5: diagnosis (旧: instructions), 6: ready
    const steps: OnboardingStep[] = useMemo(() => [
        { id: 'welcome', title: 'ようこそ' },
        { id: 'tutorial-knowledge', title: 'ナレッジ' },
        { id: 'tutorial-web', title: 'Web検索' },
        { id: 'tutorial-hybrid', title: 'ハイブリッド' },
        { id: 'name', title: 'お名前' },
        { id: 'diagnosis', title: '診断' },
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

    const setTempInstructions = useCallback((customInstructions: string): void => {
        setTempProfile(prev => ({ ...prev, customInstructions }));
    }, []);

    // チュートリアルをスキップ → 名前入力ステップ(Step 4)へジャンプ
    const skipTutorial = useCallback((): void => {
        if (transitionLockRef.current) return;
        transitionLockRef.current = true;
        setCurrentStep(4);
        setTimeout(() => {
            transitionLockRef.current = false;
        }, 400);
    }, []);

    // ─── 診断機能 actions ───

    const setDiagnosisMode = useCallback((mode: DiagnosisMode): void => {
        setDiagnosisModeState(mode);
        if (mode === 'diagnosis') {
            setDiagnosisSubStep(1); // Q1から開始
        } else if (mode === 'manual') {
            setDiagnosisSubStep(-1); // 手動入力を示す特別な値
        } else if (mode === 'skip') {
            // スキップ: customInstructionsは空のままnextStepへ
        }
    }, []);

    const setDiagnosisAnswer = useCallback((axisKey: keyof DiagnosisAnswers, answer: 'A' | 'B'): void => {
        setTempProfile(prev => ({
            ...prev,
            diagnosisAnswers: {
                ...prev.diagnosisAnswers,
                [axisKey]: answer,
            },
        }));
    }, []);

    const nextDiagnosisSubStep = useCallback((): void => {
        setDiagnosisSubStep(prev => prev + 1);
    }, []);

    const prevDiagnosisSubStep = useCallback((): void => {
        setDiagnosisSubStep(prev => {
            if (prev <= 1) {
                // Q1から戻る → intro画面へ
                setDiagnosisModeState('none');
                return 0;
            }
            return prev - 1;
        });
    }, []);

    const resetDiagnosis = useCallback((): void => {
        setDiagnosisModeState('none');
        setDiagnosisSubStep(0);
        setTempProfile(prev => ({
            ...prev,
            diagnosisAnswers: undefined,
            personaName: undefined,
        }));
    }, []);

    const completeOnboarding = useCallback(async (updateSettingsFn?: UpdateSettingsFunction): Promise<void> => {
        if (!user?.userId) return;

        try {
            if (updateSettingsFn) {
                if (tempProfile.name) {
                    updateSettingsFn('profile', 'displayName', tempProfile.name);
                }
                if (tempProfile.customInstructions) {
                    updateSettingsFn('prompt', 'customInstructions', tempProfile.customInstructions);
                }
            }

            // DBに保存
            await authService.updatePreferences(user.userId, { isOnboardingCompleted: true });

            setIsCompleted(true);

            setTimeout(() => {
                setIsAppReady(true);
            }, 600);

            console.log('[useOnboarding] Onboarding completed for user:', user.userId, tempProfile);
        } catch (e) {
            console.error('[useOnboarding] Failed to complete onboarding:', e);
        }
    }, [user, tempProfile]);

    const resetOnboarding = useCallback(async (): Promise<void> => {
        if (!user?.userId) return;

        try {
            // DBをリセット
            await authService.updatePreferences(user.userId, { isOnboardingCompleted: false });

            setIsCompleted(false);
            setIsAppReady(false);
            setCurrentStep(0);
            setTempProfile({ name: '', customInstructions: '' });
            setDiagnosisModeState('none');
            setDiagnosisSubStep(0);
            console.log('[useOnboarding] Onboarding reset for user:', user.userId);
        } catch (e) {
            console.error('[useOnboarding] Failed to reset onboarding:', e);
        }
    }, [user]);

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
        skipTutorial,
        setTempName,
        setTempInstructions,
        completeOnboarding,
        resetOnboarding,
        // 診断機能
        diagnosisMode,
        diagnosisSubStep,
        setDiagnosisMode,
        setDiagnosisAnswer,
        nextDiagnosisSubStep,
        prevDiagnosisSubStep,
        resetDiagnosis,
    };
};
