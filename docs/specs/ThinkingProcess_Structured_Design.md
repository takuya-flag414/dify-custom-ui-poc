# Thinkingプロセス構造化（配列化）実装設計書

## 1. 背景と目的
現在、Difyの各LLMノードから出力される推論プロセス（`thinking`）は単一の文字列（String）として定義・処理されています。
これを「項目名」と「推論内容」を持つオブジェクトの配列（Array）に構造化することで、以下の目的を達成します。

- **ユーザー体験の向上**: 内部的な推論ログを「質問の意図を分析しています...」のような進捗報告ベースの表現に変換し、ユーザーの待機中の安心感を高める。
- **UIでの表現力向上**: フロントエンドのタイムラインや詳細パネルで、推論プロセスをステップごとに視覚的にわかりやすく展開・表示できるようにする。

本設計の最初のテスト対象は `LLM_Intent_Analysys/Web` ノードとします。

## 2. Dify側（バックエンド）の変更設計

### 2.1 JSON Schema の変更
対象ファイル: `docs/temp/Node/LLM_Intent_Analysys/Web/json_schema.json`
`thinking` フィールドの型を `string` から `array` に変更し、内部に `action_label` と `detail` を持つオブジェクトを定義します。

```json
"thinking": {
    "description": "推論プロセスの各ステップを配列で出力します。各ステップはユーザーへの進捗報告として表示されます。",
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "action_label": {
                "type": "string",
                "description": "現在行っている思考・作業の進捗報告。必ず現在進行形または完了形（例: '質問の意図を分析しています...', '過去の会話を確認しました'）で記述すること。"
            },
            "detail": {
                "type": "string",
                "description": "そのステップでの具体的な推論結果や理由（例: '最新の天気情報を取得する必要があると判断しました'）"
            }
        },
        "required": ["action_label", "detail"]
    }
}
```

### 2.2 System Prompt の変更
対象ファイル: `docs/temp/Node/LLM_Intent_Analysys/Web/SystemPrompt.md`
LLMに新しい形式で出力させるため、プロンプトの出力フォーマット指示を更新します。

**追加・修正内容の案**:
```markdown
## 出力フォーマット
(中略)
- `thinking`: 思考プロセスを配列形式で出力してください。各ステップはユーザーが読んで安心できる進捗報告の形式（〜しています、〜しました等）にしてください。

【thinkingの出力例】
"thinking": [
  { 
    "action_label": "質問の意図を分析しています...", 
    "detail": "ユーザーは「明日の東京の天気」を知りたいと考えています。" 
  },
  { 
    "action_label": "過去のやり取りを確認しています...", 
    "detail": "特に引き継ぐべき関連するコンテキストはありませんでした。" 
  },
  { 
    "action_label": "最適な情報源を判断しています...", 
    "detail": "リアルタイムな気象情報が必要なため、Web検索を実行することに決定しました。" 
  }
]
```

## 3. フロントエンド（React）の変更設計

フロントエンドでは、既存の文字列型 `thinking` と新しい配列型 `thinking` の両方に互換性を持たせる設計とします。

### 3.1 `src/components/Message/ThinkingProcess.jsx`
タイムライン上で展開される思考プロセス部分の表示ロジックを更新します。

```jsx
// 修正イメージ
{typeof step.thinking === 'string' ? (
    // 従来の単一文字列の場合の表示
    <div className="text-gray-600 whitespace-pre-wrap">{step.thinking}</div>
) : Array.isArray(step.thinking) ? (
    // 配列（構造化JSON）の場合の表示
    <ul className="flex flex-col gap-3 mt-2">
        {step.thinking.map((t, index) => (
            <li key={index} className="text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-blue-500 text-lg">▪</span>
                    <strong className="text-gray-800">{t.action_label}</strong>
                </div>
                <div className="text-gray-600 pl-4 mt-1 border-l-2 border-gray-100 ml-1">
                    {t.detail}
                </div>
            </li>
        ))}
    </ul>
) : null}
```

### 3.2 `src/components/Inspector/InspectorPanel.jsx`
インスペクターパネル（開発者/デバッグ向け詳細）での表示も同様に対応します。

### 3.3 型定義の更新
必要に応じて `src/utils/responseParser.ts` や `src/utils/thoughtProcessRestorer.ts` で定義している `ProcessLogs` や `ThoughtStep` 内の `thinking` の型を `string | Array<{action_label: string, detail: string}>` に拡張します。

## 4. テスト・検証手順
1. 上記の変更を適用後、PoCアプリを起動する。
2. Web検索が必要なプロンプト（例：「明日の東京の天気は？」）を入力し送信する。
3. Difyからのストリーミングレスポンス中に、タイムライン上に「質問の意図を分析しています...」等のステップごとの進捗表示が、リスト形式で順次あるいは一括で表示されるか確認する。
4. インスペクター画面でも同様に配列として構造化して表示されているか確認する。
