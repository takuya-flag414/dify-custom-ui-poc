/**
 * StudioContext - Studios状態管理
 * 
 * Phase A: Frontend Mockup & Experience Design
 * - 現在アクティブなStudioの管理
 * - Studioの作成/削除
 * - LocalStorageへの簡易永続化
 */

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
    ReactNode
} from 'react';
import { Studio, StudioContextType } from '../types/studio';
import { defaultStudios, generateStudioId } from '../mocks/studioData';

const STORAGE_KEY = 'studios-data';
const ACTIVE_STUDIO_KEY = 'active-studio-id';

/**
 * LocalStorageからStudiosを読み込む
 */
const loadStudiosFromStorage = (): Studio[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored) as Studio[];
            // デフォルトスタジオを除外したユーザースタジオのみを抽出
            const userStudios = parsed.filter(s => !defaultStudios.some(d => d.id === s.id));
            // デフォルトスタジオ（初期状態）とユーザースタジオを結合
            return [...defaultStudios, ...userStudios];
        }
    } catch (error) {
        console.warn('[StudioContext] Failed to load studios from storage:', error);
    }
    return defaultStudios;
};

/**
 * LocalStorageにStudiosを保存する
 */
const saveStudiosToStorage = (studios: Studio[]): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(studios));
    } catch (error) {
        console.warn('[StudioContext] Failed to save studios to storage:', error);
    }
};

/**
 * アクティブなStudio IDを読み込む
 */
const loadActiveStudioId = (): string | null => {
    try {
        return localStorage.getItem(ACTIVE_STUDIO_KEY);
    } catch {
        return null;
    }
};

/**
 * アクティブなStudio IDを保存する
 */
const saveActiveStudioId = (id: string | null): void => {
    try {
        if (id) {
            localStorage.setItem(ACTIVE_STUDIO_KEY, id);
        } else {
            localStorage.removeItem(ACTIVE_STUDIO_KEY);
        }
    } catch (error) {
        console.warn('[StudioContext] Failed to save active studio id:', error);
    }
};

// Context作成
const StudioContext = createContext<StudioContextType | undefined>(undefined);

interface StudioProviderProps {
    children: ReactNode;
}

/**
 * StudioProvider
 * 
 * Studios機能の状態管理を提供するContextプロバイダー
 */
export const StudioProvider: React.FC<StudioProviderProps> = ({ children }) => {
    const [studios, setStudios] = useState<Studio[]>(loadStudiosFromStorage);
    const [activeStudioId, setActiveStudioId] = useState<string | null>(loadActiveStudioId);

    // Studiosの変更を永続化
    useEffect(() => {
        saveStudiosToStorage(studios);
    }, [studios]);

    // アクティブStudio IDの変更を永続化
    useEffect(() => {
        saveActiveStudioId(activeStudioId);
    }, [activeStudioId]);

    // 現在アクティブなStudioオブジェクトを取得
    const activeStudio = useMemo(() => {
        if (!activeStudioId) return null;
        return studios.find(s => s.id === activeStudioId) || null;
    }, [studios, activeStudioId]);

    /**
     * Studioに入室する
     */
    const enterStudio = useCallback((id: string) => {
        const studio = studios.find(s => s.id === id);
        if (studio) {
            setActiveStudioId(id);
            console.log(`[StudioContext] Entered studio: ${studio.name}`);
        } else {
            console.warn(`[StudioContext] Studio not found: ${id}`);
        }
    }, [studios]);

    /**
     * Galleryに戻る
     */
    const exitStudio = useCallback(() => {
        setActiveStudioId(null);
        console.log('[StudioContext] Exited to gallery');
    }, []);

    /**
     * 新しいStudioを作成する
     */
    const createStudio = useCallback((data: Partial<Studio>) => {
        const newStudio: Studio = {
            id: generateStudioId(),
            name: data.name || 'New Studio',
            description: data.description || '',
            icon: data.icon || '✨',
            themeColor: data.themeColor || 'blue',
            systemPrompt: data.systemPrompt || '',
            knowledgeFiles: data.knowledgeFiles || [],
            inputPlaceholder: data.inputPlaceholder || 'メッセージを入力...',
            welcomeMessage: data.welcomeMessage || 'こんにちは！何かお手伝いできることはありますか？',
        };

        setStudios(prev => [...prev, newStudio]);
        console.log(`[StudioContext] Created studio: ${newStudio.name}`);
    }, []);

    /**
     * Studioを削除する
     */
    const deleteStudio = useCallback((id: string) => {
        // デフォルトStudioは削除不可


        setStudios(prev => prev.filter(s => s.id !== id));

        // 削除したStudioがアクティブだった場合、Galleryに戻る
        if (activeStudioId === id) {
            setActiveStudioId(null);
        }

        console.log(`[StudioContext] Deleted studio: ${id}`);
    }, [activeStudioId]);

    /**
     * 既存のStudioを更新する
     */
    const updateStudio = useCallback((id: string, data: Partial<Studio>) => {
        // デフォルトStudioは編集不可


        setStudios(prev => prev.map(s =>
            s.id === id ? { ...s, ...data } : s
        ));

        console.log(`[StudioContext] Updated studio: ${id}`);
    }, []);

    const value: StudioContextType = {
        studios,
        activeStudioId,
        activeStudio,
        enterStudio,
        exitStudio,
        createStudio,
        deleteStudio,
        updateStudio,
    };

    return (
        <StudioContext.Provider value={value}>
            {children}
        </StudioContext.Provider>
    );
};

/**
 * useStudio - StudioContextを使用するためのフック
 */
export const useStudio = (): StudioContextType => {
    const context = useContext(StudioContext);
    if (context === undefined) {
        throw new Error('useStudio must be used within a StudioProvider');
    }
    return context;
};

export default StudioContext;
