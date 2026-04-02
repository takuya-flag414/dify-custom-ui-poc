# HTML Artifact 生成ガイドブック（プレゼンテーションスライド用）v1.0

本ドキュメントは、Dify カスタム UI において高品質な HTML Artifact（プレゼンテーションスライド）を生成するための技術仕様およびデザイン指針を定義する。  
LLM および実装者は本ガイドに従い、プレビュー整合性・スライド境界安定性・視覚的品位・分割後ランタイムの描画安定性を担保すること。

---

## 1. 基本方針

- HTML は `<!DOCTYPE html>` を含む完全な文書として生成すること
- 各スライドは独立した `<div class="slide">` で表現すること
- 最終スライド以外の `.slide` には、必ずインラインで `style="page-break-after: always;"` を付与すること
- スライドの美しさより、**1枚への収容安全性・表示崩壊防止・分割後ランタイムの描画完了性**を優先すること
- 各スライドは固定キャンバスである。コンテンツがはみ出すくらいなら、スライドを分割すること

---

## 2. 基本構造 (Document Structure)

### 2.1 必須骨格

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>スライドタイトル</title>

  <style>
    /* CSS はすべてここに記述 */
  </style>

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <script>
    function initInteractiveElements() {
      if (typeof Chart === 'undefined') {
        requestAnimationFrame(initInteractiveElements);
        return;
      }

      let pending = false;

      document.querySelectorAll('canvas[data-chart-role]').forEach(function(canvas) {
        if (canvas.__chartInitialized) return;

        const role = canvas.getAttribute('data-chart-role');
        if (!role) return;

        canvas.__chartInitialized = true;

        if (role === 'example-chart') {
          new Chart(canvas, {
            type: 'bar',
            data: {
              labels: ['A', 'B', 'C'],
              datasets: [{
                label: 'データ',
                data: [10, 20, 30],
                backgroundColor: 'rgba(99,102,241,0.7)'
              }]
            },
            options: {
              responsive: true,
              animation: false
            }
          });
        }
      });

      document.querySelectorAll('canvas[data-chart-role]').forEach(function(canvas) {
        if (!canvas.__chartInitialized) pending = true;
      });

      if (pending) requestAnimationFrame(initInteractiveElements);
    }

    initInteractiveElements();
  </script>
</head>
<body>
  <div class="slide slide-title" style="page-break-after: always;">
    <div class="slide-body">
      <!-- スライド1：タイトルスライド -->
    </div>
  </div>

  <div class="slide slide-content" style="page-break-after: always;">
    <div class="slide-body">
      <!-- スライド2：コンテンツスライド -->
    </div>
    <div class="slide-number">2</div>
  </div>

  <div class="slide slide-content">
    <div class="slide-body">
      <!-- 最終スライド -->
    </div>
    <div class="slide-number">3</div>
  </div>

  <script>
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        window.parent.postMessage({
          type: 'artifact-resize',
          height: document.documentElement.scrollHeight
        }, '*');
      });
      ro.observe(document.body);
    }
  </script>
</body>
</html>
```

### 2.2 スライド本文ラッパー

- 通常フローの本文は、必ず `.slide-body` でラップすること
- `.slide-body` はスライドのコンテンツ領域であり、スライド番号等の絶対配置要素はその外に置くこと
- `.slide-body` の外側に出した絶対配置要素は、`.slide` の `position: relative` を基準とする

### 2.3 最低限の配置原則

- `.slide` はスライド枠（固定キャンバス）である
- `.slide-body` はコンテンツ領域である
- 絶対配置要素はコンテンツレイアウトと独立して配置する
- コンテンツは `.slide` の境界からはみ出してはならない

---

## 3. スライド分割と表示同期 (Pagination & Sync)

### 3.1 改ページルール

フロントエンドの `splitArtifactPages` は、インライン `style` の `page-break-after` を見てスライド分割を行う。  
そのため、改ページ指定を CSS クラスへ逃がしてはならない。

- すべての `.slide` 要素（最終スライドを除く）に `style="page-break-after: always;"` を直接付与すること
- 最終スライドには `page-break-after` を付与しないこと
- 末尾 `<script>` は本文直後に置き、余分な白紙スライドを防ぐこと

### 3.2 分割判断の原則

- 分割判断はスライド枚数目標ではなく、**各スライドの収容安全性**を最優先とする
- コンテンツが `.slide` の高さ（540px）を超えそうな場合は、迷わず次のスライドに分割すること
- 1スライドへ詰め込むために文字を小さくしたり行間を詰めたりしてはならない

### 3.3 分割後ランタイムの前提

ページ分割後の各スライドは、独立した描画単位として扱われる場合がある。  
したがって、HTML 内のスクリプトは「文書全体の全スライドが同時に存在する」前提で実装してはならない。

- 各スライドは独立 DOM として扱われうる
- 他スライドにある要素の存在を前提とした初期化を禁止する
- チャート、Mermaid、KaTeX 等の初期化は、当該スライド内に存在する要素のみを対象とする
- `if (!a || !b || !c) return;` のような全要素同時存在前提のガードを禁止する
- インタラクティブ要素は、要素ごとの独立初期化を原則とする

---

## 4. スタイリング仕様 (CSS Specifications)

### 4.1 スライド寸法と表示精度

スライドサイズは画面表示においては **960px × 540px（16:9）** を基準とするが、印刷・PDF化を考慮した表示安定化のため、物理サイズを基準とする。  
フロントエンドは `isHtmlSlide` 判定時に basePaperWidth = 1020、minHeight = 540 でiframe を描画する。  
`@page { size: 10in 5.625in; margin: 0; }` は省略禁止とする。

### 4.2 固定CSS（必須）

以下の CSS ブロックは固定仕様である。改変禁止。

```css
@page { size: 10in 5.625in; margin: 0; }

:root {
  --slide-width: 960px;
  --slide-height: 540px;

  --font-body: "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
  --font-heading: "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
  --font-mono: "Courier New", "Osaka-Mono", monospace;

  --text-base: 18px;
  --text-sm: 14px;
  --text-lg: 22px;
  --text-h1: 48px;
  --text-h2: 32px;
  --text-h3: 22px;
  --text-eyebrow: 12px;
}

html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: transparent;
}

