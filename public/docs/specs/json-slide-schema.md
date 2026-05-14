# JsonSlide スキーマ仕様書 (modern-indigo テーマ)

このドキュメントは、`JsonSlide` システムの `modern-indigo` テーマにおける入力JSONデータの仕様を定めたものです。AI（LLM）がプレゼンテーション構成を生成する際のガイドラインとして機能します。

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
| `id` | string | 任意 | スライドの一意識別子 |
| `layout_type` | string | **必須** | スライドのレイアウトタイプ（エイリアスも可） |
| `content` | object | **必須** | スライド固有のコンテンツデータ |

---

## 2. 共通プロパティ

ほぼすべてのスライドの `content` 内で使用可能な共通プロパティです。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドの見出しタイトル |
| `annotations` | array | ○ | ページ下部に表示される注釈（脚注）の配列 |

---

## 3. スライドタイプ選択ガイド（使い分け）

似た構造を持つスライドについては、以下の基準で最適なものを選択してください。

| 比較対象 | 選択の基準 |
| :--- | :--- |
| **Roadmap** vs **Timeline** | 未来の計画、フェーズ、日付重視のマイルストーンは `roadmap`。過去の履歴、単純な出来事の羅列は `timeline`。 |
| **MultiPoint** vs **Content** | 3〜6個の独立した要点を構造的に見せる（アイコンや小見出し付き）場合は `multi_point`。一般的な文章は `content`。 |
| **StrategicPillar** vs **MultiPoint** | 「3つの柱」が「共通の土台」を支えるという戦略的・構造的な概念を示す場合は `strategic_pillar`。 |
| **ExecutiveSummary** vs **Split** | 現状（課題）と提言という文脈で対比させる場合は `executive_summary`。単純な2要素の比較は `split`。 |
| **DataInsight** vs **Chart** | グラフから得られる特定の「インサイト（洞察）」を言葉で強く強調したい場合は `data_insight`。グラフ自体が主役なら `chart`。 |

---

## 4. スライドタイプ別仕様

### 4.1. 表紙・アジェンダ

#### タイトルスライド (`title_slide` / `title`)
プレゼンテーションの表紙。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | メインタイトル |
| `subtitle` | string | ○ | サブタイトル |
| `eyebrow` | string | ○ | タイトルの上の小さなラベル |
| `logo_text` | string | ○ | 左上のロゴ用テキスト（デフォルト: "PRESENTATION"） |
| `author` | string | ○ | 発表者名 |
| `date` | string | × | 日付テキスト（例: "2024.05.14"） |
| `tags` | array | ○ | カテゴリ等を示すチップの文字列配列 |

#### アジェンダ (`agenda_slide` / `agenda`)
目次スライド。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドタイトル（デフォルト: "Agenda"） |
| `lead_text` | string | ○ | 導入文 |
| `items` | array | ○ | 目次項目の配列。各要素は `{title, description}`。 |
| `layout_variation`| string | × | `"one-column"` (1列) \| `"two-column"` (2列。5項目以上で自動適用) |

- **項目 (`items`) の詳細**:
    - `title`: 項目の見出し（エイリアス: `label`）
    - `description`: 補足説明（エイリアス: `subtitle`, `text`）

---

### 4.2. テキスト・構造化コンテンツ

#### コンテンツスライド (`content_slide` / `content`)
標準的なテキストベースのスライド。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドタイトル |
| `key_message` | string | ○ | 強調メッセージ（ボックス表示） |
| `body_text` | string | ○ | 本文（Markdown可能） |
| `layout_variation` | string | × | `"one-column"` (1カラム。幅90%に最適化) \| `"two-column"` (2カラム) |

#### マルチポイント (`multi_point_slide` / `multi_point`)
重要事項をグリッド形式で構造化して表示。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドタイトル |
| `subtitle` | string | ○ | 補足タイトル |
| `items` | array | ○ | `{icon, heading, text}` の配列（推奨3〜6個） |

