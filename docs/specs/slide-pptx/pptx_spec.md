# PPTX Specification (`pptx_spec`)

このドキュメントは、`pptxGenerator.js` によって処理される PowerPoint 生成用の JSON/オブジェクトのスキーマ仕様をまとめたものです。

## 概要

プレゼンテーション全体の設定を行うグローバルプロパティと、各スライドの具体的な内容を定義する `slides` 配列で構成されます。

## グローバル設定 (Global Settings)

プレゼンテーション全体に適用されるメタデータやテーマカラーを設定します。

| プロパティ名 | 型 | 説明 |
| --- | --- | --- |
| `documentTitle` | `string` | プレゼンテーションのメタデータ（タイトル・件名）や一部スライドにおけるフッター日付などの表示に使用されます。生成するファイル名にも利用されます。 |
| `theme` | `object` | プレゼンテーション全体のフォントやカラーパレットを定義します。（下表参照） |
| `slides` | `array` | 各スライドのデータを格納した配列。（必須） |

### テーマ設定 (`theme`)
カラーコード（HEX）は `#` の有無を問わずに指定可能です（内部でサニタイズされます）。指定がない場合はデフォルトのモダンなスレート系テーマが使用されます。

- `fontFamilyBody` (`string`) : メインテキスト用のフォント (デフォ: "Meiryo")
- `fontFamilyHeading` (`string`) : 見出し用のフォント (デフォ: "Meiryo")
- `backgroundColor` (`string`) : 基本スライドの背景色
- `textColor` (`string`) : 基本の文字色
- `primaryColor` (`string`) : 主要カラー（ヘッダーテキスト、装飾図形等）
- `secondaryColor` (`string`) : 背景のアクセントカラー（薄いグレー等）
- `accentColor` (`string`) : アクセントカラー（強調テキスト、Eyebrow等）
- `mutedTextColor` (`string`) : ミュートカラー（補足テキスト、図の枠線以外等）
- `borderColor` または `borderGray` (`string`) : ボックスや線の境界線色

---

## 共通スライドプロパティ

すべての `slides` 配列内のスライドオブジェクトで共通して使用・認識されるプロパティです。

| プロパティ名 | 型 | 説明 |
| --- | --- | --- |
| `type` | `string` | **必須**。スライドの種類を指定します。 |
| `speakerNotes` | `string` | スライドの発表者ノート（ノートエリア）に設定されるテキスト。 |
| `footerNote` | `string` | 多くのスライドタイプで、画面下部（フッター領域）に表示される短い注釈文字列。 |

---

## スライドタイプ別仕様

各スライドタイプ (`type`) で利用可能なプロパティの一覧です。

### 1. タイトルスライド (`title`)
プレゼンテーションの表紙。モダンなグラデーション背景と半透明の装飾付きで出力されます。
- `kicker` (`string`): タイトル上の小さめの事前ラベル (例: "CONFIDENTIAL")
- `title` (`string`): メインタイトル
- `subtitle` (`string`): サブタイトル（少し薄い色）
- `heroTags` (`string[]`): 下部のリボン状に並ぶタグ（キーワードなど）

### 2. セクションスライド (`section`)
大きなセクションの区切りなどで使用する、スッキリとしたレイアウト。
- `title` (`string`): セクションタイトル
- `subtitle` (`string`): サブタイトル

### 3. アジェンダスライド (`agenda`)
目次や今後の議題を示すスライド。リストが多くなると自動的に2列化します。
- `title` (`string`): ヘッダータイトル
- `lead` (`string`): ヘッダー横のリード・補足文
- `items` (`string[]` または `Array<{title: string, desc: string}>`): 目次アイテムのリスト

### 4. 箇条書き / コンテンツスライド (`bullet`)
リストや付随するポイントカード、数値を表現する汎用スライド。
- `eyebrow` (`string`): ヘッダーのEyebrow部分（小見出し）
- `title` (`string`): ヘッダータイトル
- `lead` (`string`): ヘッダー横のリード文
- `panelLead` (`string`): リストを配置する左側パネル上のリード文
- `bullets` (`string[]`): 箇条書きリストの内容
- `isNumbered` (`boolean`): リストを数字の連番にするかどうか
- `pointCards` (`Array<{label: string, title: string, desc: string}>`): 画面右側に配置されるポイントカードの配列
- `metrics` (`Array<{value: string, label: string}>`): 画面下部に配置される数値ハイライトの配列

