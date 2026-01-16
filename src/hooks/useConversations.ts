// src/hooks/useConversations.ts
import { useState, useEffect, useCallback } from 'react';
import { fetchConversationsApi, deleteConversationApi, renameConversationApi, Conversation } from '../api/dify';
import { mockConversations } from '../mocks/data';
import { LogLevel } from './useLogger';

/**
 * 会話データの型（created_at追加）
 */
export interface ConversationWithTimestamp extends Conversation {
    created_at: number;
    updated_at?: number;
}

/**
 * ログ追加関数の型
 */
export type AddLogFunction = (message: string, level?: LogLevel) => void;

/**
 * useConversations の戻り値の型
 */
export interface UseConversationsReturn {
    conversations: ConversationWithTimestamp[];
    conversationId: string | null;
    setConversationId: React.Dispatch<React.SetStateAction<string | null>>;
    handleConversationCreated: (newId: string, newTitle: string) => void;
    handleDeleteConversation: (targetId: string) => Promise<void>;
    handleRenameConversation: (targetId: string, newName: string) => Promise<void>;
    handleConversationUpdated: (targetId: string) => void;
}

export const useConversations = (
    mockMode: 'FE' | 'BE' | 'OFF',
    userId: string | null,
    addLog: AddLogFunction,
    apiKey: string,
    apiUrl: string
): UseConversationsReturn => {
    const [conversations, setConversations] = useState<ConversationWithTimestamp[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);

    useEffect(() => {
        const fetchConversations = async (): Promise<void> => {
            if (mockMode === 'FE') {
                addLog('[useConversations] FE Mock mode. Loading rich dummy conversations.', 'info');

                const now = new Date();
                const enrichedMock: ConversationWithTimestamp[] = mockConversations.map((conv, index) => {
                    const fakeDate = new Date(now);
                    if (index === 1) fakeDate.setDate(now.getDate() - 1);
                    if (index === 2) fakeDate.setDate(now.getDate() - 3);
                    if (index === 3) fakeDate.setDate(now.getDate() - 10);
                    if (index >= 4) fakeDate.setDate(now.getDate() - 60);

                    return {
                        ...conv,
                        created_at: Math.floor(fakeDate.getTime() / 1000)
                    };
                });

                setConversations(enrichedMock);
                return;
            }

            addLog('[useConversations] Fetching REAL conversations list...', 'info');

            if (!apiKey || !apiUrl || !userId) {
                if (!userId) {
                    addLog('[useConversations] User ID not set yet.', 'info');
                } else {
                    addLog('[useConversations Error] API KEY or URL not set.', 'error');
                }
                setConversations([]);
                return;
            }

            try {
                const data = await fetchConversationsApi(userId, apiUrl, apiKey);
                const conversationsWithTimestamp = (data.data || []).map(conv => ({
                    ...conv,
                    created_at: conv.created_at || Math.floor(Date.now() / 1000)
                }));
                setConversations(conversationsWithTimestamp);
                addLog(`[useConversations] Fetched ${data.data?.length || 0} conversations.`, 'info');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                addLog(`[useConversations Error] ${errorMessage}`, 'error');
                setConversations([]);
            }
        };

        fetchConversations();
    }, [addLog, mockMode, apiKey, apiUrl, userId]);

    const handleConversationCreated = useCallback((newId: string, newTitle: string): void => {
        addLog(`[useConversations] New conversation created: ${newId}`, 'info');
        const newConv: ConversationWithTimestamp = {
            id: newId,
            name: newTitle,
            created_at: Math.floor(Date.now() / 1000)
        };

        setConversations((prev) => {
            if (prev.some(c => c.id === newId)) return prev;
            return [newConv, ...prev];
        });
        setConversationId(newId);

        if (mockMode !== 'FE' && apiKey && apiUrl && userId) {
            setTimeout(async () => {
                try {
                    const data = await fetchConversationsApi(userId, apiUrl, apiKey, 1);
                    const updatedConv = data.data?.find(c => c.id === newId);
                    if (updatedConv && updatedConv.name && updatedConv.name !== newTitle) {
                        setConversations(prev => prev.map(c =>
                            c.id === newId ? { ...c, name: updatedConv.name } : c
                        ));
                        addLog(`[useConversations] Title updated: "${updatedConv.name}"`, 'info');
                    }
                } catch (e) {
                    const errorMessage = e instanceof Error ? e.message : String(e);
                    addLog(`[useConversations] Failed to refresh title: ${errorMessage}`, 'warn');
                }
            }, 3000);
        }
    }, [addLog, mockMode, apiKey, apiUrl, userId]);

    const handleDeleteConversation = useCallback(async (targetId: string): Promise<void> => {
        addLog(`[useConversations] Deleting conversation: ${targetId}`, 'info');

        if (mockMode === 'FE') {
            setConversations((prev) => prev.filter((c) => c.id !== targetId));
            if (conversationId === targetId) setConversationId(null);
            addLog(`[useConversations] Deleted (Mock): ${targetId}`, 'info');
            return;
        }

        if (!userId) {
            addLog('[useConversations] Error: User ID is missing.', 'error');
            return;
        }

        try {
            await deleteConversationApi(targetId, userId, apiUrl, apiKey);
            setConversations((prev) => prev.filter((c) => c.id !== targetId));

            if (conversationId === targetId) {
                setConversationId(null);
                addLog(`[useConversations] Active conversation deleted. Resetting view.`, 'info');
            }
            addLog(`[useConversations] Successfully deleted: ${targetId}`, 'info');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`[useConversations Error] Failed to delete: ${errorMessage}`, 'error');
            throw error;
        }
    }, [mockMode, conversationId, addLog, apiKey, apiUrl, userId]);

    const handleRenameConversation = useCallback(async (targetId: string, newName: string): Promise<void> => {
        addLog(`[useConversations] Renaming conversation: ${targetId} -> ${newName}`, 'info');

        if (mockMode === 'FE') {
            setConversations(prev => prev.map(c =>
                c.id === targetId ? { ...c, name: newName } : c
            ));
            addLog(`[useConversations] Renamed (Mock): ${newName}`, 'info');
            return;
        }

        if (!userId) {
            addLog('[useConversations] Error: User ID is missing.', 'error');
            return;
        }

        try {
            await renameConversationApi(targetId, newName, userId, apiUrl, apiKey);
            setConversations(prev => prev.map(c =>
                c.id === targetId ? { ...c, name: newName } : c
            ));
            addLog(`[useConversations] Successfully renamed.`, 'info');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(`[useConversations Error] Failed to rename: ${errorMessage}`, 'error');
            throw error;
        }
    }, [mockMode, addLog, apiKey, apiUrl, userId]);

    const handleConversationUpdated = useCallback((targetId: string): void => {
        setConversations((prev) => {
            const targetIndex = prev.findIndex(c => c.id === targetId);
            if (targetIndex === -1) return prev;

            const targetConv = { ...prev[targetIndex] };
            const nowSec = Math.floor(Date.now() / 1000);
            targetConv.created_at = nowSec;
            targetConv.updated_at = nowSec;

            const others = prev.filter(c => c.id !== targetId);
            return [targetConv, ...others];
        });
    }, []);

    return {
        conversations,
        conversationId,
        setConversationId,
        handleConversationCreated,
        handleDeleteConversation,
        handleRenameConversation,
        handleConversationUpdated,
    };
};
