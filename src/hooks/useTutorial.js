// src/hooks/useTutorial.js
import { useState, useCallback, useMemo } from 'react';

export const useTutorial = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // ツアーのステップ定義
  const steps = useMemo(() => [
    {
      target: 'input-area',
      title: 'ここからスタート',
      content: 'AIへの質問や指示はここに入力します。\nShift+Enterで改行も可能です。',
      position: 'top'
    },
    {
      target: 'context-selector',
      title: '検索範囲をコントロール',
      content: 'Web検索を行うか、社内規定（RAG）を参照するか。\nスイッチ一つで切り替えられます。',
      position: 'top'
    },
    {
      target: 'attachment-btn',
      title: '資料を読み込ませる',
      content: 'PDFやExcelファイルを添付して、\nその内容について分析・要約を依頼できます。',
      position: 'top'
    },
    {
      target: 'sidebar',
      title: '会話の履歴',
      content: '過去のやり取りは自動保存されます。\n話題を変えたい時は「新しいチャット」を押してください。',
      position: 'right'
    },
    {
      target: 'api-config',
      title: '接続設定',
      content: 'APIキーや接続先の変更が必要な場合は、\nここから設定画面を開けます。',
      position: 'bottom'
    }
  ], []);

  const startTutorial = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  const endTutorial = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      endTutorial();
    }
  }, [currentStepIndex, steps.length, endTutorial]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  return {
    isActive,
    currentStepIndex,
    step: steps[currentStepIndex],
    totalSteps: steps.length,
    startTutorial,
    
    // ★修正: コンポーネントのProps名に合わせて関数をマッピング
    onClose: endTutorial,
    onNext: nextStep,
    onPrev: prevStep
  };
};