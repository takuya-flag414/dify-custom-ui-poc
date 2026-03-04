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
    isTitleGenerated?: boolean;
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
    handleTitleExtracted: (targetId: string, sessionTitle: string) => void;
    handleTitleFallback: (targetId: string, userText: string) => void;
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
            name: '✨ 思考中...',
            created_at: Math.floor(Date.now() / 1000),
            isTitleGenerated: false,
        };

        setConversations((prev) => {
            if (prev.some(c => c.id === newId)) return prev;
            return [newConv, ...prev];
        });
        setConversationId(newId);
        // ★変更: フォールバックは workflow_finished 後に handleTitleFallback で実行するため、setTimeout は削除
    }, [addLog]);

    /**
     * session_titleが抽出された時にタイトルを更新する（最優先）
     * session_title は最も正確なソースであるため、isTitleGenerated に関係なく常に上書きする
     */
    const handleTitleExtracted = useCallback((targetId: string, sessionTitle: string): void => {
        addLog(`[useConversations] session_title extracted: "${sessionTitle}" for ${targetId}`, 'info');
        setConversations(prev => prev.map(c => {
            if (c.id === targetId) {
                return { ...c, name: sessionTitle, isTitleGenerated: true };
            }
            return c;
        }));

        // Dify側の会話名も上書き（fire-and-forget）
        if (mockMode !== 'FE' && apiKey && apiUrl && userId) {
            renameConversationApi(targetId, sessionTitle, userId, apiUrl, apiKey)
                .then(() => addLog(`[useConversations] Dify rename success: "${sessionTitle}"`, 'info'))
                .catch((e: Error) => addLog(`[useConversations] Dify rename failed: ${e.message}`, 'warn'));
        }
    }, [addLog, mockMode, apiKey, apiUrl, userId]);

    /**
     * session_titleが取得できなかった場合のフォールバック（workflow_finished 後に呼ばれる）
     * Level 1: Dify Auto-title ポーリング → Level 2: ユーザー入力先頭20文字
     */
    const handleTitleFallback = useCallback((targetId: string, userText: string): void => {
        addLog(`[useConversations] Fallback triggered for ${targetId}`, 'info');

        if (mockMode !== 'FE' && apiKey && apiUrl && userId) {
            // Level 1: Dify Auto-title ポーリング（3秒後、Dify側の自動タイトル生成を待つ）
            setTimeout(async () => {
                try {
                    const data = await fetchConversationsApi(userId, apiUrl, apiKey, 1);
                    const updatedConv = data.data?.find((c: Conversation) => c.id === targetId);
                    if (updatedConv && updatedConv.name) {
                        setConversations(prev => prev.map(c => {
                            if (c.id === targetId && !c.isTitleGenerated) {
                                addLog(`[useConversations] Level 1 Fallback: Dify auto-title = "${updatedConv.name}"`, 'info');
                                return { ...c, name: updatedConv.name, isTitleGenerated: true };
                            }
                            return c;
                        }));
                        return;
                    }
                } catch (e) {
                    const errorMessage = e instanceof Error ? e.message : String(e);
                    addLog(`[useConversations] Dify poll failed: ${errorMessage}`, 'warn');
                }

                // Level 2 Fallback: ユーザー入力の先頭20文字
                setConversations(prev => prev.map(c => {
                    if (c.id === targetId && !c.isTitleGenerated) {
                        const fallbackTitle = userText.length > 20
                            ? userText.substring(0, 20) + '...'
                            : userText;
                        addLog(`[useConversations] Level 2 Fallback: user input = "${fallbackTitle}"`, 'info');
                        return { ...c, name: fallbackTitle, isTitleGenerated: true };
                    }
                    return c;
                }));
            }, 3000);
        } else {
            // Mockモード: ユーザー入力をそのまま使用
            const fallbackTitle = userText.length > 20
                ? userText.substring(0, 20) + '...'
                : userText;
            setConversations(prev => prev.map(c => {
                if (c.id === targetId && !c.isTitleGenerated) {
                    return { ...c, name: fallbackTitle, isTitleGenerated: true };
                }
                return c;
            }));
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
        handleTitleExtracted,
        handleTitleFallback,
    };
};
