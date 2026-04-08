# フロントエンド Artifact 処理内部仕様書 (v2.0 補足)

本ドキュメントは、現在のフロントエンド（FE）実装に基づいた Artifact 処理（受信、パース、描画、サニタイズ）の技術仕様をまとめたものです。Dify 側のワークフロー調整時のリファレンスとして使用してください。

---

## 期待される JSON レスポンス構造

FE の `responseParser.ts` は、ストリーミング中の柔軟な解析および既存コードとの互換性のため、以下の**フラットな構造**の JSON を期待しています。

> [!WARNING]
> 「Artifact v2.0 実装ドキュメント」セクション 2.1 に記載された入れ子構造（`"artifact": { "type": "...", "content": "..." }`）では、現在は Artifact パネルが起動しません。

### 必須フィールド (ルート直下)

| フィールド名 | 型 | 内容・役割 |
|---|---|---|
| `artifact_title` | string | **必須。** ドキュメントのタイトル。パネルのヘッダーやダウンロード時のファイル名に使用されます。 |
| `artifact_type` | string | **必須。** `'html_document'` または既存の Markdown 型 (`summary_report` 等)。 |
| `artifact_content` | string | **必須。** ドキュメントの本文。HTML型の場合は `<!DOCTYPE html>` で開始する必要があります。 |
| `answer` | string | チャット欄に表示される AI の短いメッセージ。 |
| `thinking` | string | 思考プロセス (CoT)。チャット欄の折りたたみ部分に表示されます。 |
| `citations` | array | 出典(引用)情報。 |
| `smart_actions` | array | 提案アクションボタン。 |

---

## パースとストリーミングの仕組み

### 1. 全体 JSON パース (`responseParser.ts`)
完了した JSON に対しては、`artifact_title` と `artifact_content` の両方が root に存在するかをチェックし、存在する場合に Artifact データを生成します。

### 2. ストリーミング中の部分抽出
HTML の生成中（JSON が閉じられていない状態）でもプレビューを表示するため、以下の正規表現で各フィールドを個別に抽出しています。
*   `artifact_title` が見つかった瞬間に Artifact パネルが開き「生成中」の状態になります。
*   `artifact_content` の中身がストリーミングされる度に iframe 内が更新されます。

---

## HTML型 Artifact (`html_document`) の要件

### 1. HTML 構造
*   `<!DOCTYPE html>` から始まる完全な HTML 文字列である必要があります。
*   内部で `Chart.js`, `Mermaid.js`, `KaTeX` 等を使用する場合は、コード内で CDN を読み込み、初期化スクリプトを含めてください。

### 2. ページ分割 (A4 ビューワー)
FE 側の `splitArtifactPages.js` は、HTML 要素の **インラインスタイル** 属性をスキャンしてページを分割します。
*   **区切り条件**: 要素に `style="page-break-after: always;"` または `style="break-after: page;"` が含まれていること。
*   CSS クラスによる指定は、FE のパース時点（iframe 注入前）では検知できないため無視されます。

### 3. 高さ通知 (必須)
iframe 内のコンテンツ高さを親（FE）に伝え、スクロールを制御するために、HTML の末尾付近に必ず以下のスクリプトを含めてください。
```html
<script>
  window.parent.postMessage({ type: 'artifact-resize', height: document.documentElement.scrollHeight }, '*');
</script>
```

---

## セキュリティ・サニタイズ処理

FE 側では iframe への注入直前に `sanitizeArtifactHtml.js` による以下の保護を行っています。

*   **外部スクリプト制限**: `https://cdn.jsdelivr.net` 以外のドメインからの `<script src="...">` は除去されます。
*   **通信遮断**: `fetch()` および `XMLHttpRequest` はダミーオブジェクトに置換され、外部へのリクエストは失敗します。
*   **ストレージ遮断**: `localStorage` および `sessionStorage` は空のダミーオブジェクトに置換されます。
*   **フォーム制限**: `<form action="...">` の `action` 属性は除去されます。

> [!NOTE]
> サニタイズによってコードが置換された場合、ブラウザのコンソールに警告が出力されますが、ドキュメントの描画自体は継続されます。

---

## Dify 側での対応方針

現在の FE 仕様で HTML Artifact を表示させるには、Dify の出力 JSON を以下のように構成してください。

```json
{
  "thinking": "...",
  "answer": "...",
  "artifact_title": "サンプルレポート",
  "artifact_type": "html_document",
  "artifact_content": "<!DOCTYPE html><html>...<div style=\"page-break-after: always;\">Page 1</div>...</html>",
  "citations": [],
  "smart_actions": []
}
```
