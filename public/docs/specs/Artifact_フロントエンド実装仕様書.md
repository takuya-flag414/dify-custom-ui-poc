## 📄 Artifact: フロントエンド実装仕様書

***

# HybridQA Artifact機能 フロントエンド実装仕様

**バージョン:** 1.0.0
**作成日:** 2026年3月17日

***

## 1. Artifact機能の全体像

### 1.1 概要

Artifact機能とは、チャット上でAIが生成した回答内容を、**構造化されたドキュメント（レポート・チェックリスト・比較表など）として書き出す機能**です。ユーザーが回答に付随するアクションボタンをクリックすることで、Difyワークフロー内の専用LLMノードがドキュメントを生成し、フロントエンドが専用ビューワーで表示します。

### 1.2 Difyワークフロー内の処理フロー

```
[フロントエンド] ボタンクリック
      ↓ artifact フィールド付きJSONを送信
[Protocol_Parser] artifact.requested / artifact.type を抽出
      ↓ is_artifact = "true"
[GATE_Artifact_Mode] TRUEブランチへ分岐
      ↓
[LLM_Artifact_Generator] 会話履歴 + コンテキストからドキュメント生成
      ↓ Structured Output（JSON）
[ANSWER_Artifact] JSONをそのままフロントエンドへ返却
```

通常の会話メッセージ（`artifact: null`）の場合は `GATE_Artifact_Mode` のFALSEブランチへ流れ、**既存フローに一切影響しません。**

### 1.3 LLM_Artifact_Generator が返す JSON 構造

```json
{
  "artifact_title": "テレワーク規定まとめ",
  "artifact_type": "summary_report",
  "artifact_content": "## 概要\n...\n## 詳細\n...\n## まとめ\n...",
  "answer": "「テレワーク規定まとめ」のドキュメントを生成しました。",
  "citations": [
    { "id": "1", "source": "テレワーク勤務規定_v2.1.pdf", "url": null }
  ]
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `artifact_title` | string | ドキュメントタイトル（20字以内） |
| `artifact_type` | string | ドキュメント種別（後述） |
| `artifact_content` | string | Markdown形式の本文 |
| `answer` | string | チャット欄に表示する完了メッセージ |
| `citations` | array | 参照ソース一覧 |

**artifact_type の種別一覧:**

| 値 | 説明 |
|---|---|
| `summary_report` | 概要・詳細・まとめ構成のレポート |
| `checklist` | `- [ ]` 形式のチェックリスト |
| `comparison_table` | Markdownテーブル形式の比較表 |
| `faq` | Q&A形式のFAQ集 |
| `meeting_minutes` | 日時・議題・決定事項・TODO構成の議事録 |

***

## 2. ユーザーメッセージ送信プロトコル

### 2.1 基本プロトコル（v1.0）

フロントエンドからDifyへ送信するメッセージはすべて以下のJSON構造に従います。

```json
{
  "v": "1.0",
  "content": {
    "text": "ユーザーが入力したテキスト"
  },
  "attachments": [],
  "intelligence": {
    "mode": "speed",
    "model": "gemini-2.5-flash"
  },
  "context": {
    "selected_store_ids": [],
    "selected_store_names": [],
    "web_search_enabled": true,
    "domain_context": "general",
    "domain_filter": []
  },
  "quote": null,
  "timestamp": 1773642214012,
  "dify_inputs": {
    "rag_enabled": "false",
    "web_enabled": "true",
    "domain_filter": "",
    "current_time": "2026年3月17日",
    "ai_style": "partner",
    "system_prompt": "...",
    "reasoning_mode": "fast",
    "gemini_store_id": ""
  },
  "artifact": null
}
```

### 2.2 Artifactリクエスト時のプロトコル拡張

ユーザーがArtifactボタンをクリックした際、フロントエンドは `artifact` フィールドを以下のように付与して送信します。

```json
{
  "v": "1.0",
  "content": {
    "text": "この内容をレポートにまとめる"
  },
  "artifact": {
    "requested": true,
    "type": "summary_report"
  },
  ...
}
```

**通常会話時:** `"artifact": null` または フィールド省略

**フィールド仕様:**

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `artifact.requested` | boolean | ○ | 必ず `true` をセット |
| `artifact.type` | string | ○ | 上記artifact_type種別から選択 |

### 2.3 smart_actions との連携

AIの回答JSONに含まれる `smart_actions` のうち、`type: "generate_document"` のアクションがある場合、フロントエンドはアクションボタンとしてレンダリングします。

```json
{
  "smart_actions": [
    {
      "type": "generate_document",
      "label": "この内容をレポートにまとめる",
      "payload": {
        "artifact_type": "summary_report"
      }
    }
  ]
}
```

ユーザーがこのボタンをクリックすると、フロントエンドは以下の処理を行います。

```javascript
function onArtifactButtonClick(action) {
  const message = {
    v: "1.0",
    content: { text: action.label },
    artifact: {
      requested: true,
      type: action.payload.artifact_type
    },
    // ...その他フィールドは通常送信と同様...
  };
  sendToDify(message);
}
```

***

## 3. Artifactレスポンスのパースと表示

### 3.1 レスポンス判定ロジック

Difyからのレスポンスを受信したら、まず `artifact_title` フィールドの有無でArtifactレスポンスか否かを判定します。

```javascript
function handleDifyResponse(rawText) {
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    // 通常テキストレスポンスとして処理
    renderChatMessage(rawText);
    return;
  }

  if (parsed.artifact_title && parsed.artifact_content) {
    // Artifactレスポンス
    renderArtifact(parsed);
    renderChatMessage(parsed.answer); // 完了メッセージをチャット欄に表示
  } else {
    // 通常JSONレスポンス（既存の処理）
    renderNormalResponse(parsed);
  }
}
```

### 3.2 Artifactビューワーの表示仕様

`renderArtifact()` は以下の要素をUIに展開します。

```
┌─────────────────────────────────────────┐
│ 📄 テレワーク規定まとめ        [コピー] │  ← artifact_title
│ summary_report                          │  ← artifact_type バッジ
├─────────────────────────────────────────┤
│                                         │
│  ## 概要                                │
│  テレワーク勤務は週3回（月12回）まで…  │  ← artifact_content
│                                         │  　（Markdownレンダリング）
│  ## 詳細                                │
│  ...                                    │
│                                         │
├─────────────────────────────────────────┤
│ 出典: テレワーク勤務規定_v2.1.pdf [1]   │  ← citations
└─────────────────────────────────────────┘
```

### 3.3 artifact_type 別レンダリング指針

| artifact_type | Markdownレンダリング上の注意点 |
|---|---|
| `summary_report` | `##` 見出し単位で折りたたみ（アコーディオン）を実装すると閲覧しやすい |
| `checklist` | `- [ ]` をインタラクティブなチェックボックスとしてレンダリングする |
| `comparison_table` | 横スクロール対応のテーブルコンポーネントを使用する |
| `faq` | **Q:** と **A:** を色分けして視認性を高める |
| `meeting_minutes` | TODOセクションのみ抽出してサイドバーに表示する等の拡張が有効 |

### 3.4 コピー・エクスポート機能

```javascript
function onCopyArtifact(artifact) {
  // Markdownテキストをクリップボードにコピー
  const header = `# ${artifact.artifact_title}\n\n`;
  navigator.clipboard.writeText(header + artifact.artifact_content);
}
```

> **注意:** Dify Cloud版はファイルダウンロードリンクの動的生成に対応していないため、PDF/Word変換はフロントエンド側のライブラリ（例: `jsPDF`, `docx.js`）で実装してください。