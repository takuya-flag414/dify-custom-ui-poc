# HTML Artifact 生成ガイドブック（フォーマルビジネス文書用）v2.0

本ドキュメントは、Dify カスタム UI において高品質な複数ページ HTML Artifact（提案書、報告書、案内文、通知文、依頼書、警告書、仕様書、学術レポート等）を生成するための技術仕様およびデザイン指針を定義する。  
LLM および実装者は本ガイドに従い、プレビュー整合性、印刷再現性、ページ分割安定性、ページ装飾の妥当性、およびビジネス文書としての品位を担保すること。

*v2.0 更新内容：ビジネスレター前付けルールを新設し、日付・宛先・差出人・件名の配置順を明文化。通知文・警告文・依頼書などレター形式文書ではページ上端装飾を標準で無効化する方式へ変更し、`doc_layout` 判定、レター専用チェック項目、禁止パターン、行数見積りの細分化を追加した。*

---

## 1. 基本方針

- HTML は `<!DOCTYPE html>` を含む完全な文書として生成すること
- 各ページは独立した `<div class="page">` で表現すること
- 最終ページ以外の `.page` には、必ずインラインで `style="page-break-after: always;"` を付与すること
- 文書の美しさより、印刷再現性・ページ分割安定性・読み順の自然さを優先すること
- レター文書では、装飾よりも文書秩序（前付けの順序、余白、視線誘導）を優先すること

---

## 2. 基本構造 (Document Structure)

