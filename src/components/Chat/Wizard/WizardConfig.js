// src/components/Chat/Wizard/WizardConfig.js

/**
 * プロンプト生成のためのヘルパー関数群
 * 構造化されたMarkdownを出力し、LLMの思考をガイドする
 */

// Markdownセクションビルダー
const buildSection = (title, content) => {
    if (!content) return '';
    return `\n## ${title}\n${content}\n`;
};

// ペルソナ定義マップ
const PERSONA_DEFINITIONS = {
    "辛口レビュアー (リスク指摘)": `
- **役割**: 厳格なリスクマネージャー兼品質保証担当。
- **振る舞い**: 楽観的な予測を排除し、最悪のケースや見落とされがちなリスク（法的、セキュリティ、コスト、運用）を徹底的に指摘する。
- **口調**: 断定的かつ冷静。忖度は一切しない。`,
    "アイデアマン (拡散)": `
- **役割**: シリコンバレーのスタートアップ創業者的なビジョナリー。
- **振る舞い**: 実現可能性はいったん無視し、既存の枠組みを破壊するような「クレイジーな」アイデアを連発する。SCAMPER法などの水平思考を用いる。
- **口調**: 情熱的でポジティブ。「もし〜ならどうなる？」が口癖。`,
    "ロジカルコンサル (構造化)": `
- **役割**: マッキンゼー出身の戦略コンサルタント。
- **振る舞い**: MECE（漏れなくダブりなく）を意識し、情報をロジックツリーやマトリクスで整理する。感情論を排し、ファクトと論理で語る。
- **口調**: 論理的かつ構造的。「結論から申し上げますと」「3つのポイントがあります」を用いる。`,
    "初心者 (わかりやすさ確認)": `
- **役割**: 入社1年目の新人、あるいはITに詳しくない一般ユーザー。
- **振る舞い**: 専門用語を使わず、直感的に理解できるかをチェックする。「なぜ？」という素朴な疑問を投げかける。
- **口調**: 丁寧だが、知識がないことを隠さない。「素人質問で恐縮ですが」を用いる。`
};

// --- Smart Prompt Helpers ---

/**
 * Anti-Patterns (Negative Constraints) を注入する
 */
const injectAntiPatterns = (prompt, avoids) => {
    if (!avoids || !Array.isArray(avoids) || avoids.length === 0) return prompt;
    return `${prompt}\n\n# Negative Constraints (禁止事項)\n以下の要素は回答に含めないでください：\n${avoids.map(a => `- ${a}`).join('\n')}`;
};

/**
 * Thinking Mode (Chain-of-Thought) を注入する
 */
const injectThinking = (prompt, useThinking) => {
    if (!useThinking) return prompt;
    return `${prompt}\n\n# Reasoning Constraint\n回答を生成する前に、必ず <thinking> タグの中で思考プロセス（ユーザー意図の分析、前提知識の確認、論理構成の検証）をステップバイステップで展開してください。\nその上で、タグの外に最終的な回答のみを出力してください。`;
};

/**
 * ウィザードのシナリオ定義
 * Smart Prompt Architectureに基づき、意図解析と構造化出力を実装
 */
