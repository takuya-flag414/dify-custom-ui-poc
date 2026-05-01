// src/hooks/useShieldMode.ts
/**
 * useShieldMode - プライバシーシールドモード状態管理フック
 *
 * 会話単位でシールドモードを管理する。
 * - 機密情報検知 → ConfirmDialog承認時に activateShield() で有効化
 * - Vault（SecureVaultService）はインメモリのため、ブラウザ終了で自動消滅
 * - 手動OFFは提供しない（ブラウザ終了まで継続）
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

/** 会話ごとのシールド状態 */
interface ShieldEntry {
    activatedAt: number;
}

/** フックの返り値 */
export interface UseShieldModeReturn {
    /** 指定した conversationId がシールド中かどうか */
    isShieldActive: (conversationId: string | null) => boolean;
    /** 現在表示中の会話がシールド中かどうか（便利ショートカット） */
    isCurrentShieldActive: boolean;
    /** シールドモードを有効化（機密検知 → ConfirmDialog承認時に呼ぶ） */
    activateShield: (conversationId: string) => void;
    /** シールド中の会話数 */
    shieldedCount: number;
}

/**
 * プライバシーシールドモード管理フック
 * @param currentConversationId - 現在表示中の会話ID
 */
export function useShieldMode(currentConversationId: string | null): UseShieldModeReturn {
    // 会話ID → シールド状態のMap（インメモリのみ、リロードで消滅）
    const [shieldMap, setShieldMap] = useState<Map<string, ShieldEntry>>(new Map());

    /**
     * 指定した会話をシールド状態にする
     */
    const activateShield = useCallback((conversationId: string) => {
        setShieldMap(prev => {
            // 既にシールド中なら何もしない
            if (prev.has(conversationId)) return prev;

            const next = new Map(prev);
            next.set(conversationId, { activatedAt: Date.now() });
            return next;
        });
    }, []);

    /**
     * 指定した conversationId がシールド中かどうか
     */
    const isShieldActive = useCallback((conversationId: string | null): boolean => {
        if (!conversationId) return false;
        return shieldMap.has(conversationId);
    }, [shieldMap]);

    /**
     * 現在表示中の会話がシールド中かどうか
     */
    const isCurrentShieldActive = useMemo(() => {
        return isShieldActive(currentConversationId);
    }, [isShieldActive, currentConversationId]);

    /**
     * シールド中の会話数
     */
    const shieldedCount = shieldMap.size;

    /**
     * beforeunload イベントリスナー
     * 1つ以上の会話がシールド中の場合、ブラウザ離脱時に警告を表示
     */
    useEffect(() => {
        if (shieldedCount === 0) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            // 最新ブラウザでは returnValue の設定が必要
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [shieldedCount]);

    return {
        isShieldActive,
        isCurrentShieldActive,
        activateShield,
        shieldedCount,
    };
}

export default useShieldMode;
