// src/components/Chat/Wizard/WizardConfig.js

/**
 * ウィザードのシナリオ定義 (Mock)
 * 将来的にはCMSやAPIから取得することも想定
 */
export const WIZARD_SCENARIOS = {
    // 1. 社内規定検索
    search: {
        id: 'search',
        title: "社内規定・マニュアル検索",
        icon: "SearchIcon",
        steps: [
            {
                id: "scope",
                type: "chips",
                question: "どの分野について調べますか？",
                options: ["全般", "人事・労務", "経理・精算", "IT・セキュリティ", "総務・施設"]
            },
            {
                id: "query",
                type: "text",
                question: "具体的な知りたいことを教えてください",
                placeholder: "例: 台風時の特別休暇の申請ルールは？"
            }
        ],
        // 入力値をプロンプトに変換する関数
        generatePrompt: (data) => {
            const scope = data.scope || "全般";
            const query = data.query || "";
            return `【検索範囲: ${scope}】\n社内規定に基づき、以下の質問に回答してください：\n「${query}」`;
        }
    },

    // 2. メール・文書作成
    draft: {
        id: 'draft',
        title: "メール・文書作成",
        icon: "PenToolIcon",
        steps: [
            {
                id: "docType",
                type: "chips",
                question: "作成する文書の種類は？",
                options: ["ビジネスメール", "日報/週報", "企画書ドラフト", "謝罪文", "会議アジェンダ"]
            },
            {
                id: "tone",
                type: "chips", // 本来はSlider推奨だが、モックなのでChipsで代用
                question: "相手とトーンを設定してください",
                options: ["社内 (カジュアル)", "社内 (標準)", "社外 (標準)", "社外 (フォーマル)"]
            },
            {
                id: "points",
                type: "text",
                question: "盛り込みたい要点を箇条書きで入力",
                placeholder: "例: ・システム障害のお詫び\n・復旧は明日10時予定\n・原因は調査中"
            }
        ],
        generatePrompt: (data) => {
            return `以下の条件で文書を作成してください。\n- 種類: ${data.docType}\n- トーン: ${data.tone}\n- 必須要素:\n${data.points}`;
        }
    },

    // 3. 議事録・資料要約
    summary: {
        id: 'summary',
        title: "議事録・資料の要約",
        icon: "FileTextIcon",
        steps: [
            {
                id: "text",
                type: "text", // 本来はFile Dropzoneだが、モックなのでTextarea
                question: "要約したいテキストを入力してください",
                placeholder: "ここにテキストを貼り付け..."
            },
            {
                id: "focus",
                type: "chips",
                question: "どのような形式で出力しますか？",
                options: ["要点のみ (3行)", "アクションアイテム抽出", "詳細レポート構造化", "小学生でもわかるように"]
            }
        ],
        generatePrompt: (data) => {
            return `以下のテキストを読み込み、【${data.focus}】の形式で要約してください。\n\n${data.text}`;
        }
    },

    // 4. アイデア出し・壁打ち (AI Glow対象)
    idea: {
        id: 'idea',
        title: "アイデア出し・壁打ち",
        icon: "SparklesIcon",
        steps: [
            {
                id: "persona",
                type: "chips",
                question: "壁打ち相手の役割を選んでください",
                options: ["辛口レビュアー (リスク指摘)", "アイデアマン (拡散)", "ロジカルコンサル (構造化)", "初心者 (わかりやすさ確認)"]
            },
            {
                id: "theme",
                type: "text",
                question: "議論したいテーマや課題は？",
                placeholder: "例: 全社員フルリモート化のメリット・デメリットについて"
            }
        ],
        generatePrompt: (data) => {
            return `あなたは「${data.persona}」として振る舞ってください。\n以下のテーマについて議論したいです。\n\nテーマ: 「${data.theme}」`;
        }
    }
};