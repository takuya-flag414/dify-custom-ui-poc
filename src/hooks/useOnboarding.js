// src/hooks/useOnboarding.js
import { useState, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'onboarding_completed';
const PROFILE_TEMP_KEY = 'onboarding_temp_profile';

/**
 * オンボーディング状態管理Hook
 * - 初回起動時のセットアップウィザードの状態を管理
 * - 完了後は localStorage にフラグを保存
 */
export const useOnboarding = () => {
    // オンボーディング完了フラグ
    const [isCompleted, setIsCompleted] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'true';
        } catch (e) {
            console.error('[useOnboarding] Failed to read completion flag:', e);
            return false;
        }
    });

    // 現在のステップ (0: Welcome, 1: Name, 2: Style, 3: Ready)
    const [currentStep, setCurrentStep] = useState(0);

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
        if (currentStep < totalSteps - 1) {
            setCurrentStep(prev => prev + 1);
        }
    }, [currentStep, totalSteps]);

    // 前のステップへ
    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
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
        try {
            // プロファイルを永続化（updateSettingsFn は App.jsx から渡される）
            if (updateSettingsFn && tempProfile.name) {
                updateSettingsFn('profile', 'displayName', tempProfile.name);
                updateSettingsFn('profile', 'aiStyle', tempProfile.style);
            }

            // 完了フラグを保存
            localStorage.setItem(STORAGE_KEY, 'true');
            setIsCompleted(true);

            console.log('[useOnboarding] Onboarding completed:', tempProfile);
        } catch (e) {
            console.error('[useOnboarding] Failed to complete onboarding:', e);
        }
    }, [tempProfile]);

    // オンボーディングをリセット（デバッグ/設定用）
    const resetOnboarding = useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEY);
            setIsCompleted(false);
            setCurrentStep(0);
            setTempProfile({ name: '', style: 'partner' });
            console.log('[useOnboarding] Onboarding reset');
        } catch (e) {
            console.error('[useOnboarding] Failed to reset onboarding:', e);
        }
    }, []);

    return {
        // 状態
        isCompleted,
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