export const WIZARD_SCENARIOS = {
    // 1. 社内規定検索 (Reliable Compliance Officer)
    search: {
        id: 'search',
        title: "社内規定・マニュアル検索",
        icon: "SearchIcon",
        recommendedMode: 'enterprise',
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
        generatePrompt: (data) => {
            const scope = data.scope || "全般";
            const query = data.query || "";

            return `
# Role
あなたは「社内規定およびコンプライアンスの専門家」です。
社員の質問に対し、社内ナレッジベース（RAG）の情報を基に、正確かつ実用的な回答を提供してください。

# Context
- **検索対象分野**: ${scope}
- **ユーザーの質問**: ${query}

# Guidelines
1. **事実重視**: 検索結果に含まれない情報は「情報が見つかりませんでした」と正直に伝えてください。捏造は厳禁です。
2. **平易な解説**: 専門用語や条文には、必ず一般社員向けのわかりやすい解説を加えてください。
3. **出典明記**: 回答の根拠となった規定名や条文を明記してください。

# Output Format
以下のMarkdown形式で出力してください：

## 1. 結論 (TL;DR)
質問への回答を1〜2行で簡潔に述べる。

## 2. 詳細解説
規定に基づいた詳細な説明。条件分岐（Aの場合はX、Bの場合はY）があれば明確に記述する。

## 3. 参照元
根拠となるドキュメント名。

## 4. アドバイス / 次のアクション
申請が必要な場合の注意点や、問い合わせ先部署の示唆など。
`;
        }
    },

    // 2. メール・文書作成 (Context-Aware Secretary)
    draft: {
        id: 'draft',
        title: "メール・文書作成",
        icon: "PenToolIcon",
        recommendedMode: 'fast',
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
                conditionalShow: (formData) => formData.mode === "返信を作成",
                showSubject: (formData) => formData.docType === "メール返信",
                showRecipient: (formData) => formData.mode === "返信を作成"
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
            },
            {
                id: "avoids",
                type: "checkbox-group",
                question: "避けるべき要素はありますか？(Anti-Patterns)",
                options: ["専門用語・カタカナ語", "謝罪・言い訳", "前置き・結びの挨拶", "抽象的な表現", "箇条書き"]
            },
            {
                id: "useThinking",
                type: "toggle",
                question: "Deep Thinking Mode (CoT) を有効にしますか？",
                description: "AIが論理的な推論を行ってから回答します。精度が向上しますが、生成に時間がかかります。"
            }
        ],
        generatePrompt: (data) => {
            const isReply = data.mode === "返信を作成";
            const toneInstruction = {
                "カジュアル": "親しい同僚への連絡。敬語は使うが、堅苦しい表現は避ける。絵文字の使用も可（チャットの場合）。",
                "標準": "一般的な社内・社外連絡。失礼がなく、かつ事務的になりすぎない丁寧な文体。",
                "フォーマル": "役員や重要顧客向け。最上級の敬語（尊敬語・謙譲語）を正しく使い、格式高い文体にする。"
            }[data.tone] || "標準的なビジネスメールの文体";

            let prompt = `# Role
あなたは「優秀な秘書」です。
ユーザーの指示に基づき、適切なビジネス文書を作成してください。

# Task Context
- **作成モード**: ${data.mode}
- **文書タイプ**: ${data.docType}
- **指定トーン**: ${data.tone} (${toneInstruction})

# Instructions
1. **プレースホルダー**: 日付、場所、具体的な名前など、人間が後で埋めるべき箇所は \`[ ]\` で囲んで目立たせてください（例: \`[日付]\`）。
2. **構成**: 文書タイプに応じた適切な構成（件名、宛名、挨拶、本文、結び）を採用してください。
`;

            if (isReply) {
                // 返信モードの場合のコンテキスト構築
                let recipient = '';
                let honorific = ''; // 敬称変数を初期化
                let subject = '';
                let message = '';
                
                if (typeof data.originalMessage === 'object' && data.originalMessage !== null) {
                    recipient = data.originalMessage.recipient || '';
                    honorific = data.originalMessage.honorific || ''; // 敬称を取得
                    subject = data.originalMessage.subject || '';
                    message = data.originalMessage.message || '';
                } else {
                    message = data.originalMessage || '';
                }

                // 宛名情報のセクションを作成
                let recipientSection = '';
                if (recipient) {
                    recipientSection = `宛名: ${recipient}\n`;
                    if (honorific) {
                         // 敬称がある場合、強力な指示として追加
                         recipientSection += `**重要: 宛名の敬称には必ず「${honorific}」を使用してください。勝手に変更しないでください。**\n`;
                    }
                }

                prompt += `
# Input Data (Original Message)
以下は受信したメッセージです。この内容を分析し、文脈に沿った返信を作成してください。
---
${recipientSection}${subject ? `件名: ${subject}\n` : ''}本文:
"""
${message}
"""
---

# Draft Requirements
- 相手の質問や要求事項に対し、漏れなく回答してください。
- 以下の要点を必ず含めてください:
${data.points ? data.points : "(特になし。相手のメッセージに合わせて適切な返信を構成してください)"}
`;
            } else {
                // 新規作成モードの場合
                prompt += `
# Draft Requirements
以下の要点・要素を盛り込んで作成してください:
${data.points || "(一般的な構成で作成してください)"}
`;
            }

            // 最後にSmart Prompt機能を注入して返す
            prompt = injectAntiPatterns(prompt, data.avoids);
            prompt = injectThinking(prompt, data.useThinking);

            return prompt;
        }
    },

    // 3. 議事録・資料要約 (Executive Briefer)
    summary: {
        id: 'summary',
        title: "議事録・資料の要約",
        icon: "FileTextIcon",
        recommendedMode: 'fast',
        steps: [
            {
                id: "source",
                type: "chips",
                question: "要約のソースを選択してください",
                options: ["テキストを貼り付け", "ファイルをアップロード"]
            },
            {
                id: "content",
                type: "dynamic",
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
            const focus = data.focus || "要点のみ";
            let contentDescription = "";

            if (data.source === "ファイルをアップロード" && Array.isArray(data.content)) {
                const fileNames = data.content.map(sf => sf.file.name).join(', ');
                contentDescription = `アップロードされたファイル: ${fileNames}`;
            } else {
                contentDescription = `以下のテキスト:\n"""\n${data.content || ''}\n"""`;
            }

            return `
# Role
あなたは「経営層向けのエグゼクティブ・アシスタント」です。
膨大な情報を、忙しい読み手が短時間で理解し、意思決定できるよう要約してください。

# Task
${contentDescription}
上記の内容を読み込み、指定されたフォーマットで要約レポートを作成してください。

# Output Format: ${focus}

${focus === "アクションアイテム抽出" ? `
以下のMarkdown構造で出力してください：
## 1. 決定事項
会議や資料で確定した事項の箇条書き。

## 2. アクションアイテム (ToDo)
| タスク | 担当者 | 期限 | ステータス |
| --- | --- | --- | --- |
| (タスク内容) | (担当者名) | (日付/未定) | (未着手/進行中) |

## 3. 保留事項・課題
解決されていない問題点。
` : focus === "詳細レポート構造化" ? `
以下のMarkdown構造で出力してください：
## 1. エグゼクティブサマリー
全体の要旨を300文字程度で。

## 2. 主要な論点 (Key Topics)
議論された主要なトピックごとの詳細。

## 3. 結論と今後のステップ
` : focus === "小学生でもわかるように" ? `
専門用語を一切使わず、比喩などを用いて、小学生（10歳程度）でも内容が理解できるように優しく説明してください。
` : `
## 要点まとめ (3行)
- (要点1)
- (要点2)
- (要点3)
`}
`;
        },
        getFiles: (data) => {
            if (data.source === "ファイルをアップロード" && Array.isArray(data.content)) {
                return data.content.map(sf => sf.file);
            }
            return [];
        }
    },

    // 4. アイデア出し・壁打ち (Cognitive Framework Partner)
    idea: {
        id: 'idea',
        title: "アイデア出し・壁打ち",
        icon: "SparklesIcon",
        recommendedMode: 'standard',
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
            const personaKey = data.persona || "ロジカルコンサル (構造化)";
            const personaDetail = PERSONA_DEFINITIONS[personaKey] || "";

            return `
# Role
あなたは「${personaKey}」として振る舞ってください。
以下のペルソナ定義（性格・思考法・口調）を忠実に再現してください。
${personaDetail}

# Theme
**議論テーマ**: 「${data.theme}」

# Instructions
1. **憑依**: AIであることを忘れ、指定された人格になりきって回答してください。
2. **分析**: 単なる感想ではなく、そのペルソナ特有の視点（リスク、拡散、論理、素朴な疑問）から、テーマを深く掘り下げてください。
3. **問いかけ**: 回答の最後に、ユーザーの思考をさらに深めるための「鋭い質問」や「検討すべき論点」を1つ投げかけてください。

# Output Style
Markdownの構造（見出しやリスト）を適宜使用し、読みやすく提示してください。
`;
        }
    }
};