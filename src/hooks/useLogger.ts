// src/hooks/useLogger.ts
import { useState, useCallback, useEffect } from 'react';

// 元のコンソール関数を保持（モジュールスコープで一度だけ取得）
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

/**
 * ログレベルの型
 */
export type LogLevel = 'log' | 'error' | 'warn' | 'info';

/**
 * メッセージ型（ログ出力用）
 */
export interface LogMessage {
    id?: string;
    role?: string;
    text?: string;
    [key: string]: unknown;
}

/**
 * useLogger の戻り値の型
 */
export interface UseLoggerReturn {
    systemLogs: string[];
    addLog: (message: string, level?: LogLevel) => void;
    handleCopyLogs: (messages?: LogMessage[]) => void;
    copyButtonText: string;
}

export const useLogger = (): UseLoggerReturn => {
    const [systemLogs, setSystemLogs] = useState<string[]>([]);
    const [copyButtonText, setCopyButtonText] = useState<string>('ログをコピー');

    // ログ追加関数
    const addLog = useCallback((message: string, level: LogLevel = 'log'): void => {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

        // 開発者ツールにも出力
        switch (level) {
            case 'error':
                originalConsoleError(logEntry);
                break;
            case 'warn':
                originalConsoleWarn(logEntry);
                break;
            case 'info':
                originalConsoleInfo(logEntry);
                break;
            default:
                originalConsoleLog(logEntry);
        }

        setSystemLogs((prevLogs) => [...prevLogs, logEntry]);
    }, []);

    // グローバルコンソールの上書きは削除 (無限ループ回避のため)
    useEffect(() => {
        addLog('--- PoC App Initialized (useLogger) ---', 'info');
    }, [addLog]);

    // ログコピー機能
    const handleCopyLogs = useCallback((messages: LogMessage[] = []): void => {
        addLog('[useLogger] Copying logs to clipboard...', 'info');
        let logContent = '--- PoC Debug Logs ---\n\n';

        logContent += '--- System Logs ---\n';
        logContent += systemLogs.join('\n');
        logContent += '\n\n';

        logContent += '--- Conversation Logs (JSON) ---\n';

        let messagesToLog = messages;
        if (!Array.isArray(messages)) {
            addLog('[useLogger] handleCopyLogs received non-array messages. Defaulting to empty array.', 'warn');
            messagesToLog = [];
        }

        try {
            // 循環参照回避のための簡易的な置換関数
            const safeStringify = (key: string, value: unknown): unknown => {
                if (key === 'view' || key === 'parent') return undefined;
                return value;
            };
            logContent += JSON.stringify(messagesToLog, safeStringify, 2);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`[useLogger] Failed to stringify messages: ${errorMessage}`, 'error');
            logContent += 'Failed to stringify conversation logs.';
        }
        logContent += '\n\n--- End of Logs ---';

        navigator.clipboard
            .writeText(logContent)
            .then(() => {
                addLog('[useLogger] Logs copied successfully!', 'info');
                setCopyButtonText('コピーしました！');
                setTimeout(() => setCopyButtonText('ログをコピー'), 2000);
            })
            .catch((err) => {
                addLog(`[useLogger] Failed to copy logs: ${err.message}`, 'error');
                setCopyButtonText('コピーに失敗');
                setTimeout(() => setCopyButtonText('ログをコピー'), 2000);
            });
    }, [systemLogs, addLog]);

    return {
        systemLogs,
        addLog,
        handleCopyLogs,
        copyButtonText
    };
};
