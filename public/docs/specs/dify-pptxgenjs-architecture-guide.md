# Dify × PptxGenJS 実装アーキテクチャ手順書

## 概要

本手順書は、DifyでPowerPoint生成用の仕様またはコードを生成し、カスタムフロントエンド（Vite + React）でPptxGenJSを用いて `.pptx` を生成するための、社内向けアーキテクチャと実装手順をまとめたものです。[cite:65][cite:63]

DifyのCodeノードはPython/JavaScriptを実行できますが、セキュリティ上の理由からファイルシステムアクセス、ネットワークリクエスト、OSコマンド実行が制限されています。[cite:65][cite:29][cite:28] そのため、Dify側はスライド仕様生成に集中し、実ファイル生成はブラウザ上のReactアプリで行う分離構成が適しています。[cite:65][cite:63][cite:37]

## 推奨アーキテクチャ

### 基本方針

推奨構成は「Difyが宣言的なスライド仕様を生成し、Reactがその仕様を検証してPptxGenJSでPowerPoint化する」方式です。[cite:65][cite:63] Difyが生成したJavaScriptコードをそのままフロントエンドで `eval` する方式は、任意コード実行やXSSのリスクが高く、避けるべきです。[cite:74]

### 構成要素

| 層 | 役割 | 実装ポイント |
|---|---|---|
| Dify Workflow | ユーザー要求からスライド仕様JSONを生成 | LLM + Codeノードで整形[cite:65] |
| 社内API連携層 | Dify API呼び出し、認証、会話管理 | `POST /chat-messages` を利用[cite:72][cite:75] |
| Vite + React フロントエンド | 仕様JSONの入力、検証、プレビュー、pptx生成 | PptxGenJSをブラウザモードで利用[cite:63][cite:76] |
| テンプレート層 | テーマ、レイアウト、座標、フォント、配色の標準化 | フロント側で固定実装 |
| 監査・制御層 | ログ、JSON Schema検証、危険値除去 | 任意コード実行を禁止 |

### データフロー

1. ユーザーがReactアプリから資料作成条件を入力します。[cite:72]
2. Reactアプリが社内経由でDifyの `POST /chat-messages` を呼び出します。[cite:72][cite:75]
3. Difyワークフローがタイトル、章立て、本文、表、画像メタ情報を含むスライド仕様JSONを返します。[cite:65]
4. ReactアプリがJSON Schemaでバリデーションし、許可された要素のみをUIに反映します。[cite:65][cite:74]
5. ユーザーが「pptx生成」を押すと、PptxGenJSがブラウザ上で `.pptx` を生成し、ダウンロードさせます。[cite:63][cite:76]

## 推奨データモデル

### 生成対象

Difyには、実行可能JavaScriptではなく、以下のような宣言的JSONを返させる設計が適しています。[cite:65][cite:74]

```json
{
  "documentTitle": "2026年度 事業戦略説明",
  "theme": {
    "name": "corporate-blue",
    "primaryColor": "1F4E79",
    "secondaryColor": "D9EAF7",
    "fontFamily": "Aptos"
  },
  "slides": [
    {
      "type": "title",
      "title": "2026年度 事業戦略説明",
      "subtitle": "営業本部",
      "notes": "役員会向け"
    },
    {
      "type": "bullet",
      "title": "重点方針",
      "bullets": [
        "既存顧客深耕を強化",
        "新規市場の仮説検証を加速",
        "案件進捗の可視化を標準化"
      ]
    },
    {
      "type": "table",
      "title": "KPI一覧",
      "headers": ["指標", "現状", "目標"],
      "rows": [
        ["売上", "1.2億円", "1.5億円"],
        ["粗利率", "32%", "36%"]
      ]
    }
  ]
}
```

### スライド型の例

実装初期は型を絞ると安定します。

- `title`
- `section`
- `bullet`
- `two-column`
- `table`
- `chart-placeholder`
- `image`
- `summary`

このようにスライド型を制限すると、React側でレイアウト変換ロジックを固定化しやすくなります。[cite:63]

## 実装手順

### 1. 全体設計を確定する

最初に「Difyは何を返すか」と「Reactは何を生成するか」を明確に分離します。[cite:65] Difyは文章生成と構造化、Reactはテンプレート適用とPptxGenJS変換に責務を限定します。[cite:65][cite:63]

決めるべき主要項目は次のとおりです。

- 入力項目、例: 目的、対象者、ページ数、トーン
- Dify出力JSON Schema
- スライドテンプレート一覧
- 使用可能な色、画像、フォント、要素種別
- ログ・監査項目

### 2. Difyワークフローを作成する