#### 戦略ピラー (`strategic_pillar_slide` / `strategic_pillar`)
戦略の3つの柱と、それを支える土台を表現。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドタイトル |
| `pillars` | array | ○ | `{heading, text}` の配列（最大3個まで表示） |
| `foundation` | string | ○ | 土台部分に表示する共通概念・基盤（デフォルト: "Unified Foundation"） |

#### エグゼクティブサマリー (`executive_summary_slide` / `executive_summary`)
現状分析と提言をまとめた、意思決定者向けスライド。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドタイトル |
| `summary_left` | object | ○ | 左側（現状・課題）: `{title, text}` |
| `summary_right` | object | ○ | 右側（提言・結論）: `{title, items}` (itemsはstring配列) |

---

### 4.3. 分析・データ・比較

#### データインサイト (`data_insight_slide` / `data_insight`)
データビジュアライゼーションと、それに対する深い洞察。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドタイトル |
| `insight_title` | string | ○ | インサイトの見出し（デフォルト: "Key Insight"） |
| `insight_text` | string | ○ | 分析結果から導き出された具体的な洞察 |

#### チャートスライド (`chart_slide` / `chart`)
グラフを主役としたスライド。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドタイトル |
| `chart_type` | string | × | `"bar"`, `"line"`, `"area"`, `"pie"`, `"doughnut"` |
| `data` | array | × | データオブジェクトの配列。各要素は `{label, value, color}`。 |
| `key_message` | string | ○ | グラフの要点（強調表示） |
| `body_text` | string | ○ | 補足説明 |
| `layout_variation`| string | × | `"bottom-desc"` (下部に説明) \| `"left-desc"` / `"two-column"` (左側に説明) |

- **データ (`data`) の詳細**:
    - `label`: 項目名（エイリアス: `name`）
    - `value`: 数値
    - `color`: 任意の色指定（テーマカラーを優先する場合は省略可）

#### マトリックス分析 (`matrix_slide` / `matrix`)
2x2の象限による分析。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドタイトル |
| `quadrants` | array | ○ | 象限データの配列（**必ず以下のインデックス順で指定**） |
| `x_label` | string | × | X軸ラベル（例: "重要度"） |
| `y_label` | string | × | Y軸ラベル（例: "緊急度"） |

- **象限 (`quadrants`) の順序定義**:
    - `[0]`: **右上 (Top-Right)** - 最重要・ハイライトされる象限
    - `[1]`: **左上 (Top-Left)**
    - `[2]`: **左下 (Bottom-Left)**
    - `[3]`: **右下 (Bottom-Right)**
- **各要素の構造**: `{label, text}`

#### 比較スライド (`split_slide` / `split`)
左右の対比。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドタイトル |
| `left_title` | string | ○ | 左側のタイトル（エイリアス: `left_label`） |
| `left_text` | string | ○ | 左側の本文（エイリアス: `left_body`） |
| `right_title` | string | ○ | 右側のタイトル（エイリアス: `right_label`） |
| `right_text` | string | ○ | 右側の本文（エイリアス: `right_body`） |
| `comparison_icon`| string | ○ | 中央のアイコンテキスト（デフォルト: "VS"） |

---

### 4.4. 時系列・実績

#### ロードマップ (`roadmap_slide` / `roadmap`)
水平な時間軸に沿ったマイルストーン。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドタイトル |
| `steps` | array | ○ | `{date, label, description}` の配列 |

#### タイムライン (`timeline_slide` / `timeline`)
一連の出来事やプロセスの順序。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドタイトル |
| `events` | array | ○ | イベントオブジェクトの配列（エイリアス: `items`） |
| `layout_variation`| string | × | `"vertical"` (垂直・デフォルト) \| `"horizontal"` (水平) |

- **イベント (`events`) の詳細**:
    - `label`: 日付・時期（エイリアス: `date`, `year`, `step`）
    - `title`: イベントの見出し（エイリアス: `label`）
    - `description`: 詳細内容