body {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.5;
  letter-spacing: 0.02em;
  color: var(--color-body);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.slide {
  width: var(--slide-width);
  height: var(--slide-height);
  margin: 0 auto;
  background: var(--color-slide-bg);
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
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

@media print {
  html, body {
    background: none;
    display: block;
    overflow: visible;
  }
  .slide {
    margin: 0;
    box-shadow: none;
    width: 960px;
    height: 540px;
    page-break-inside: avoid;
  }
}
```

### 4.2.1 スライド外形の不変条件（最重要）

このHTMLは画面表示においては「1スライド = 960px × 540px の固定16:9キャンバス」である（※ただし印刷時 `@media print` は用紙サイズに合わせて物理サイズで拡張される）。`.slide` はスライドそのものの外形であり、常に四角い固定矩形を維持しなければならない。

- `.slide` に対して、`border-radius`、太い `border`、過度な `box-shadow`、`outline`、`filter`、`transform`、`clip-path`、`mask` など、スライド外形をカード風・ポスター風・額縁風に見せる装飾を適用してはならない。
- `.slide-body` もスライド本文領域の基盤であり、角丸化、可変高さ化、`overflow: visible / auto`、外周装飾の追加を禁止する。
- 装飾はスライド**内部の要素**に対してのみ許可される。

### 4.3 スライド種別クラス

各スライドの性質に応じて、`.slide` に以下のクラスを1つ付与すること。

| クラス | 用途 | 対応するドキュメント概念 |
|---|---|---|
| `.slide-title` | タイトルスライド（表紙） | `cover` 表紙パターン |
| `.slide-section` | セクション区切りスライド | `decorated-page` に相当 |
| `.slide-content` | 標準コンテンツスライド | 通常ページ |
| `.slide-two-col` | 2カラムレイアウトスライド | 通常ページ（横並びコンテンツ） |
| `.slide-chart` | グラフ中心スライド | グラフ専用ページ |
| `.slide-closing` | クロージングスライド（末尾） | 末尾ページ |

### 4.4 タイポグラフィ

```css
h1 {
  font-family: var(--font-heading);
  font-size: var(--text-h1);
  line-height: 1.2;
  color: var(--color-heading);
  margin: 0 0 16px 0;
  font-weight: 700;
}

h2 {
  font-family: var(--font-heading);
  font-size: var(--text-h2);
  line-height: 1.25;
  color: var(--color-heading);
  margin: 0 0 12px 0;
  font-weight: 700;
}

h3 {
  font-family: var(--font-heading);
  font-size: var(--text-h3);
  line-height: 1.3;
  color: var(--color-heading);
  margin: 0 0 8px 0;
  font-weight: 600;
}

p {
  margin: 0 0 10px 0;
  text-indent: 0;
  line-height: 1.5;
  font-size: var(--text-base);
}

.eyebrow {
  font-size: var(--text-eyebrow);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: 8px;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  font-size: var(--text-sm);
}

th, td {
  border: 1px solid var(--color-border);
  padding: 7px 12px;
  vertical-align: middle;
}

th {
  background: var(--color-bg-accent);
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--color-heading);
  font-size: var(--text-sm);
}

.caption {
  text-align: center;
  font-size: 11px;
  color: var(--color-muted);
  font-family: var(--font-body);
  margin-top: 6px;
}
```

### 4.5 リストスタイル

スライドにおけるリストは**読み上げ式ではなく視覚的スキャン**を前提とする。  
1スライドあたりの箇条書きは原則7項目以内とする。

```css
ul {
  margin: 0 0 10px 0;
  padding-left: 20px;
  list-style-type: disc;
}

ul li, ol li {
  margin-bottom: 8px;
  line-height: 1.45;
  font-size: var(--text-base);
}

ol {
  margin: 0 0 10px 0;
  padding-left: 22px;
  list-style-type: decimal;
}

ul ul, ol ol {
  margin: 4px 0 4px 14px;
  font-size: var(--text-sm);
}
```

### 4.6 スライド番号（フッター）

タイトルスライド（`.slide-title`）にはスライド番号を付けない。  
コンテンツスライドにはスライド番号を絶対配置する。

```css
.slide-number {
  position: absolute;
  right: 32px;
  bottom: 14px;
  font-family: var(--font-heading);
  font-size: 11px;
  color: var(--color-muted);
  letter-spacing: 0.05em;
}
```

### 4.7 CSS禁止事項

以下はすべて禁止とする。

- `html, body` への `background` / `background-color` 指定
- `html, body` への独自 `margin` / `padding` 指定
- `.slide` への `min-height` 指定（高さは固定）
- `.slide` への `overflow: visible` / `overflow: auto` 指定（はみ出し防止のため）
- 固定CSSのデザイン目的の改変
- `text-indent` による段落インデント（スライドでは不要）
- フォントサイズを `10px` 以下に下げること

---

## 5. カラーモード (Color Mode)

スライドは**カラーがデフォルト**である。モノクロは明示指定時のみ使用する。

### 5.1 カラーパレット（デフォルト）

```css
:root {
  --color-primary: #6366f1;
  --color-accent: #f59e0b;
  --color-heading: #0f172a;
  --color-body: #1e293b;
  --color-muted: #94a3b8;
  --color-border: #e2e8f0;
  --color-rule: #6366f1;
  --color-bg-accent: #f1f5f9;
  --color-slide-bg: #ffffff;
  --color-cover-bg: #0f172a;
}
```

### 5.2 モノクロパレット

```css
:root {
  --color-primary: #000000;
  --color-accent: #333333;
  --color-heading: #000000;
  --color-body: #111111;
  --color-muted: #666666;
  --color-border: #cccccc;
  --color-rule: #000000;
  --color-bg-accent: #f0f0f0;
  --color-slide-bg: #ffffff;
  --color-cover-bg: #1a1a1a;
}
```

### 5.3 モード選択基準

- カラー：社外向けプレゼン、営業提案、製品紹介、研究発表（デフォルト）
- モノクロ：社内向け簡易報告、議会・行政向け資料、ユーザーが「モノクロで」と明示した場合
- ユーザーが「〜カラーで」「〜テーマで」と明示した場合はユーザー指示を優先する

---

## 6. スライド分類 (Slide Classification)

HTML Artifact 生成前に、スライド全体のテーマとスライドの種別を判定する。

### 6.1 `slide_theme`（全体テーマ）

全体で1つ選択する。

| テーマ値 | 用途 | 色調 |
|---|---|---|
| `DARK_NAVY` | 社内重要報告、一般デフォルト | ダークネイビー表紙 |
| `MODERN` | 社外提案書、製品紹介 | ビビッドアクセント |
| `CORPORATE` | IR資料、年次報告 | 落ち着いたブルー系 |
| `ACADEMIC` | 研究発表、学術報告 | ホワイト基調、ミニマル |
| `MINIMAL` | エグゼクティブ向け、シンプル指示時 | 余白重視、装飾最小 |

### 6.2 `slide_type`（スライド種別）

各スライドに1つ記録する。`.slide` クラスとの対応は §4.3 を参照。

- `title`：タイトルスライド（1枚目）
- `agenda`：アジェンダ・目次スライド
- `section`：セクション区切り
- `content`：標準コンテンツ
- `two-col`：2カラムコンテンツ
- `chart`：グラフ中心
- `table`：表中心
- `closing`：クロージング・Thank You

### 6.3 thinking への記録

thinking フィールド冒頭に、必ず以下のように記録すること。

```text
slide_theme: MODERN
slides:
  1: title
  2: agenda
  3: content
  4: chart
  5: closing
```

---

## 7. スライド容量計算ルール (Capacity Rules)

### 7.1 基本原則

スライドは **高さ540px固定のキャンバス**である。コンテンツはこの境界内に収まらなければならない。  
行数ではなく**要素の実高さの合計**を基準に判断すること。

### 7.2 コンテンツ別高さ目安

| 要素 | 高さ目安 | 備考 |
|---|---|---|
| スライドタイトル（h2） | 45〜55px | padding含む |
| 本文1行（18px） | 28〜32px | line-height 1.5 |
| 箇条書き1項目 | 34〜38px | margin含む |
| 表（1ヘッダ＋Nrow） | 34 + 34×N px | td padding 7px |
| Chart.js canvas | 180〜220px | max-height指定による |
| 見出しエリア（eyebrow+h2） | 80〜90px | margin含む |
| スライドパディング合計 | 80〜100px | 上下padding 40〜50px |

### 7.3 収容安全基準

コンテンツの合計高さが **440px** を超えそうな場合は分割すること（540px - 安全余白100px）。

- 箇条書き：1スライドあたり **7項目まで**を推奨、10項目を超えてはならない
- 表：1スライドあたり **1本まで**。行数は7行まで推奨
- グラフ：1スライドあたり **1点まで**。グラフと表の同居は禁止
- テキスト段落：1スライドあたり **3段落まで**

### 7.4 スライドタイプ別推奨枚数

| コンテンツ量 | 推奨枚数 | 通常上限 |
|---|---|---|
| 簡単な説明・概要 | 3〜5枚 | 8枚 |
| 通常のプレゼン | 8〜15枚 | 20枚 |
| 詳細な分析・報告 | 15〜25枚 | 30枚 |

---

## 8. タイトルスライドパターン (Title Slide Patterns)

### 8.1 優先順位

1. ユーザー明示指定
2. `slide_theme` による自動選択
3. 非該当時は `DARK_NAVY`

### 8.2 ユーザー明示指定ルール

- 「ダークテーマ」「ネイビー」→ `DARK_NAVY`
- 「モダンな」「スタイリッシュな」→ `MODERN`
- 「コーポレートスタイル」→ `CORPORATE`
- 「学術論文風」「シンプル」→ `ACADEMIC`
- 「ミニマル」「余白重視」→ `MINIMAL`

### 8.3 DARK_NAVY タイトルスライド

```css
.slide-title.theme-dark-navy {
  background: #0f172a;
  color: #f8fafc;
  padding: 60px 80px;
  justify-content: center;
}

.slide-title.theme-dark-navy h1 {
  color: #f8fafc;
  font-size: 52px;
  line-height: 1.15;
  margin-bottom: 20px;
}

.slide-title.theme-dark-navy .subtitle {
  color: #94a3b8;
  font-size: 20px;
  margin-bottom: 40px;
}

.slide-title.theme-dark-navy .presenter-info {
  position: absolute;
  bottom: 40px;
  right: 80px;
  text-align: right;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}
```

### 8.4 MODERN タイトルスライド

※MODERNテーマのタイトルスライドの具体的な実装コード（洗練された背景グリッド、Kicker、リボン装飾など）は、**付録Bの完全版テンプレート**をそのまま使用すること。

### 8.5 セクションスライド共通

```css
.slide-section {
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 60px 80px;
}

.slide-section h2 {
  font-size: 42px;
  color: var(--color-primary);
  margin-bottom: 12px;
}

.slide-section .section-sub {
  font-size: 18px;
  color: var(--color-muted);
}
```

---

## 9. コンテンツスライドレイアウト (Content Layouts)

### 9.1 標準コンテンツスライド（`.slide-content`）

```css
.slide-content .slide-body {
  padding: 40px 60px 36px 60px;
}

.slide-content .slide-header {
  margin-bottom: 20px;
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: 12px;
}

.slide-content .slide-header h2 {
  font-size: 28px;
  margin: 0;
  color: var(--color-heading);
}
```

### 9.2 2カラムスライド（`.slide-two-col`）

```css
.slide-two-col .slide-body {
  padding: 40px 60px 36px 60px;
}

.slide-two-col .col-container {
  display: flex;
  gap: 40px;
  flex: 1;
  align-items: flex-start;
}

.slide-two-col .col {
  flex: 1;
  min-width: 0;
}
```

```html
<!-- 2カラムの正例 -->
<div class="slide slide-two-col" style="page-break-after: always;">
  <div class="slide-body">
    <div class="slide-header">
      <h2>比較：現状 vs 改善案</h2>
    </div>
    <div class="col-container">
      <div class="col">
        <h3>現状</h3>
        <ul>
          <li>項目A</li>
          <li>項目B</li>
        </ul>
      </div>
      <div class="col">
        <h3>改善案</h3>
        <ul>
          <li>改善A</li>
          <li>改善B</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="slide-number">3</div>
</div>
```

### 9.3 グラフスライド（`.slide-chart`）

```css
.slide-chart .slide-body {
  padding: 32px 60px 28px 60px;
}

.slide-chart canvas {
  max-height: 340px;
  margin: auto;
  display: block;
}
```

---

## 10. 強調・注記コンポーネント (Highlight Components)

ドキュメント版の `callout` / `notice` 系に相当するコンポーネント。  
スライドでは**視覚的なカード形式**で表現する。

### 10.1 使用する3種類

- `.highlight-card`：重要な数値・KPI・メッセージの強調表示
- `.point-box`：箇条書きを囲む強調ボックス
- `.label-tag`：インラインのバッジ・ラベル

### 10.2 CSS定義

※MODERNスタイルの場合は、より洗練された影やグラデーションを備えた**付録Bの実装**を優先的に使用すること。通常のベースラインは以下の通り。

```css
/* KPI・数値強調カード */
.highlight-card {
  background: var(--color-bg-accent);
  border-left: 4px solid var(--color-primary);
  border-radius: 6px;
  padding: 14px 20px;
  margin: 8px 0;
}

.highlight-card .card-value {
  font-size: 36px;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1.1;
}

.highlight-card .card-label {
  font-size: 12px;
  color: var(--color-muted);
  margin-top: 4px;
}

/* ポイントボックス */
.point-box {
  border: 1.5px solid var(--color-primary);
  border-radius: 6px;
  padding: 12px 18px;
  margin: 8px 0;
  background: #fff;
}

.point-box-title {
  font-weight: 700;
  font-size: var(--text-sm);
  color: var(--color-primary);
  margin-bottom: 6px;
  letter-spacing: 0.04em;
}

/* インラインラベル */
.label-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.label-positive  { background: #d1fae5; color: #065f46; }
.label-negative  { background: #fee2e2; color: #991b1b; }
.label-neutral   { background: #dbeafe; color: #1e40af; }
.label-warning   { background: #fef3c7; color: #92400e; }
```

### 10.3 配置ルール

- `.highlight-card` はKPIや核心的な数値・メッセージのみに使用する。1スライドあたり3点まで
- `.point-box` はコンテンツの補足・まとめとして使用する。1スライドあたり1点まで
- `.label-tag` は表のセル内や箇条書き末尾など、インラインで使用する
- グラフスライドに `.highlight-card` / `.point-box` を同居させない

---

## 11. 許可ライブラリ (Allowed Libraries)

### 11.1 許可CDN一覧

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
```

### 11.2 配置ルール

- **CDN 読み込みタグと初期化スクリプト自体（`<script> function initInteractiveElements() ... </script>`）は必ず `<head>` 内に記述すること**
- 絶対に `<body>` の末尾や途中に分離して書いてはならない。（ストリーミング表示で各スライドが分割してiframe描画される際、末尾のスクリプトは生成中のスライドに含まれないため）
- `splitArtifactPages` は `<head>` 内容を全スライドに複製する
- ストリーミング対応のため `requestAnimationFrame` による待機を使うこと

### 11.3 禁止事項

- 許可外の外部CDN、外部CSS
- `fetch()` / `XMLHttpRequest`
- `localStorage` / `sessionStorage`
- 外部URL画像読み込み
- `javascript:` スキーム

### 11.4 CDNフォールバック

```html
<script>
window.addEventListener('error', function(e) {
  if (e.target && e.target.src && e.target.src.includes('chart.js')) {
    document.querySelectorAll('canvas[data-fallback]').forEach(function(canvas) {
      const fallback = document.createElement('div');
      fallback.className = 'chart-fallback';
      fallback.innerHTML = canvas.getAttribute('data-fallback');
      canvas.parentNode.replaceChild(fallback, canvas);
    });
  }
}, true);
</script>
```

```css
.chart-fallback {
  border: 1px solid var(--color-border);
  padding: 16px;
  background: var(--color-bg-accent);
  font-size: var(--text-sm);
  font-family: var(--font-heading);
  color: var(--color-muted);
  text-align: center;
  border-radius: 4px;
}
```

### 11.5 インタラクティブ要素初期化ルール

（§3.3 と同一の原則を適用する）

- 要素ごとに存在確認し、存在するもののみ初期化する
- 初期化済みフラグは要素単位で持つ
- 複数グラフを1つの条件で束ねない
- 全要素が見つかるまで無限待機する設計を避ける
- 継続ポーリングは、当該スライドに未初期化要素が残る場合のみ継続する

---

## 12. 表と図の選択基準 (Table vs Chart Decision)

### 12.1 表を使うべき場面

- 比較軸が2次元以上
- 数値を正確に読ませたい
- テキストと数値が混在する
- 項目数が5件以上（スライドでは5〜7行を上限とする）
- 条件・仕様・スペック一覧

### 12.2 グラフを使うべき場面

- 時系列の変化（聴衆に傾向を伝えたい）
- 構成比の可視化
- カテゴリ間の大小比較
- 実データが存在する場合のみ

### 12.3 どちらも不要な場面

- 数値が1〜2個のみ → `.highlight-card` で強調
- 定性的説明が中心 → テキスト＋箇条書き
- データが不足している

### 12.4 サンプルデータ利用条件

ドキュメント版と同一の条件を適用する（§12.4参照）。

---

## 13. グラフ種別の選択基準 (Chart Type Selection)

| データの性質 | 推奨グラフ型 | 禁止・非推奨 | 備考 |
|---|---|---|---|
| 時系列・推移 | line | pie | 時間軸はX軸 |
| カテゴリ比較 | bar | radar | 項目数2〜6（スライドでは上限を絞る） |
| 構成比 | pie / doughnut | line | 4項目以下を推奨 |
| 多指標比較 | radar | bar | 3〜6軸 |
| 相関・分布 | scatter | pie | 外れ値説明を本文に |
| 累積・内訳 | stacked bar | line | 合計値も明示 |
| 進捗・達成率 | horizontal bar | radar | 100%ライン明示 |

### 13.1 Chart.js テンプレート

```html
<canvas id="chart-1"
        data-chart-role="revenue-trend"
        style="max-height: 340px; margin: auto; display: block;"
        data-fallback="グラフデータ（テキスト代替）"></canvas>
<p class="caption">図1：売上推移（2024〜2026年）</p>
```

### 13.2 印刷・PDF安定化ルール

- Chart.js は `animation: false` を必須とする
- `requestAnimationFrame` 初期化待機を必ず組み込む
- `data-fallback` は必須属性とする

### 13.3 配置ルール

- 1スライドに配置するChart.js canvasは**原則1点まで**
- グラフスライドには他のコンテンツを最小限に抑える（タイトルとキャプションのみ許容）
- グラフスライドに表を同居させてはならない
- グラフスライドに `.highlight-card` / `.point-box` を同居させてはならない

---

## 14. アジェンダスライド (Agenda Slide)

アジェンダ・目次スライドは、プレゼンが4スライド以上かつセクションが3つ以上ある場合に付与する。

```css
.agenda-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.agenda-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 17px;
}

.agenda-item:last-child {
  border-bottom: none;
}

.agenda-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.agenda-title {
  font-weight: 600;
  color: var(--color-heading);
}
```

---

## 15. 画像・ロゴ代替 (Image / Logo Handling)

### 15.1 ロゴ代替

```css
.logo-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--color-heading);
  padding: 4px 12px;
  font-family: var(--font-heading);
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--color-heading);
  border-radius: 3px;
}
```

### 15.2 画像代替

```css
.img-placeholder {
  width: 90%;
  height: 200px;
  background: var(--color-bg-accent);
  border: 1px dashed var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  color: var(--color-muted);
  font-family: var(--font-heading);
  margin: 8px auto;
  border-radius: 4px;
}
```

### 15.3 運用ルール

- 外部画像URLの読み込みは禁止
- `data:` スキームのBase64画像は許容
- 画像は本文の理解補助に限り使用する

---

## 16. 明示的禁止事項まとめ

以下は全体を通じて禁止とする。

- 外部通信・外部画像URL読み込み
- `html, body` の背景色・余白の追加
- 固定CSSの改変（`@media print` ブロックを省略・要約・改変することも禁止）
- `.slide` への `overflow: visible` / `overflow: auto` 指定
- `.slide` の高さを可変にすること（`min-height` の使用禁止）
- `.slide` をカード化・ポスター化する変形（`border-radius`、太い枠線、強い影、四隅の欠けや丸めなど）
- `text-indent` によるインデント
- フォントサイズ `10px` 以下の使用
- 原則として架空データによるグラフ生成
- 1スライドに2点以上のグラフを配置すること
- グラフと表の同居
- 他スライドの要素存在を前提としたチャート一括初期化
- `if (!a || !b || !c)` 型の全要素存在前提チャートガード
- 印刷対象チャートでのアニメーション付き描画
- グラフなどの初期化スクリプトを `<body>` 内の末尾などに記述すること（必ず `<head>` 内にまとめる）
- `data-fallback` 未付与のグラフ
- ドキュメント版の `callout` / `notice` 系クラスの流用
- 箇条書き10項目超の1スライド詰め込み

---

## 17. 生成時の最終チェックリスト

**構造・骨格**
- `<!DOCTYPE html>` から始まっているか
- `<meta charset="UTF-8">` があるか
- `@page { size: 10in 5.625in; margin: 0; }` があるか
- `html, body` が `margin: 0; padding: 0; overflow: hidden; background: transparent;` になっているか
- `.slide` の最終スライド以外に `style="page-break-after: always;"` があるか
- `.slide` に `overflow: hidden` が設定されているか（コンテンツはみ出し防止）
- `@media print` の中に `body { display: block; overflow: visible; }` が省略されずに含まれているか
- `@media print` の中の `.slide` に `width: 960px; height: 540px;` が省略されずに含まれているか
- `artifact-resize` postMessage スクリプトが末尾にあるか

**スライド設計**
- `slide_theme` と各スライドの `slide_type` を thinking に記録したか
- 各スライドに適切な種別クラス（`.slide-title` 等）が付与されているか
- タイトルスライドにスライド番号が付いていないか
- コンテンツの合計高さが440pxを超えていないか
- 箇条書きが1スライド10項目以内か
- 表が1スライド1本以内か
- グラフが1スライド1点以内か
- グラフと表が同居していないか

**グラフ・インタラクティブ要素**
- `data-fallback` が付与されているか
- `animation: false` が設定されているか
- 各チャートが要素単位で独立初期化されるか
- 他スライド要素の存在を前提にした初期化コードになっていないか
- `requestAnimationFrame` による待機が組み込まれているか

**外部リソース・セキュリティ**
- 外部通信・外部画像がないか
- 許可外CDNを使っていないか

---

## 18. 運用補足

### 18.1 スライド枚数と安全性の関係

- スライド枚数が少ないこと自体は品質ではない
- 1スライドが過密なら、迷わず分割すること
- 「収まりが悪い」より「読めない」方が問題である

### 18.2 分割をためらわない条件

- 箇条書きが7項目を超える場合
- グラフと表を同一スライドに置こうとした場合
- タイトル＋コンテンツ＋補足で440px上限が見えた場合
- `.highlight-card` を3点以上並べようとした場合

### 18.3 今後の運用推奨

- HTML作者は「単一HTML」ではなく「分割後実行環境（独立iframe）」を前提に設計すること
- フロントエンド実装者は、ズームレベルとスライド縦横比の組合せでプレビューを検証すること
- チャートを含むテンプレートは、すべて個別初期化方式で統一すること
- ドキュメント版テンプレートとスライド版テンプレートは分離して管理すること

---

## 19. 付録A：競合回避・実装補足ルール

この付録は本文の補足であり、本文の必須要件を上書きしない。矛盾が生じそうな場合は、以下の優先順位で解釈すること。

**優先順位:**
1. 出力フィールド要件
2. 固定CSS仕様（必須・改変禁止）
3. 明示的禁止事項
4. HTMLの必須骨格
5. 収容安全性ルール
6. 本付録
7. 一般的な見栄え上の判断

すなわち、本付録は「見た目の改善」よりも「本文ルールの解釈明確化」にのみ使うこと。

### 19.1 生成判断の基本姿勢
このノードは、装飾的なスライド生成器ではなく、Dify カスタム UI 上で安全に表示・分割・印刷される HTML Slide Artifact を生成する専用ノードである。
したがって、判断基準は常に次の順序とする。

1. **収容安全性**
2. 分割後の独立描画安定性
3. 可読性
4. 情報の正確性
5. 見た目の整い方
6. 装飾性

見栄え向上のためであっても、本文の固定CSS・禁止事項・収容安全性ルールを破ってはならない。
余白不足、行数超過、表の肥大化、グラフの詰め込みが起こりそうなら、必ずスライドを増やすこと。

---

*このガイドラインに従うことで、LLM および実装者はスライドの種別・情報密度・グラフの必要性・スライド構成・収容安全性・分割後ランタイムの挙動を総合的に判断し、崩れにくく視覚的に品位あるプレゼンテーション HTML Artifact を安定して生成できる。*

---

## 20. 付録B：MODERNスタイル 完全版テンプレート (Reusable Sample)

以下のテンプレートは、540pxの固定高さ制限およびコンポーネント間のオーバーラップ防止策を全て適用済みの、MODERNスタイルの基準実装である。生成時はこの構造とスタイルを基準にすること。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>modern-style-template-fixed</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    @page { size: 10in 5.625in; margin: 0; }

    :root {
      --slide-width: 960px;
      --slide-height: 540px;
      --safe-top: 34px;
      --safe-side: 48px;
      --safe-bottom: 46px;
      --safe-number-right: 30px;
      --safe-number-bottom: 14px;

      --font-body: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
      --font-heading: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;

      --text-base: 17px;
      --text-sm: 13px;
      --text-lg: 21px;
      --text-h1: 46px;
      --text-h2: 28px;
      --text-h3: 19px;
      --text-eyebrow: 12px;

      --color-primary: #6366f1;
      --color-accent: #8b5cf6;
      --color-primary-soft: #eef2ff;
      --color-heading: #0f172a;
      --color-body: #334155;
      --color-muted: #94a3b8;
      --color-border: #dbe3f0;
      --color-rule: #6366f1;
      --color-bg-accent: #f8fafc;
      --color-slide-bg: #ffffff;

      --shadow-soft: 0 16px 40px rgba(15, 23, 42, 0.10);
      --shadow-card: 0 10px 24px rgba(99, 102, 241, 0.07);
      --radius-xl: 22px;
      --radius-lg: 18px;
    }

    html, body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: transparent;
    }

    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      font-family: var(--font-body);
      font-size: var(--text-base);
      line-height: 1.5;
      letter-spacing: 0.01em;
      color: var(--color-body);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background:
        radial-gradient(circle at top, rgba(99,102,241,0.10), transparent 28%),
        linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
    }

    .slide {
      width: var(--slide-width);
      height: var(--slide-height);
      margin: 0 auto;
      background: var(--color-slide-bg);
      box-shadow: var(--shadow-soft);
      box-sizing: border-box;
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      page-break-after: always;
      isolation: isolate;
    }

    .slide::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(circle at top right, rgba(139,92,246,0.10), transparent 22%),
        radial-gradient(circle at bottom left, rgba(99,102,241,0.08), transparent 22%);
      z-index: 0;
    }

    .slide-body {
      position: relative;
      z-index: 1;
      flex: 1;
      min-height: 0;
      box-sizing: border-box;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: var(--safe-top) var(--safe-side) var(--safe-bottom);
    }

    .slide-number {
      position: absolute;
      right: var(--safe-number-right);
      bottom: var(--safe-number-bottom);
      font-size: 11px;
      color: var(--color-muted);
      letter-spacing: 0.06em;
      z-index: 3;
    }

    h1, h2, h3, p, ul { margin: 0; }

    h1 {
      font-size: var(--text-h1);
      line-height: 1.08;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #fff;
    }

    h2 {
      font-size: var(--text-h2);
      line-height: 1.18;
      font-weight: 800;
      color: var(--color-heading);
    }

    h3 {
      font-size: var(--text-h3);
      line-height: 1.25;
      font-weight: 700;
      color: var(--color-heading);
    }

    p {
      font-size: var(--text-base);
      line-height: 1.55;
      color: var(--color-body);
    }

    .eyebrow {
      font-size: var(--text-eyebrow);
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--color-accent);
      margin-bottom: 8px;
    }

    ul {
      padding-left: 18px;
      margin-top: 8px;
    }

    li {
      margin-bottom: 7px;
      font-size: 16px;
      line-height: 1.42;
    }

    .theme-modern {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 52%, #0f172a 100%);
      color: #fff;
    }

    .theme-modern::before {
      background:
        linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px),
        radial-gradient(circle at 18% 18%, rgba(255,255,255,0.10), transparent 16%),
        radial-gradient(circle at 82% 76%, rgba(255,255,255,0.08), transparent 18%);
      background-size: 28px 28px, 28px 28px, auto, auto;
      opacity: 0.65;
    }

    .slide-title .slide-body { justify-content: space-between; }
    .title-top { display: flex; flex-direction: column; gap: 18px; max-width: 760px; padding-top: 10px; }
    .title-bottom { display: flex; align-items: end; justify-content: space-between; gap: 18px; padding-top: 18px; min-height: 86px; }

    .title-kicker {
      display: inline-flex; align-items: center; align-self: flex-start; gap: 10px;
      min-height: 40px; padding: 0 18px; border-radius: 999px; font-size: 12px; font-weight: 800;
      letter-spacing: 0.12em; text-transform: uppercase; color: #fff;
      background: rgba(124, 106, 244, 0.96); border: 1px solid rgba(255,255,255,0.28);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05); white-space: nowrap;
    }
    .title-kicker::before { content: ""; width: 10px; height: 10px; border-radius: 50%; background: #fff; flex-shrink: 0; }
    .subtitle { max-width: 650px; font-size: 18px; line-height: 1.6; color: rgba(255,255,255,0.82); }
    .hero-ribbon { display: flex; flex-wrap: wrap; gap: 10px; max-width: 620px; }
    .hero-pill, .closing-pill {
      display: inline-flex; align-items: center; min-height: 38px; padding: 0 16px; border-radius: 999px;
      font-size: 12px; font-weight: 700; color: #fff; background: rgba(91, 78, 210, 0.96);
      border: 1px solid rgba(255,255,255,0.20); white-space: nowrap;
    }
    .presenter-info { text-align: right; font-size: 13px; line-height: 1.55; color: rgba(255,255,255,0.82); min-width: 210px; }

    .slide-header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 300px;
      gap: 20px;
      align-items: end;
      padding-bottom: 12px;
      margin-bottom: 18px;
      border-bottom: 2px solid var(--color-rule);
      flex: 0 0 auto;
    }

    .slide-header p { font-size: 14px; color: var(--color-muted); line-height: 1.45; text-align: right; }
    .slide-main { flex: 1; min-height: 0; overflow: hidden; }

    .agenda-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; height: 100%; }
    .agenda-item {
      display: grid; grid-template-columns: 44px 1fr; gap: 14px; align-items: center;
      padding: 11px 0; border-bottom: 1px solid var(--color-border); min-height: 0;
    }
    .agenda-item:last-child { border-bottom: none; }
    .agenda-num {
      width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800;
      box-shadow: 0 8px 18px rgba(99, 102, 241, 0.16);
    }
    .agenda-title { display: block; font-size: 16px; font-weight: 700; color: var(--color-heading); margin-bottom: 2px; line-height: 1.3; }
    .agenda-desc { font-size: 13px; line-height: 1.4; color: var(--color-muted); }

    .panel, .compact-panel, .col, .chart-side, .chart-panel {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
      box-shadow: var(--shadow-card);
      overflow: hidden;
    }

    .panel { padding: 20px 20px 16px; display: flex; flex-direction: column; min-height: 0; }
    .compact-panel { padding: 18px 18px 14px; display: flex; flex-direction: column; gap: 12px; min-height: 0; background: linear-gradient(180deg, #fcfcff 0%, #f7f9ff 100%); }
    .lede { font-size: 17px; line-height: 1.58; color: #334155; margin-bottom: 8px; }

    .highlight-card {
      border: 1px solid rgba(99,102,241,0.12);
      border-radius: 16px;
      background: linear-gradient(180deg, var(--color-primary-soft) 0%, #ffffff 100%);
      padding: 12px;
      min-height: 74px;
    }
    .highlight-card .card-value { font-size: 24px; line-height: 1; font-weight: 800; color: var(--color-primary); letter-spacing: -0.03em; margin-bottom: 6px; }
    .highlight-card .card-label { font-size: 11px; line-height: 1.3; color: var(--color-muted); letter-spacing: 0.05em; text-transform: uppercase; }

    .label-tag {
      display: inline-flex; align-items: center; min-height: 30px; padding: 0 12px; border-radius: 999px;
      font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap;
    }
    .label-neutral { background: #dbeafe; color: #1d4ed8; }
    .label-positive { background: #dcfce7; color: #166534; }
    .label-warning { background: #fef3c7; color: #92400e; }

    .point-box {
      border: 1px solid var(--color-border);
      border-left: 4px solid var(--color-primary);
      border-radius: var(--radius-lg);
      padding: 12px 14px;
      background: #fff;
      min-height: 0;
    }
    .point-box-title { font-size: 13px; font-weight: 800; letter-spacing: 0.04em; color: var(--color-primary); margin-bottom: 6px; }
    .point-box p { font-size: 14px; line-height: 1.45; color: var(--color-body); }

    .slide-principles .slide-body {
      padding-bottom: 52px;
    }
    
    .slide-principles .slide-main {
      display: grid;
      grid-template-rows: minmax(0, 1fr) auto;
      gap: 12px;
      min-height: 0;
    }
    
    .slide-principles .content-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.18fr) minmax(0, 0.9fr);
      gap: 14px;
      min-height: 0;
    }
    
    .slide-principles .panel {
      padding: 18px 18px 14px;
    }
    
    .slide-principles .lede {
      font-size: 16px;
      line-height: 1.54;
      margin-bottom: 6px;
    }
    
    .slide-principles ul {
      margin-top: 6px;
    }
    
    .slide-principles li {
      margin-bottom: 6px;
      font-size: 15px;
      line-height: 1.4;
    }
    
    .slide-principles .compact-panel {
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 28px;
      min-height: 0;
    }
    
    .slide-principles .mini-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex-shrink: 0;
    }
    
    .slide-principles .label-tag {
      display: flex;
      align-items: center;
      align-self: flex-start;
      min-height: 28px;
      padding: 0 11px;
      font-size: 10px;
      line-height: 1;
      border-radius: 999px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    
    .slide-principles .point-box {
      margin: 0;
      padding: 10px 12px;
      border-radius: 16px;
      flex-shrink: 0;
    }
    
    .slide-principles .point-box-title {
      font-size: 12px;
      margin-bottom: 4px;
      line-height: 1.25;
    }
    
    .slide-principles .point-box p {
      margin: 0;
      font-size: 13px;
      line-height: 1.35;
    }
    
    .principles-metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      min-height: 0;
    }
    
    .principles-metrics .highlight-card {
      min-height: 0;
      padding: 10px 12px;
    }
    
    .principles-metrics .card-value {
      font-size: 22px;
      margin-bottom: 4px;
    }
    
    .principles-metrics .card-label {
      font-size: 10px;
      line-height: 1.25;
    }

    .slide-two-col .slide-main { display: block; }
    .col-container { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; height: 100%; min-height: 0; }
    .col { padding: 18px 18px 16px; display: flex; flex-direction: column; min-height: 0; }
    .col-topline { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
    .metric-chip {
      display: inline-flex; align-items: center; justify-content: center; min-height: 30px; padding: 0 12px;
      border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.04em; white-space: nowrap;
    }
    .metric-chip.good { background: #fee2e2; color: #991b1b; }
    .metric-chip.focus { background: #e0e7ff; color: #4338ca; }
    .feature-list { padding-left: 18px; margin-top: 6px; }
    .feature-list li { font-size: 15px; line-height: 1.42; margin-bottom: 8px; }
    .quote-box { margin-top: auto; border-radius: 16px; padding: 12px 14px; background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08)); color: #312e81; font-size: 13px; line-height: 1.5; }

    .chart-wrap { display: grid; grid-template-columns: 208px 1fr; gap: 16px; height: 100%; min-height: 0; }
    .chart-side { padding: 16px; display: flex; flex-direction: column; gap: 10px; min-height: 0; }
    .chart-side .big-number { font-size: 38px; line-height: 1; font-weight: 800; color: var(--color-primary); letter-spacing: -0.04em; }
    .chart-side .caption { font-size: 12px; line-height: 1.45; color: var(--color-muted); }
    .stat-group { display: flex; flex-direction: column; gap: 10px; margin-top: auto; padding-top: 6px; }
    .stat-line { display: flex; flex-direction: column; gap: 4px; }
    .stat-name { font-size: 12px; color: var(--color-body); }
    .stat-bar { height: 7px; border-radius: 999px; background: #e5e7eb; overflow: hidden; }
    .stat-bar > span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--color-primary), var(--color-accent)); }
    .chart-panel { padding: 16px 18px 12px; display: grid; grid-template-rows: 1fr auto; min-height: 0; }
    .chart-area { min-height: 0; position: relative; }
    .chart-area canvas { width: 100% !important; height: 250px !important; max-height: 250px; display: block; }
    .chart-note { display: flex; align-items: center; gap: 8px; border-top: 1px solid var(--color-border); margin-top: 10px; padding-top: 10px; font-size: 12px; line-height: 1.4; color: var(--color-muted); min-height: 40px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); }
    .chart-fallback { display: flex; align-items: center; justify-content: center; height: 250px; border-radius: 16px; border: 1px solid var(--color-border); background: var(--color-bg-accent); color: var(--color-muted); font-size: 13px; text-align: center; padding: 16px; box-sizing: border-box; }

    .slide-closing { background: linear-gradient(135deg, #0f172a 0%, #312e81 45%, #8b5cf6 100%); color: #fff; }
    .slide-closing::before {
      background:
        linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px),
        radial-gradient(circle at 20% 26%, rgba(255,255,255,0.10), transparent 17%),
        radial-gradient(circle at 86% 78%, rgba(255,255,255,0.08), transparent 18%);
      background-size: 30px 30px, 30px 30px, auto, auto;
      opacity: 0.58;
    }
    .slide-closing .slide-body { justify-content: center; }
    .closing-card {
      max-width: 740px; padding: 26px 28px; border-radius: 24px; background: rgba(83, 70, 194, 0.94);
      border: 1px solid rgba(255,255,255,0.18); box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
    }
    .closing-card h2 { color: #fff; font-size: 38px; margin-bottom: 10px; }
    .closing-card p { color: rgba(255,255,255,0.84); font-size: 17px; line-height: 1.55; }
    .closing-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }

    @media print {
      html, body { background: none; display: block; overflow: visible; }
      .slide { width: 960px; height: 540px; margin: 0; box-shadow: none; page-break-inside: avoid; }
      .title-kicker, .hero-pill, .closing-pill, .closing-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .title-kicker { background: #7868f1 !important; color: #fff !important; border-color: rgba(255,255,255,0.28) !important; }
      .hero-pill, .closing-pill { background: #5f52d6 !important; color: #fff !important; }
      .closing-card { background: rgba(83, 70, 194, 0.96) !important; }
    }
  </style>
  <script>
    function initInteractiveElements() {
      if (typeof Chart === 'undefined') {
        requestAnimationFrame(initInteractiveElements);
        return;
      }
      let pending = false;
      document.querySelectorAll('canvas[data-chart-role]').forEach(function (canvas) {
        if (canvas.chartInitialized) return;
        const role = canvas.getAttribute('data-chart-role');
        if (!role) return;
        canvas.chartInitialized = true;

        if (role === 'modern-growth') {
          new Chart(canvas, {
            type: 'bar',
            data: {
              labels: ['構想', '情報設計', 'ドラフト', '磨き込み', '最終化'],
              datasets: [{
                label: '完成度',
                data: [38, 56, 74, 88, 96],
                backgroundColor: [
                  'rgba(99,102,241,0.70)',
                  'rgba(99,102,241,0.72)',
                  'rgba(99,102,241,0.76)',
                  'rgba(124,58,237,0.76)',
                  'rgba(139,92,246,0.82)'
                ],
                borderRadius: 10,
                borderSkipped: false,
                maxBarThickness: 44
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: false,
              layout: { padding: { top: 6, right: 6, left: 6, bottom: 0 } },
              plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: '#0f172a', titleColor: '#fff', bodyColor: '#e2e8f0', padding: 10 }
              },
              scales: {
                x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } }, border: { display: false } },
                y: { beginAtZero: true, max: 100, ticks: { color: '#94a3b8', stepSize: 20, font: { size: 11 } }, grid: { color: 'rgba(148,163,184,0.18)' }, border: { display: false } }
              }
            }
          });
        }
      });
      document.querySelectorAll('canvas[data-chart-role]').forEach(function (canvas) {
        if (!canvas.chartInitialized) pending = true;
      });
      if (pending) requestAnimationFrame(initInteractiveElements);
    }

    window.addEventListener('error', function (e) {
      if (e.target && e.target.src && e.target.src.includes('chart.js')) {
        document.querySelectorAll('canvas[data-fallback]').forEach(function (canvas) {
          const fallback = document.createElement('div');
          fallback.className = 'chart-fallback';
          fallback.innerHTML = canvas.getAttribute('data-fallback');
          canvas.parentNode.replaceChild(fallback, canvas);
        });
      }
    }, true);

    document.addEventListener('DOMContentLoaded', function () {
      initInteractiveElements();
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(function () {
          window.parent.postMessage({ type: 'artifact-resize', height: document.documentElement.scrollHeight }, '*');
        });
        ro.observe(document.body);
      }
    });
  </script>
</head>
<body>

  <div class="slide slide-title theme-modern" style="page-break-after: always;">
    <div class="slide-body">
      <div class="title-top">
        <div class="title-kicker">MODERN TEMPLATE</div>
        <h1>制限下でも、美しく伝わる<br>プロフェッショナルなHTMLスライド</h1>
        <p class="subtitle">情報量と視認性のバランスを保ちながら、派手すぎず、しかし凡庸にも見えない。限られた表現でも完成度を上げるための、再利用前提のモダンな雛形です。</p>
      </div>
      <div class="title-bottom">
        <div class="hero-ribbon">
          <span class="hero-pill">960 × 540 固定</span>
          <span class="hero-pill">再利用しやすい単一HTML</span>
          <span class="hero-pill">Chart.js フォールバック対応</span>
        </div>
        <div class="presenter-info">Reusable Sample Code<br>Modern Slide HTML Template<br>2026</div>
      </div>
    </div>
    <div class="slide-number" style="color: rgba(255,255,255,0.78);">1</div>
  </div>

  <div class="slide slide-content" style="page-break-after: always;">
    <div class="slide-body">
      <div class="slide-header">
        <div>
          <div class="eyebrow">Agenda</div>
          <h2>テンプレートの構成</h2>
        </div>
        <p>冒頭から締めまで、最小限の部品で統一感をつくるための基本セット。</p>
      </div>
      <div class="slide-main">
        <ul class="agenda-list">
          <li class="agenda-item"><span class="agenda-num">1</span><div><span class="agenda-title">タイトルで印象を決める</span><div class="agenda-desc">グラデーション背景、簡潔な見出し、補足情報の三点で第一印象を設計。</div></div></li>
          <li class="agenda-item"><span class="agenda-num">2</span><div><span class="agenda-title">本文は余白で信頼感をつくる</span><div class="agenda-desc">強い装飾よりも、ヘッダー線・カード・文字階層の整合を優先。</div></div></li>
          <li class="agenda-item"><span class="agenda-num">3</span><div><span class="agenda-title">比較は2カラムに限定する</span><div class="agenda-desc">要点の数を抑え、視線移動を単純化して読みやすさを維持。</div></div></li>
          <li class="agenda-item"><span class="agenda-num">4</span><div><span class="agenda-title">数値は装飾よりも整理</span><div class="agenda-desc">KPIとチャートを分離し、ラベルの意味が一目で分かる構成にする。</div></div></li>
          <li class="agenda-item"><span class="agenda-num">5</span><div><span class="agenda-title">締めは静かに強く終える</span><div class="agenda-desc">結論を短く言い切り、次アクションを控えめなピルで添える。</div></div></li>
        </ul>
      </div>
    </div>
    <div class="slide-number">2</div>
  </div>

  <div class="slide slide-content slide-principles" style="page-break-after: always;">
    <div class="slide-body">
      <div class="slide-header">
        <div>
          <div class="eyebrow">Content</div>
          <h2>美しく見せるための実装原則</h2>
        </div>
        <p>強い装飾を足すのではなく、ルールを守ることで仕上がりを上げます。</p>
      </div>
  
      <div class="slide-main">
        <div class="content-grid">
          <div class="panel">
            <p class="lede">
              限られた条件でスライドをプロフェッショナルに見せるには、派手さよりも
              「整列・余白・文字階層・色数の抑制」を徹底するのが効果的です。
            </p>
            <ul>
              <li>見出しは短く、本文は1スライドあたり3〜5点に絞る。</li>
              <li>アクセント色は見出し線と重要数値だけに使い、面積を増やしすぎない。</li>
              <li>カードの角丸・影・境界線を揃え、細部の一貫性で品質を出す。</li>
            </ul>
          </div>
  
          <div class="compact-panel">
            <div class="mini-item">
              <span class="label-tag label-neutral">READABILITY</span>
              <div class="point-box">
                <div class="point-box-title">文字階層</div>
                <p>見出しと本文の強弱を明確にし、メリハリをつける。</p>
              </div>
            </div>
  
            <div class="mini-item">
              <span class="label-tag label-positive">RESTRAINT</span>
              <div class="point-box">
                <div class="point-box-title">装飾の節度</div>
                <p>色面は要所のみとし、基本は白背景を保つ。</p>
              </div>
            </div>
          </div>
        </div>
  
        <div class="principles-metrics">
          <div class="highlight-card">
            <div class="card-value">1</div>
            <div class="card-label">Strong visual system</div>
          </div>
          <div class="highlight-card">
            <div class="card-value">3</div>
            <div class="card-label">Core colors</div>
          </div>
          <div class="highlight-card">
            <div class="card-value">5</div>
            <div class="card-label">Max key points</div>
          </div>
        </div>
      </div>
    </div>
    <div class="slide-number">3</div>
  </div>

  <div class="slide slide-two-col" style="page-break-after: always;">
    <div class="slide-body">
      <div class="slide-header">
        <div>
          <div class="eyebrow">Two Column</div>
          <h2>悪い例と良い例の並置</h2>
        </div>
        <p>比較は情報量を増やしやすいため、各カラムの論点は3つ程度までに制御します。</p>
      </div>
      <div class="slide-main">
        <div class="col-container">
          <div class="col">
            <div class="col-topline"><h3>避けたい状態</h3><span class="metric-chip good">OVERLOAD</span></div>
            <ul class="feature-list">
              <li>見出しも本文も強く、どこから読むべきか分からない。</li>
              <li>カード数が多く、1枚の中で視線が往復し続ける。</li>
              <li>色の意味が定義されず、装飾のためだけに増えていく。</li>
            </ul>
            <div class="quote-box">悪い例は「要素が多いこと」よりも「優先順位が曖昧なこと」で発生します。</div>
          </div>
          <div class="col">
            <div class="col-topline"><h3>維持したい状態</h3><span class="metric-chip focus">FOCUS</span></div>
            <ul class="feature-list">
              <li>各カラムに1つの結論を置き、下位要素はそれを支えるだけにする。</li>
              <li>余白を削って詰め込むのではなく、論点の数を減らして収める。</li>
              <li>アクセント色は「強調」と「誘導」に用途を限定する。</li>
            </ul>
            <div class="quote-box">良い例は、読み終えたあとに構造が自然に記憶に残ります。</div>
          </div>
        </div>
      </div>
    </div>
    <div class="slide-number">4</div>
  </div>

  <div class="slide slide-content" style="page-break-after: always;">
    <div class="slide-body">
      <div class="slide-header">
        <div>
          <div class="eyebrow">Chart</div>
          <h2>完成度は段階的に積み上がる</h2>
        </div>
        <p>モダンな見た目は一度に生まれず、構造整理と磨き込みの反復で上がっていきます。</p>
      </div>
      <div class="slide-main">
        <div class="chart-wrap">
          <div class="chart-side">
            <span class="label-tag label-neutral">Progress</span>
            <div class="big-number">96%</div>
            <div class="caption">最終化フェーズでは、追加より削減の判断が品質を左右します。</div>
            <div class="stat-group">
              <div class="stat-line"><div class="stat-name">情報整理</div><div class="stat-bar"><span style="width:88%"></span></div></div>
              <div class="stat-line"><div class="stat-name">視線誘導</div><div class="stat-bar"><span style="width:92%"></span></div></div>
              <div class="stat-line"><div class="stat-name">安全余白</div><div class="stat-bar"><span style="width:94%"></span></div></div>
            </div>
          </div>
          <div class="chart-panel">
            <div class="chart-area">
              <canvas data-chart-role="modern-growth" data-fallback="Chart.js が利用できない環境では、ここに簡易チャートや表を置いて代替できます。"></canvas>
            </div>
            <div class="chart-note"><span class="legend-dot"></span>構想から最終化まで、各段階で要素を増やすより整える比率を高めると完成度が安定します。</div>
          </div>
        </div>
      </div>
    </div>
    <div class="slide-number">5</div>
  </div>

  <div class="slide slide-closing" style="page-break-after: always;">
    <div class="slide-body">
      <div class="closing-card">
        <div class="eyebrow" style="color: rgba(255,255,255,0.72);">Closing</div>
        <h2>整えることが、最短の演出になる</h2>
        <p>MODERNスタイルでは、余白・見出し線・カード・数値の秩序を先に決めることで、少ない装飾でも十分に洗練された印象を作れます。</p>
        <div class="closing-actions">
          <span class="closing-pill">テンプレート化しやすい</span>
          <span class="closing-pill">安全領域を守りやすい</span>
          <span class="closing-pill">量産時も破綻しにくい</span>
        </div>
      </div>
    </div>
    <div class="slide-number" style="color: rgba(255,255,255,0.78);">6</div>
  </div>

</body>
</html>
```

*このガイドラインに従うことで、LLM および実装者はスライドの種別・情報密度・グラフの必要性・スライド構成・収容安全性・分割後ランタイムの挙動を総合的に判断し、崩れにくく視覚的に品位あるプレゼンテーション HTML Artifact を安定して生成できる。*

