// src/hooks/useErrorIntelligence.ts
// Auto-Retry制御 & エラー状態管理フック
// ★改修: テキスト保持・復元、指数バックオフ、retryStrategy分岐

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
    /** 復元待ちの入力テキスト（null = 復元不要） */
    pendingInputText: string | null;
    /** エラーを報告（分析 → 状態更新 → 必要に応じてAuto-Retry） */
    reportError: (
        raw: string | Error | unknown,
        onRetry?: () => void,
        options?: {
            inputText?: string;
            statusCode?: number;
            isWorkflowError?: boolean; // ★追加
        }
    ) => void;
    /** エラーカードを閉じる */
    dismiss: () => void;
    /** 手動リトライをトリガー */
    triggerManualRetry: () => void;
    /** 復元完了後にクリアする */
    clearPendingInput: () => void;
    /** Shake アニメーション用のトリガーキー */
    shakeKey: number;
}

export function useErrorIntelligence(): UseErrorIntelligenceReturn {
    const [activeError, setActiveError] = useState<IntelligenceError | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryCountdown, setRetryCountdown] = useState(0);
    const [shakeKey, setShakeKey] = useState(0);
    // ★追加: 復元待ちの入力テキスト
    const [pendingInputText, setPendingInputText] = useState<string | null>(null);

    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const onRetryCallbackRef = useRef<(() => void) | null>(null);
    // ★追加: 保持中の入力テキスト（リトライ中に使用）
    const savedInputTextRef = useRef<string | null>(null);

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
     * ★追加: 復元完了後に呼ぶクリア関数
     */
    const clearPendingInput = useCallback(() => {
        setPendingInputText(null);
        savedInputTextRef.current = null;
    }, []);

    /**
     * ★追加: 入力テキストを復元キューに設定する
     */
    const restoreInputText = useCallback(() => {
        if (savedInputTextRef.current) {
            setPendingInputText(savedInputTextRef.current);
        }
    }, []);

    /**
     * Auto-Retry のスケジューリング（★改修: 指数バックオフ対応）
     */
    const scheduleAutoRetry = useCallback((error: IntelligenceError, currentRetryCount: number) => {
        if (error.retryStrategy !== 'auto-retry' || currentRetryCount >= error.maxRetries) {
            // 最大リトライ超過 → manual-retry にフォールバック + テキスト復元
            if (currentRetryCount >= error.maxRetries) {
                setActiveError({
                    ...error,
                    action: 'manual-retry',
                    description: 'リトライ上限に達しました。手動で再試行してください。',
                });
                setIsRetrying(false);
                // ★追加: テキスト復元
                restoreInputText();
            }
            return;
        }

        setIsRetrying(true);

        // ★改修: 指数バックオフ（baseDelay * 2^retryCount）
        const baseDelay = error.retryDelayMs;
        const delayMs = baseDelay * Math.pow(2, currentRetryCount);
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
    }, [restoreInputText]);

    /**
     * エラーを報告（★改修: inputText, statusCode対応）
     */
    const reportError = useCallback((
        raw: string | Error | unknown,
        onRetry?: () => void,
        options?: {
            inputText?: string;
            statusCode?: number;
            isWorkflowError?: boolean; // ★追加
        }
    ) => {
        clearTimers();

        const analyzed = analyzeIntelligenceError(raw, options?.statusCode);
        const errorWithFlags = {
            ...analyzed,
            isWorkflowError: options?.isWorkflowError || false
        };
        setActiveError(errorWithFlags);
        setShakeKey(prev => prev + 1); // Shake トリガー

        onRetryCallbackRef.current = onRetry || null;

        // ★追加: 入力テキストの保持
        if (options?.inputText) {
            savedInputTextRef.current = options.inputText;
        }

        // ★追加: retryStrategyに基づく分岐
        switch (errorWithFlags.retryStrategy) {
            case 'immediate-restore':
                // 即時復元: テキストを即座に復元
                if (savedInputTextRef.current) {
                    setPendingInputText(savedInputTextRef.current);
                }
                break;

            case 'auto-retry':
                // 自動再送信: リトライ中はテキスト復元せず、失敗時に復元
                scheduleAutoRetry(errorWithFlags, retryCount);
                break;

            case 'no-retry':
                // 再送信不要: テキスト復元しない
                break;
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
        // ★追加: 保持テキストもクリア
        savedInputTextRef.current = null;
        setPendingInputText(null);
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
        pendingInputText,
        reportError,
        dismiss,
        triggerManualRetry,
        clearPendingInput,
        shakeKey,
    };
}
