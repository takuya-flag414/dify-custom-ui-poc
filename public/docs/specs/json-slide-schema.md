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
| `date` | string | × | 日付テキスト |
| `tags` | array | ○ | カテゴリ等を示すチップの配列 |

#### アジェンダ (`agenda_slide` / `agenda`)
目次スライド。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `lead_text` | string | ○ | 導入文 |
| `items` | array | ○ | 目次項目 `{label, description}` の配列 |

---

### 4.2. テキスト・構造化コンテンツ

#### コンテンツスライド (`content_slide` / `content`)
標準的なテキストベースのスライド。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `key_message` | string | ○ | 強調メッセージ（ボックス表示） |
| `body_text` | string | ○ | 本文（Markdown可能） |
| `layout_variation` | string | × | `"one-column"` \| `"two-column"` |

#### マルチポイント (`multi_point_slide` / `multi_point`)
重要事項をグリッド形式で構造化して表示。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `subtitle` | string | ○ | 補足タイトル |
| `items` | array | ○ | `{icon, heading, text}` の配列（推奨3〜6個） |

#### 戦略ピラー (`strategic_pillar_slide` / `strategic_pillar`)
戦略の3つの柱と、それを支える土台を表現。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `pillars` | array | ○ | `{heading, text}` の配列（最大3個） |
| `foundation` | string | ○ | 土台部分に表示する共通概念・基盤 |

#### エグゼクティブサマリー (`executive_summary_slide` / `executive_summary`)
現状分析と提言をまとめた、意思決定者向けスライド。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `summary_left` | object | ○ | 左側（現状・課題）: `{title, text}` |
| `summary_right` | object | ○ | 右側（提言・結論）: `{title, items}` (itemsはstring配列) |

---

### 4.3. 分析・データ・比較

#### データインサイト (`data_insight_slide` / `data_insight`)
データビジュアライゼーションと、それに対する深い洞察。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `insight_title` | string | ○ | インサイトの見出し（デフォルト: "Key Insight"） |
| `insight_text` | string | ○ | 分析結果から導き出された具体的な洞察 |

#### チャートスライド (`chart_slide` / `chart`)
グラフを主役としたスライド。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `chart_type` | string | × | `"bar"`, `"line"`, `"area"`, `"pie"` |
| `data` | array | × | `{label, value, color}` の配列 |
| `key_message` | string | ○ | グラフの要点 |
| `body_text` | string | ○ | 補足説明 |

#### マトリックス分析 (`matrix_slide` / `matrix`)
2x2の象限による分析。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `quadrants` | array | ○ | `{label, text}` の配列（最大4個。右上から時計回りに1-4） |
| `x_label` | string | × | X軸ラベル（例: "重要度"） |
| `y_label` | string | × | Y軸ラベル（例: "緊急度"） |

#### 比較スライド (`split_slide` / `split`)
左右の対比。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
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
| `steps` | array | ○ | `{date, label, description}` の配列 |

#### タイムライン (`timeline_slide` / `timeline`)
一連の出来事やプロセスの順序。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `events` | array | ○ | `{label, title, description}` の配列 |
| `layout_variation`| string | × | `"vertical"` \| `"horizontal"` |

#### プロセスフロー (`process_flow_slide` / `process_flow`)
手順のステップ。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `steps` | array | ○ | `{title, description}` の配列（エイリアス: `process_steps`） |
| `key_message` | string | ○ | フローの要点・注意点 |

#### 実績ハイライト (`stats_slide` / `stats`)
大きな数値による定量的実績。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `stats` | array | × | `{value, unit, label, description}` の配列 |
| `body_text` | string | ○ | 全体の総括コメント |

#### KPIダッシュボード (`kpi_dashboard_slide` / `kpi_dashboard`)
複数の重要指標の俯瞰。

| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `summary_kpis` | array | × | 主要KPI配列 |
| `detail_kpis` | array | × | 詳細KPI配列 |
| `body_text` | string | ○ | 総評 |

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
| `subtitle` | string | ○ | サブタイトル |
| `section_number`| string | ○ | セクション番号 |

#### プロフィール (`profile_slide` / `profile`)
| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `name` | string | ○ | 氏名 |
| `role` | string | ○ | 役職・肩書き |
| `bio` | string | ○ | 経歴・紹介文 |
| `image_url` | string | × | プロフィール写真URL |
| `highlights` | array | ○ | 主な実績・スキル（string配列） |

#### 画像コンテンツ (`image_content_slide` / `image_content`)
| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `image_url` | string | × | 画像URL |
| `image_caption` | string | ○ | キャプション |
| `key_message` | string | ○ | 強調メッセージ |
| `body_text` | string | ○ | 補足説明 |
| `bullet_points` | array | ○ | 箇条書き（string配列） |
| `layout_variation`| string | × | `"image-left"` \| `"image-right"` |

#### テーブル (`table_slide` / `table`)
| フィールド | 型 | Markdown | 説明 |
| :--- | :--- | :--- | :--- |
| `headers` | array | ○ | ヘッダーセルの配列 |
| `rows` | array | ○ | 行データの配列（セルの配列の配列） |
| `description` | string | ○ | 表の補足説明 |

---

## 5. 特記事項

### Markdown サポート
Markdown（`○` の付いたフィールド）では、太字、リスト、リンク等の標準的な記法が利用可能です。

### 自動調整機能
項目数やテキスト量に応じて、レイアウトやフォントサイズが最適化されます。ただし、視認性を保つため、1枚のスライドに情報を詰め込みすぎないことを推奨します（例：`multi_point` は6項目以内）。
