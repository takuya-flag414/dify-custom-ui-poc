// src/hooks/useErrorIntelligence.ts
// Auto-Retry制御 & エラー状態管理フック

import { useState, useRef, useCallback, useEffect } from 'react';
import { analyzeIntelligenceError, IntelligenceError } from '../utils/errorIntelligence';

interface UseErrorIntelligenceReturn {
    /** 現在アクティブなエラー（null = エラーなし） */
    activeError: IntelligenceError | null;
    /** 現在のリトライ回数 */
    retryCount: number;
    /** リトライ中フラグ */
    isRetrying: boolean;
    /** リトライまでのカウントダウン（秒） */
    retryCountdown: number;
    /** エラーを報告（分析 → 状態更新 → 必要に応じてAuto-Retry） */
    reportError: (raw: string | Error | unknown, onRetry?: () => void) => void;
    /** エラーカードを閉じる */
    dismiss: () => void;
    /** 手動リトライをトリガー */
    triggerManualRetry: () => void;
    /** Shake アニメーション用のトリガーキー */
    shakeKey: number;
}

export function useErrorIntelligence(): UseErrorIntelligenceReturn {
    const [activeError, setActiveError] = useState<IntelligenceError | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryCountdown, setRetryCountdown] = useState(0);
    const [shakeKey, setShakeKey] = useState(0);

    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const onRetryCallbackRef = useRef<(() => void) | null>(null);

    // クリーンアップ
    const clearTimers = useCallback(() => {
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
    }, []);

    // アンマウント時のクリーンアップ
    useEffect(() => {
        return () => clearTimers();
    }, [clearTimers]);

    /**
     * Auto-Retry のスケジューリング
     */
    const scheduleAutoRetry = useCallback((error: IntelligenceError, currentRetryCount: number) => {
        if (error.action !== 'auto-retry' || currentRetryCount >= error.maxRetries) {
            // 最大リトライ超過 → manual-retry にフォールバック
            if (currentRetryCount >= error.maxRetries) {
                setActiveError({
                    ...error,
                    action: 'manual-retry',
                    description: 'リトライ上限に達しました。手動で再試行してください。',
                });
                setIsRetrying(false);
            }
            return;
        }

        setIsRetrying(true);
        const delayMs = error.retryDelayMs;
        const delaySec = Math.ceil(delayMs / 1000);
        setRetryCountdown(delaySec);

        // カウントダウン
        let remaining = delaySec;
        countdownIntervalRef.current = setInterval(() => {
            remaining -= 1;
            setRetryCountdown(remaining);
            if (remaining <= 0 && countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
            }
        }, 1000);

        // リトライ実行
        retryTimerRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            setIsRetrying(false);
            setRetryCountdown(0);

            // リトライコールバック実行
            if (onRetryCallbackRef.current) {
                onRetryCallbackRef.current();
            }

            // エラーをクリア（リトライが成功すれば新しいエラーは報告されない）
            setActiveError(null);
        }, delayMs);
    }, []);

    /**
     * エラーを報告
     */
    const reportError = useCallback((raw: string | Error | unknown, onRetry?: () => void) => {
        clearTimers();

        const analyzed = analyzeIntelligenceError(raw);
        setActiveError(analyzed);
        setShakeKey(prev => prev + 1); // Shake トリガー

        onRetryCallbackRef.current = onRetry || null;

        if (analyzed.action === 'auto-retry') {
            scheduleAutoRetry(analyzed, retryCount);
        }
    }, [clearTimers, scheduleAutoRetry, retryCount]);

    /**
     * エラーカードを閉じる
     */
    const dismiss = useCallback(() => {
        clearTimers();
        setActiveError(null);
        setRetryCount(0);
        setIsRetrying(false);
        setRetryCountdown(0);
        onRetryCallbackRef.current = null;
    }, [clearTimers]);

    /**
     * 手動リトライ
     */
    const triggerManualRetry = useCallback(() => {
        if (onRetryCallbackRef.current) {
            onRetryCallbackRef.current();
        }
        dismiss();
    }, [dismiss]);

    return {
        activeError,
        retryCount,
        isRetrying,
        retryCountdown,
        reportError,
        dismiss,
        triggerManualRetry,
        shakeKey,
    };
}
