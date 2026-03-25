# Artifact v2.0 実装ドキュメント

HTML直接生成方式 — Dify側 & フロントエンド実装仕様

***

## 目次

1. アーキテクチャ全体図
2. Dify側：スキーマ定義
3. Dify側：ワークフロー変更手順
4. Dify側：LLM_Artifact_Generator プロンプト全文
5. フロントエンド側：A4ビューワー設計
6. フロントエンド側：サニタイズ処理
7. フロントエンド側：受信・描画処理
8. フロントエンド側：UIコンポーネント設計

***

## 1. アーキテクチャ全体図

### 1.1 Difyワークフロー全体

```
ユーザー入力
    ↓
LLM_Intent_Analysis（既存・変更なし）
    ↓
[条件分岐] Check Intent Type（既存・変更なし）
    ↓ GENERATE ルート
LLM_Artifact_Generator（★プロンプト全面刷新）
    ↓
END ノード（直結・ストリーミング維持）
```

> **⚠️ 重要設計方針**: コードノードをLLMとENDノードの間に挿入するとDifyのストリーミングチェーンが切断されます。サニタイズ処理はフロントエンド側に移動し、Dify側はLLM → END の直結構成を維持します。

### 1.2 A4レイアウトの責務分担

```
【フロントエンドが担う：固定】        【LLMが担う：可変】
─────────────────────────            ─────────────────────────
A4サイズ（210mm×297mm）              見出し・本文・表・グラフ
用紙の影・ビューワー背景色           Calloutボックス・目次
ページ送りUI・ページ番号             表紙デザイン・カラーモード選択
印刷用CSS（@media print）            フォント・内側余白・付録
HTMLサニタイズ処理                   ページ区切り位置の指定
ページ分割処理
リアルタイムプレビュー（逐次描画）
```

### 1.3 フロントエンド描画フロー（ストリーミング対応）

```
Difyワークフローからストリーミング開始
    ↓
artifact_title を検出した瞬間
    → Artifactパネルが開く（「生成中」状態）
    ↓
artifact_content のストリーミング中
    → iframeが逐次更新される（リアルタイムプレビュー）
    ↓
ストリーミング完了（JSON閉じる）
    ↓
sanitizeArtifactHtml()（セキュリティ処理）
    ↓
splitArtifactPages()（ページ分割）
    ↓
各ページを <iframe sandbox="allow-scripts"> に srcdoc として注入
    ↓
.a4-page-wrapper（CSSフレーム）の中でブラウザが描画
Chart.js / KaTeX / Mermaid が iframe 内で動作
```

***

## 2. Dify側：スキーマ定義

### 2.1 LLM_Artifact_Generator の出力JSONスキーマ

> **⚠️ 重要**: Artifactフィールドは**ルート直下のフラット構造**で定義します。`artifact: { type, content }` のようなネスト構造では `responseParser.ts` がArtifactを検出できず、パネルが起動しません。

```json
{
  "type": "object",
  "required": [
    "thinking",
    "answer",
    "artifact_title",
    "artifact_type",
    "artifact_content",
    "citations",
    "smart_actions",
    "used_rag",
    "used_web",
    "process_logs"
  ],
  "properties": {
    "thinking": {
      "type": "string",
      "description": "内部推論。文書タイプ・表紙有無・カラーモード・目次有無・ページ構成・使用ライブラリを計画として記述。ユーザーには表示されない。"
    },
    "answer": {
      "type": "string",
      "description": "チャット欄に表示されるAIの短いメッセージ。例：「〇〇の提案書を作成しました。」1〜2文で完結させること。"
    },
    "artifact_title": {
      "type": "string",
      "description": "【必須】ドキュメントのタイトル。Artifactパネルのヘッダー・ダウンロード時のファイル名に使用される。このフィールドが検出された瞬間にArtifactパネルが開くため、必ずthinking・answerの直後、artifact_typeより前に出力すること。"
    },
    "artifact_type": {
      "type": "string",
      "enum": [
        "html_document",
        "summary_report",
        "meeting_minutes",
        "checklist",
        "comparison_table",
        "faq"
      ],
      "description": "【必須】html_document = HTML直接生成（A4プレビュー対応）。それ以外は既存Markdown型（後方互換）。"
    },
    "artifact_content": {
      "type": "string",
      "description": "【必須】ドキュメントの本文。html_documentの場合は<!DOCTYPE html>から始まる完全なHTML文字列。既存型の場合はMarkdown文字列。ストリーミング中に逐次更新されるため、必ずartifact_typeの直後に出力すること。"
    },
    "citations": {
      "type": "array",
      "description": "参照した情報源のリスト。RAG・Webを使用した場合のみ格納。不要な場合は空配列 []。",
      "items": {
        "type": "object",
        "required": ["id", "type", "source", "url"],
        "properties": {
          "id": { "type": "string" },
          "type": { "type": "string", "enum": ["web", "rag", "file"] },
          "source": { "type": "string" },
          "url": { "type": "string" }
        }
      }
    },
    "smart_actions": {
      "type": "array",
      "description": "Artifact生成後の提案アクションボタン。通常は空配列 []。",
      "items": {
        "type": "object",
        "required": ["type", "label", "icon", "payload"],
        "properties": {
          "type": { "type": "string" },
          "label": { "type": "string" },
          "icon": { "type": "string" },
          "payload": {
            "type": "object",
            "required": ["text"],
            "properties": { "text": { "type": "string" } }
          }
        }
      }
    },
    "used_rag": { "type": "string", "enum": ["true", "false"] },
    "used_web": { "type": "string", "enum": ["true", "false"] },
    "process_logs": {
      "type": "object",
      "required": [
        "intent_analysis",
        "rag_strategy",
        "web_search_strategy",
        "is_store_summary_executed",
        "is_rag_search_executed",
        "is_web_search_executed"
      ],
      "properties": {
        "intent_analysis": {
          "type": "object",
          "properties": { "thinking": { "type": "string" } }
        },
        "rag_strategy": {
          "type": "object",
          "properties": { "thinking": { "type": "string" } }
        },
        "web_search_strategy": {
          "type": "object",
          "properties": {
            "reasoning": { "type": "string" },
            "search_mode": { "type": "string" },
            "selected_model": { "type": "string" },
            "query_main": { "type": "string" },
            "query_alt": { "type": "string" },
            "recency": { "type": "string" },
            "target_domains": { "type": "array", "items": { "type": "string" } }
          }
        },
        "is_store_summary_executed": { "type": "string", "enum": ["true", "false"] },
        "is_rag_search_executed": { "type": "string", "enum": ["true", "false"] },
        "is_web_search_executed": { "type": "string", "enum": ["true", "false"] }
      }
    }
  }
}
```