### 5. 2カラム比較スライド (`two-column`)
Before/After や Good/Bad など、左右に配置して比較するスライド。
- `eyebrow` (`string`): ヘッダーのEyebrow
- `title` (`string`): ヘッダータイトル
- `lead` (`string`): ヘッダー横のリード文
- `left` / `right` (`object`): 左右それぞれのデータ。以下のプロパティを持ちます。
  - `tag` (`string`): カード上部のラベル
  - `heading` (`string`): カラムのヘッダーテキスト
  - `bodyPoints` (`string[]`): そのカラムの箇条書きポイント
  - `isNumbered` (`boolean`): リストを連番にするかどうか

### 6. テーブルスライド (`table`)
表組みスライド。
- `title` (`string`): ヘッダータイトル
- `lead` (`string`): リード・補足文
- `headers` (`string[]`): 表のヘッダー行文字列の配列
- `rows` (`Array<string[]>`): 各行におけるデータの配列（二次元配列）

### 7. チャートスライド (`chart-placeholder`)
ネイティブのチャート（グラフ）を描画するスライド。右側にインサイト（重要情報）を併記することもできます。
- `eyebrow` (`string`): ヘッダーのEyebrow
- `title` (`string`): ヘッダータイトル
- `lead` (`string`): ヘッダー横のリード文
- `chartType` (`string`): グラフの種類 ("line" | "pie" | "doughnut" | "stacked-bar" | "horizontal-bar")。指定なしの場合は通常の棒グラフ。
- `categories` (`string[]`): グラフのX軸ラベル等のカテゴリ
- `series` (`Array<{name: string, values: number[]}>`): プロットする系列のデータセット
- `insightTag` (`string`): 右側パネル上部のタグ文字
- `insightHighlight` (`string`): 大きくハイライトするインサイト数値など
- `insight` (`string`): インサイトの本文

### 8. ワークフロースライド (`workflow`)
複数のステップに沿ったプロセスを図解するスライド。
- `eyebrow` (`string`): ヘッダーのEyebrow
- `title` (`string`): ヘッダータイトル
- `lead` (`string`): ヘッダー横のリード文
- `steps` (`Array<{title: string, desc: string}>`): 進行ステップごとのデータ。矢印で繋がれて表示されます。

### 9. クロージングスライド (`closing`)
プレゼンテーションの最後に配置するスライド。「ご清聴ありがとうございました」などのメッセージと各種アクションピルを置けます。
- `eyebrow` (`string`): 中央カード上部のEyebrow
- `title` (`string`): メインメッセージ
- `message` / `lead` (`string`): サブメッセージ
- `actions` (`string[]`): アクションを促すピル状ラベルの配列

### 10. フィーチャーカードスライド (`feature-cards`)
3〜4個の特徴を横並びのカードとして表現するスライド。
- `title` (`string`): ヘッダータイトル
- `lead` (`string`): ヘッダー横のリード文
- `cards` (`Array<{iconHint?: string, title: string, description: string}>`): 各カードのデータ文字列。`iconHint` の値の有無に関わらず、現在は "FEATURE" というラベルが表示されます。

---

## 最小実行 JSON ペイロード サンプル

以下は各機能を最小限に含んだ生成用のサンプルのペイロードです。

```json
{
  "documentTitle": "Sample Pitch Deck",
  "theme": {
    "primaryColor": "0F172A",
    "accentColor": "2563EB"
  },
  "slides": [
    {
      "type": "title",
      "kicker": "CONFIDENTIAL DRAFT",
      "title": "A New Generation of Features",
      "subtitle": "Discover our completely revamped architecture.",
      "heroTags": ["Innovation", "Performance", "Security"]
    },
    {
      "type": "bullet",
      "eyebrow": "SUMMARY",
      "title": "Key Capabilities",
      "lead": "The essential things to keep in mind.",
      "bullets": [
        "Highly customizable themes",
        "Fast rendering with hardware acceleration"
      ],
      "pointCards": [
        { "label": "PRO", "title": "Scalable", "desc": "Design for scale." }
      ]
    },
    {
      "type": "closing",
      "eyebrow": "END",
      "title": "Thank You",
      "message": "Let's build something great.",
      "actions": ["Contact Us", "View Demo"]
    }
  ]
}
```