### 2.1 必須骨格

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>ドキュメントタイトル</title>

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

        if (role === 'sales-trend') {
          new Chart(canvas, {
            type: 'line',
            data: {
              labels: ['1月', '2月', '3月'],
              datasets: [{
                label: '売上',
                data: ,
                borderColor: '#1e3a8a',
                backgroundColor: 'rgba(30,58,138,0.1)',
                tension: 0.3
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
  <div class="page" style="page-break-after: always;">
    <div class="page-body">
      <!-- ページ1本文 -->
    </div>
    <div class="page-number">1</div>
  </div>

  <div class="page">
    <div class="page-body">
      <!-- 最終ページ本文 -->
    </div>
    <div class="page-number">2</div>
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

### 2.2 本文ラッパー

- 通常フローの本文は、必ず `.page-body` でラップすること
- `.page-body` は本文専用のレイアウト領域であり、フッター安全域を含む
- ページ番号、文書番号、補助注記などの絶対配置要素は `.page-body` の外に置くこと

### 2.3 最低限の配置原則

- `.page` はページ枠である
- `.page-body` は本文領域である
- 絶対配置要素は本文レイアウトと独立して配置する
- 本文はフッター領域へ侵入してはならない

---

## 3. ページ分割と表示同期 (Pagination & Sync)

### 3.1 改ページルール

フロントエンドの `splitArtifactPages` は、インライン `style` の `page-break-after` を見てページ分割を行う。  
そのため、改ページ指定を CSS クラスへ逃がしてはならない。

- すべての `.page` 要素（最終ページを除く）に `style="page-break-after: always;"` を直接付与すること
- 最終ページには `page-break-after` を付与しないこと
- 末尾 `<script>` は本文直後に置き、余分な白紙ページを防ぐこと

### 3.2 分割判断の原則

- 分割判断はページ数目標ではなく、各ページの収容安全性を最優先とする
- 推奨ページ数や通常上限は文書体裁の目安であり、分割安全性より優先してはならない
- 25行以上のページを維持するために分割を我慢してはならない

### 3.3 分割後ランタイムの前提

ページ分割後の各ページは、独立した描画単位として扱われる場合がある。  
したがって、HTML 内のスクリプトは「文書全体の全要素が同時に存在する」前提で実装してはならない。

- 各ページは独立 DOM として扱われうる
- 他ページにある要素の存在を前提とした初期化を禁止する
- チャート、Mermaid、KaTeX 等の初期化は、当該ページ内に存在する要素のみを対象とする
- `if (!a || !b || !c) return;` のような全要素同時存在前提のガードを禁止する
- インタラクティブ要素は、要素ごとの独立初期化を原則とする

---

## 4. スタイリング仕様 (CSS Specifications)

### 4.1 ページ設定と印刷精度

A4 サイズは 210mm x 297mm を基準とする。  
`@page { size: A4; margin: 0; }` は省略禁止とする。

### 4.2 固定CSS（必須）

以下の CSS ブロックは固定仕様である。  
ただし、ページ上端装飾は `.page` 本体ではなく、派生クラスで制御すること。

```css
@page { size: A4; margin: 0; }

:root {
  --page-width: 210mm;
  --page-height: 297mm;

  --font-body: "Hiragino Mincho ProN", "Yu Mincho", serif;
  --font-heading: "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
  --font-mono: "Courier New", "Osaka-Mono", monospace;

  --text-base: 10.5pt;
  --text-sm: 9pt;
  --text-h1: 20pt;
  --text-h2: 14pt;
  --text-h3: 11.5pt;
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
  line-height: 1.6;
  letter-spacing: 0.02em;
  color: var(--color-body);
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

.page.decorated-page {
  border-top: 8px solid var(--color-primary);
}

.page.letter-page {
  border-top: none;
}

@media print {
  body { background: none; display: block; }
  .page {
    margin: 0;
    box-shadow: none;
    width: 210mm;
    height: 296.8mm;
  }
}
```

### 4.3 ページ装飾ルール

- `.decorated-page` は提案書、報告書、分析レポートなど、ページデザインを伴う文書で使う
- `.letter-page` は案内文、通知文、依頼書、警告書、内容証明系文書などで使う
- レター文書では、ページ上端の黒帯・色帯・太罫線を標準で禁止する
- ページ装飾の有無は、文書種別と `doc_layout` に基づいて決定する

### 4.4 タイポグラフィ

```css
h1 {
  font-family: var(--font-heading);
  font-size: var(--text-h1);
  line-height: 1.3;
  color: var(--color-heading);
}

h2 {
  font-family: var(--font-heading);
  font-size: var(--text-h2);
  line-height: 1.3;
  color: var(--color-heading);
  border-bottom: 1.5px solid var(--color-rule);
  padding-bottom: 3pt;
}

h3 {
  font-family: var(--font-heading);
  font-size: var(--text-h3);
  line-height: 1.3;
  color: var(--color-heading);
}

h2, h3 {
  break-before: avoid;
  break-after: avoid;
}

p {
  margin: 0 0 6pt 0;
  text-indent: 1em;
  line-height: 1.6;
  font-size: var(--text-base);
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 10pt 0;
}

th, td {
  border: 1px solid var(--color-border);
  padding: 5pt 8pt;
  font-size: var(--text-base);
  vertical-align: top;
}

th {
  background: var(--color-bg-accent);
  font-family: var(--font-heading);
  color: var(--color-heading);
}

.caption {
  text-align: center;
  font-size: 8.5pt;
  color: #000;
  font-family: var(--font-body);
  margin-top: 5pt;
  margin-bottom: 20pt;
}
```

### 4.5 リストスタイル

```css
ul {
  margin: 6pt 0 10pt 0;
  padding-left: 18pt;
  list-style-type: disc;
}

ul li, ol li {
  margin-bottom: 4pt;
  line-height: 1.6;
  font-size: var(--text-base);
}

ol {
  margin: 6pt 0 10pt 0;
  padding-left: 20pt;
  list-style-type: decimal;
}

ol.kigaki-list {
  list-style-type: none;
  padding-left: 0;
  counter-reset: kigaki;
}

ol.kigaki-list li::before {
  counter-increment: kigaki;
  content: "記" counter(kigaki) ". ";
  font-family: var(--font-heading);
}

ul ul, ol ol {
  margin: 3pt 0 3pt 12pt;
}
```

### 4.6 CSS禁止事項

以下はすべて禁止とする。

- `html, body` への `background` / `background-color` 指定
- `html, body` への独自 `margin` / `padding` 指定
- `body` への `padding-top` / `padding-bottom` 追加
- `.page` 本体への独自装飾・独自ボーダー追加
- 固定CSSのデザイン目的の改変
- 指定クラス以外によるページ上端装飾の追加
- レター文書への装飾トップボーダー適用

### 4.7 フッター安全域（必須）

ページ番号や文書番号などを `.page` 内で絶対配置する場合、本文が下端へ侵入しないよう、本文側に安全域を必ず確保する。

```css
.page-body {
  flex: 1;
  box-sizing: border-box;
  padding-bottom: 14mm;
}

.page-number {
  position: absolute;
  right: 25mm;
  bottom: 12mm;
  font-family: var(--font-heading);
  font-size: 9pt;
  color: #555;
}
```

#### 4.7.1 運用ルール

- 絶対配置のフッター要素を使う場合、`.page-body` の使用は必須
- `.page-body` の `padding-bottom` は 12mm〜15mm の範囲で設定する
- ページ番号フッターは絶対配置でよいが、本文がその領域へ入ってはならない
- 絶対配置だから面積を取らない、という理由で本文回避領域を省略してはならない

---

## 5. カラーモード (Color Mode)

### 5.1 モノクロパレット（デフォルト）

```css
:root {
  --color-primary: #000000;
  --color-accent: #000000;
  --color-heading: #000000;
  --color-body: #000000;
  --color-muted: #000000;
  --color-border: #000000;
  --color-rule: #000000;
  --color-bg-accent: #f0f0f0;
  --color-bg-cover: #1a1a1a;
}
```

### 5.2 カラーパレット

```css
:root {
  --color-primary: #1e3a8a;
  --color-accent: #8b0000;
  --color-heading: #000000;
  --color-body: #000000;
  --color-muted: #000000;
  --color-border: #b0b8c1;
  --color-rule: #1e3a8a;
  --color-bg-accent: #f8fafc;
  --color-bg-cover: #1e3a8a;
}

.badge-success { background: #d1fae5; color: #065f46; }
.badge-primary { background: #dbeafe; color: #1e3a8a; }
.badge-warning { background: #fef3c7; color: #92400e; }
```

### 5.3 モード選択基準

- モノクロ：案内文、通知文、依頼書、社内文書、議事録、シンプルな文書
- カラー：社外提案書、分析レポート、プレゼン、ダッシュボード、図表重視文書
- ユーザーが「カラーで」「シンプルに」等を明示した場合はユーザー指示を優先する

---

## 6. 文書分類 (Document Classification)

HTML Artifact 生成前に、文書の性質とレイアウト類型を判定する。

### 6.1 `doc_nature`

#### `doc_nature = "legal"` の条件

以下を含む場合は `legal` と判定する。

- 警告書
- 内容証明
- 通知書
- 契約書
- 覚書
- 念書
- 訴状
- 督促状
- 「法的に通用する」「法務部」「弁護士」「損害賠償」「差止請求」等の表現

#### `doc_nature = "general"` の条件

上記以外の一般ビジネス文書はすべて `general` とする。

### 6.2 `doc_layout`

#### `doc_layout = "letter"` の条件

以下を含む場合は `letter` と判定する。

- 案内文
- 通知文
- 招待状
- 依頼書
- 警告書
- 内容証明系文書
- 督促状
- 社外向けの一対一通知文

#### `doc_layout = "document"` の条件

以下を含む場合は `document` と判定する。

- 提案書
- 報告書
- 調査レポート
- 仕様書
- 社内回覧
- 議事録
- 手順書
- ダッシュボード
- 学術レポート

### 6.3 thinking への記録

thinking フィールド冒頭に、必ず以下のように記録すること。

```text
doc_nature: legal
doc_layout: letter
```

または

```text
doc_nature: general
doc_layout: document
```

---

## 7. 文書タイプ判断マトリクス (Decision Matrix)

### 7.1 優先順位

ページ分割時は、以下の優先順位で判断すること。

1. 技術的安定性（印刷再現性、表示崩れ防止、フッター干渉回避、描画完了性）
2. ページ容量計算ルール
3. 文書タイプとしての推奨レンジ・通常上限
4. デザイン上の見栄え

### 7.2 文書タイプ表

| 文書種別 | 表紙 | カラーモード | ページ装飾 | レイアウト | 推奨レンジ | 通常上限 | 備考 |
|---|---|---|---|---|---|---|---|
| 案内文・通知文・招待状 | なし | モノクロ | なし | letter | 1〜2ページ | 2ページ | 安全分割が必要なら 3ページ可 |
| 警告書・内容証明・督促状 | なし | モノクロ | なし | letter | 1〜2ページ | 3ページ | 前付けを厳格運用 |
| 社内回覧・依頼書 | なし | モノクロ | 原則なし | letter または document | 1〜2ページ | 3ページ | 目的に応じて判断 |
| 議事録・簡易報告書 | なし | モノクロ | なし | document | 1〜3ページ | 4ページ | 表や注記が多い場合は超過可 |
| 社内向け提案書・報告書 | あり | モノクロ（カラー指示があればカラー） | あり可 | document | 4〜6ページ | 8ページ | 安全性確保のため超過可 |
| 社外向け提案書・プレゼン | あり | カラー推奨 | あり推奨 | document | 5〜8ページ | 12ページ | 図表密度が高い場合は超過可 |
| 分析・調査レポート | あり | カラー推奨（図表多い場合） | あり可 | document | 3〜6ページ | 8ページ | 表・グラフ量に応じて柔軟に分割 |
| ダッシュボード・KPI | なし | カラー必須 | あり可 | document | 1〜2ページ | 3ページ | グラフ密度が高い場合は超過可 |

### 7.3 解釈ルール

- 推奨レンジは見た目のまとまりの目安であり、強制条件ではない
- 通常上限は原則値であり、安全なページ分割のための超過を許容する
- 各ページの過密化を防げない場合、ページ数超過を許容して分割する
- 体裁より、印刷プレビューとページ下端の安定性を優先する
- `doc_layout = "letter"` の場合、ページ装飾は原則として用いない

---

## 8. ビジネスレター前付け (Opening Block)

### 8.1 対象

以下の文書では本章を適用する。

- 案内文
- 通知文
- 招待状
- 依頼書
- 警告書
- 内容証明系文書
- 督促状
- その他、社外向けレター形式文書

### 8.2 読み順の原則

前付けは上から順に、以下の順で配置すること。

1. 日付（必要に応じて文書番号を含む）
2. 宛先
3. 差出人
4. 件名
5. 本文

### 8.3 視覚配置の原則

- 日付は右上に独立ブロックとして置く
- 宛先は日付の下に左寄せで置く
- 差出人は宛先の下に右寄せで置く
- 件名は前付けブロックの後に中央配置する
- 宛先と差出人は同一ベースライン上の均等2カラムにしない
- HTML の記述順と、視線上の読み順を一致させること

### 8.4 許容事項

- 差出人は宛先の斜め右下に見える配置を許容する
- 文書番号は日付の上または同一ブロック内に右寄せで配置してよい
- 文末署名型も存在するが、通知文・警告文・依頼文では冒頭配置を優先する

### 8.5 禁止パターン

- 宛先と差出人を 50:50 の左右2カラムで同列表示すること
- `display: table` / `grid` / `flex` による均等2分割で前付けを組むこと
- 左セルに宛先、右セルに日付と差出人を入れた 1 行ヘッダー構成にすること
- 読み順より左右整列を優先すること
- レター文書の 1 ページ目にページ上端装飾帯を置くこと

### 8.6 推奨CSS

```css
p.no-indent,
.date-block p,
.recipient-block p,
.sender-block p,
.title-block p {
  text-indent: 0;
}

.date-block {
  text-align: right;
  margin-bottom: 16pt;
}

.date-block p {
  margin-bottom: 2pt;
}

.recipient-block {
  width: 56%;
  margin-bottom: 12pt;
}

.recipient-block p {
  margin-bottom: 2pt;
}

.sender-block {
  width: 52%;
  margin-left: auto;
  text-align: right;
  margin-bottom: 18pt;
}

.sender-block p {
  margin-bottom: 2pt;
}

.title-block {
  margin: 8pt 0 14pt 0;
  text-align: center;
}
```

### 8.7 正例

```html
<div class="date-block">
  <p class="no-indent">文書番号：TM-2026-03-01</p>
  <p class="no-indent">2026年3月26日</p>
</div>

<div class="recipient-block">
  <p class="no-indent">株式会社ネクストブリッジ</p>
  <p class="no-indent">代表取締役　山田 太郎　様</p>
</div>

<div class="sender-block">
  <p class="no-indent">アルファリンク株式会社</p>
  <p class="no-indent">法務・知的財産室</p>
</div>

<div class="title-block">
  <h1>商標権侵害に関する警告通知</h1>
</div>
```

### 8.8 NG例

```html
<!-- NG: 宛先と差出人を同列2カラムにしている -->
<div class="header-grid">
  <div class="header-left">
    <div class="recipient-block">...</div>
  </div>
  <div class="header-right">
    <div class="date-block">...</div>
    <div class="sender-block">...</div>
  </div>
</div>
```

---

## 9. 表紙スタイル自動選択 (Cover Style Auto-Selection)

### 9.1 優先順位

1. `doc_layout = "letter"` の場合は表紙を付けない
2. ユーザー明示指定
3. コンテンツ自動判定
4. 非該当時は `DARK_NAVY`

### 9.2 ユーザー明示指定ルール

- 「学術論文スタイル」「論文風」 → `ACADEMIC`
- 「ビジネス計画書スタイル」「提案書風」 → `LIGHT_BUSINESS`
- 「コーポレートスタイル」「年次報告書風」 → `CORPORATE`
- 「テクニカルスタイル」「仕様書スタイル」 → `TECHNICAL`
- 「ミニマルスタイル」「シンプルなデザイン」 → `MINIMAL`
- 「ダークネイビー」「現行スタイル」 → `DARK_NAVY`

### 9.3 コンテンツ自動判定ルール

- `ACADEMIC`：論文、研究報告、考察、abstract、要旨、参考文献、学術
- `LIGHT_BUSINESS`：事業計画、ビジネスプラン、提案書、計画書、企画書
- `CORPORATE`：年次報告、アニュアルレポート、IR資料、決算報告、経営報告
- `TECHNICAL`：仕様書、マニュアル、設計書、APIドキュメント、技術仕様、README
- `MINIMAL`：エッセイ、コラム、随筆、文芸、詩
- `DARK_NAVY`：機密、社内限、CONFIDENTIAL、または非該当時のデフォルト

---

## 10. 表紙パターン定義 (Cover Patterns)

### 10.1 DARK_NAVY

用途：社内機密報告書、重要文書、一般的な正式文書

```css
.cover {
  background: #1e3a8a;
  color: #fff;
  justify-content: space-between;
  padding: 20mm 25mm;
}
```

### 10.2 ACADEMIC

用途：論文、研究報告、調査報告書  
特徴：静かな構図、余白重視、過度な装飾なし

### 10.3 LIGHT_BUSINESS

用途：事業計画書、提案書、企画書  
特徴：明るい背景、適度な区切り、読みやすさ重視

### 10.4 CORPORATE

用途：年次報告書、IR資料、経営報告書  
特徴：信頼感、整った罫線、情報整理優先

### 10.5 TECHNICAL

用途：仕様書、マニュアル、設計書、手順書  
特徴：見出しの階層明確化、図表整理、可読性重視

### 10.6 MINIMAL

用途：エッセイ、コラム、シンプルな企画書  
特徴：装飾最小、タイポグラフィ中心

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

- CDN 読み込みタグと初期化定義は必ず `<head>` 内に記述すること
- `splitArtifactPages` は `<head>` 内容を全ページに複製する
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
  padding: 12pt;
  background: var(--color-bg-accent);
  font-size: var(--text-sm);
  font-family: var(--font-heading);
  color: var(--color-muted);
  text-align: center;
}
```

### 11.5 インタラクティブ要素初期化ルール

- 要素ごとに存在確認し、存在するもののみ初期化する
- 初期化済みフラグは要素単位で持つ
- 複数グラフを 1 つの条件で束ねない
- 全要素が見つかるまで無限待機する設計を避ける
- 継続ポーリングは、当該ページに未初期化要素が残る場合のみ継続する
- 1 ページ内に該当要素が存在しない場合でも、エラー終了しない

---

## 12. 表と図の選択基準 (Table vs Chart Decision)

### 12.1 表を使うべき場面

- 比較軸が 2 次元以上
- 数値を正確に読ませたい
- テキストと数値が混在する
- 項目数が 7 件以上
- 条件・仕様・スペック一覧
- アクションアイテム、チェックリスト

### 12.2 グラフを使うべき場面

- 時系列の変化
- 構成比の可視化
- カテゴリ間の大小比較
- 複数指標の相対比較
- 実データが存在する場合のみ

### 12.3 どちらも不要な場面

- 数値が 1〜2 個のみ
- 定性的説明が中心
- データが不足している
- レター文書の主文において図示が本質でない場合

### 12.4 サンプルデータ利用条件

原則として、グラフは実データに基づいて生成する。  
ただし、以下のすべてを満たす場合に限り、サンプル用途での架空データ使用を許容する。

- ユーザーがサンプル・モック・ダミー用途であることを明示している
- ユーザーが架空データの使用を明示的に許可している
- 文中または図表注記でサンプルデータであることが明確である
- 誤認を招く実績報告や外部提出資料に転用されない前提である

---

## 13. グラフ種別の選択基準 (Chart Type Selection)

| データの性質 | 推奨グラフ型 | 禁止・非推奨 | 備考 |
|---|---|---|---|
| 時系列・推移 | line | pie | 時間軸は X 軸 |
| カテゴリ比較 | bar | radar | 項目数 2〜8 |
| 構成比 | pie / doughnut | line | 5項目以下 |
| 多指標比較 | radar | bar | 3〜8軸 |
| 相関・分布 | scatter | pie | 外れ値説明を本文に |
| 累積・内訳 | stacked bar | line | 合計値も明示 |
| 進捗・達成率 | horizontal bar | radar | 100%ライン明示 |

### 13.1 Chart.js テンプレート

```html
<canvas id="chart-1"
        data-chart-role="sales-trend"
        style="max-height: 230pt; margin: auto; display: block;"
        data-fallback="グラフデータ（テキスト代替）"></canvas>
<p class="caption">図1：〇〇の推移（2024〜2026年）</p>
```

### 13.2 印刷安定化ルール

- 印刷・PDF出力対象の Chart.js は `animation: false` を原則とする
- 即時出力が想定される場面でアニメーション付き描画を使ってはならない
- フォント読み込みや CDN 読み込み直後の未描画状態を前提に、初期化待機を組み込むこと
- 描画完了前提のスクリーンショット・印刷を行わないこと

### 13.3 配置ルール

- 1 ページに配置する Chart.js canvas は原則 1 点までとする
- グラフ 1 点と表 1 本以上の同居は危険構成として保守的に扱う
- グラフを置くページでは、追加テキストを最小限に抑える
- チャートが描画されなくても意味が伝わるよう、`data-fallback` は必須とする
- レター文書では、図表は必要性が高い場合のみ用いる

---

## 14. Notice Boxes（注記・強調ボックス）

旧 `callout` 系は全面廃止とする。  
Web UI 的でビジネス文書らしくないため、`notice` 系で統一する。

### 14.1 使用禁止

```html
<div class="callout callout-important">...</div>
<div class="callout callout-warning">...</div>
<div class="callout callout-note">...</div>
<div class="callout callout-success">...</div>
```

### 14.2 使用する3種類

- `.notice-box`：重要事項、正式な強調
- `.notice-dash`：注意、確認事項
- `.notice-side`：補足、参考、本文に溶け込ませたい注記

### 14.3 CSS定義

```css
p.no-indent,
.notice-box p, .notice-dash p, .notice-side p { text-indent: 0; }

.notice-box {
  border: 1.5pt solid var(--color-heading);
  padding: 8pt 14pt;
  margin: 10pt 0;
  font-size: var(--text-base);
  line-height: 1.6;
  background: #fff;
}

.notice-box-title {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: bold;
  color: var(--color-heading);
  text-align: center;
  border-bottom: 0.5pt solid var(--color-border);
  margin-bottom: 6pt;
  padding-bottom: 3pt;
  letter-spacing: 0.1em;
}

.notice-dash {
  border: 1pt dashed var(--color-heading);
  padding: 7pt 14pt;
  margin: 10pt 0;
  font-size: var(--text-base);
  line-height: 1.6;
  background: #fff;
}

.notice-dash-title {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: bold;
  color: var(--color-heading);
  margin-bottom: 4pt;
  letter-spacing: 0.05em;
}

.notice-side {
  border: none;
  border-left: 3pt solid var(--color-rule);
  padding: 3pt 0 3pt 12pt;
  margin: 8pt 0;
  font-size: var(--text-base);
  line-height: 1.6;
  background: transparent;
}

.notice-side-title {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: bold;
  color: var(--color-heading);
  margin-bottom: 3pt;
}
```

### 14.4 配置ルール

- `.notice-box` と `.notice-dash` は、大きな表の直後かつページ末尾に配置しない
- 長文セルを含む表の直後では、`notice-box` / `notice-dash` は次ページへ送ることを優先する
- `.notice-side` のみ、短文であれば本文途中の補足として同ページ配置を許容する
- 表 2 本以上が同居するページでは、`notice-box` / `notice-dash` の追加を強く避ける
- レター文書では、notice の使い過ぎを避け、本文の静かな流れを壊さないこと

---

## 15. インライン強調クラス

```css
.text-emphasis {
  font-weight: bold;
  color: var(--color-heading);
}

.text-underline {
  font-weight: bold;
  text-decoration: underline;
  text-underline-offset: 2pt;
}

.text-legal-accent {
  color: #8b0000;
  font-weight: bold;
}

.text-legal-underline {
  font-weight: bold;
  text-decoration: underline;
  text-underline-offset: 2pt;
}
```

### 15.1 使用ルール

- `.text-emphasis`：全 `doc_nature` 共通
- `.text-underline`：全 `doc_nature` 共通
- `.text-legal-accent`：`legal` 専用
- `.text-legal-underline`：`legal` 専用

---

## 16. 目次 (Table of Contents)

本文 4 ページ以上、かつ H2 が 4 つ以上ある場合は目次を付与する。  
ただし、`doc_layout = "letter"` の場合は原則として目次を付けない。

```css
.toc-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8pt;
}
.toc-table tr {
  border-bottom: 1px dotted var(--color-border);
}
.toc-table td {
  padding: 6pt 4pt;
  border: none;
  font-size: var(--text-base);
}
.toc-num {
  width: 20pt;
  color: var(--color-muted);
  font-family: var(--font-heading);
}
.toc-title {
  font-family: var(--font-body);
}
.toc-page {
  width: 24pt;
  text-align: right;
  font-family: var(--font-heading);
  color: var(--color-muted);
}
.toc-h3 td {
  font-size: var(--text-sm);
  color: var(--color-muted);
}
```

---

## 17. 数値・日付フォーマット

- 数値は桁区切りを統一する
- 日付は和文文書に適した表記を使う
- URL、コード、識別子は本文数値ルールと混同しない
- レター文書では、日付は右上ブロックに置き、文中と混在させない

---

## 18. 画像・ロゴ代替 (Image / Logo Handling)

### 18.1 ロゴ代替

```css
.logo-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--color-heading);
  padding: 4pt 10pt;
  font-family: var(--font-heading);
  font-size: 10pt;
  letter-spacing: 0.1em;
  color: var(--color-heading);
}
```

### 18.2 画像代替

```css
.img-placeholder {
  width: 92%;
  height: 80pt;
  background: var(--color-bg-accent);
  border: 1px dashed var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  color: var(--color-muted);
  font-family: var(--font-heading);
  margin: 8pt auto;
}
```

### 18.3 運用ルール

- 外部画像URLの読込は禁止
- レター文書では、原則として画像を使わない
- 提案書・報告書では、画像は本文の理解補助に限る
- ロゴが必要な場合も、印刷再現性を損なわない範囲で用いる

---

## 19. 付録 (Appendix)

付録は本文の最終ページの後に配置する。  
参考文献、略語表、補足表などをここにまとめる。

```css
.reference-list {
  padding-left: 20pt;
  margin: 8pt 0;
}
.reference-list li {
  margin-bottom: 8pt;
  font-size: var(--text-base);
  line-height: 1.6;
}
.ref-title {
  display: block;
  font-family: var(--font-heading);
  color: var(--color-heading);
}
.ref-source {
  display: block;
  font-size: var(--text-sm);
  color: var(--color-muted);
  margin-top: 2pt;
}
```

---

## 20. ページ容量計算ルール (Page Count)

### 20.1 前提

padding 25mm、フォントサイズ 10.5pt、行間 1.6 の条件下で、1ページの理論最大行数は約 41 行である。  
ただし安全運用のため、実運用上の上限は **28 行** とする。

- 24行以下 → 安全圏
- 25〜28行 → ギリギリ判定、原則分割
- 28行超 → 必ず分割

#### 20.1.1 フッター安全域込みの運用

- 絶対配置のページ番号またはフッター要素を使う場合、実務上は **24行以下** を優先目標とする
- 25行以上のページは、推奨ページ数内であっても原則分割する
- 推奨レンジや通常上限を守るために 25〜28行のページを維持してはならない
- 28行超のページは、文書全体のページ数が通常上限を超える場合でも必ず分割する

### 20.2 換算表

| 要素 | 換算行数 |
|---|---|
| h1（タイトル・件名） | 4行 |
| h2（セクション見出し） | 3行 |
| h3（小見出し） | 2.5行 |
| 本文1行（〜30文字） | 1.5行 |
| 本文1行（31〜60文字） | 1.5行 |
| 本文1行（61文字以上） | 2.5行 |
| 段落間の余白（`<p>`タグ1つ） | 1行 |
| 「記」「以上」「敬白」等の1行要素 | 2行 |
| 文書番号ブロック | 1〜2行 |
| 日付ブロック | 2行 |
| 宛先ブロック | 3〜4行 |
| 差出人ブロック | 3〜4行 |
| ビジネスレター前付け全体 | 8〜12行 |
| ビジネスレター本文（3段落程度） | 10行 |
| 表：ヘッダー行 | 2行 |
| 表：本文行（セル内テキスト1行） | 2行 |
| 表：本文行（セル内テキスト2〜3行） | 4行 |
| 表：本文行（セル内テキスト4行以上） | 6行 |
| `.notice-box / .notice-dash`（テキスト〜2行） | 5行 |
| `.notice-box / .notice-dash`（テキスト3〜5行） | 7行 |
| `.notice-box / .notice-dash`（テキスト6行以上） | 9行 |
| `.notice-side`（テキスト〜2行） | 3行 |
| `.notice-side`（テキスト3〜5行） | 5行 |
| グラフ（Chart.js canvas） | 22行 |
| 画像プレースホルダー（`.img-placeholder`） | 12行 |
| `<hr>` または装飾区切り線 | 1.5行 |
| `.page-body` のフッター安全域 | 3行相当として保守計上 |
| ページ番号フッター（絶対配置） | 0行（ただし本文安全域は別途必須） |

### 20.2A 危険構成

以下のいずれかに該当するページは、推奨ページ数内であっても分割候補とする。

- 表が 3 本以上ある
- 表が 2 本以上あり、かつ `.notice-box` または `.notice-dash` がある
- 長文セル（4行以上換算）が複数ある表を含む
- H2 が 3 本以上あり、かつ表が 2 本以上ある
- グラフ 1 点と表 1 本以上が同居する
- `.notice-box` / `.notice-dash` がページ末尾に来る
- レター文書の 1 ページ目で、前付け・件名・notice・表を過密に詰め込んでいる

### 20.2B 長文セル表の保守見積り

- 狭い列に長文が入る表は、通常より 1 段階重く見積もる
- 改行が発生しやすい列幅の場合、本文行 2〜3 行相当でも 4 行換算を優先する
- 行ごとの見積りが不明な場合は、保守的に 1 段階上で扱う

### 20.2C インタラクティブ要素の保守見積り

- Chart.js canvas は 22 行相当として扱う
- チャート描画用の説明文や補足文がある場合は、別途本文行数を加算する
- グラフを含むページでは、非同期初期化のため内容量をさらに保守的に見積もる
- グラフページは余白を確保し、表・notice を同居させすぎないこと

### 20.3 thinking での計算手順

1. 生成予定要素を上から順に列挙する
2. 各要素を換算表の行数へ変換する
3. ページごとの合計行数を計算する
4. 25行以上なら保守的に分割する
5. 分割後の各ページも再計算し、24行以下を目安に調整する
6. 文書全体のページ数が推奨レンジまたは通常上限を超える場合でも、表示安定性と印刷再現性を優先する
7. ページ数削減のために、表・notice・長文段落を同一ページへ過密配置してはならない

---

## 21. 技術的安定性 (Technical Stability)

### 21.1 ResizeObserver

高さ通知は `ResizeObserver` を使い、`artifact-resize` を `postMessage` すること。

### 21.2 ストリーミング初期化

初期化コードは `<head>` に置き、`requestAnimationFrame` でポーリングすること。

### 21.3 印刷・プレビュー安定化の4大ルール

#### ルール1：body padding は絶対禁止

```css
/* NG */
body { padding: 15mm 0; }
```

理由：`scrollHeight` が膨張し、iframe 高さが誤って伸びるため。

#### ルール2：overflow: hidden は必須

```css
html, body {
  overflow: hidden;
}
```

理由：省略するとコンテンツが iframe 外にはみ出し、サイズ通知が不安定になるため。

#### ルール3：印刷時の高さ固定は必須

```css
@media print {
  .page {
    height: 296.8mm;
  }
}
```

理由：`min-height` のみでは印刷時のページ境界が安定しないため。

#### ルール4：フッター安全域は必須

```css
.page-body {
  padding-bottom: 14mm;
}
```

理由：本文が下端フッター領域へ侵入し、ページ番号や文書番号と重なるのを防ぐため。

### 21.4 印刷ずれ防止

```css
@page { size: A4; margin: 0; }
```

この 1 行を省略すると、ブラウザ標準印刷余白が介入し、印刷プレビューで右ズレ・見切れが発生する。

### 21.5 チャート描画安定化ルール

- Chart.js を含む文書では、描画完了前の印刷開始を前提にしてはならない
- HTML 側では `animation: false` を原則設定とする
- 実行環境側では、印刷用ウィンドウの `load` 後に短い待機時間を設けてから `print()` を呼び出すことを推奨する
- 待機時間の目安は 300ms〜700ms とし、標準値は 500ms を推奨する
- 描画の完了を確認せずに `window.print()` を直ちに実行する実装を避けること

### 21.6 レンダラ実装要件

ArtifactPanel 等のフロントエンド実装者は、以下を考慮すること。

- 分割表示用 iframe は、必要に応じて `allow-same-origin` を含む sandbox 設定を検討する
- CDN 利用時の互換性と描画安定性を確認する
- `document.write()` 後すぐに印刷を開始しない
- HTML 作者にすべての安定性責務を押しつけず、レンダラ側でも待機と再描画余地を確保する

---

## 22. 明示的禁止事項まとめ

以下は全体を通じて禁止とする。

- 外部通信
- 外部画像URL読み込み
- `callout` 系の使用
- `html, body` の背景色・余白の追加
- 固定CSSの改変
- 原則として架空データによるグラフ生成
- 推奨ページ数を守るための過密レイアウト
- フッター安全域なしの絶対配置ページ番号
- 長文表の直後に `notice-box` / `notice-dash` を詰め込むこと
- 他ページの要素存在を前提としたチャート一括初期化
- `if (!a || !b || !c)` 型の全要素存在前提チャートガード
- 印刷対象チャートでのアニメーション付き描画
- 描画完了前提を欠いた即時 `print()` 実行
- レター文書におけるトップボーダーや色帯の強制適用
- 宛先と差出人の均等2カラム同列配置
- 日付・宛先・差出人の読み順を壊すヘッダーレイアウト
- レター文書での過剰なページ装飾

### 22.1 例外規定

以下の場合に限り、架空データによるグラフ生成を許容する。

- ユーザーがサンプル用途であることを明示
- ユーザーが架空データの使用を明示許可
- 文中にサンプルデータである旨を明記
- 実績資料や対外文書として誤用しない前提

---

## 23. 生成時の最終チェックリスト

- `<!DOCTYPE html>` から始まっているか
- `<meta charset="UTF-8">` があるか
- `@page { size: A4; margin: 0; }` があるか
- `html, body` が `margin: 0; padding: 0; overflow: hidden; background: transparent;` になっているか
- `.page` の最終ページ以外に `style="page-break-after: always;"` があるか
- 本文が `.page-body` でラップされているか
- `.page-body` に下部安全域が確保されているか
- `callout` を使っていないか
- `notice` 系を適切に使っているか
- `doc_nature` と `doc_layout` を thinking に記録しているか
- 表紙パターンが文書内容に合っているか
- 25行以上のページが残っていないか
- 28行ルールを超えていないか
- 表 3 本以上、または 表 2 本＋`notice` の危険構成ページがないか
- 長文セルを含む表を保守的に再見積りしたか
- 絶対配置フッターと本文が視覚的に干渉していないか
- 外部通信・外部画像がないか
- 各チャートが要素単位で独立初期化されるか
- 他ページ要素の存在を前提にした初期化コードになっていないか
- `data-fallback` が付与されているか
- 印刷対象チャートで `animation: false` を設定したか
- チャートを含むページで表や notice を詰め込みすぎていないか
- 印刷プレビューでチャート欠落がないか
- 分割後の各ページ iframe 単位でも描画が成立するか
- レター文書で `.letter-page` を使用しているか
- レター文書でページ上端装飾が無効化されているか
- 日付が右上の独立ブロックになっているか
- 宛先が日付の下に配置されているか
- 差出人が宛先の下で右寄せになっているか
- 宛先と差出人が均等2カラムで同列表示されていないか
- 前付けのHTML記述順と視覚順が一致しているか
- 件名が前付けブロックの後に中央配置されているか

---

## 24. 運用補足

### 24.1 ページ数と安全性の関係

- ページ数が少ないこと自体は品質ではない
- 文書全体が短くても、個別ページが過密なら不適切である
- 安全に印刷できることを、体裁上のコンパクトさより優先する

### 24.2 分割をためらわない条件

以下の条件では、推奨レンジ超過を許容してよい。

- 表が多い
- セル内文章が長い
- `notice-box` / `notice-dash` を含む
- H2 が多い
- ページ番号や文書番号など下端固定要素を持つ
- Chart.js などの非同期描画要素を含む
- レター文書で前付けと本文冒頭が過密になっている

### 24.3 今後の運用推奨

- HTML 作者は「単一HTML」ではなく「分割後実行環境」を前提に設計すること
- フロントエンド実装者は、印刷・プレビュー・分割描画を一体で検証すること
- サンプルHTMLのレビューでは、通常表示だけでなく印刷プレビューを必ず確認すること
- チャートを含むテンプレートは、今後すべて個別初期化方式で統一すること
- レター文書テンプレートは、提案書・報告書テンプレートと分離して管理すること

---

*このガイドライン v2.0 に従うことで、LLM および実装者は文書の性質、情報密度、図表の必要性、ページ構成、印刷要件、前付けの読み順、分割後ランタイムの挙動を総合的に判断し、実用的で崩れにくい HTML Artifact を安定して生成できる。*