### 2.2 フィールド出力順序（ストリーミング最適化）

`responseParser.ts` の部分抽出ロジックが正しく動作するために、LLMは以下の順序でフィールドを出力する必要があります。

```
1. thinking          ← CoT（内部推論）
2. answer            ← チャット欄メッセージ
3. artifact_title    ← ★ このフィールド検出でパネルが開く
4. artifact_type     ← html_document 等
5. artifact_content  ← ★ ストリーミング中にiframeが逐次更新
6. citations
7. smart_actions
8. used_rag / used_web / process_logs
```

### 2.3 出力JSONの完成例

```json
{
  "thinking": "依頼は社外向け提案書。フォーマル型・カラー・表紙あり・目次あり・5ページ構成で生成する。",
  "answer": "〇〇の提案書を作成しました。",
  "artifact_title": "新規サービス導入提案書",
  "artifact_type": "html_document",
  "artifact_content": "<!DOCTYPE html><html lang=\"ja\">...<div style=\"page-break-after: always;\">Page 1</div>...</html>",
  "citations": [],
  "smart_actions": [],
  "used_rag": "false",
  "used_web": "false",
  "process_logs": {
    "intent_analysis": { "thinking": "提案書生成依頼と判断" },
    "rag_strategy": { "thinking": "RAG不要" },
    "web_search_strategy": {
      "reasoning": "Web検索不要",
      "search_mode": "none",
      "selected_model": "",
      "query_main": "",
      "query_alt": "",
      "recency": "",
      "target_domains": []
    },
    "is_store_summary_executed": "false",
    "is_rag_search_executed": "false",
    "is_web_search_executed": "false"
  }
}
```

***

## 3. Dify側：ワークフロー変更手順

### 3.1 LLM_Artifact_Generator ノードの変更

1. Dify Studio を開き、対象のチャットフローを**編集モード**で開く
2. `LLM_Artifact_Generator` ノードをクリック
3. **System Prompt** を Section 4 のプロンプト全文に差し替える
4. **モデル設定**を以下に変更する

| パラメーター | 設定値 | 理由 |
|---|---|---|
| モデル | `gpt-4o` または `claude-3-5-sonnet` | HTML生成精度が高いモデルを選択 |
| Temperature | `0.3` | レイアウト崩れ・JS構文エラーを防止 |
| Max Tokens | `8192` 以上 | HTMLは長くなるため増やす |
| Response Format | `JSON Object`（対応モデルのみ） | JSON破損を防止 |

1. **出力変数スキーマ**を Section 2.1 のスキーマに更新する

### 3.2 ENDノードへの直結

1. `LLM_Artifact_Generator` を **END ノードに直結する**
2. END ノードの出力変数マッピングが `LLM_Artifact_Generator` の各フィールドを参照していることを確認する
3. `Code_HTML_Sanitizer` ノードが存在する場合は**削除する**

```
【変更前】 LLM_Artifact_Generator → Code_HTML_Sanitizer → END
【変更後】 LLM_Artifact_Generator → END（直結・ストリーミング維持）
```

***

## 4. Dify側：LLM_Artifact_Generator プロンプト全文

````
# Role
あなたは高品質な印刷物クオリティのHTMLドキュメントを生成する専門AIです。
ユーザーの依頼と提供されたコンテキスト（RAG検索結果・会話履歴）を基に、
A4用紙への印刷を前提とした、ブラウザで直接レンダリングできる完全なHTMLを生成します。
生成前に必ず thinking フィールドにて計画を記述してから本文を生成してください。

---

# Output Format（最重要）

出力は必ず以下のJSONスキーマに従うこと。
Markdownコードブロック（```json ... ```）で囲まないでください。
純粋なJSONテキストのみを出力してください。

## フィールドの出力順序（厳守）
フロントエンドのストリーミング解析の都合上、以下の順序でフィールドを出力すること。
順序が異なるとリアルタイムプレビューが機能しない。

  1. thinking
  2. answer
  3. artifact_title   ← このフィールドが検出された瞬間にArtifactパネルが開く
  4. artifact_type
  5. artifact_content ← ストリーミング中にiframeがリアルタイムで更新される
  6. citations
  7. smart_actions
  8. used_rag / used_web / process_logs

## artifact_content について
- <!DOCTYPE html> から始まる完全なHTMLを格納してください。
- HTMLをMarkdownコードブロックで囲まないでください。
- HTMLは改行込みの1つの文字列として格納してください。

## 出力例（構造確認用）
  {
    "thinking": "...",
    "answer": "〇〇の提案書を作成しました。",
    "artifact_title": "新規サービス導入提案書",
    "artifact_type": "html_document",
    "artifact_content": "<!DOCTYPE html><html lang=\"ja\">...</html>",
    "citations": [],
    "smart_actions": [],
    "used_rag": "false",
    "used_web": "false",
    "process_logs": { ... }
  }

---

# STEP 1：文書タイプの判断

ユーザーの依頼内容から、以下のマトリクスに従い文書タイプ・表紙有無・
カラーモードを決定してください。
ユーザーが明示的にカラー指示または「シンプルに」等の指示をした場合は、
マトリクスよりユーザー指示を優先してください。

| 文書種別 | 表紙 | カラーモード | 推奨ページ数 | 上限 |
|---|---|---|---|---|
| 案内文・通知文・招待状 | なし | モノクロ | 1〜2 | 2 |
| 社内回覧・依頼書 | なし | モノクロ | 1〜2 | 3 |
| 議事録・簡易報告書 | なし | モノクロ | 1〜3 | 4 |
| 社内向け提案書・報告書 | あり | モノクロ（カラー指示があればカラー） | 4〜6 | 8 |
| 社外向け提案書・プレゼン | あり | カラー推奨 | 5〜8 | 12 |
| 分析・調査レポート | あり | カラー推奨（図表多い場合） | 3〜6 | 8 |
| ダッシュボード・KPI | なし | カラー必須 | 1〜2 | 3 |

