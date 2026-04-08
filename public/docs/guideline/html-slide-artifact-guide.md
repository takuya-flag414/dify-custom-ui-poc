# HTML Slide Artifact Guideline v4.0

## 1. 目的

このガイドラインは、固定サイズで安定表示でき、再利用しやすい HTML スライドアーティファクトを作成するための共通仕様を定義する。

本ガイドラインの優先順位は以下とする。

1. 構造安全性
2. レイアウト安定性
3. 再利用性
4. トークン効率
5. 視覚品質

本書は、以下の 2 つの役割を兼ねる。

- HTML スライドアーティファクトの仕様書
- LLM を用いたスライド生成ワークフローの実行ガイド

---

## 2. 基本原則

### 2.1 固定キャンバス優先

すべてのスライドは 16:9 の固定キャンバス上で設計する。  
可変高さ、自動伸長、流動レイアウト前提のスライド描画へ切り替えてはならない。

### 2.2 1 スライド単位で独立して成立すること

各スライドは、独立した HTML 単位として成立しなければならない。  
前後スライドの DOM、高さ計算、描画順、表示状態に依存してはならない。

### 2.3 縮小より分割を優先する

内容が安全に収まらない場合は、スライドを分割する。  
フォントサイズ、余白、行間を強引に縮めて overflow を回避してはならない。

### 2.4 発明より再利用を優先する

承認済みテンプレートが存在する場合、新しい構造を即興で作ってはならない。  
まず `slide_type` を選び、その後に `template_id` を選び、最後に slot を埋める。

### 2.5 即興ではなく手順で生成する

スライド生成は、段階的なワークフローに従って実行しなければならない。  
デッキ構成とスライド分類が終わる前に、最終 HTML を書き始めてはならない。

### 2.6 phase をまたいで役割を混在させない

テンプレート資産は phase ごとに分離して運用する。  
phase 分離は、再利用性と構造ドリフト抑制のために存在する。

---

## 3. 必須ワークフロー

スライド生成は、必ず以下の手順に従う。

### Step 1. デッキ構成案の作成

まず、デッキ全体の構成案を作成する。

最低限、以下を定義すること。

- プレゼンの目的
- 想定読者または想定聴衆
- 主なストーリーライン
- セクション構成
- 概算スライド枚数
- 各スライドの役割

デッキ構成案の作成前に、スライド HTML を生成してはならない。

### Step 2. スライドマッピング

構成案で定義した各スライドについて、以下を割り当てる。

- スライド番号
- スライドの目的
- `slide_type`
- `template_id`
- `phase_file`
- 想定情報量
- chart / table / comparison / visual の有無

このマッピングは、スライド HTML の記述前に完了していなければならない。

### Step 3. スライド単位生成

スライドは 1 枚ずつ生成する。  
明確な理由がない限り、デッキ全体を 1 回の自由記述 HTML で一括生成してはならない。

各スライドについて、以下を順に行う。

1. デッキ構成案を確認する
2. 対象スライドのマッピング情報を確認する
3. 承認済みテンプレートを選択する
4. 承認済み slot のみを埋める
5. 容量と安全性を検証する
6. 当該スライドを出力する

### Step 4. 最終統合レビュー

すべてのスライドを生成した後、デッキ全体のレビューを実施する。

確認項目:

- タイトルの一貫性
- 文体・語調の一貫性
- ページ番号の連続性
- セクションの流れ
- 重複
- 不自然な断絶
- テンプレートの誤用
- 安全性違反

デッキ全体レビューを完了するまでは、最終成果物として確定してはならない。

---

## 4. 構成案の出力形式

スライド生成前に、構造化された planning object を作成する。

推奨形式:

```yaml
deck_goal: [短い目的説明]
audience: [対象読者]
tone: [executive / analytical / explanatory / sales など]
sections:
  - id: S1
    title: [セクションタイトル]
    purpose: [セクションの目的]
slides:
  - no: 1
    section: S1
    purpose: [スライドの役割]
    slide_type: [title / content / chart / table など]
    template_id: [承認済みテンプレートID]
    phase_file: [phase HTML ファイル名]
    notes: [制約 / 想定情報量]
```

この planning block は、生成ワークフロー上の必須要素とする。

---

## 5. 必須 HTML 構造

すべてのアーティファクトは、完全な HTML 文書でなければならない。

最小構造:

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>title</title>
  <style>
    /* required CSS */
  </style>
