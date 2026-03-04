// src/components/Onboarding/utils/diagnosisConstants.ts

/**
 * 診断設問の選択肢データ
 */
export interface QuestionOption {
  label: string;
  description: string;
  icon: string; // emoji icon
}

/**
 * 診断設問データ
 */
export interface QuestionData {
  axisKey: 'axis1' | 'axis2' | 'axis3' | 'axis4';
  title: string;
  subtitle: string;
  optionA: QuestionOption;
  optionB: QuestionOption;
}

/**
 * 4軸の診断設問定義
 */
export const DIAGNOSIS_QUESTIONS: QuestionData[] = [
  {
    axisKey: 'axis1',
    title: '明日の会議資料について相談',
    subtitle: '明日の会議で使う資料についてAIに相談しました。どちらの回答が助かりますか？',
    optionA: {
      label: '結論と要点だけ教えて',
      description: '「ポイントは3つ。①〜 ②〜 ③〜」のように端的にまとめてくれる。',
      icon: '🎯',
    },
    optionB: {
      label: '背景や理由も詳しく解説して',
      description: '「この資料の目的は〜で、背景として〜があり…」と丁寧に説明してくれる。',
      icon: '📖',
    },
  },
  {
    axisKey: 'axis2',
    title: '業務中のちょっとした質問',
    subtitle: '業務中にちょっとした疑問が浮かんでAIに聞きました。どちらの話し方が心地いいですか？',
    optionA: {
      label: '丁寧・ビジネスライクに',
      description: '「〜でございます。ご確認ください。」と敬語で端的に対応。',
      icon: '👔',
    },
    optionB: {
      label: '気軽・フランクに',
      description: '「〜だね！こんな感じでどうかな？」とカジュアルに対応。',
      icon: '☕',
    },
  },
  {
    axisKey: 'axis3',
    title: '新規プロジェクトの進め方',
    subtitle: '新規プロジェクトの進め方に悩んでいます。AIにどう手伝ってほしいですか？',
    optionA: {
      label: 'データや事例を調べて分析して',
      description: '「類似事例では〜という結果が出ています」と根拠をもとに整理。',
      icon: '📊',
    },
    optionB: {
      label: '自由な発想でアイデアを出して',
      description: '「こんな切り口はどうでしょう？例えば…」と新しい視点を提案。',
      icon: '💡',
    },
  },
  {
    axisKey: 'axis4',
    title: '企画書のレビューを依頼',
    subtitle: '書いた企画書のレビューをAIに頼みました。どこまで踏み込んでほしいですか？',
    optionA: {
      label: '聞かれたことだけ的確に',
      description: '「ここの表現は〜に修正すると正確です」と指摘に集中。',
      icon: '🗂️',
    },
    optionB: {
      label: '改善案や次のステップも提案して',
      description: '「修正に加えて、次は〜をやると効果的です」と先回り。',
      icon: '🚀',
    },
  },
];