Difyでは、ユーザー入力を受け、LLMでスライド構成案を生成し、CodeノードでJSON整形する流れを作ります。[cite:65] Codeノードはサンドボックス内で動作し、危険な処理や外部アクセスは制限されます。[cite:65][cite:29]

推奨ノード構成は以下です。

1. Startノード: 入力項目を受け取る。[cite:65]
2. LLMノード: スライド構成と各ページ本文を生成する。
3. Codeノード: LLM出力を正規化し、必要なら整形する。[cite:65]
4. Endノード: JSON文字列または構造化出力として返す。

#### Difyプロンプト設計例

- 出力は必ずJSONのみ
- 許可された `type` のみ使用
- 1スライド当たりの最大文字数を制限
- 禁止事項としてHTML、JavaScript、外部URL埋め込み、任意コード記述を明示

### 3. Reactアプリを構築する

PptxGenJSはReactやVite環境で利用でき、ブラウザでも動作します。[cite:63][cite:37] React側では `pptx.setBrowser(true)` を設定し、ブラウザ保存に切り替えることが重要です。[cite:76]

Vite + React 側の役割は次のとおりです。

- Dify API呼び出し
- JSONレスポンスの取得
- JSON Schema検証
- スライドプレビュー
- PptxGenJSへの変換
- `.pptx` ダウンロード

### 4. Dify API連携を実装する

Difyは `POST /chat-messages` APIでチャットアプリを呼び出せます。[cite:72][cite:75] リクエストには `query`, `inputs`, `response_mode`, `user`, 必要に応じて `conversation_id` を含めます。[cite:72][cite:75]

React実装では、Dify APIキーをブラウザへ直接露出しない構成が望ましいです。社内バックエンドまたはBFFを挟み、フロントからは社内APIのみ呼ぶ設計にします。[cite:72][cite:75]

#### API呼び出し例

```ts
const payload = {
  query: userPrompt,
  inputs: {
    audience,
    purpose,
    slideCount,
    tone
  },
  response_mode: 'blocking',
  user: userId,
  conversation_id: conversationId
};
```

### 5. JSON Schema検証を実装する

Difyの出力をそのまま信用せず、フロントで厳格にバリデーションします。[cite:65][cite:74] 型不正、過大文字数、未許可スライド型、外部URL、危険文字列を除外します。[cite:74]

検証観点は次のとおりです。

- `slides` が配列であること
- `type` が許可リスト内であること
- `title` や `bullets` の長さ制限
- `rows` と `headers` の列数整合
- 色コードや画像識別子が許可ルールに合うこと

### 6. テンプレートマッピングを実装する

React側では、各 `slide.type` をPptxGenJSの固定テンプレート関数にマッピングします。[cite:63][cite:37] たとえば `title` はタイトル用レイアウト、`bullet` は箇条書き用、`table` は表用の固定関数に変換します。

例:

- `renderTitleSlide(slide, pptx)`
- `renderBulletSlide(slide, pptx)`
- `renderTableSlide(slide, pptx)`
- `renderSectionSlide(slide, pptx)`

この方式により、Difyの自由記述を減らしつつ、資料品質を揃えられます。

### 7. PptxGenJS生成処理を実装する

PptxGenJSはブラウザ、React、Viteで利用でき、PowerPoint互換の `.pptx` を生成できます。[cite:63][cite:37] ブラウザ実行時は `setBrowser(true)` を設定してから `writeFile()` を呼ぶ構成が案内されています。[cite:76]

```ts
import PptxGenJS from 'pptxgenjs';

export async function generatePptx(spec: PresentationSpec) {
  const pptx = new PptxGenJS();
  pptx.setBrowser(true);
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Internal AI App';
  pptx.subject = spec.documentTitle;
  pptx.title = spec.documentTitle;
  pptx.company = 'Your Company';
  pptx.lang = 'ja-JP';

  for (const slideSpec of spec.slides) {
    switch (slideSpec.type) {
      case 'title':
        renderTitleSlide(pptx, slideSpec, spec.theme);
        break;
      case 'bullet':
        renderBulletSlide(pptx, slideSpec, spec.theme);
        break;
      case 'table':
        renderTableSlide(pptx, slideSpec, spec.theme);
        break;
      default:
        throw new Error(`Unsupported slide type: ${slideSpec.type}`);
    }
  }

  await pptx.writeFile({ fileName: `${spec.documentTitle}.pptx` });
}
```

### 8. プレビュー画面を実装する

pptx生成前に、React上で簡易プレビューを見せると運用が安定します。Difyの生成結果が長すぎる、見出しが崩れる、表の列が多すぎるといった問題を事前に検知できます。