</head>
<body>
  <div class="slide [slide-type-class]" style="page-break-after: always;">
    <div class="slide-body">
      <!-- slide contents -->
    </div>
    <div class="slide-number">1</div>
  </div>
</body>
</html>
```

### 必須ルール

- `<!DOCTYPE html>` は必須。
- `<html>`, `<head>`, `<body>` は必須。
- 各スライドは `.slide` を使う。
- 各スライドは `.slide-body` を含む。
- 各スライドは `.slide-number` を含む。
- 最終スライド以外には `style="page-break-after: always;"` を付ける。
- 文書末尾に resize 同期用スクリプトを置く。
- 各 pattern の先頭に `<!-- Pattern: ... -->` コメントを置く。
- 可変要素は `{{TITLE}}` のようなプレースホルダー形式で表現する。

---

## 6. 固定ページ仕様とキャンバス仕様

スライド形式は固定とする。

### 必須ページサイズ

```css
@page { size: 10in 5.625in; margin: 0; }
```

### 必須キャンバスサイズ

```css
:root {
  --slide-width: 960px;
  --slide-height: 540px;
}
```

### 必須 body 挙動

```css
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: transparent;
}
```

### 必須 slide 挙動

```css
.slide {
  width: var(--slide-width);
  height: var(--slide-height);
  margin: 0 auto;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.slide-body {
  flex: 1;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
```

### 印刷時の挙動

```css
@media print {
  html, body {
    background: none;
    display: block;
    overflow: visible;
  }

  .slide {
    margin: 0;
    width: 960px;
    height: 540px;
    page-break-inside: avoid;
  }
}
```

---

## 7. タイポグラフィ標準

推奨ベース変数:

```css
:root {
  --font-body: "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
  --font-heading: "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
  --font-mono: "Courier New", "Osaka-Mono", monospace;

  --text-base: 18px;
  --text-sm: 14px;
  --text-lg: 22px;
  --text-h1: 46px;
  --text-h2: 30px;
  --text-h3: 22px;
  --text-eyebrow: 12px;
}
```

タイポグラフィ規則:

- 本文標準は `18px`
- その場しのぎのフォント縮小は禁止
- 段落の `text-indent` は `0`
- 余白は一貫させる
- 内容を押し込むために行間を極端に詰めない

---

## 8. カラーシステム

主要色は CSS 変数で管理する。

推奨変数セット:

```css
:root {
  --color-primary: #1d4ed8;
  --color-accent: #c2410c;
  --color-heading: #0f172a;
  --color-body: #334155;
  --color-muted: #64748b;
  --color-border: #dbe3ee;
  --color-rule: #1d4ed8;
  --color-bg-accent: #eff6ff;
  --color-bg-soft: #f8fafc;
  --color-slide-bg: #ffffff;
}
```

スライドごとにテーマ色をベタ書きすることは避ける。  
必要な場合でも、原則として CSS 変数の上書きで対応する。

---

## 9. 許可ライブラリ

利用するライブラリは最小限に限定する。

### 許可ライブラリ

- Chart.js

### 標準方針

- chart スライドが必要な場合にのみ Chart.js を使う
- 明確な理由なしに追加ライブラリを読み込まない
- KaTeX や Mermaid は標準構成に含めない

---

## 10. スライド分類

各スライドには、以下を必ず割り当てる。

- `slide_type`
- `template_id`
- `phase_file`

### 承認済み slide_type

- `title`
- `agenda`
- `section`
- `content`
- `two-col`
- `chart`
- `table`
- `closing`

### 決定順序

1. slide purpose
2. slide type
3. template id
4. slot filling
5. safety validation

「何が見た目としてきれいか」から始めてはならない。  
「このスライドの役割は何か」から始める。

---

## 11. フェーズ分離方針

テンプレート資産は phase ごとに分離する。  
各 phase HTML は独立したファイルとして維持する。

### Phase 1

ファイル:

- `phase1-slide-templates.html`

主な役割:

- 導入
- 文脈づくり
- 章区切り
- 基本説明
- KPI 的導入

### Phase 2

ファイル:

- `phase2-slide-templates.html`

主な役割:

- agenda
- 比較
- table
- text + visual
- closing

### Phase 3

ファイル:

- `phase3-slide-templates.html`

主な役割:

- chart
- process
- comparison emphasis

phase の役割を安易にまたいで混在させてはならない。  
phase 分離は、再利用性と構造ドリフト抑制のために存在する。

---

## 12. Template Index

以下の template id を用いる。

| template_id | phase_file | slide_type | purpose |
|---|---|---|---|
| P1_TITLE | phase1-slide-templates.html | title | 表紙、導入、発表タイトル |
| P1_SECTION | phase1-slide-templates.html | section | セクション区切り |
| P1_CONTENT | phase1-slide-templates.html | content | 基本説明 |
| P1_KPI | phase1-slide-templates.html | content | KPI や強い数値強調 |
| P2_AGENDA | phase2-slide-templates.html | agenda | 目次、進行、論点一覧 |
| P2_TWO_COL | phase2-slide-templates.html | two-col | 左右比較 |
| P2_TEXT_VISUAL | phase2-slide-templates.html | two-col | 説明 + visual placeholder |
| P2_TABLE | phase2-slide-templates.html | table | データ表、条件表、項目比較 |
| P2_CLOSING | phase2-slide-templates.html | closing | 締め、連絡先、次アクション |
| P3_PROCESS | phase3-slide-templates.html | content | プロセス / 手順説明 |
| P3_COMPARISON | phase3-slide-templates.html | two-col | before / after や現状 / 目標比較 |
| P3_CHART | phase3-slide-templates.html | chart | 単一 chart スライド |

---

## 13. テンプレート選定ルール

各スライドについて、以下を順に行う。

1. 役割を定義する
2. `slide_type` を選ぶ
3. `template_id` を選ぶ
4. `phase_file` を選ぶ
5. 承認済み slot を埋める
6. 安全性を検証する
7. スライドを出力する

### 簡易マッピング指針

- opener -> `P1_TITLE`
- section divider -> `P1_SECTION`
- general explanation -> `P1_CONTENT`
- KPI emphasis -> `P1_KPI`
- agenda -> `P2_AGENDA`
- standard comparison -> `P2_TWO_COL`
- explanation + visual -> `P2_TEXT_VISUAL`
- exact data matrix -> `P2_TABLE`
- closing -> `P2_CLOSING`
- step / process -> `P3_PROCESS`
- before / after comparison -> `P3_COMPARISON`
- one chart -> `P3_CHART`

迷った場合は、より単純なテンプレートを優先する。  
それでも解決しない場合は、スライドを分割する。

---

## 14. Slot Contract

変更可能なのは、承認済み slot のみとする。

### 固定構造ルール

- 各 slide 先頭に `<!-- Pattern: TEMPLATE_ID -->` コメントを置く
- 可変要素は `{{PLACEHOLDER}}` 形式を用いる
- 新しい構造が必要な場合は、新しい `template_id` を定義する
- 既存テンプレートを黙って変形させてはならない

### 一般的に編集可能な slot

- eyebrow
- title
- subtitle
- lead
- bullets
- labels
- metric values
- metric unit
- captions
- notes
- table cell values
- chart role
- chart fallback
- chart note
- chart caption

### 固定構造要素

以下は slot ではなく、固定構造として扱う。

- `.slide`
- `.slide-body`
- `.slide-number`
- ページサイズ規則
- overflow 規則
- `page-break-after`
- resize 同期処理
- chart 初期化骨格
- fallback 挙動
- phase 分離の考え方

---

## 15. パターン別 slot 一覧

### 15.1 Phase 1

#### P1_TITLE

- `EYEBROW`
- `TITLE`
- `SUBTITLE`
- `PRESENTER_NAME`
- `PRESENTER_META`
- `SLIDE_NUMBER`

#### P1_SECTION

- `SECTION_LABEL`
- `SECTION_TITLE`
- `SECTION_SUBTITLE`
- `SLIDE_NUMBER`

#### P1_CONTENT

- `EYEBROW`
- `TITLE`
- `LEAD`
- `BULLET_1`
- `BULLET_2`
- `BULLET_3`
- `POINT_BOX_TITLE`
- `POINT_BOX_BODY`
- `LABEL_TAG_1`
- `LABEL_TAG_2`
- `SLIDE_NUMBER`

#### P1_KPI

- `EYEBROW`
- `TITLE`
- `METRIC_VALUE`
- `METRIC_UNIT`
- `METRIC_LABEL`
- `METRIC_SUBTEXT`
- `SUPPORT_BULLET_1`
- `SUPPORT_BULLET_2`
- `FOOTNOTE`
- `SLIDE_NUMBER`

### 15.2 Phase 2

#### P2_AGENDA

- `EYEBROW`
- `TITLE`
- `AGENDA_ITEM_1`
- `AGENDA_ITEM_2`
- `AGENDA_ITEM_3`
- `AGENDA_ITEM_4`
- `FOOTNOTE`
- `SLIDE_NUMBER`

#### P2_TWO_COL

- `EYEBROW`
- `TITLE`
- `LEFT_TITLE`
- `LEFT_BULLET_1`
- `LEFT_BULLET_2`
- `LEFT_BULLET_3`
- `LEFT_NOTE`
- `RIGHT_TITLE`
- `RIGHT_BULLET_1`
- `RIGHT_BULLET_2`
- `RIGHT_BULLET_3`
- `RIGHT_NOTE`
- `SLIDE_NUMBER`

#### P2_TEXT_VISUAL

- `EYEBROW`
- `TITLE`
- `TEXT_TITLE`
- `TEXT_BULLET_1`
- `TEXT_BULLET_2`
- `TEXT_BULLET_3`
- `VISUAL_LABEL`
- `VISUAL_CAPTION`
- `FOOTNOTE`
- `SLIDE_NUMBER`

#### P2_TABLE

- `EYEBROW`
- `TITLE`
- `COL_1_HEADER`
- `COL_2_HEADER`
- `COL_3_HEADER`
- `ROW_1_COL_1`
- `ROW_1_COL_2`
- `ROW_1_COL_3`
- `ROW_2_COL_1`
- `ROW_2_COL_2`
- `ROW_2_COL_3`
- `ROW_3_COL_1`
- `ROW_3_COL_2`
- `ROW_3_COL_3`
- `CAPTION`
- `FOOTNOTE`
- `SLIDE_NUMBER`

#### P2_CLOSING

- `EYEBROW`
- `CLOSING_TITLE`
- `CLOSING_MESSAGE`
- `ACTION_1`
- `ACTION_2`
- `CONTACT_LINE`
- `SLIDE_NUMBER`

### 15.3 Phase 3

#### P3_PROCESS

- `EYEBROW`
- `TITLE`
- `STEP_1_TITLE`
- `STEP_1_BODY`
- `STEP_2_TITLE`
- `STEP_2_BODY`
- `STEP_3_TITLE`
- `STEP_3_BODY`
- `FOOTNOTE`
- `SLIDE_NUMBER`

#### P3_COMPARISON

- `EYEBROW`
- `TITLE`
- `LEFT_LABEL`
- `LEFT_TITLE`
- `LEFT_BULLET_1`
- `LEFT_BULLET_2`
- `LEFT_BULLET_3`
- `RIGHT_LABEL`
- `RIGHT_TITLE`
- `RIGHT_BULLET_1`
- `RIGHT_BULLET_2`
- `RIGHT_BULLET_3`
- `FOOTNOTE`
- `SLIDE_NUMBER`

#### P3_CHART

- `EYEBROW`
- `TITLE`
- `CHART_ROLE`
- `CHART_FALLBACK`
- `INSIGHT_LINE`
- `CAPTION`
- `FOOTNOTE`
- `SLIDE_NUMBER`

---

## 16. レイアウト意味論

### 16.1 title

用途:

- デッキタイトル
- オープニングメッセージ
- エグゼクティブ向け見出し
- プレゼン冒頭

情報量は絞り、メッセージ中心にする。

### 16.2 section

用途:

- 章区切り
- 大きな構造の切り替え

説明文を詰め込んではならない。

### 16.3 content

用途:

- 通常説明
- 前提説明
- テキスト中心の説明
- KPI 的導入
- chart を伴わないプロセス説明

標準の汎用レイアウトとする。

### 16.4 two-col

用途:

- 比較
- 対比
- 左右分担
- テキストと visual placeholder の併置

左右の情報量が極端に偏る場合は使用しない。

### 16.5 chart

用途:

- 推移
- 比率
- カテゴリ比較
- 定量情報の視覚強調

原則として 1 スライド 1 chart とする。

### 16.6 table

用途:

- 正確な数値
- 条件比較
- 構造化一覧
- マトリクス読み

視覚的インパクトより、精度を優先する場合に用いる。

### 16.7 closing

用途:

- ありがとうページ
- 連絡先
- 次アクション
- 締めの導線

closing に大量の新情報を載せてはならない。

---

## 17. 容量ルール

安全な本文領域は有限である。  
540px 全体を自由に使える前提で考えてはならない。

### 一般ルール

- 箇条書きは 3〜5 項目を基本とする
- 1 項目は 1〜2 行に収める
- 表は窮屈になる前に分割する
- chart の caption は短く保つ
- 2 カラムは片側 3 項目程度までを基本とする
- 長文は point 化または別スライド化する

### pattern 別上限の目安

- `P1_CONTENT`: bullets 3 件まで
- `P1_KPI`: 主指標 1 件 + 補足 bullet 2 件まで
- `P2_AGENDA`: 4〜5 項目まで
- `P2_TWO_COL`: 各カラム bullet 3 件まで
- `P2_TEXT_VISUAL`: text 側 bullet 3 件まで
- `P2_TABLE`: 3 列 x 3 行程度を標準とする
- `P3_PROCESS`: 3 ステップを標準とする
- `P3_COMPARISON`: 左右それぞれ bullet 3 件まで
- `P3_CHART`: 1 スライド 1 chart のみ

### 内容が多すぎる場合の優先順位

1. 別スライドに分割する
2. 文を短くする
3. 要点を抽象化する
4. レイアウトを変更する
5. 最後に軽微な密度調整を検討する

最初にフォント縮小へ逃げてはならない。

---

## 18. 強調コンポーネント

承認済み強調要素:

- `highlight-card`
- `point-box`
- `label-tag`
- `visual-placeholder`

### 使用ガイド

- `highlight-card`: KPI や強い単一指標
- `point-box`: 短い補足論点
- `label-tag`: 状態や分類ラベル
- `visual-placeholder`: 画像・図版未確定時の安全な仮置き枠

強調要素を乱用してはならない。  
視覚的に騒がしくなるまで装飾してはならない。

---

## 19. Table と Chart の使い分け

次の場合は **chart** を使う。

- パターンを素早く見せたい
- 推移や比率が重要
- 視覚比較が主目的

次の場合は **table** を使う。

- 正確な数値が重要
- 複数条件を厳密に比較したい
- セル単位で読ませたい

密な chart と密な table を同じスライドに同居させてはならない。  
両方必要な場合は別スライドへ分ける。

---

## 20. Chart 安全ルール

Chart.js を使う場合、以下をすべて守ること。

### 必須挙動

- 初期化スクリプトは 1 か所へ整理する
- `requestAnimationFrame` を用いた安全な初期化構造を持たせる
- 各 chart canvas は `data-chart-role` を持つ
- 各 chart は 1 回だけ初期化する
- `animation: false` を設定する
- 各 chart は `data-fallback` を持つ
- 失敗時は読めるテキストへフォールバックする
- `CHART_ROLE` が未置換、空、未知 role の場合も fallback を表示する

### chart スライドルール

- 1 スライド = 1 chart
- chart タイトルは短くする
- 補足文は短くする
- caption は簡潔にする
- dense table と併置しない
- chart 下に長文解説を置かない

### role 運用ルール

- 既知 role のみを描画対象とする
- 未知 role は描画を試みず fallback を表示する
- role を追加する場合は初期化関数側へ明示的に追記する

---

## 21. Visual Placeholder ルール

画像や図版アセットが未確定の間は、`visual-placeholder` を使う。

ルール:

- サイズ不明の生画像を直接入れない
- 後で差し替える前提で現実的な枠を確保する
- placeholder がレイアウトを崩してはならない
- 差し替え画像は想定枠に収まるものに限定する

---

## 22. 絶対禁止事項

以下は禁止する。

- `html`, `body`, `.slide` の固定サイズ前提を壊すこと
- スライド高さを fluid / auto にすること
- 必須 overflow 制御を外すこと
- インライン `page-break-after` を削除すること
- `.slide-body` を削除すること
- `.slide-number` を削除すること
- resize 同期スクリプトを削除すること
- 無関係なテンプレート役割を混在させること
- 1 枚に過剰な情報を詰め込むこと
- chart fallback を省略すること
- スライド間 DOM 依存を持ち込むこと
- storage / network 依存の runtime logic を追加すること
- 既存テンプレートを ad hoc に書き換えて流用すること

美観と構造安全性が衝突する場合は、構造安全性を優先する。

---

## 23. スライド単位リクエスト契約

1 スライドずつ生成する際は、最低限以下の契約形式を使う。

```yaml
deck_context:
  title: [デッキタイトル]
  audience: [対象読者]
  tone: [文体]
  section: [セクション名]

slide_request:
  no: [スライド番号]
  purpose: [スライドの役割]
  slide_type: [承認済み type]
  template_id: [承認済み template id]
  phase_file: [phase html file]
  content_inputs:
    - [箇条書き、本文、数値、chart data など]
  constraints:
    - [安全密度に収める]
    - [不要な部品を追加しない]
```

一貫性が重要な場合、スライド単位リクエストを自由記述だけにしてはならない。

---

## 24. Safety Gate

各スライドは、受理前に Safety Gate を通過しなければならない。

### Structural gate

確認項目:

- 完全な HTML 構造がある
- 必須 class が存在する
- page break 規則が正しい
- 固定キャンバス規則が保たれている
- 禁止された構造改変がない

### Density gate

確認項目:

- 箇条書きが安全範囲にある
- テキストが長すぎない
- chart や table が過密でない
- 2 カラムの左右バランスが極端でない
- タイトルと補足文が簡潔である

### Semantic gate

確認項目:

- スライドの役割とテンプレート選択が一致している
- phase file と役割が一致している
- chart / table の選択が適切である
- 役割外の部品混入がない

いずれかに失敗した場合は、修正または分割する。

---

## 25. 最終デッキ統合レビュー

すべてのスライドを個別生成した後、デッキ全体レビューを行う。

### 必須チェック

- ページ番号が連続している
- タイトルの命名スタイルが統一されている
- 用語が統一されている
- 重複内容が削除されている
- セクション順序が自然である
- 視覚リズムが極端に崩れていない
- phase の使い方に一貫性がある
- スライド同士で矛盾していない
- intro / body / closing の役割が明確である

スライド単位生成は局所品質を高めやすいが、全体整合が崩れる可能性があるため、このレビューは必須とする。

---

## 26. LLM 用プロンプト方針

このガイドラインをプロンプトへ変換する際、毎回長大な HTML 本文を貼ってはならない。  
以下の階層で運用する。

1. guideline を全体方針として与える
2. deck planning block を与える
3. slide mapping block を与える
4. one-slide request を与える
5. 最終 integration checklist を与える

この順序により、トークン消費を抑えつつ安定性を高める。

推奨プロンプトフロー:

- Prompt A: デッキ構造を作る
- Prompt B: 各スライドを分類しテンプレートを割り当てる
- Prompt C1...Cn: 各スライドを独立生成する
- Prompt D: デッキ全体の統合レビューを行う

---

## 27. 最小プロンプト例

### Example A: deck planning

```md
まずデッキ構成案だけを作成してください。
HTML はまだ生成しないでください。

Inputs:
- goal: 提案内容を説明する
- audience: 経営層
- expected slides: 6

Required output:
- セクション構成
- 各スライドの役割
- 各スライドの推奨 slide_type
```

### Example B: slide mapping

```md
承認済みガイドラインに従って、各スライドに template_id と phase_file を割り当ててください。
最終 HTML はまだ生成しないでください。
```

### Example C: one slide generation

```md
slide 3 だけを生成してください。

Constraints:
- slide_type: chart
- template_id: P3_CHART
- phase_file: phase3-slide-templates.html
- 承認済み slot のみを使う
- chart は 1 つだけ
- note は短くする
- 構造安全性を守る
```

### Example D: final review

```md
デッキ全体について、以下をレビューしてください。
- 構造違反
- 密度過多
- 文体不一致
- ページ番号不整合
- 重複内容

全面再設計は不要です。
必要な修正点だけを報告してください。
```

---

## 28. 受け入れチェックリスト

成果物を受理してよいのは、以下がすべて真である場合のみとする。

- deck planning が存在する
- slide mapping が存在する
- 各スライドが承認済みテンプレートから生成されている
- スライド生成が 1 枚単位、または同等に制御された単位で実行されている
- 構造禁止事項に違反していない
- 密度ルールを守っている
- phase 分離を守っている
- chart 安全ルールを守っている
- 最終デッキ統合レビューが完了している

1 つでも満たさない場合、デッキは未完成とみなす。

---

## 29. 標準運用サマリー

標準の安全運用モデルは以下とする。

1. デッキを計画する
2. 各スライドを承認済みパターンへマッピングする
3. 1 スライドずつ生成する
4. 各スライドを検証する
5. デッキ全体をレビューする
6. 最終 Safety Pass の後にのみ受理する

強い理由がない限り、この方式から逸脱してはならない。

---

## 30. 参照資産

承認済みテンプレート資産:

- `phase1-slide-templates.html`
- `phase2-slide-templates.html`
- `phase3-slide-templates.html`

これらの資産は、自由に書き換えるサンプルではなく、再利用すべき構造参照資産として扱う。

---

## 31. 統合フェーズ

本ガイドラインにおける統合フェーズとは、ユーザー承認済みの個別スライドを、最終成果物として 1 本の HTML アーティファクトへ安全に束ねる工程を指す。

統合フェーズは、再設計や再生成の工程ではない。  
統合の主目的は、承認済みスライドの内容を維持したまま、順序、共通構造、共通 CSS / JS、ページ番号、最終出力形式を整えることである。

統合対象に含めてよいのは、以下の条件を満たすスライドのみとする。

- 個別生成が完了している
- ユーザー承認が完了している
- `slide_type`, `template_id`, `phase_file` が確定している
- Safety Gate を通過している
- 単体 HTML として構造破綻がない

未承認スライド、要再修正スライド、構造安全性に疑義があるスライドを統合対象へ含めてはならない。

---

## 32. 統合時の基本原則

### 32.1 統合は再編集ではない

統合時に、承認済みスライドの本文、数値、表現、チャートデータ、レイアウト構造を無断変更してはならない。  
統合後に変更してよいのは、原則として以下に限定する。

- スライド順序の確定
- ページ番号の再採番
- 共通 `<head>` 要素の整理
- 共通 CSS の一本化
- 共通 JavaScript の一本化
- 最終スライドの `page-break-after` 調整
- 文書末尾の resize 同期処理の配置

内容の意味に影響する変更が必要な場合、統合フェーズではなく、個別スライドの修正フェーズへ差し戻すこと。

### 32.2 1 文書へ統合する

最終成果物は、1 つの `<!DOCTYPE html>`、1 つの `<html>`、1 つの `<head>`、1 つの `<body>` を持つ完全な HTML 文書として出力する。

各スライドは、`<body>` 内に `.slide` 要素として順番に並べる。  
各スライドの `.slide` と `.slide-body` の構造は維持しなければならない。

### 32.3 スライド独立性を維持する

各スライドは、統合後も独立して成立しなければならない。  
あるスライドの DOM、サイズ、描画順、スクリプト実行結果に、別スライドが依存してはならない。

統合の結果として、スライド間参照、共有状態依存、後続スライドによる前方上書き、ID 衝突による誤作動を生じさせてはならない。

---

## 33. 統合時の正規化ルール

### 33.1 `<head>` の正規化

個別スライドが持つ `<head>` 要素は、そのまま多重に連結してはならない。  
統合時には、全スライドに共通する `<meta>`, `<title>`, `<style>`, `<script>` を整理し、最終文書の `<head>` に 1 回だけ配置する。

重複する CSS 定義、ライブラリ読み込み、初期化スクリプトは統合し、冗長な重複を残してはならない。

### 33.2 CSS の正規化

固定ページ仕様、固定キャンバス仕様、`html, body`, `.slide`, `.slide-body` に関する CSS は、最終文書で 1 セットのみ保持する。

個別スライド側で追加された局所スタイルは、以下の条件を満たす場合のみ保持してよい。

- 固定サイズ前提を壊さない
- overflow 制御を壊さない
- 他スライドへ副作用を与えない
- 禁止事項に抵触しない

競合する CSS がある場合は、見た目ではなく構造安全性を優先して整理する。

### 33.3 JavaScript の正規化

個別スライド内の JavaScript は、統合後に衝突しないよう整理しなければならない。  
特に、重複する初期化関数名、複数回実行される描画処理、ライブラリ多重読込、同一要素の二重初期化を防ぐこと。

chart を含む場合は、共通の初期化スクリプトへ統合し、`canvas[data-chart-role]` を要素単位で初期化する。  
初期化は 1 要素 1 回を原則とし、`animation: false` と `data-fallback` の要件を維持する。

### 33.4 ページ番号の正規化

統合後の `.slide-number` は、最終的な並び順に基づいて先頭から連番で再採番する。  
個別スライド生成時の暫定番号をそのまま残してはならない。

### 33.5 ページ分割の正規化

最終スライド以外のすべての `.slide` には、インラインの `style="page-break-after: always;"` を維持する。  
最終スライドのみ、必要に応じてこの指定を外してよい。

CSS 側の曖昧な page-break 制御だけに依存してはならない。  
明示的なインライン指定を最終成果物でも維持する。

### 33.6 resize 同期処理の正規化

`artifact-resize` を送る resize 同期処理は、最終文書末尾に 1 回だけ配置する。  
個別スライドごとに複数回残してはならない。

---

## 34. 統合入力の契約

統合フェーズへ渡す各スライドには、最低限以下のメタ情報を付与すること。

```yaml
slide_id: [一意なID]
approved: true
approved_version: [版番号]
slide_no_source: [個別生成時の番号]
template_id: [承認済み template id]
phase_file: [phase html file]
slide_type: [承認済み slide type]
has_chart: [true / false]
has_table: [true / false]
has_visual: [true / false]
html_fragment: [承認済み slide 本体]
```

このメタ情報が不足している場合、統合時の正規化・検証・差分管理が不安定になるため、原則として補完後に統合する。

---

## 35. 統合手順

統合は、必ず以下の手順で行う。

1. 統合対象スライドの承認状態を確認する
2. 採用するスライド順序を確定する
3. 重複・欠番・差し替え漏れを確認する
4. 共通 `<head>` を構築する
5. 各 `.slide` を `<body>` 内へ順に配置する
6. ページ番号を再採番する
7. 最終スライド以外へ `page-break-after: always;` を確認する
8. 共通 JavaScript を統合する
9. 文書末尾へ resize 同期処理を 1 回だけ配置する
10. 統合後 Safety Gate を実施する

この手順を飛ばして、個別 HTML を単純連結してはならない。

---

## 36. 統合後 Safety Gate

統合後の成果物は、個別スライドの Safety Gate とは別に、統合後 Safety Gate を通過しなければならない。

### 36.1 Structural gate

確認項目:

- `<!DOCTYPE html>` が 1 回だけ存在する
- `<html>`, `<head>`, `<body>` が 1 組だけ存在する
- 各スライドに `.slide`, `.slide-body`, `.slide-number` がある
- 固定 16:9 / 960x540 の前提が保たれている
- 禁止された構造改変がない

### 36.2 Pagination gate

確認項目:

- スライド順序が正しい
- `.slide-number` が連番である
- 最終スライド以外に `page-break-after: always;` がある
- ページ分割の欠落や重複がない

### 36.3 Script gate

確認項目:

- ライブラリ読込が重複していない
- 初期化関数が衝突していない
- chart がある場合、`data-chart-role`, `data-fallback`, `animation: false` の前提が維持されている
- 同一 chart の二重初期化がない
- resize 同期処理が末尾に 1 回だけ存在する

### 36.4 Independence gate

確認項目:

- あるスライドが別スライド DOM に依存していない
- スライド間で ID や初期化対象が衝突していない
- 局所スタイルや局所スクリプトが他スライドへ副作用を与えていない

### 36.5 Deck coherence gate

確認項目:

- タイトルや見出しの粒度が揃っている
- 用語や表記が統一されている
- セクションの流れが自然である
- 重複説明が過剰でない
- intro / body / closing の役割が明確である

いずれかの gate に失敗した場合、完成品として受理してはならない。  
必要に応じて、統合の修正または個別スライドの差し戻しを行う。

---

## 37. 統合フェーズにおける禁止事項

統合フェーズでは、以下を禁止する。

- 未承認スライドを混入させること
- 承認済み本文を無断で書き換えること
- 個別スライドの構造 class を変えること
- `.slide` の固定サイズ前提を崩すこと
- `.slide-body` を削除または改変すること
- 最終成果物に複数の `<head>` や `<body>` を残すこと
- CSS / JS の重複を放置すること
- `artifact-resize` を複数回残すこと
- chart 初期化の要件を壊すこと
- 単純連結だけで統合完了とみなすこと

統合は、単なる結合作業ではなく、構造安全性を保った正規化工程であることを常に優先する。

---

## 38. 統合完了条件

統合が完了したとみなしてよいのは、以下をすべて満たす場合のみとする。

- 全スライドが承認済みである
- 順序が確定している
- ページ番号が再採番されている
- 共通 CSS / JS が正規化されている
- `page-break-after` が正しく付与されている
- resize 同期処理が末尾に 1 回だけある
- 統合後 Safety Gate を通過している
- 最終成果物が 1 本の完全な HTML 文書である

これらを 1 つでも満たさない場合、統合は未完了とみなす。
