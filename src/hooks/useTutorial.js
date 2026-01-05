// src/hooks/useTutorial.js
import { useState, useCallback, useMemo, useEffect } from 'react';

/**
 * チュートリアル（Coachmarks）管理フック
 * macOS Sequoia スタイルのガイド付きツアー
 */
export const useTutorial = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1: forward, -1: backward

  // ツアーのステップ定義（macOS風に刷新）
  const steps = useMemo(() => [
    {
      target: null, // center (ウェルカム画面)
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
      target: null, // center (完了画面)
      icon: '✨',
      title: '準備完了！',
      content: 'さあ、何でも質問してみましょう。\nいつでも「？」ボタンでこのガイドに戻れます。',
      position: 'center',
      isComplete: true
    }
  ], []);

  const startTutorial = useCallback(() => {
    setCurrentStepIndex(0);
    setDirection(1);
    setIsActive(true);
  }, []);

  const endTutorial = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
  }, []);

  const nextStep = useCallback(() => {
    setDirection(1);
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      endTutorial();
    }
  }, [currentStepIndex, steps.length, endTutorial]);

  const prevStep = useCallback(() => {
    setDirection(-1);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  // キーボードナビゲーション
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
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
    
    // ★コンポーネントのProps名に合わせて関数をマッピング
    onClose: endTutorial,
    onNext: nextStep,
    onPrev: prevStep
  };
};