プレビューで確認させる項目は次のとおりです。

- タイトルと順序
- 箇条書き数
- 表の列数
- 画像有無
- 禁止ワードや機密区分

### 9. エラーハンドリングを入れる

DifyのCodeノードではエラー分岐設定が可能で、実行エラー時の代替処理を構成できます。[cite:65] 一方で、JavaScript Codeノードの保存や実行まわりで挙動差異が報告された事例もあるため、出力形式はできるだけ単純なJSONに保つほうが運用しやすいです。[cite:30][cite:61]

フロント側では以下を実装します。

- Dify応答タイムアウト
- JSON parse失敗時の再試行
- Schema不一致時のエラー表示
- pptx生成失敗時の詳細ログ出力
- 失敗データの監査保存

## 推奨ディレクトリ構成

```text
project-root/
├─ apps/
│  └─ pptx-client/
│     ├─ src/
│     │  ├─ api/
│     │  │  └─ dify.ts
│     │  ├─ components/
│     │  │  ├─ PreviewPane.tsx
│     │  │  └─ GenerateButton.tsx
│     │  ├─ pptx/
│     │  │  ├─ generator.ts
│     │  │  ├─ theme.ts
│     │  │  └─ templates/
│     │  │     ├─ title.ts
│     │  │     ├─ bullet.ts
│     │  │     └─ table.ts
│     │  ├─ schema/
│     │  │  └─ presentation.schema.ts
│     │  ├─ types/
│     │  │  └─ presentation.ts
│     │  └─ pages/
│     │     └─ Home.tsx
│     └─ package.json
└─ services/
   └─ bff/
      └─ dify-proxy.ts
```

## セキュリティ設計

### 避けるべき設計

以下は避けるべきです。

- DifyにJavaScriptソースコードを返させ、そのまま実行する。
- フロントエンドにDify APIキーを埋め込む。[cite:72][cite:75]
- 画像URLやリンクURLを無制限に許可する。
- スライドごとに自由座標や自由HTMLを許可する。

### 推奨制御

- Dify出力はJSON Schemaに限定する。[cite:65]
- BFF経由でDifyを呼び、APIキーを秘匿する。[cite:72][cite:75]
- 許可済みスライド型のみ生成する。
- 画像は社内ストレージID参照に限定する。
- 全生成履歴を監査ログ化する。
- PptxGenJSはnpm配布物を社内管理し、外部CDNを使わない。[cite:63]

## 推奨開発ステップ

### フェーズ1: 最小実装

- Difyから `title` と `bullet` のみ返す。
- Reactで2種類のテンプレートのみ実装する。
- ブラウザ保存でpptx生成できることを確認する。[cite:76]

### フェーズ2: 実用化

- `table`, `section`, `summary` を追加する。
- テーマ切り替え、会社ロゴ、フッターを追加する。
- プレビューUIとバリデーションエラーUIを追加する。

### フェーズ3: 運用強化

- 監査ログ、再生成、差分編集を追加する。
- ユーザーごとのテンプレート権限管理を入れる。
- 会話IDごとの履歴再利用を入れる。[cite:72]

## テスト項目

### 単体テスト

- JSON Schema検証
- slide typeごとのテンプレート生成
- 表データ整形
- 色や文字数の制限

### 結合テスト

- Dify応答からpptx出力までの正常系
- 不正JSON混入時の異常系
- 長文入力時の切り詰め処理
- 会話継続時の `conversation_id` 利用確認[cite:72]

### セキュリティテスト

- スクリプト文字列混入
- 許可外URL混入
- サイズ過大な表や画像指定
- APIキー露出確認

## 運用上の注意

DifyのCodeノードは柔軟ですが、サンドボックス制約と安全設計が前提です。[cite:65][cite:29] そのため、pptxの最終品質を安定させるには、Difyの自由度を上げすぎず、フロントエンド側のテンプレート主導で制御することが重要です。[cite:63][cite:76]

また、Dify自体をセルフホストする場合でも、LLM接続先、監査ログ、静的アセット配布方法まで含めて社内ポリシーに沿って閉域化を設計する必要があります。[cite:74][cite:72]

## 実装判断の結論

最も安全で保守しやすい方式は、Difyで「pptxgenjsコード」を生成するのではなく、「pptxに変換可能な宣言的JSON仕様」を生成し、Vite + React 側で固定テンプレートを用いてPptxGenJSへ変換する方式です。[cite:65][cite:63][cite:76] これにより、Difyの生成能力を活かしつつ、ブラウザ側で安全にPowerPointを生成できます。[cite:63][cite:37]
