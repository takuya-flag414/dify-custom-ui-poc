// src/components/Onboarding/utils/promptGenerator.ts

/**
 * 診断回答の型
 */
export interface DiagnosisAnswers {
    axis1: 'A' | 'B'; // 情報量: A=簡潔 / B=詳細
    axis2: 'A' | 'B'; // トーン: A=プロフェッショナル / B=カジュアル
    axis3: 'A' | 'B'; // 思考性: A=事実重視 / B=クリエイティブ
    axis4: 'A' | 'B'; // 積極性: A=受動的 / B=能動的
}

/**
 * 診断結果の型
 */
export interface DiagnosisResult {
    personaName: string;
    personaDescription: string;
    prompt: string;
}

// ─── 各軸のプロンプトセグメント ───

const AXIS1_SEGMENTS: Record<'A' | 'B', string> = {
    A: '- 回答は箇条書きで簡潔にまとめてください。結論を先に述べ、理由は最小限にしてください。\n- 冗長な説明は避け、要点を端的に伝えてください。',
    B: '- 理由や背景も含めて詳しく説明してください。具体例を積極的に示してください。\n- 段階的に論理を展開し、読者が深く理解できるよう丁寧に記述してください。',
};

const AXIS2_SEGMENTS: Record<'A' | 'B', string> = {
    A: '- 敬語で丁寧に、プロフェッショナルな口調で回答してください。\n- ビジネスシーンに適した、端的で信頼感のある文体を使用してください。',
    B: '- 親しみやすいカジュアルな口調で回答してください。\n- 堅苦しくなりすぎず、気軽に相談できる同僚のようなトーンで話してください。',
};

const AXIS3_SEGMENTS: Record<'A' | 'B', string> = {
    A: '- 事実やデータに基づいた正確な分析を重視してください。\n- 可能な限り根拠やソースを示し、客観的で現実的な回答を心がけてください。',
    B: '- 創造的で自由な発想を大切にしてください。\n- 既存の枠にとらわれない斬新なアイデアやアプローチを積極的に提案してください。',
};

const AXIS4_SEGMENTS: Record<'A' | 'B', string> = {
    A: '- 質問された内容にのみ的確に回答してください。\n- 余計な情報や未要求の提案は控え、聞かれたことに集中してください。',
    B: '- 回答に加えて、次に取るべきアクションやフォローアップを積極的に提案してください。\n- ユーザーが気づいていない観点や関連するトピックも先回りして共有してください。',
};

// ─── 16パターンのペルソナ名テーブル ───

type AnswerKey = `${string}${string}${string}${string}`;

interface PersonaEntry {
    name: string;
    description: string;
}

const PERSONA_TABLE: Record<string, PersonaEntry> = {
    // ベース役職: 簡潔+丁寧=秘書, 簡潔+カジュアル=同僚, 詳細+丁寧=顧問, 詳細+カジュアル=相談役
    AAAA: { name: '堅実な秘書', description: '正確なデータを端的にまとめ、聞かれたことに的確に応える。' },
    AAAB: { name: '敏腕の秘書', description: '的確な情報に加え、次に必要な一手も先回りして添える。' },
    AABA: { name: '発想豊かな秘書', description: '要点を押さえつつ、新しい切り口や視点も提供する。' },
    AABB: { name: '提案型の秘書', description: '簡潔なアイデアと具体的な行動計画を同時に届ける。' },
    ABAA: { name: '頼れる同僚', description: '気軽に聞ける正確な情報源。要点をさっとまとめてくれる。' },
    ABAB: { name: '行動派の同僚', description: '的確な情報と共に、背中を押してくれる頼もしい存在。' },
    ABBA: { name: '閃きの同僚', description: '自由な発想をさっと共有してくれる、気の合う仕事仲間。' },
    ABBB: { name: '開拓型の同僚', description: '一緒にアイデアを形にしていく、推進力のある仲間。' },
    BAAA: { name: '堅実な顧問', description: '深い分析と丁寧な解説で、確かな理解へと導く。' },
    BAAB: { name: '敏腕の顧問', description: '綿密な分析から具体的な提案まで、一貫して伴走する。' },
    BABA: { name: '構想力の顧問', description: '広い視野で可能性を丁寧に描き出す、知恵の源泉。' },
    BABB: { name: '改革型の顧問', description: '革新的な構想と実行計画を同時に提示する先導者。' },
    BBAA: { name: '頼れる相談役', description: 'じっくり話を聞き、豊富な知識で的確に応えてくれる。' },
    BBAB: { name: '行動派の相談役', description: 'データと直感を融合し、成長を後押ししてくれる存在。' },
    BBBA: { name: '発想豊かな相談役', description: '自由な対話の中から、新たな気づきを引き出してくれる。' },
    BBBB: { name: '共創型の相談役', description: '一緒に可能性を広げていく、頼もしいパートナー。' },
};

/**
 * 診断回答からプロンプトとペルソナを生成する
 */
export function generatePrompt(answers: DiagnosisAnswers): DiagnosisResult {
    const key = `${answers.axis1}${answers.axis2}${answers.axis3}${answers.axis4}` as AnswerKey;
    const persona = PERSONA_TABLE[key] || PERSONA_TABLE['BAAB'];

    const segments = [
        AXIS1_SEGMENTS[answers.axis1],
        AXIS2_SEGMENTS[answers.axis2],
        AXIS3_SEGMENTS[answers.axis3],
        AXIS4_SEGMENTS[answers.axis4],
    ];

    const prompt = `以下のルールに従って回答してください。\n\n${segments.join('\n\n')}`;

    return {
        personaName: persona.name,
        personaDescription: persona.description,
        prompt,
    };
}