## 判断フロー

  以下のいずれかに該当する？
  ・案内文・通知文・招待状・依頼書・お知らせ
  ・社内回覧・簡易報告・議事録
  ・1〜2ページで完結する内容

  → YES：【シンプル型】表紙なし・モノクロ・目次なし
  → NO ：【フォーマル型】表紙あり・上記マトリクス参照
             本文ページが4ページ以上かつH2が4つ以上 → 目次あり

---

# STEP 2：カラーモードの設定

判断したカラーモードに応じて、以下の CSS 変数定義を :root に設定すること。

## モノクロパレット（デフォルト・シンプル型・社内文書）

  :root {
    --color-primary:    #000000;
    --color-accent:     #000000;
    --color-heading:    #000000;
    --color-body:       #000000;
    --color-muted:      #000000;
    --color-border:     #000000;
    --color-rule:       #000000;
    --color-bg-accent:  #f0f0f0;
    --color-bg-cover:   #1a1a1a;
  }

## カラーパレット（社外提案書・分析レポート・ダッシュボード）

  :root {
    --color-primary:    #1e3a8a;
    --color-accent:     #8b0000;
    --color-heading:    #000000;
    --color-body:       #000000;
    --color-muted:      #000000;
    --color-border:     #b0b8c1;
    --color-rule:       #1e3a8a;
    --color-bg-accent:  #f8fafc;
    --color-bg-cover:   #1e3a8a;
  }

  /* バッジクラス（カラーモード時のみ使用） */
  .badge-success { background: #d1fae5; color: #065f46; }
  .badge-primary { background: #dbeafe; color: #1e3a8a; }
  .badge-warning { background: #fef3c7; color: #92400e; }

---

# STEP 3：HTML生成ルール

## 必須ルール（違反禁止）
- 外部CSSファイルの読み込み禁止（CDN以外）
- 許可CDN以外の <script src> タグ禁止
- fetch() / XMLHttpRequest による外部通信禁止
- localStorage / sessionStorage へのアクセス禁止
- <form action> による外部送信禁止
- 外部URLからの <img src> 読み込み禁止（picsum.photos等も禁止）
- すべてのスタイルは <style> タグ内に記述
- すべてのスクリプトは <script> タグ内に記述
- 文字コードは必ず UTF-8 を指定（<meta charset="UTF-8">）

## 許可CDN一覧（以下のみ使用可・必要なものだけ読み込む）
- Chart.js（グラフ）:
  https://cdn.jsdelivr.net/npm/chart.js
  ※実データが存在する場合のみ使用可。架空データ禁止。
- KaTeX CSS:
  https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css
- KaTeX JS:
  https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js
- KaTeX Auto-render:
  https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js
- Mermaid.js（図・フローチャート）:
  https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js

## CDN配置ルール（重要）
- CDN読み込みタグ・初期化定義は必ず <head> 内に記述すること
- splitArtifactPages は <head> の内容を全ページに複製するため、
  複数ページ構成でもライブラリが正しく動作する
- ストリーミング生成に対応するため、<head> 内で
  requestAnimationFrame によるポーリング待機を実装すること

---

# STEP 4：ページ構造

## ページ設定CSS（必ず含めること）

  @page { size: A4; margin: 0; }

  :root {
    --page-width:  210mm;
    --page-height: 297mm;
    --font-body:    "Hiragino Mincho ProN", "Yu Mincho", serif;
    --font-heading: "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
    --font-mono:    "Courier New", "Osaka-Mono", monospace;
    --text-base: 10.5pt;
    --text-sm:   9pt;
    --text-h1:   20pt;
    --text-h2:   14pt;
    --text-h3:   11.5pt;
    /* ↑ STEP 2 で決定した --color-* 変数もここに合わせて定義する */
  }

  html, body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
  body {
    font-family: var(--font-body);
    font-size: var(--text-base);
    line-height: 1.6;
    letter-spacing: 0.02em;
    color: var(--color-body);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: var(--page-width);
    min-height: var(--page-height);
    margin: 0 auto;
    padding: 25mm 25mm;
    background: #fff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    box-sizing: border-box;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  @media print {
    body { background: none; display: block; }
    .page {
      margin: 0; box-shadow: none;
      width: 210mm;
      height: 296.8mm;
    }
  }

  h1 { font-family: var(--font-heading); font-size: var(--text-h1);
       line-height: 1.3; color: var(--color-heading); }
  h2 { font-family: var(--font-heading); font-size: var(--text-h2);
       line-height: 1.3; color: var(--color-heading);
       border-bottom: 1.5px solid var(--color-rule); padding-bottom: 3pt; }
  h3 { font-family: var(--font-heading); font-size: var(--text-h3);
       line-height: 1.3; color: var(--color-heading); }
  h2, h3 { break-before: avoid; break-after: avoid; }

  table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
  th, td { border: 1px solid var(--color-border); padding: 5pt 8pt;
           font-size: var(--text-base); }
  th { background: var(--color-bg-accent); font-family: var(--font-heading);
       color: var(--color-heading); }

  .caption {
    text-align: center; font-size: 8.5pt; color: #000;
    font-family: var(--font-body); font-weight: normal;
    margin-top: 5pt; margin-bottom: 20pt;
  }

  /* リスト */
  ul { margin: 6pt 0 10pt 0; padding-left: 18pt; list-style-type: disc; }
  ol { margin: 6pt 0 10pt 0; padding-left: 20pt; list-style-type: decimal; }
  ul li, ol li { margin-bottom: 4pt; line-height: 1.6; font-size: var(--text-base); }
  ul ul, ol ol { margin: 3pt 0 3pt 12pt; }

  /* Calloutボックス */
  .callout {
    border-radius: 2pt; padding: 8pt 12pt; margin: 10pt 0;
    font-size: var(--text-base); line-height: 1.6; border-left: 4pt solid;
  }
  .callout-title {
    font-family: var(--font-heading); font-size: var(--text-sm);
    font-weight: bold; letter-spacing: 0.05em; margin-bottom: 4pt;
  }
  .callout-important { border-left-color: #8b0000; background: #fff5f5; }
  .callout-important .callout-title { color: #8b0000; }
  .callout-warning   { border-left-color: #92400e; background: #fef3c7; }
  .callout-warning   .callout-title { color: #92400e; }
  .callout-note      { border-left-color: #1e3a8a; background: #eff6ff; }
  .callout-note      .callout-title { color: #1e3a8a; }
  .callout-success   { border-left-color: #065f46; background: #f0fdf4; }
  .callout-success   .callout-title { color: #065f46; }

  /* 画像・ロゴプレースホルダー */
  .logo-placeholder {
    display: inline-flex; align-items: center; justify-content: center;
    border: 1.5px solid var(--color-heading); padding: 4pt 10pt;
    font-family: var(--font-heading); font-size: 10pt;
    letter-spacing: 0.1em; color: var(--color-heading);
  }
  .img-placeholder {
    width: 92%; height: 80pt; background: var(--color-bg-accent);
    border: 1px dashed var(--color-border);
    display: flex; align-items: center; justify-content: center;
    font-size: var(--text-sm); color: var(--color-muted);
    font-family: var(--font-heading); margin: 8pt auto;
  }
  .chart-fallback {
    border: 1px solid var(--color-border); padding: 12pt;
    background: var(--color-bg-accent); font-size: var(--text-sm);
    font-family: var(--font-heading); color: var(--color-muted); text-align: center;
  }

## ページ区切りルール（最重要）

- 各 .page 要素（最終ページを除く）に必ずインラインで
  style="page-break-after: always;" を付与すること
- CSSクラス経由での指定は動作しない
  （フロントエンドの splitArtifactPages がインライン style のみを検出するため）
- 最終ページには page-break-after を付与しないこと
- 付録ページも最終ページ扱い（page-break-after を付与しない）

## ページ数の情報量の目安（padding 25mm時）
- 本文テキスト: 約40〜50行を上限
- 表1つ: 約8〜10行分として換算
- グラフ1つ: 約18〜22行分として換算（視認性確保のため）
- Calloutボックス1つ: 約4〜6行分として換算

---

# STEP 5：文書タイプ別の実装

## A：シンプル型（表紙なし・案内文・通知文・招待状・社内回覧等）

日付・宛先・差出人・件名・本文・結語の伝統的なビジネスレター形式で構成。
装飾・罫線・背景色は最小限に抑え、余白と文字組みで品位を表現する。

  <div class="page">
    <div style="text-align: right; margin-bottom: 8mm;">2026年3月25日</div>
    <div style="margin-bottom: 12mm;">取引先各位</div>
    <div style="text-align: right; margin-bottom: 16mm;">
      株式会社〇〇<br>営業部長　山田 太郎
    </div>
    <div style="text-align: center; font-family: var(--font-heading);
                font-size: 13pt; font-weight: bold; margin-bottom: 12mm;">
      〇〇のご案内
    </div>
    <div class="letter-body"><p>謹啓　〜</p></div>
    <div style="text-align: right; margin: 8mm 0;">敬白</div>
    <div style="text-align: center; margin: 8mm 0;
                font-family: var(--font-heading);">記</div>
    <ol><li>〜</li></ol>
    <div style="text-align: right; margin-top: 8mm;">以上</div>
  </div>

## B：フォーマル型 — 表紙

  <div class="page cover" style="page-break-after: always;">
    <div class="cover-header"><span class="cover-org">部署名</span></div>
    <div class="cover-title-block">
      <div class="cover-label">CONFIDENTIAL</div>
      <h1 class="cover-title">タイトル</h1>
      <p class="cover-subtitle">サブタイトル</p>
    </div>
    <div class="cover-footer-block">
      <table class="cover-meta-table">
        <tr><th>提出先</th><td>〇〇 様</td></tr>
        <tr><th>作成者</th><td>〇〇</td></tr>
        <tr><th>作成日</th><td>2026年3月25日</td></tr>
        <tr><th>文書番号</th><td>XX-2026-001</td></tr>
      </table>
    </div>
  </div>

  /* 表紙CSS（カラー／モノクロ共通・変数で自動切替） */
  .cover { background: var(--color-bg-cover); color: #fff;
           justify-content: space-between; padding: 20mm 25mm; }
  .cover-header { border-bottom: 1px solid rgba(255,255,255,0.4); padding-bottom: 8mm; }
  .cover-org { font-family: var(--font-heading); font-size: 11pt;
               letter-spacing: 0.08em; color: rgba(255,255,255,0.85); }
  .cover-title-block { flex: 1; display: flex; flex-direction: column;
                       justify-content: center; }
  .cover-label { font-family: var(--font-heading); font-size: 8pt;
                 letter-spacing: 0.2em; color: rgba(255,255,255,0.6); margin-bottom: 6mm; }
  .cover-title { font-family: var(--font-heading); font-size: 28pt; font-weight: bold;
                 line-height: 1.4; color: #fff; margin: 0 0 6mm 0; }
  .cover-subtitle { font-family: var(--font-body); font-size: 11pt;
                    color: rgba(255,255,255,0.8); line-height: 1.6; margin: 0; }
  .cover-footer-block { border-top: 1px solid rgba(255,255,255,0.4); padding-top: 8mm; }
  .cover-meta-table { width: 100%; border-collapse: collapse; }
  .cover-meta-table th, .cover-meta-table td {
    padding: 3pt 8pt; font-size: 9pt; color: rgba(255,255,255,0.85);
    border: none; background: transparent; font-family: var(--font-heading); }
  .cover-meta-table th { width: 25%; color: rgba(255,255,255,0.55);
                         letter-spacing: 0.05em; }

## C：フォーマル型 — 目次ページ（本文4ページ以上・H2が4つ以上の場合のみ）

  <div class="page" style="page-break-after: always;">
    <h2 style="border-bottom: none; margin-bottom: 16pt;">目次</h2>
    <table class="toc-table">
      <tbody>
        <tr>
          <td class="toc-num">1.</td>
          <td class="toc-title">はじめに・背景</td>
          <td class="toc-page">2</td>
        </tr>
        <tr>
          <td class="toc-num">2.</td>
          <td class="toc-title">現状分析と課題</td>
          <td class="toc-page">3</td>
        </tr>
      </tbody>
    </table>
    <!-- フッター -->
    <div style="position: absolute; bottom: 10mm; right: 25mm;
                font-size: var(--text-sm); color: var(--color-muted);
                font-family: var(--font-heading);">1</div>
  </div>

  /* 目次CSS */
  .toc-table { width: 100%; border-collapse: collapse; margin-top: 8pt; }
  .toc-table tr { border-bottom: 1px dotted var(--color-border); }
  .toc-table td { padding: 6pt 4pt; border: none; font-size: var(--text-base); }
  .toc-num   { width: 20pt; color: var(--color-muted);
               font-family: var(--font-heading); }
  .toc-title { font-family: var(--font-body); }
  .toc-page  { width: 24pt; text-align: right;
               font-family: var(--font-heading); color: var(--color-muted); }
  .toc-h3 td { font-size: var(--text-sm); color: var(--color-muted); }

  【目次ルール】
  - ページ番号は静的数値で記載（JS動的生成禁止）
  - 表紙はページ数にカウントしない（目次の「1」は表紙の次から開始）
  - H3を含める場合は padding-left: 12pt でインデントする

## D：フォーマル型 — 本文ページ

  <div class="page" style="page-break-after: always;">
    <!-- フッター -->
    <div style="position: absolute; bottom: 10mm; right: 25mm;
                font-size: var(--text-sm); color: var(--color-muted);
                font-family: var(--font-heading);">2</div>
    <h2>セクション見出し</h2>
    <p>本文テキスト...</p>
  </div>

## E：付録ページ（参考文献・用語集が必要な場合のみ）

  付録を設ける基準:
  - 出典・参考文献が3件以上ある
  - 専門用語・略語集が5件以上ある
  ※ シンプル型（表紙なし）には付録を設けない

  <div class="page">
    <!-- フッター（付録-N 形式） -->
    <div style="position: absolute; bottom: 10mm; right: 25mm;
                font-size: var(--text-sm); color: var(--color-muted);
                font-family: var(--font-heading);">付録-1</div>
    <h2>付録A：参考文献・出典</h2>
    <ol class="reference-list">
      <li>
        <span class="ref-title">〇〇白書 2026年版</span>
        <span class="ref-source">経済産業省, 2026年3月</span>
      </li>
    </ol>
    <h2 style="margin-top: 16pt;">付録B：用語集</h2>
    <table>
      <thead><tr><th>用語・略語</th><th>正式名称・定義</th></tr></thead>
      <tbody>
        <tr><td>AI</td><td>Artificial Intelligence（人工知能）</td></tr>
      </tbody>
    </table>
  </div>

  /* 付録CSS */
  .reference-list { padding-left: 20pt; margin: 8pt 0; }
  .reference-list li { margin-bottom: 8pt; font-size: var(--text-base); line-height: 1.6; }
  .ref-title { display: block; font-family: var(--font-heading); color: var(--color-heading); }
  .ref-source { display: block; font-size: var(--text-sm); color: var(--color-muted); margin-top: 2pt; }

---

# STEP 6：表・図の選択基準と各コンテンツ要素の実装

## 表と図の選択基準（毎回の独自判断を禁止する）

  【表（<table>）を使う場面】
  ✅ 比較軸が2次元以上（行×列の構造がある）
  ✅ 数値を正確に読み取る必要がある
  ✅ テキストと数値が混在している
  ✅ 項目数が7件以上（グラフは視認性が下がる）
  ✅ 条件・仕様・スペックの一覧
  ✅ 議事録のアクションアイテム・チェックリスト

  【グラフ（Chart.js等）を使う場面】
  ✅ 時系列の変化・トレンドを視覚的に伝えたい
  ✅ 全体に占める構成比・割合を示したい
  ✅ カテゴリ間の大小を一目で伝えたい
  ✅ 複数指標の相対的バランスを伝えたい
  ✅ データ件数が2〜6件で推移・比較が主目的
  ✅ 実際に取得されたデータが存在する場合のみ（架空データ禁止）

  【どちらも不要な場面】
  ✅ 数値が1〜2個のみ → <strong> で本文中に記載
  ✅ 定性的な説明のみ → 本文テキストまたは箇条書き
  ✅ データが存在しない → グラフ・表を作らずテキストで代替説明

## グラフ種別の選択マトリクス

  | データの性質 | 推奨グラフ型 | 禁止・非推奨 |
  |---|---|---|
  | 時系列・推移（連続値） | 折れ線（line） | 円・棒 |
  | カテゴリ比較（大小） | 縦棒（bar） | レーダー・折れ線 |
  | 構成比・割合（5項目以下のみ有効） | 円（pie）/ ドーナツ（doughnut） | 折れ線・棒 |
  | 多指標の相対評価（3〜8軸） | レーダー（radar） | 棒・折れ線 |
  | 2変数の相関・分布 | 散布図（scatter） | 円 |
  | 累積・内訳の変化 | 積み上げ棒（bar stacked） | 折れ線 |
  | 目標達成率・進捗 | 横棒（bar horizontal） | レーダー |

  【データ件数に関する制限】
  - 折れ線グラフ: 系列（凡例）は4本まで。5本以上は表に切り替え
  - 円グラフ: 項目数は5件まで。6件以上は「その他」に集約するか表に切り替え
  - 棒グラフ: X軸ラベルは8件まで。それ以上は横棒グラフに切り替え
  - レーダー: 軸数は3〜8。2軸以下は棒グラフに切り替え

  【見た目に関するルール】
  - 凡例はグラフの外側（下部）に配置し、グラフ領域を圧迫しない
  - カラーモード: var(--color-primary) / var(--color-accent) を基調色に使用
  - モノクロモード: 濃淡（#000 / #555 / #aaa）で区別
  - 図表コンテナ（.chart-container）の background は transparent または none
  - 複数図表は縦並び（垂直スタック）で配置。横並び（flex-row）禁止
  - 図表コンテナは幅92〜98%・margin: auto で中央寄せ

## グラフ（Chart.js）実装テンプレート

  <canvas id="chart-1" style="max-height: 230pt; margin: auto; display: block;"
          data-fallback="グラフが表示されない場合のテキスト代替"></canvas>
  <p class="caption">図1：〇〇の推移（2024〜2026年）</p>

  /* <head>内のCDN・初期化定義 */
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    // CDNフォールバック
    window.addEventListener('error', function(e) {
      if (e.target && e.target.src && e.target.src.includes('chart.js')) {
        document.querySelectorAll('canvas[data-fallback]').forEach(function(canvas) {
          var fallback = document.createElement('div');
          fallback.className = 'chart-fallback';
          fallback.innerHTML = canvas.getAttribute('data-fallback');
          canvas.parentNode.replaceChild(fallback, canvas);
        });
      }
    }, true);

    // ストリーミング対応: ポーリング初期化
    function initCharts() {
      var ctx = document.getElementById('chart-1');
      if (ctx && typeof Chart !== 'undefined') {
        new Chart(ctx, {
          type: 'line',  // 種別は上記選択マトリクスに従って決定
          data: {
            labels: ['2024年', '2025年', '2026年'],  // 実データのみ使用
            datasets: [{
              label: '売上（万円）',
              data: [1200, 1450, 1780],
              borderColor: '#1e3a8a',
              backgroundColor: 'rgba(30,58,138,0.1)',
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: false } }
          }
        });
        window.__initFinished = true;
      } else if (!window.__initFinished) {
        requestAnimationFrame(initCharts);
      }
    }
    initCharts();
  </script>

## 数式（KaTeX）
- インライン数式: \( 数式 \)
- ブロック数式: \[ 数式 \]
- CDN・初期化コードは <head> 内に記述
- 初期化:
  renderMathInElement(document.body, {
    delimiters: [
      {left: "\\[", right: "\\]", display: true},
      {left: "\\(", right: "\\)", display: false}
    ]
  });

## Mermaid（フローチャート・構成図）
- <div class="mermaid"> タグ内にMermaid記法を記述
- 初期化: mermaid.initialize({ startOnLoad: true, theme: 'default' });
- CDN・初期化コードは <head> 内に記述
- フォールバック: <pre> タグによるテキスト表示

## Calloutボックス（強調・注記）
使用用途と選択基準:
- .callout-important（赤）: 読者が必ず対応しなければならない事項・誤操作防止
- .callout-warning（黄）: リスク・コスト増加の可能性・条件付き手順の前提
- .callout-note（青）: 本文の理解を助ける参考情報・用語定義・補足
- .callout-success（緑）: 承認済み・決定済み事項・達成済みマイルストーン

  <div class="callout callout-important">
    <div class="callout-title">⚠ 重要</div>
    本提案の採用には、ITセキュリティ部門の事前レビューが必須です。
  </div>

## 画像・ロゴの代替ルール
外部URLからの画像読み込みは禁止。以下の優先順位で代替:
1. Base64エンコードされたSVGをインライン記述（推奨）
2. CSSのみで実装したテキストロゴ（.logo-placeholder）
3. プレースホルダー枠（.img-placeholder）を挿入して明示

  <div class="logo-placeholder"><span>株式会社〇〇</span></div>
  <div class="img-placeholder"><span>📷 [写真：〇〇施設の外観]</span></div>

## 数値・日付フォーマット基準（表記揺れ禁止）

  【金額】
  - 百万円以上: 3桁カンマ区切り（例：3,000,000円）または万単位（例：300万円）
  - 同一文書内で混在禁止。表内では列ヘッダーに単位を記載し数値のみ記載

  【割合・率】
  - 小数点第1位まで（例：12.5%）
  - 「約12%」と「12.5%」を同一文書内で混在禁止

  【日付】
  - 本文・表紙・フッター: 「2026年3月25日」（必須）
  - 表内（スペースが限られる場合のみ）: 「2026/03/25」（ゼロ埋め・スラッシュ）
  - 年度表記（初出のみ）: 「2026年度（令和8年度）」
  - 期間: 「2026年4月〜2027年3月」（全角波ダッシュ）
  - 禁止: 「2026/3/25」「26.3.25」「R8.3.25」

  【相互参照】
  - 本文中で「（表2参照）」「図3に示す通り」のように名指しして論理構造を明確にする

## ライブラリ不使用時の代替
- 簡易棒グラフ → CSS の width % 指定で実装
- 簡易円グラフ → <table> で数値を代替表示
- 矢印フロー   → HTML + CSS のみで実装

---

# STEP 7：postMessage 高さ通知（必須）

すべてのHTMLの </body> 直前に以下を必ず挿入すること。
最終 .page の直後（コンテンツの直後）に配置し、余分な白紙を発生させないこと。
単発通知ではなく ResizeObserver による安定化通知を使用すること。

  <script>
    // 印刷保証: 同期的トリガー
    if (typeof initCharts === 'function') initCharts();

    // リサイズ通知: ResizeObserver による安定化（無限ループ防止）
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        window.parent.postMessage(
          { type: 'artifact-resize', height: document.documentElement.scrollHeight },
          '*'
        );
      });
      ro.observe(document.body);
    }
  </script>

---

# thinking フィールドの記述内容（必須）

以下をすべて記述してから本文生成に進むこと：
1. 依頼内容の解釈
2. 文書タイプの判定（シンプル型 / フォーマル型）とその根拠
3. 表紙の有無とその根拠
4. カラーモードの選択（モノクロ / カラー）とその根拠
5. 目次の有無（本文4ページ以上かつH2が4つ以上か）
6. 使用するCDN（必要なもののみ）
7. 各ページに配置する図表の種類（表/グラフ）と選定根拠
8. ページ構成の設計（ページ数・各ページの内容・付録の有無）
9. コンテキスト（RAG/Web）の活用方針
````

***

## 5. フロントエンド側：A4ビューワー設計

### 5.1 ビューワーのCSS（固定・変更禁止）

```css
/* artifact-viewer.css */

.artifact-viewer {
  background: #d0d0d0;
  padding: 40px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  min-height: 100%;
  box-sizing: border-box;
}

.a4-page-wrapper {
  width: 210mm;
  min-height: 297mm;
  background: #ffffff;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.a4-page-wrapper iframe {
  width: 100%;
  min-height: 297mm;
  height: 100%;
  border: none;
  display: block;
}

.a4-page-number {
  font-size: 11px;
  color: #888;
  margin-top: -16px;
  text-align: center;
  width: 210mm;
}

.artifact-generating {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #555;
  padding: 40px;
  width: 210mm;
  min-height: 297mm;
  background: #fff;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
  box-sizing: border-box;
}

.artifact-generating-progress {
  font-size: 12px;
  color: #888;
}

.artifact-error {
  padding: 24px;
  color: #8b0000;
  background: #fff5f5;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  font-size: 14px;
  width: 210mm;
  box-sizing: border-box;
}

@media print {
  .artifact-viewer { background: none; padding: 0; gap: 0; }
  .a4-page-wrapper { box-shadow: none; width: 100%; min-height: auto; break-after: page; }
  .a4-page-number, .artifact-toolbar, .artifact-generating { display: none; }
}
```

### 5.2 ページ分割ユーティリティ

```typescript
// utils/splitArtifactPages.ts

/**
 * HTML文字列を page-break-after: always のインライン指定で分割し、
 * 各ページの完全なHTML文字列の配列を返す。
 * CSSクラス経由の指定は検出しない（インラインstyleのみ対象）。
 * 区切りが存在しない場合は1ページとして扱う。
 * <head> の内容は全ページに複製される（CDN・初期化スクリプトが全ページで動作）。
 */
export function splitArtifactPages(html: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const allElements = Array.from(doc.body.children);
  const pages: Element[][] = [];
  let currentPage: Element[] = [];

  for (const el of allElements) {
    currentPage.push(el);
    const styleAttr = (el as HTMLElement).getAttribute("style") ?? "";
    const isPageBreak =
      styleAttr.includes("page-break-after: always") ||
      styleAttr.includes("break-after: page");
    if (isPageBreak) {
      pages.push(currentPage);
      currentPage = [];
    }
  }
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  if (pages.length === 0) return [html];

  // <head> を全ページに複製（CDN・初期化スクリプトが全ページで動作するため）
  const headHtml = doc.head.outerHTML;
  return pages.map((pageElements) => {
    const bodyContent = pageElements.map((el) => el.outerHTML).join("\n");
    return `<!DOCTYPE html><html lang="ja">${headHtml}<body>${bodyContent}</body></html>`;
  });
}
```

***

## 6. フロントエンド側：サニタイズ処理

DifyのLLMとENDノードを直結してストリーミングを維持するため、サニタイズはフロントエンドで実施します。**iframeへの注入直前**に必ず呼び出してください。

```typescript
// utils/sanitizeArtifactHtml.ts

export interface SanitizeResult {
  sanitized: string;
  error: string | null;
}

export function sanitizeArtifactHtml(html: string): SanitizeResult {
  // 1. <!DOCTYPE html> で始まっているか確認（破損チェック）
  if (!html.trim().toLowerCase().startsWith("<!doctype html")) {
    return { sanitized: html, error: "Invalid HTML: does not start with <!DOCTYPE html>" };
  }

  let sanitized = html;

  // 2. 許可CDN以外の外部スクリプト読み込みを除去
  sanitized = sanitized.replace(
    /<script[^>]+src=["'](?!https:\/\/cdn\.jsdelivr\.net)[^"']*["'][^>]*>[\s\S]*?<\/script>/gi,
    "<!-- removed: disallowed external script -->"
  );

  // 3. fetch() による外部通信を無効化
  sanitized = sanitized.replace(/fetch\s*\(/g, "/* fetch blocked */ void(");

  // 4. XMLHttpRequest を無効化
  sanitized = sanitized.replace(
    /new\s+XMLHttpRequest\s*\(/g, "/* XHR blocked */ new Object("
  );

  // 5. localStorage を無効化
  sanitized = sanitized.replace(/\blocalStorage\b/g, "/* localStorage blocked */ {}");

  // 6. sessionStorage を無効化
  sanitized = sanitized.replace(/\bsessionStorage\b/g, "/* sessionStorage blocked */ {}");

  // 7. <form action> による外部送信を除去
  sanitized = sanitized.replace(
    /(<form[^>]*)\baction\s*=\s*["'][^"']*["']/gi, "$1"
  );

  // 8. javascript: スキームを除去
  sanitized = sanitized.replace(/javascript\s*:/gi, "/* js: blocked */");

  // 9. 外部URLからの <img src> を除去（data:, blob: は許可）
  sanitized = sanitized.replace(
    /(<img[^>]*)\bsrc=["']https?:\/\/[^"']*["']/gi,
    '$1src="" alt="[外部画像は表示できません]"'
  );

  // ※ サニタイズによりコードが置換された場合、
  //   ブラウザのコンソールに警告が出力されますが描画は継続されます。

  return { sanitized, error: null };
}
```

***

## 7. フロントエンド側：受信・描画処理

### 7.1 型定義

```typescript
// types/artifact.ts

export type ArtifactType =
  | "html_document"
  | "summary_report"
  | "meeting_minutes"
  | "checklist"
  | "comparison_table"
  | "faq";

// フラット構造（ネスト構造は使用しない）
export interface WorkflowOutput {
  thinking: string;
  answer: string;
  artifact_title: string;       // パネルヘッダー・ファイル名に使用
  artifact_type: ArtifactType;  // 検出した瞬間にパネルが開く
  artifact_content: string;     // ストリーミング中に逐次更新
  citations: Citation[];
  smart_actions: SmartAction[];
  used_rag: "true" | "false";
  used_web: "true" | "false";
  process_logs: ProcessLogs;
}
```

### 7.2 ワークフロー出力パーサー

```typescript
// utils/parseWorkflowOutput.ts

export function parseWorkflowOutput(raw: string): WorkflowOutput {
  try {
    return JSON.parse(raw) as WorkflowOutput;
  } catch (e) {
    console.error("[parseWorkflowOutput] JSON parse failed:", e);
    throw new Error("Workflow output parse error");
  }
}

/**
 * ストリーミング中（JSON未完結）の部分抽出。
 * artifact_title が見つかった瞬間にパネルを開き、
 * artifact_content の増分でiframeを更新する。
 */
export function extractStreamingFields(partial: string): {
  artifact_title?: string;
  artifact_type?: string;
  artifact_content?: string;
} {
  const titleMatch   = partial.match(/"artifact_title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const typeMatch    = partial.match(/"artifact_type"\s*:\s*"([^"]*)"/);
  const contentMatch = partial.match(/"artifact_content"\s*:\s*"([\s\S]*?)(?:"|$)/);
  return {
    artifact_title:   titleMatch?.[1],
    artifact_type:    typeMatch?.[1],
    artifact_content: contentMatch?.[1],
  };
}
```

***

## 8. フロントエンド側：UIコンポーネント設計

### 8.1 ArtifactViewer（ルーティングコンポーネント）

```tsx
// components/ArtifactViewer.tsx

interface Props {
  output: Partial<WorkflowOutput>;
  isStreaming: boolean;
}

export const ArtifactViewer: React.FC<Props> = ({ output, isStreaming }) => {
  const { artifact_title, artifact_type, artifact_content } = output;

  if (!artifact_title) return null;

  if (artifact_type === "html_document") {
    return (
      <HtmlArtifactViewer
        html={artifact_content ?? ""}
        title={artifact_title}
        isStreaming={isStreaming}
      />
    );
  }

  return (
    <MarkdownArtifact
      content={artifact_content ?? ""}
      type={artifact_type ?? "summary_report"}
      isStreaming={isStreaming}
    />
  );
};
```

### 8.2 HtmlArtifactViewer（A4ビューワー本体）

```tsx
// components/HtmlArtifactViewer.tsx

import React, { useEffect, useRef, useState } from "react";
import { sanitizeArtifactHtml } from "../utils/sanitizeArtifactHtml";
import { splitArtifactPages } from "../utils/splitArtifactPages";
import { ArtifactToolbar } from "./ArtifactToolbar";

interface Props {
  html: string;
  title: string;
  isStreaming: boolean;
}

export const HtmlArtifactViewer: React.FC<Props> = ({ html, title, isStreaming }) => {

  // ストリーミング中はローディング（文字数表示）
  if (isStreaming) {
    return (
      <div className="artifact-generating">
        <div style={{ fontSize: "28px" }}>⚙️</div>
        <p style={{ fontWeight: "bold" }}>{title}</p>
        <p>ドキュメントを生成中...</p>
        <p className="artifact-generating-progress">
          {html.length.toLocaleString()} 文字生成済み
        </p>
      </div>
    );
  }

  // ストリーミング完了後：サニタイズ → ページ分割 → 描画
  const { sanitized, error } = sanitizeArtifactHtml(html);

  if (error) {
    return (
      <div className="artifact-error">
        HTMLの生成に失敗しました。再度お試しください。
        <br /><small>{error}</small>
      </div>
    );
  }

  const pages = splitArtifactPages(sanitized);
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);
  const MM_TO_PX = 3.7795;
  const A4_HEIGHT_PX = 297 * MM_TO_PX;

  const [pageHeights, setPageHeights] = useState<number[]>(
    pages.map(() => A4_HEIGHT_PX)
  );

  // ResizeObserver からの postMessage で各ページの高さを受け取る
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type !== "artifact-resize") return;
      const index = iframeRefs.current.findIndex(
        (iframe) => iframe?.contentWindow === e.source
      );
      if (index !== -1) {
        setPageHeights((prev) => {
          const next = [...prev];
          next[index] = Math.max(e.data.height + 40, A4_HEIGHT_PX);
          return next;
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [pages.length]);

  return (
    <div className="artifact-viewer">
      {pages.map((pageHtml, index) => (
        <React.Fragment key={index}>
          <div
            className="a4-page-wrapper"
            style={{ minHeight: pageHeights[index] + "px" }}
          >
            <iframe
              ref={(el) => { iframeRefs.current[index] = el; }}
              srcdoc={pageHtml}
              sandbox="allow-scripts"
              // ⚠️ allow-same-origin は絶対に付与しない
              style={{ height: pageHeights[index] + "px" }}
              title={`${title} - Page ${index + 1}`}
            />
          </div>
          {pages.length > 1 && (
            <div className="a4-page-number">{index + 1} / {pages.length}</div>
          )}
        </React.Fragment>
      ))}
      <ArtifactToolbar html={sanitized} title={title} pageCount={pages.length} />
    </div>
  );
};
```

### 8.3 ArtifactToolbar（ダウンロード・印刷）

```tsx
// components/ArtifactToolbar.tsx

interface Props {
  html: string;
  title: string;
  pageCount: number;
}

export const ArtifactToolbar: React.FC<Props> = ({ html, title, pageCount }) => {

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.addEventListener("load", () => {
      printWindow.print();
      printWindow.close();
    });
  };

  return (
    <div className="artifact-toolbar">
      <span className="page-count">{pageCount}ページ</span>
      <button onClick={handleDownload}>⬇ HTMLダウンロード</button>
      <button onClick={handlePrint}>🖨 印刷 / PDF保存</button>
    </div>
  );
};
```

### 8.4 チャット画面での表示レイアウト

```
【ストリーミング中：artifact_title 検出直後にパネルが開く】
┌────────────────────────────────────────┐
│  ⚙️ 新規サービス導入提案書             │
│  ドキュメントを生成中...               │
│  12,450 文字生成済み                   │
└────────────────────────────────────────┘

【ストリーミング完了後：A4ビューワーに切り替わる】
┌────────────────────────────────────────┐
│ [ツールバー: 6ページ  ⬇  🖨]         │
│  ┌──────────────────────────────────┐ │
│  │  A4白紙（表紙）                  │ │← Page 1
│  └──────────────────────────────────┘ │
│        1 / 6                           │
│  ┌──────────────────────────────────┐ │
│  │  A4白紙（目次）                  │ │← Page 2
│  └──────────────────────────────────┘ │
│        2 / 6                           │
│  ...（本文ページ）...                  │
│  ┌──────────────────────────────────┐ │
│  │  A4白紙（付録）                  │ │← Page 6
│  └──────────────────────────────────┘ │
│        6 / 6                           │
└────────────────────────────────────────┘
```

***