#### プロセスフロー (`process_flow_slide` / `process_flow`)
手順のステップ。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドタイトル |
| `steps` | array | ○ | ステップオブジェクトの配列（エイリアス: `process_steps`, `items`） |
| `body_text` | string | ○ | 導入文・コンテキスト分析 |
| `key_message` | string | ○ | フローの要点・結論 |

- **ステップ (`steps`) の詳細**:
    - `title`: ステップ名（エイリアス: `label`）
    - `description`: 具体的な内容（エイリアス: `text`）

#### 実績ハイライト (`stats_slide` / `stats`)
大きな数値による定量的実績。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドタイトル |
| `stats` | array | × | `{value, unit, label, description}` の配列 |
| `body_text` | string | ○ | 全体の総括（エイリアス: `description`） |
| `layout_variation`| string | × | `"default"` (縦積み) \| `"two-column"` (左に総括、右に指標) |

#### KPIダッシュボード (`kpi_dashboard_slide` / `kpi_dashboard`)
複数の重要指標の俯瞰。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドタイトル |
| `summary_kpis` | array | × | 主要KPI配列（最上段に大きく表示） |
| `detail_kpis` | array | × | 詳細KPI配列（グリッド表示） |
| `kpis` | array | × | フォールバック（summary/detailがない場合に使用） |
| `body_text` | string | ○ | 結論・インサイト |

- **KPIオブジェクトの詳細**:
    - `label`: 指標名
    - `value`: 数値（単位込みの文字列）
    - `change`: 変化率（例: "+15.2%"）
    - `trend`: `"up"` (上昇) \| `"down"` (下落) \| `"flat"`
    - `status`: `"good"` (緑) \| `"warning"` (黄) \| `"bad"` (赤)

---

### 4.5. 特殊レイアウト

#### 引用 (`quote_slide` / `quote`)
| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `quote` | string | ○ | 引用文 |
| `author` | string | ○ | 発言者 |
| `role` | string | ○ | 発言者の肩書き |

#### セクション区切り (`section_slide` / `section`)
| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | セクションタイトル |
| `subtitle` | string | ○ | サブタイトル（エイリアス: `section_number`） |

#### プロフィール (`profile_slide` / `profile`)
| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドタイトル |
| `name` | string | ○ | 氏名 |
| `role` | string | ○ | 役職・肩書き |
| `bio` | string | ○ | 経歴・紹介文 |
| `image_url` | string | × | プロフィール写真URL |
| `highlights` | array | ○ | 主な実績・スキル（string配列） |

#### 画像コンテンツ (`image_content_slide` / `image_content`)
| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドタイトル |
| `image_url` | string | × | 画像URL |
| `image_caption` | string | ○ | キャプション |
| `key_message` | string | ○ | 強調メッセージ |
| `body_text` | string | ○ | 補足説明 |
| `bullet_points` | array | ○ | 箇条書き（string配列） |
| `layout_variation`| string | × | `"image-left"` \| `"image-right"` |

#### テーブル (`table_slide` / `table`)
| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | ○ | スライドタイトル |
| `headers` | array | ○ | ヘッダーセルの配列 |
| `rows` | array | ○ | 行データの配列（セルの配列の配列） |
| `description` | string | ○ | 表の補足説明 |
| `layout_variation`| string | × | `"default"` (縦積み) \| `"two-column"` (左に説明、右に表) |

---

## 5. 特記事項

### Markdown サポート
Markdown（`○` の付いたフィールド）では、太字、リスト、リンク等の標準的な記法が利用可能です。

### 自動調整機能
項目数やテキスト量に応じて、レイアウトやフォントサイズが最適化されます。ただし、視認性を保つため、1枚のスライドに情報を詰め込みすぎないことを推奨します（例：`multi_point` は6項目以内）。

### フィールドの柔軟性（エイリアス）
本テーマでは、AIの生成結果に柔軟に対応するため、多くのフィールドで複数のキー名を許容しています。可能な限りドキュメント記載の標準的な名前を使用してください。
