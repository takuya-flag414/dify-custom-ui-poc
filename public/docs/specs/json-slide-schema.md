# JsonSlide スキーマ仕様書 (modern-indigo テーマ)

このドキュメントは、`JsonSlide` システムの `modern-indigo` テーマにおける入力JSONデータの仕様を定めたものです。

## 1. 基本構造 (Root Object)

プレゼンテーション全体のデータは、以下のルートオブジェクトで構成されます。

| フィールド | 型 | 必須 | 説明 |
| :--- | :--- | :--- | :--- |
| `presentation_title` | string | 任意 | プレゼンテーション全体のタイトル |
| `theme` | string | 任意 | 使用するテーマID（`modern-indigo` を指定） |
| `slides` | array | **必須** | スライドオブジェクトの配列 |

### スライドオブジェクト

`slides` 配列の各要素は、以下の構造を持ちます。

| フィールド | 型 | 必須 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | string | 任意 | スライドの一意識別子（省略時は自動生成） |
| `layout_type` | string | **必須** | スライドのレイアウトタイプ（後述のエイリアスも可） |
| `content` | object | **必須** | スライド固有のコンテンツデータ |

---

## 2. 共通プロパティ

ほぼすべてのスライドの `content` 内で使用可能な共通プロパティです。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドの見出しタイトル |
| `annotations` | array | ○ | ページ下部に表示される注釈（脚注）の配列 |

---

## 3. スライドタイプ別仕様

各スライドタイプごとの `content` スキーマ詳細です。

### 3.1. タイトルスライド (`title_slide` / `title`)
プレゼンテーションの表紙。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | メインタイトル |
| `subtitle` | string | ○ | サブタイトル |
| `eyebrow` | string | ○ | タイトルの上に表示されるラベル |
| `logo_text` | string | ○ | 左上に表示されるロゴ用テキスト（デフォルト: "PRESENTATION"） |
| `author` | string | ○ | 発表者名 |
| `date` | string | × | 日付テキスト |
| `tags` | array | ○ | カテゴリ等を示すチップの配列 |

### 3.2. コンテンツスライド (`content_slide` / `content`)
標準的なテキストベースのスライド。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `key_message` | string | ○ | 強調したいメッセージ（ボックス内に表示） |
| `body_text` | string | ○ | メインの本文（Markdown形式で記述可能） |
| `layout_variation` | string | × | `"one-column"` または `"two-column"` (自動カラム化) |

### 3.3. 比較スライド (`split_slide` / `split`)
左右のセクションを対比させるレイアウト。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `left_title` | string | ○ | 左側のタイトル（エイリアス: `left_label`） |
| `left_text` | string | ○ | 左側の本文（エイリアス: `left_body`） |
| `right_title` | string | ○ | 右側のタイトル（エイリアス: `right_label`） |
| `right_text` | string | ○ | 右側の本文（エイリアス: `right_body`） |
| `comparison_icon`| string | ○ | 中央の円内に表示する文字（デフォルト: "VS"） |

### 3.4. チャートスライド (`chart_slide` / `chart`)
グラフを表示するスライド。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `chart_type` | string | × | `"bar"`, `"line"`, `"area"`, `"pie"` |
| `data` | array | × | グラフデータ (`{label, value, color}` の配列) |
| `key_message` | string | ○ | グラフの要点 |
| `body_text` | string | ○ | 補足説明 |
| `layout_variation`| string | × | `"bottom-desc"` (下部説明) または `"two-column"` (左右並列) |

### 3.5. テーブルスライド (`table_slide` / `table`)
一覧表を表示するスライド。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `headers` | array | ○ | ヘッダーセルの配列（最大8列） |
| `rows` | array | ○ | 行データの配列（各行はセルの配列、最大12行） |
| `description` | string | ○ | 表の補足説明 |
| `layout_variation`| string | × | `"default"` または `"two-column"` |

### 3.6. 実績ハイライト (`stats_slide` / `stats`)
大きな数字を強調するスライド。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `stats` | array | × | 実績項目の配列 (`{value, unit, label, description}` の配列) |
| `body_text` | string | ○ | 全体の分析コメント（エイリアス: `description`） |
| `layout_variation`| string | × | `"default"` または `"two-column"` |

### 3.7. プロセスフロー (`process_flow_slide` / `process_flow`)
手順やフローを表示するスライド。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `steps` | array | ○ | ステップの配列 (`{title, description}` の配列。エイリアス: `process_steps`, `items`) |
| `key_message` | string | ○ | インサイト（下部に表示。エイリアス: `body_text`） |

### 3.8. タイムライン (`timeline_slide` / `timeline`)
時系列やロードマップを表示するスライド。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `events` | array | ○ | イベントの配列 (`{label, title, description}` の配列。エイリアス: `items`) |
| `layout_variation`| string | × | `"vertical"` (垂直) または `"horizontal"` (水平) |

### 3.10. KPIダッシュボード (`kpi_dashboard_slide` / `kpi_dashboard`)
複数の重要指標を表示するスライド。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `summary_kpis` | array | × | 上段に表示する主要KPIの配列 |
| `detail_kpis` | array | × | 中段に表示する詳細KPIの配列 |
| `body_text` | string | ○ | インサイトコメント |

> **KPI項目オブジェクト**: `{label, value, unit, change, trend}`
> - `trend`: `"up"` (上昇/緑), `"down"` (下降/橙), `"flat"` (変化なし/灰)

### 3.11. アジェンダ (`agenda_slide` / `agenda`)
目次スライド。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `lead_text` | string | ○ | リード文 |
| `items` | array | ○ | 目次項目の配列 (`{label, description}` の配列) |

> 項目が5件以上の場合、自動的に2カラムレイアウトに切り替わります。

### 3.12. その他 (CommonSlides)
- **引用 (`quote_slide` / `quote`)**: `quote`, `author`, `role`
- **セクション区切り (`section_slide` / `section`)**: `title`, `subtitle`, `section_number`
- **プロフィール (`profile_slide` / `profile`)**: `name`, `role`, `bio`, `image_url`, `highlights` (array)
- **画像コンテンツ (`image_content_slide` / `image_content`)**: `image_url`, `image_caption`, `key_message`, `body_text`, `layout_variation` (`"image-left" | "image-right"`)

---

## 4. 特記事項

### Markdown サポート
Markdown（`○` の付いたフィールド）では、以下の要素が利用可能です。
- 太字 (`**bold**`), 斜体 (`*italic*`)
- リンク (`[text](url)`)
- リスト (`- item`)
- インラインコード (`` `code` ``)
- 強調表現（一部のテーマで装飾される場合があります）

### 自動スケーリング
`modern-indigo` テーマでは、テキスト量や項目数に応じてフォントサイズや余白が自動調整（スケーリング）されます。極端にデータ量が多い場合、読みやすさを維持するために自動的に縮小されますが、適切な範囲（例：テーブル12行以内）での入力を推奨します。
