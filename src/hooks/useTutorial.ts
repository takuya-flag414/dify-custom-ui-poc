// src/hooks/useTutorial.ts
import { useState, useCallback, useMemo, useEffect } from 'react';

/**
 * チュートリアルステップの型
 */
export interface TutorialStep {
    target: string | null;
    icon: string;
    title: string;
    content: string;
    position: 'center' | 'top' | 'right' | 'bottom' | 'left';
    isComplete?: boolean;
}

/**
 * useTutorial の戻り値の型
 */
export interface UseTutorialReturn {
    isActive: boolean;
    currentStepIndex: number;
    step: TutorialStep;
    totalSteps: number;
    direction: 1 | -1;
    startTutorial: () => void;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}

/**
 * チュートリアル（Coachmarks）管理フック
 * macOS Sequoia スタイルのガイド付きツアー
 */
export const useTutorial = (): UseTutorialReturn => {
    const [isActive, setIsActive] = useState<boolean>(false);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [direction, setDirection] = useState<1 | -1>(1);

    // ツアーのステップ定義（macOS風に刷新）
    const steps: TutorialStep[] = useMemo(() => [
        {
            target: null,
            icon: '🤖',
            title: 'AI Agent へようこそ',
            content: '社内の情報について、自然な言葉で質問できるアシスタントです。\n簡単な操作を覚えましょう。',
            position: 'center'
        },
        {
            target: 'input-area',
            icon: '💬',
            title: '会話を始める',
            content: 'ここに質問を入力してください。\n例：「出張精算の手順は？」',
            position: 'top'
        },
        {
            target: 'context-selector',
            icon: '🔍',
            title: '検索ソースを選ぶ',
            content: '🌐 Web検索 または 📚 社内規定から\n情報を取得します。',
            position: 'top'
        },
        {
            target: 'attachment-btn',
            icon: '📎',
            title: 'ファイルを添付',
            content: 'PDFやExcelを添付すると、\nその内容を読み取り分析します。',
            position: 'top'
        },
        {
            target: 'sidebar',
            icon: '📂',
            title: '会話を管理',
            content: '過去のやり取りはすべてここに保存されます。\nピン留めでお気に入りを整理！',
            position: 'right'
        },
        {
            target: null,
            icon: '✨',
            title: '準備完了！',
            content: 'さあ、何でも質問してみましょう。\nいつでも「？」ボタンでこのガイドに戻れます。',
            position: 'center',
            isComplete: true
        }
    ], []);

    const startTutorial = useCallback((): void => {
        setCurrentStepIndex(0);
        setDirection(1);
        setIsActive(true);
    }, []);

    const endTutorial = useCallback((): void => {
        setIsActive(false);
        setCurrentStepIndex(0);
    }, []);

    const nextStep = useCallback((): void => {
        setDirection(1);
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            endTutorial();
        }
    }, [currentStepIndex, steps.length, endTutorial]);

    const prevStep = useCallback((): void => {
        setDirection(-1);
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    }, [currentStepIndex]);

    // キーボードナビゲーション
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e: KeyboardEvent): void => {
            switch (e.key) {
                case 'ArrowRight':
                case 'Enter':
                    e.preventDefault();
                    nextStep();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    prevStep();
                    break;
                case 'Escape':
                    e.preventDefault();
                    endTutorial();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, nextStep, prevStep, endTutorial]);

    return {
        isActive,
        currentStepIndex,
        step: steps[currentStepIndex],
        totalSteps: steps.length,
        direction,
        startTutorial,
        onClose: endTutorial,
        onNext: nextStep,
        onPrev: prevStep
    };
};
