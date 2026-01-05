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
        recommendedMode: 'enterprise', // 社内データのみ検索
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

    // 2. メール・文書作成（返信機能付き）
    draft: {
        id: 'draft',
        title: "メール・文書作成",
        icon: "PenToolIcon",
        recommendedMode: 'fast', // 外部検索不要、LLMのみで生成
        steps: [
            {
                id: "mode",
                type: "chips",
                question: "作成モードを選択してください",
                options: ["新規作成", "返信を作成"]
            },
            {
                id: "docType",
                type: "dynamic-chips",
                question: "作成する文書の種類は？",
                // modeに応じてオプションを切り替え
                getOptions: (formData) => {
                    if (formData.mode === "返信を作成") {
                        return ["メール返信", "チャット返信 (Teams/Slack等)"];
                    }
                    return ["ビジネスメール", "日報/週報", "企画書ドラフト", "謝罪文", "会議アジェンダ"];
                }
            },
            {
                id: "originalMessage",
                type: "privacy-textarea",
                question: "返信したい元のメッセージを貼り付けてください",
                placeholder: "ここにメールやチャットの内容を貼り付け...",
                // 返信モードの場合のみ表示
                conditionalShow: (formData) => formData.mode === "返信を作成",
                // メール返信の場合は件名入力欄も表示
                showSubject: (formData) => formData.docType === "メール返信"
            },
            {
                id: "tone",
                type: "chips",
                question: "トーンを設定してください",
                options: ["カジュアル", "標準", "フォーマル"]
            },
            {
                id: "points",
                type: "text",
                question: "盛り込みたい要点を箇条書きで入力",
                placeholder: "例: ・了解しました\n・〇〇については確認中\n・明日までに回答予定"
            }
        ],
        generatePrompt: (data) => {
            if (data.mode === "返信を作成") {
                const replyType = data.docType === "メール返信" ? "メール" : "チャット";

                // originalMessageがオブジェクト形式（件名+本文）の場合
                let subject = '';
                let message = '';
                if (typeof data.originalMessage === 'object' && data.originalMessage !== null) {
                    subject = data.originalMessage.subject || '';
                    message = data.originalMessage.message || '';
                } else {
                    message = data.originalMessage || '';
                }

                const subjectLine = subject ? `【件名】${subject}\n` : '';

                return `以下のメッセージに${replyType}で返信を作成してください。

【返信タイプ】${data.docType}
【トーン】${data.tone}
${subjectLine}
【元のメッセージ】
${message || '(内容なし)'}

【返信に含める要点】
${data.points || '(特になし)'}`;
            }
            // 新規作成の場合
            return `以下の条件で文書を作成してください。
- 種類: ${data.docType}
- トーン: ${data.tone}
- 必須要素:
${data.points || '(特になし)'}`;
        }
    },

    // 3. 議事録・資料要約
    summary: {
        id: 'summary',
        title: "議事録・資料の要約",
        icon: "FileTextIcon",
        recommendedMode: 'fast', // 入力テキストのみを処理
        steps: [
            {
                id: "source",
                type: "chips",
                question: "要約のソースを選択してください",
                options: ["テキストを貼り付け", "ファイルをアップロード"]
            },
            {
                id: "content",
                type: "dynamic", // sourceの選択に応じてtext/file-uploadを切り替え
                question: "要約したい内容を入力してください",
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
            const focus = data.focus || "要点のみ (3行)";

            // ファイルアップロードの場合
            if (data.source === "ファイルをアップロード" && Array.isArray(data.content)) {
                const fileNames = data.content.map(sf => sf.file.name).join(', ');
                return `以下のファイルを読み込み、【${focus}】の形式で要約してください。\n\nアップロードファイル: ${fileNames}`;
            }

            // テキスト入力の場合
            return `以下のテキストを読み込み、【${focus}】の形式で要約してください。\n\n${data.content || ''}`;
        },
        // ファイル抽出用メソッド
        getFiles: (data) => {
            if (data.source === "ファイルをアップロード" && Array.isArray(data.content)) {
                return data.content.map(sf => sf.file);
            }
            return [];
        }
    },

    // 4. アイデア出し・壁打ち (AI Glow対象)
    idea: {
        id: 'idea',
        title: "アイデア出し・壁打ち",
        icon: "SparklesIcon",
        recommendedMode: 'standard', // AIに判断を任せる
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