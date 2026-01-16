// src/hooks/useInspector.ts
import { useState, useCallback } from 'react';

/**
 * Inspector タブの型
 */
export type InspectorTab = 'thought' | 'citations' | 'artifacts';

/**
 * ハイライト中の引用情報
 */
export interface HighlightedCitation {
    index: number;
    messageId: string;
}

/**
 * メッセージの型（Inspectorで使用）
 */
export interface InspectorMessage {
    id?: string;
    thoughtProcess?: unknown[];
    citations?: unknown[];
    [key: string]: unknown;
}

/**
 * Artifact の型
 */
export interface Artifact {
    type: string;
    title: string;
    content?: string;
    [key: string]: unknown;
}

/**
 * useInspector の戻り値の型
 */
export interface UseInspectorReturn {
    isOpen: boolean;
    activeTab: InspectorTab;
    selectedMessage: InspectorMessage | null;
    selectedArtifact: Artifact | null;
    highlightedCitation: HighlightedCitation | null;
    openInspector: (tab?: InspectorTab) => void;
    closeInspector: () => void;
    setActiveTab: React.Dispatch<React.SetStateAction<InspectorTab>>;
    selectMessage: (message: InspectorMessage | null) => void;
    selectArtifact: (artifact: Artifact) => void;
    closeArtifact: () => void;
    highlightCitation: (citationIndex: number, messageId: string) => void;
}

/**
 * Inspector Panel の状態管理フック
 */
export const useInspector = (): UseInspectorReturn => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<InspectorTab>('thought');
    const [selectedMessage, setSelectedMessage] = useState<InspectorMessage | null>(null);
    const [highlightedCitation, setHighlightedCitation] = useState<HighlightedCitation | null>(null);

    // Inspectorを開く
    const openInspector = useCallback((tab: InspectorTab = 'thought'): void => {
        setIsOpen(true);
        setActiveTab(tab);
    }, []);

    // Inspectorを閉じる
    const closeInspector = useCallback((): void => {
        setIsOpen(false);
        setHighlightedCitation(null);
    }, []);

    // メッセージを選択
    const selectMessage = useCallback((message: InspectorMessage | null): void => {
        setSelectedMessage(message);
        if (message) {
            setIsOpen(true);
            if (message.thoughtProcess && message.thoughtProcess.length > 0) {
                setActiveTab('thought');
            } else if (message.citations && message.citations.length > 0) {
                setActiveTab('citations');
            }
        }
    }, []);

    // Citation をハイライト
    const highlightCitation = useCallback((citationIndex: number, messageId: string): void => {
        setHighlightedCitation({ index: citationIndex, messageId });
        setActiveTab('citations');
        setIsOpen(true);

        setTimeout(() => setHighlightedCitation(null), 3000);
    }, []);

    // Artifact選択
    const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

    const selectArtifact = useCallback((artifact: Artifact): void => {
        setSelectedArtifact(artifact);
        setActiveTab('artifacts');
        setIsOpen(true);
    }, []);

    const closeArtifact = useCallback((): void => {
        setSelectedArtifact(null);
    }, []);

    return {
        isOpen,
        activeTab,
        selectedMessage,
        selectedArtifact,
        highlightedCitation,
        openInspector,
        closeInspector,
        setActiveTab,
        selectMessage,
        selectArtifact,
        closeArtifact,
        highlightCitation,
    };
};

export default useInspector;
