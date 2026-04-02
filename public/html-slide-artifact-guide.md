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

```css
.slide-title.theme-modern {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #ffffff;
  padding: 60px 80px;
  justify-content: center;
}

.slide-title.theme-modern h1 {
  color: #ffffff;
  font-size: 52px;
  line-height: 1.15;
  margin-bottom: 20px;
}

.slide-title.theme-modern .subtitle {
  color: rgba(255,255,255,0.8);
  font-size: 20px;
}
```

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
