export interface WizardField {
    id: string;
    type: 'text' | 'select' | 'radio' | 'multi-select' | 'textarea'; // multi-selectとtextareaを追加
    label: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
}

export interface WizardTemplate {
    id: string;
    title: string;
    description: string;
    targetAddMenu: string | null;
    targetContext: any | null;
    fields: WizardField[];
    generatePrompt: (answers: Record<string, string | string[]>) => string;
}

export const WIZARD_TEMPLATES: Record<string, WizardTemplate> = {
    slide_creation: {
        id: 'slide_creation',
        title: 'スライドを作成',
        description: 'プレゼン資料の構成案を自動生成します。',
        targetAddMenu: 'json_slide',
        targetContext: null,
        fields: [
            {
                id: 'theme',
                type: 'text',
                label: '何についてのスライドを作りますか？',
                required: true,
                placeholder: '例：新入社員向けのビジネスマナー研修'
            },
            {
                id: 'target',
                type: 'select',
                label: '誰に向けて発表しますか？',
                options: ['新入社員', '役員・経営陣', '顧客・クライアント', '一般向け']
            },
            {
                id: 'volume',
                type: 'select',
                label: 'スライドの枚数・ボリュームは？',
                options: ['5枚程度 (短め)', '10枚程度 (標準)', '15枚以上 (詳細)']
            },
            {
                id: 'tone',
                type: 'radio',
                label: 'スライドの雰囲気・トーンは？',
                options: ['フォーマル', 'カジュアル', '説得力重視']
            },
            {
                id: 'constraints',
                type: 'multi-select',
                label: '制約事項・こだわり（複数選択可）',
                options: ['専門用語を避ける', '具体例を盛り込む', '図解・表を提案する', '結論から述べる', '3行以内でまとめる']
            },
            {
                id: 'custom_constraints',
                type: 'textarea',
                label: 'その他、独自の制約事項があれば入力してください',
                placeholder: '例：社外秘情報は含めないでください。'
            }
        ],
        generatePrompt: (answers: Record<string, string | string[]>) => {
            const selectedConstraints = Array.isArray(answers.constraints) ? answers.constraints : [];
            const customConstraints = answers.custom_constraints as string || '';
            
            return `
# 指示
あなたは優秀なプレゼンテーターです。以下の要件に基づいて、プレゼンテーション用スライドの構成案を作成してください。

# 要件
・テーマ：${answers.theme || '未指定'}
・ターゲット：${answers.target || '未指定'}
・ボリューム：${answers.volume || '未指定'}
・トーン＆マナー：${answers.tone || '未指定'}

# 制約事項
${selectedConstraints.map(c => `・${c}`).join('\n')}
${customConstraints ? `・${customConstraints}` : ''}
・各スライドの「タイトル」と「話す内容の要点」を明記すること
・指定されたトーン＆マナーに合致する言葉遣いをすること
      `.trim();
        }
    }
};
