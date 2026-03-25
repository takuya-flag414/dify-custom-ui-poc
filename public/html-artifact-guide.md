# HTML Artifact 生成ガイドブック (フォーマルビジネス文書用) v1.6

本ドキュメントは、Dify カスタム UI において高品質な複数ページ HTML Artifact（ビジネス提案書、報告書、案内文等）を生成するための技術仕様およびデザイン指針を定義したものです。LLM が Artifact を生成する際、このガイドに従うことで、プレビューの整合性、印刷の再現性、およびプロフェッショナルな意匠を担保できます。

*v1.6 更新内容：表・図の選択基準（Section 8）、グラフ種別の選択基準（Section 9）、強調ボックスの定義（Section 10）、目次ルール（Section 11）、数値・日付フォーマット（Section 12）、画像・ロゴ代替ルール（Section 13）、CDNフォールバック（Section 7.3）、リストスタイル統一（Section 3.3）、付録の扱い（Section 14）を追加*

***

## 1. 基本構造 (Document Structure)

ドキュメントは `<!DOCTYPE html>` を含む完全な HTML 構造とし、各ページを独立した `<div class="page">` でラップします。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>ドキュメントタイトル</title>
    <!-- スタイル定義は内部 CSS で記述 -->
    <script>
      // 1. ストリーミング対応: ポーリングによる初期化 (Guide 10.1 準拠)
      function initInteractiveElement() {
          const el = document.getElementById('target-id');
          if (el && typeof Library !== 'undefined') {
              // 初期化実行
              window.__initFinished = true;
          } else if (!window.__initFinished) {
              requestAnimationFrame(initInteractiveElement);
          }
      }
      initInteractiveElement();
    </script>
</head>
<body>
    <div class="page" style="page-break-after: always;">
        <!-- ページ 1 の内容 -->
    </div>
    <div class="page">
        <!-- 最終ページの内容 -->
    </div>
    <script>
      // 2. 印刷保証: 同期的トリガー (Guide 10.2 準拠)
      initInteractiveElement();

      // 3. リサイズ通知: ResizeObserver による安定化 (Guide 10.3 準拠)
      if (window.ResizeObserver) {
          const ro = new ResizeObserver(() => {
              window.parent.postMessage({ type: 'artifact-resize', height: document.documentElement.scrollHeight }, '*');
          });
          ro.observe(document.body);
      }
    </script>
</body>
</html>
```

***

## 2. ページ分割と表示の同期 (Pagination & Sync)

フロントエンドのページ分割ロジック（`splitArtifactPages`）と同期するため、以下のルールを厳守してください。

- **インライン改ページ指定**: フロントエンドはインラインの `style` 属性をパースしてページを分割します。すべての `.page` 要素（最終ページを除く）に必ず **`style="page-break-after: always;"`** を直接付与してください。CSS クラス経由での指定は動作しません。
- **最終ページの空行防止**: 最終ページには `page-break-after` を付与しないでください。また、末尾の `<script>` タグによる余分な白紙が発生しないよう、コンテンツの直後に配置してください。

***

## 3. スタイリング仕様 (CSS Specifications)

### 3.1 ページ設定と印刷精度

A4サイズ（210mm x 297mm）を基準とし、プレビューと印刷のズレを最小化します。

```css
@page {
  size: A4;
  margin: 0;
}

:root {
  --page-width: 210mm;
  --page-height: 297mm;
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

### 3.2 タイポグラフィ

```css
:root {
  --font-body:    "Hiragino Mincho ProN", "Yu Mincho", serif;
  --font-heading: "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
  --font-mono:    "Courier New", "Osaka-Mono", monospace;

  /* フォントサイズ基準（A4印刷標準） */
  --text-base: 10.5pt;
  --text-sm:   9pt;
  --text-h1:   20pt;
  --text-h2:   14pt;
  --text-h3:   11.5pt;
}

body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.6;
  letter-spacing: 0.02em;
  color: var(--color-body);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

h1 { font-family: var(--font-heading); font-size: var(--text-h1);
     line-height: 1.3; color: var(--color-heading); }
h2 { font-family: var(--font-heading); font-size: var(--text-h2);
     line-height: 1.3; color: var(--color-heading);
     border-bottom: 1.5px solid var(--color-rule); padding-bottom: 3pt; }
h3 { font-family: var(--font-heading); font-size: var(--text-h3);
     line-height: 1.3; color: var(--color-heading); }

/* 見出し直前での改ページ防止 */
h2, h3 { break-before: avoid; break-after: avoid; }

/* 表 */
table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
th, td { border: 1px solid var(--color-border); padding: 5pt 8pt; font-size: var(--text-base); }
th { background: var(--color-bg-accent); font-family: var(--font-heading); color: var(--color-heading); }

/* キャプション */
.caption {
  text-align: center;
  font-size: 8.5pt;
  color: #000;
  font-family: var(--font-body);
  font-weight: normal;
  margin-top: 5pt;
  margin-bottom: 20pt;
}
```

### 3.3 リスト・箇条書きスタイル

リストは以下の統一スタイルを適用してください。LLM が毎回独自実装することを禁止します。

```css
/* 箇条書き（順不同） */
ul {
  margin: 6pt 0 10pt 0;
  padding-left: 18pt;
  list-style-type: disc;
}
ul li {
  margin-bottom: 4pt;
  line-height: 1.6;
  font-size: var(--text-base);
}

/* 番号付きリスト */
ol {
  margin: 6pt 0 10pt 0;
  padding-left: 20pt;
  list-style-type: decimal;
}
ol li {
  margin-bottom: 4pt;
  line-height: 1.6;
  font-size: var(--text-base);
}

/* 記書き用（件名形式文書） */
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

/* ネストは2階層まで */
ul ul, ol ol { margin: 3pt 0 3pt 12pt; }
```

***

## 4. カラーモード (Color Mode)

### 4.1 モード選択の判断基準

LLMは以下の基準に従い、**モノクロ（デフォルト）** と **カラー** を判断してください。

```
【モノクロを使用する（デフォルト）】
  ✅ ユーザーから色に関する指示がない
  ✅ 案内文・通知文・招待状・依頼書・報告書（簡易）
  ✅ 社内文書・回覧文書・議事録
  ✅ テキスト主体で図表が少ない文書
  ✅ 「シンプルに」「ビジネス文書として」等の指示がある

【カラーを使用する】
  ✅ ユーザーが「カラーで」「デザインを重視して」等と明示した
  ✅ 経営層・社外向けの提案書・プレゼン資料
  ✅ データや図表が多く、色による識別が必要な分析レポート
  ✅ ダッシュボード・KPIレポート
  ✅ 表紙付きの正式文書（Section 5 参照）
```

### 4.2 モノクロパレット（デフォルト）

```css
/* theme-mono */
:root {
  --color-primary:    #000000;
  --color-accent:     #000000;
  --color-heading:    #000000;
  --color-body:       #000000;
  --color-muted:      #000000;
  --color-border:     #000000;
  --color-rule:       #000000;
  --color-bg-accent:  #f0f0f0;
  --color-bg-cover:   #1a1a1a;
}
```

### 4.3 カラーパレット

CMYK印刷においても安定して再現される色域を選定済みです。

```css
/* theme-color */
:root {
  --color-primary:    #1e3a8a;   /* ダークブルー：見出し・アクセントライン */
  --color-accent:     #8b0000;   /* ダークレッド：強調・重要マーカー */
  --color-heading:    #000000;   /* 漆黒：見出しテキスト */
  --color-body:       #000000;   /* 漆黒：本文 */
  --color-muted:      #000000;   /* 漆黒：補足・フッター */
  --color-border:     #b0b8c1;   /* 罫線 */
  --color-rule:       #1e3a8a;   /* 区切り線 */
  --color-bg-accent:  #f8fafc;   /* 薄い背景：表ヘッダー等 */
  --color-bg-cover:   #1e3a8a;   /* 表紙背景 */
}

/* バッジクラス（カラーモード時のみ使用） */
.badge-success { background: #d1fae5; color: #065f46; }
.badge-primary { background: #dbeafe; color: #1e3a8a; }
.badge-warning { background: #fef3c7; color: #92400e; }
```

### 4.4 カラー使用ルール

| 要素 | 使用変数 |
|---|---|
| H1・表紙タイトル | `--color-heading` |
| H2・セクション見出し | `--color-primary`（border-bottomに使用） |
| H3・小見出し | `--color-primary` |
| 本文テキスト | `--color-body` |
| 補足・キャプション・フッター | `--color-muted` |
| 表のヘッダー背景 | `--color-bg-accent` |
| 表の境界線 | `--color-border` |
| 強調・重要事項 | `--color-accent` |
| 表紙背景 | `--color-bg-cover` |

### 4.5 アクセシビリティ（コントラスト比）

印刷物・画面表示の両方で判読性を確保するため、WCAG AA 基準（コントラスト比 4.5:1 以上）を満たしてください。

```
【要注意の組み合わせ（使用禁止）】
  ❌ 黄背景（#fef3c7）に白文字
  ❌ 水色背景（#dbeafe）に白文字
  ❌ グレー背景（#f0f0f0）に #aaa 文字

【安全な組み合わせ（推奨）】
  ✅ 白背景（#fff）に #000（21:1）
  ✅ #1e3a8a 背景に白文字（9.8:1）
  ✅ #d1fae5 背景に #065f46 文字（5.2:1）
  ✅ #fef3c7 背景に #92400e 文字（4.8:1）
```

***

## 5. 文書タイプと表紙の判断基準 (Document Type)

### 5.1 シンプル型（表紙なし）

案内文・通知文・招待状・社内回覧など、1〜2ページで完結するシンプルな文書に適用します。

**レイアウト原則:**

- 表紙を設けず、第1ページから本文を開始する
- 日付（右上）・宛先（左）・差出人（右）・件名（中央）・本文・結語の伝統的なビジネスレター形式
- 装飾・罫線・背景色は最小限に抑え、余白と文字組みのみで品位を表現する

**実装例:**

```html
<div class="page">
  <div style="text-align: right; margin-bottom: 8mm;">2026年3月25日</div>
  <div style="margin-bottom: 12mm;">取引先各位</div>
  <div style="text-align: right; margin-bottom: 16mm;">
    株式会社〇〇<br>営業部長　山田 太郎
  </div>
  <div style="text-align: center; font-family: var(--font-heading);
              font-size: 13pt; font-weight: bold; margin-bottom: 12mm;">
    〇〇のご案内
  </div>
  <div class="letter-body">
    <p>謹啓　〜</p>
  </div>
  <div style="text-align: right; margin: 8mm 0;">敬白</div>
  <div style="text-align: center; margin: 8mm 0;
              font-family: var(--font-heading);">記</div>
  <ol class="kigaki-list"><li>〜</li></ol>
  <div style="text-align: right; margin-top: 8mm;">以上</div>
</div>
```

### 5.2 フォーマル型（表紙あり）

提案書・分析レポート・プレゼン資料など、3ページ以上の正式文書に適用します。

**表紙の必須構成要素:**

```
┌──────────────────────────────────────┐
│  [組織名エリア]（上部）              │
│                                      │
│  [メインタイトル]（中央）            │
│  [サブタイトル・概要]                │
│                                      │
│  [提出情報エリア]（下部）            │
│  提出先 / 作成者 / 作成日            │
└──────────────────────────────────────┘
```

**表紙のHTML実装例:**

```html
<div class="page cover" style="page-break-after: always;">
  <div class="cover-header">
    <span class="cover-org">AIソリューション部</span>
  </div>
  <div class="cover-title-block">
    <div class="cover-label">CONFIDENTIAL</div>
    <h1 class="cover-title">2026年度 第1四半期<br>業務改善提案書</h1>
    <p class="cover-subtitle">社内AI活用による業務効率化に向けた戦略的提言</p>
  </div>
  <div class="cover-footer-block">
    <table class="cover-meta-table">
      <tr><th>提出先</th><td>経営企画部 部長 山田 太郎 様</td></tr>
      <tr><th>作成者</th><td>AIソリューション部 藤井 琢也</td></tr>
      <tr><th>作成日</th><td>2026年3月25日</td></tr>
      <tr><th>文書番号</th><td>AI-2026-Q1-001</td></tr>
    </table>
  </div>
</div>
```

**表紙のCSS（カラー／モノクロ共通・変数で自動切替）:**

```css
.cover {
  background: var(--color-bg-cover);
  color: #ffffff;
  justify-content: space-between;
  padding: 20mm 25mm;
}
.cover-header { border-bottom: 1px solid rgba(255,255,255,0.4); padding-bottom: 8mm; }
.cover-org { font-family: var(--font-heading); font-size: 11pt;
             letter-spacing: 0.08em; color: rgba(255,255,255,0.85); }
.cover-title-block { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.cover-label { font-family: var(--font-heading); font-size: 8pt;
               letter-spacing: 0.2em; color: rgba(255,255,255,0.6); margin-bottom: 6mm; }
.cover-title { font-family: var(--font-heading); font-size: 28pt; font-weight: bold;
               line-height: 1.4; color: #ffffff; margin: 0 0 6mm 0; }
.cover-subtitle { font-family: var(--font-body); font-size: 11pt;
                  color: rgba(255,255,255,0.8); line-height: 1.6; margin: 0; }
.cover-footer-block { border-top: 1px solid rgba(255,255,255,0.4); padding-top: 8mm; }
.cover-meta-table { width: 100%; border-collapse: collapse; }
.cover-meta-table th, .cover-meta-table td {
  padding: 3pt 8pt; font-size: 9pt;
  color: rgba(255,255,255,0.85); border: none;
  background: transparent; font-family: var(--font-heading);
}
.cover-meta-table th { width: 25%; color: rgba(255,255,255,0.55); letter-spacing: 0.05em; }
```

***

## 6. 文書タイプ判断マトリクス (Decision Matrix)

| 文書種別 | 表紙 | カラーモード | 推奨ページ数 | 上限 |
|---|---|---|---|---|
| 案内文・通知文・招待状 | **なし** | **モノクロ** | 1〜2 | 2 |
| 社内回覧・依頼書 | **なし** | **モノクロ** | 1〜2 | 3 |
| 議事録・簡易報告書 | **なし** | **モノクロ** | 1〜3 | 4 |
| 社内向け提案書・報告書 | **あり** | **モノクロ**（カラー指示があればカラー） | 4〜6 | 8 |
| 社外向け提案書・プレゼン | **あり** | **カラー推奨** | 5〜8 | 12 |
| 分析・調査レポート | **あり** | **カラー推奨**（図表多い場合） | 3〜6 | 8 |
| ダッシュボード・KPI | **なし** | **カラー必須** | 1〜2 | 3 |

> **注意**: ユーザーが明示的にカラー指示または「シンプルに」等の指示をした場合は、上記より**ユーザー指示を優先**してください。

***

## 7. 許可ライブラリ (Allowed Libraries)

### 7.1 許可CDN一覧

| ライブラリ | 用途 | 使用条件 |
|---|---|---|
| Chart.js | グラフ・チャート | 実データが存在する場合のみ。架空データ禁止 |
| KaTeX | 数式レンダリング | 数式を含む文書のみ |
| Mermaid.js | フローチャート・組織図 | プロセス説明・構成図が必要な場合のみ |

```html
<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<!-- KaTeX -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
<!-- Mermaid.js -->
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
```

**配置ルール（重要）:**

- CDN読み込みタグ・初期化定義は必ず `<head>` 内に記述してください
- `splitArtifactPages` は `<head>` の内容を全ページに複製するため、複数ページ構成でもライブラリが正しく動作します
- ストリーミング生成に対応するため、`<head>` 内で `requestAnimationFrame` によるポーリング待機を実装してください（Section 10.1 参照）

### 7.2 禁止事項

- 上記以外の外部CDN・外部CSSファイルの読み込み
- `fetch()` / `XMLHttpRequest` による外部通信
- `localStorage` / `sessionStorage` へのアクセス
- `javascript:` スキームの使用
- 外部URLからの `<img src>` 読み込み（Section 13 参照）

### 7.3 CDNフォールバック（読み込み失敗時）

CDNが読み込めない環境（オフライン・ファイアウォール等）での対応を必ず実装してください。

```html
<script>
  // Chart.js フォールバック例
  window.addEventListener('error', function(e) {
    if (e.target && e.target.src && e.target.src.includes('chart.js')) {
      // canvas要素をフォールバック表に差し替え
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
/* フォールバック表示 */
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

**実装ルール:**

- `<canvas>` には必ず `data-fallback="（グラフが表示されない場合のテキスト代替）"` 属性を付与してください
- フォールバックは `<table>` による数値表示を推奨します
- Mermaid が失敗した場合は `<pre>` タグによるテキスト表示にフォールバックしてください

### 7.4 ライブラリ不使用時の推奨代替

| 代替したい要素 | 推奨代替手段 |
|---|---|
| 簡易な棒グラフ | CSSのみで実装（`width` % 指定） |
| 簡易な円グラフ | 表（`<table>`）で数値を代替表示 |
| 矢印フロー | HTML + CSS のみで実装 |

***

## 8. 表と図の選択基準 (Table vs Chart Decision)

LLMは以下の基準に従い、**表（`<table>`）** とグラフ（Chart.js等）の選択を判断してください。毎回の独自判断を禁止します。

### 8.1 表（`<table>`）を使うべき場面

```
✅ 比較軸が2次元以上（行×列の構造がある）
✅ 数値を正確に読み取る必要がある（差額・比率の細かい比較）
✅ テキストと数値が混在している
✅ 項目数が7件以上（グラフは視認性が下がる）
✅ 条件・仕様・スペックの一覧
✅ 議事録のアクションアイテム、チェックリスト
✅ 相互参照が必要なデータ（「表1参照」等）
```

### 8.2 グラフ（Chart.js等）を使うべき場面

```
✅ 時系列の変化・トレンドを視覚的に伝えたい
✅ 全体に占める構成比・割合を示したい
✅ カテゴリ間の大小を一目で伝えたい
✅ 複数指標の相対的バランスを伝えたい
✅ データ件数が2〜6件で推移・比較が主目的
✅ 実際に取得されたデータが存在する場合のみ（架空データ禁止）
```

### 8.3 どちらも不要な場面

```
✅ 数値が1〜2個のみ → インライン強調（<strong>）で本文中に記載
✅ 定性的な説明のみ → 本文テキストまたは箇条書き
✅ データが存在しない → グラフ・表を作らずテキストで代替説明
```

***

## 9. グラフ種別の選択基準 (Chart Type Selection)

### 9.1 選択マトリクス

| データの性質 | 推奨グラフ型 | 禁止・非推奨 | 備考 |
|---|---|---|---|
| 時系列・推移（連続値） | 折れ線（`line`） | 円グラフ・棒グラフ | 時間軸は必ずX軸に |
| カテゴリ比較（大小） | 縦棒（`bar`） | レーダー・折れ線 | 項目数は2〜8件まで |
| 構成比・割合 | 円（`pie`）/ ドーナツ（`doughnut`） | 折れ線・棒 | **5項目以下のみ有効** |
| 多指標の相対評価 | レーダー（`radar`） | 棒グラフ・折れ線 | 指標数は3〜8軸 |
| 2変数の相関・分布 | 散布図（`scatter`） | 円グラフ | 外れ値の説明を本文に |
| 累積・内訳の変化 | 積み上げ棒（`bar stacked`） | 折れ線 | 合計値も表示する |
| 目標達成率・進捗 | 横棒（`bar horizontal`） | レーダー | 100%ラインを明示する |

### 9.2 グラフ使用上の制約ルール

```
【データ件数に関する制限】
  折れ線グラフ   → 系列（凡例）は4本まで。5本以上は表に切り替え
  円グラフ       → 項目数は5件まで。6件以上は「その他」に集約するか表に切り替え
  棒グラフ       → X軸ラベルは8件まで。それ以上は横棒グラフに切り替え
  レーダーチャート → 軸数は3〜8。2軸以下は棒グラフに切り替え

【見た目に関するルール】
  → 凡例はグラフの外側（下部）に配置し、グラフ領域を圧迫しない
  → 軸ラベル・データラベルのフォントサイズは8pt以上を維持する
  → カラーモードでは var(--color-primary) / var(--color-accent) を基調色に使用
  → モノクロモードでは塗りつぶしパターンを濃淡（#000 / #555 / #aaa）で区別する
```

### 9.3 Chart.js 実装テンプレート

```html
<!-- canvas には必ずdata-fallback属性を付与 -->
<canvas id="chart-1" style="max-height: 230pt; margin: auto; display: block;"
        data-fallback="グラフデータ（テキスト代替）"></canvas>
<p class="caption">図1：〇〇の推移（2024〜2026年）</p>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const ctx = document.getElementById('chart-1');
  if (!ctx || typeof Chart === 'undefined') return;
  new Chart(ctx, {
    type: 'line',  // 種別はSection 9.1の選択マトリクスに従って決定
    data: {
      labels: ['2024年', '2025年', '2026年'],  // 実データのみ使用
      datasets: [{
        label: '売上（万円）',
        data: [1200, 1450, 1780],
        borderColor: '#1e3a8a',
        backgroundColor: 'rgba(30,58,138,0.1)',
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      },
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
});
</script>
```

***

## 10. 強調・注記ボックス (Callout Boxes)

文書内での重要事項・警告・補足説明には、以下の統一されたCalloutスタイルを使用してください。LLMが独自実装することを禁止します。

### 10.1 Calloutクラスの定義

```css
/* 共通ベース */
.callout {
  border-radius: 2pt;
  padding: 8pt 12pt;
  margin: 10pt 0;
  font-size: var(--text-base);
  line-height: 1.6;
  border-left: 4pt solid;
}
.callout-title {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: bold;
  letter-spacing: 0.05em;
  margin-bottom: 4pt;
}

/* 重要（赤系）: 必須対応・重要事項 */
.callout-important {
  border-left-color: #8b0000;
  background: #fff5f5;
}
.callout-important .callout-title { color: #8b0000; }

/* 注意（黄系）: リスク・注意喚起 */
.callout-warning {
  border-left-color: #92400e;
  background: #fef3c7;
}
.callout-warning .callout-title { color: #92400e; }

/* 補足（青系）: 参考情報・補足説明 */
.callout-note {
  border-left-color: #1e3a8a;
  background: #eff6ff;
}
.callout-note .callout-title { color: #1e3a8a; }

/* 完了・承認（緑系）: 決定事項・達成 */
.callout-success {
  border-left-color: #065f46;
  background: #f0fdf4;
}
.callout-success .callout-title { color: #065f46; }
```

> **モノクロモード時の注意**: モノクロパレットでは背景色・左罫線ともに `#f0f0f0` / `#000` で統一してください。`callout-title` のラベル文字（「重要」等）で種別を区別します。

### 10.2 使用方法と選択基準

```
【.callout-important（重要）を使う場面】
  → 読者が必ず対応しなければならない事項
  → 誤操作・データ消失につながる注意事項
  → 例：「本書の承認なしに発注を進めないでください」

【.callout-warning（注意）を使う場面】
  → リスク・コスト増加の可能性がある事項
  → 条件付きで成立する手順の前提条件
  → 例：「システム移行期間中は旧システムと併用が必要です」

【.callout-note（補足）を使う場面】
  → 本文の理解を助ける参考情報
  → 用語の定義・略語の説明
  → 例：「※ ROIの計算は初年度コストのみを対象としています」

【.callout-success（完了）を使う場面】
  → 承認済み・決定済みの事項
  → 達成済みのマイルストーン
  → 例：「✓ 本件は経営会議にて2026年3月承認済みです」
```

**HTML実装例:**

```html
<div class="callout callout-important">
  <div class="callout-title">⚠ 重要</div>
  本提案の採用には、ITセキュリティ部門の事前レビューが必須です。
  導入スケジュールはレビュー完了後に確定してください。
</div>

<div class="callout callout-note">
  <div class="callout-note-title">📝 補足</div>
  上記の費用試算は2026年3月時点の見積もりに基づきます。
  為替変動により最終金額が変わる場合があります。
</div>
```

***

## 11. 目次 (Table of Contents)

### 11.1 目次を設ける基準

```
✅ フォーマル型（表紙あり）かつ本文ページが4ページ以上
✅ セクション（H2見出し）が4つ以上存在する
❌ シンプル型（表紙なし）には目次を設けない
❌ 本文ページが3ページ以下の場合は不要
```

### 11.2 目次のルール

- **ページ番号**: 静的な数値で記載してください（JavaScriptによる動的生成禁止）
- **インデント**: H2レベルのみを基本とします。H3を含める場合はインデント1段階（左余白12pt）
- **配置**: 表紙の次のページ（第2ページ）に独立したページとして配置します
- **表紙はページ数にカウントしない**: 目次の「1」は表紙の次のページから開始します

### 11.3 目次のHTML実装例

```html
<div class="page" style="page-break-after: always;">
  <h2 style="border-bottom: none; margin-bottom: 16pt;">目次</h2>
  <table class="toc-table">
    <tbody>
      <tr>
        <td class="toc-num">1.</td>
        <td class="toc-title">はじめに・背景</td>
        <td class="toc-page">2</td>
      </tr>
      <tr>
        <td class="toc-num">2.</td>
        <td class="toc-title">現状分析と課題</td>
        <td class="toc-page">3</td>
      </tr>
      <tr class="toc-h3">
        <td class="toc-num"></td>
        <td class="toc-title" style="padding-left: 12pt;">2.1 業務フローの課題</td>
        <td class="toc-page">3</td>
      </tr>
      <tr>
        <td class="toc-num">3.</td>
        <td class="toc-title">提案内容</td>
        <td class="toc-page">4</td>
      </tr>
    </tbody>
  </table>
</div>
```

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
.toc-num  { width: 20pt; color: var(--color-muted); font-family: var(--font-heading); }
.toc-title { font-family: var(--font-body); }
.toc-page { width: 24pt; text-align: right; font-family: var(--font-heading);
            color: var(--color-muted); }
.toc-h3 td { font-size: var(--text-sm); color: var(--color-muted); }
```

***

## 12. 数値・日付のフォーマット基準 (Number & Date Format)

文書内での表記揺れを防ぐため、以下のルールを厳守してください。

### 12.1 数値フォーマット

```
【金額】
  ✅ 百万円以上：3桁カンマ区切り（例：3,000,000円）
             または万単位（例：300万円）
  ❌ 混在禁止：同一文書内で「3,000,000円」と「300万円」を混在させない
  ✅ 表内では単位を列ヘッダーに記載し、数値のみを記載（例：売上（万円）| 300）

【割合・率】
  ✅ 小数点第1位まで（例：12.5%）
  ❌ 「約12%」と「12.5%」を混在させない（精度を統一する）

【大きな数字】
  ✅ 億単位：「1.2億円」（小数点第1位まで）
  ✅ 千単位：「4,500件」（カンマ区切り）

【順位・番号】
  ✅ 順位は「第1位」「第2位」（「1位」「1番」との混在禁止）
```

### 12.2 日付フォーマット

```
【本文・表紙・フッター】
  ✅ 基本：「2026年3月25日」
  ❌ 禁止：「2026/3/25」「26.3.25」「R8.3.25」

【表の中（スペースが限られる場合）】
  ✅ 許容：「2026/03/25」（ゼロ埋めあり・スラッシュ区切り）
  ❌ 禁止：「26/3/25」（年2桁表記）

【年度表記】
  ✅ 「2026年度（令和8年度）」（初出のみ元号を併記）
  ✅ 以降：「2026年度」のみで可

【期間表記】
  ✅ 「2026年4月〜2027年3月」（全角波ダッシュ）
  ❌ 禁止：「2026.4-2027.3」
```

***

## 13. 画像・ロゴの代替ルール (Image & Logo Handling)

外部URLからの画像読み込みはセキュリティポリシー上禁止されています。以下のルールに従い代替してください。

### 13.1 ロゴの代替方法

```
【優先順位】
  1. Base64エンコードされたSVGをインライン記述（推奨）
  2. CSSのみで実装したテキストロゴ（枠＋社名）
  3. [ロゴ] プレースホルダーを挿入して明示する

【プレースホルダーの実装例】
```

```html
<!-- ロゴが提供されない場合のプレースホルダー -->
<div class="logo-placeholder">
  <span>株式会社〇〇</span>
</div>
```

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

### 13.2 図・写真の代替方法

```
【図・写真が必要な場面の対処】
  ✅ フローチャート → Mermaid.js で実装
  ✅ 概念図・構成図 → HTML + CSS のみで実装
  ✅ 写真 → [写真：〇〇のイメージ] プレースホルダーを枠で表示
  ❌ 外部URLの <img src="https://..."> は絶対に使用しない
  ❌ picsum.photos / placehold.jp 等のプレースホルダー画像サービスも禁止
```

```html
<!-- 写真プレースホルダーの実装例 -->
<div class="img-placeholder">
  <span>📷 [写真：〇〇施設の外観]</span>
</div>
```

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

***

## 14. 付録 (Appendix)

### 14.1 付録を設ける基準

```
✅ 出典・参考文献のリストが3件以上ある
✅ 詳細データ・補足資料が本文の流れを阻害する
✅ 用語集・略語集が必要な専門用語が5件以上ある
❌ シンプル型（表紙なし）には原則付録を設けない
```

### 14.2 付録のレイアウトルール

- 付録は必ず**本文の最終ページの次**に独立したページとして配置します
- 付録ページは `style="page-break-after: always;"` を付与しません（最終ページ扱い）
- ページ番号はフッターに「付録-1」「付録-2」の形式で記載します

### 14.3 付録の実装例

```html
<!-- 付録：参考文献 -->
<div class="page">
  <div style="position: absolute; bottom: 10mm; right: 25mm;
              font-size: var(--text-sm); color: var(--color-muted);
              font-family: var(--font-heading);">付録-1</div>

  <h2>付録A：参考文献・出典</h2>
  <ol class="reference-list">
    <li>
      <span class="ref-title">〇〇白書 2026年版</span>
      <span class="ref-source">経済産業省, 2026年3月</span>
    </li>
    <li>
      <span class="ref-title">AI活用実態調査レポート</span>
      <span class="ref-source">〇〇調査機関, 2025年12月</span>
    </li>
  </ol>

  <h2 style="margin-top: 16pt;">付録B：用語集</h2>
  <table>
    <thead>
      <tr><th>用語・略語</th><th>正式名称・定義</th></tr>
    </thead>
    <tbody>
      <tr><td>AI</td><td>Artificial Intelligence（人工知能）</td></tr>
      <tr><td>ROI</td><td>Return on Investment（投資対効果）</td></tr>
    </tbody>
  </table>
</div>
```

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

***

## 15. ページ数ガイドライン (Page Count)

### 15.1 1ページあたりの情報量の目安

- 本文テキスト（padding 25mm時）: **約40〜50行** を上限とする
- 表を含む場合: **表1つあたり約8〜10行分** として換算する
- グラフを含む場合: **グラフ1つあたり約18〜22行分（視認性確保のため）** として換算する
- Calloutボックスを含む場合: **1つあたり約4〜6行分** として換算する

### 15.2 ページ数に関するルール

- 表紙・目次・付録を含めてページ数をカウントする
- 上限を超える場合は内容を要約・省略して上限内に収めること
- コンテキスト（RAG/Web検索結果）が少ない場合は無理にページ数を増やさず情報密度を優先すること
- `thinking` フィールドにて、生成前に「文書タイプ・表紙有無・カラーモード・目次有無・ページ構成」を計画してから生成すること

***

## 16. プロフェッショナルな意匠 (Aesthetics)

- **フッター**: ページ番号等の要素は `position: absolute; bottom: 10mm;` 等で配置し、本文の内容量に左右されないようにする
- **透明性の維持**: `body` 自体に背景色を設定せず、`.page` のみに白背景を設定することで、アプリ側のダークモード・ライトモード切り替え時にもクリーンな表示を維持する
- **シンプル型の抑制**: 案内文・通知文では装飾・罫線・背景色を極力使わず、余白と文字組みのみで品位を表現する
- **図表余白**: 図表コンテナは幅 92〜98% に抑え `margin: auto` で中央寄せすることで A4 用紙の端との接触を防ぐ

***

## 17. 技術的実装の安定性 (Technical Stability)

### 17.1 ストリーミング応答への対応

AI が HTML を一文字ずつ生成して出力する際、初期化スクリプトが末尾にあると生成途中のページでスクリプトが実行されません。

- **推奨**: 初期化関数とその呼び出し（ポーリング）を `<head>` に記述する
- **実装要件**: `document.getElementById` が `null` を返さないことを確認してから初期化を行う

### 17.2 印刷プレビューの整合性

印刷プレビューでは `window.print()` が `load` イベント直後に発火するため、非同期なポーリングが間に合わない場合があります。

- **要件**: `<body>` 末尾に同期的な初期化トリガー（`initFunc();` 等）を追加し、読み込み完了時点で描画が終わっている状態にする

### 17.3 無限ループの防止 (Resize Loop)

iframe の高さを親に伝える際、`requestAnimationFrame` で無条件に通知し続けると高さが伸び続ける「無限成長バグ」が発生します。

- **要件**: 通知には必ず `ResizeObserver` を使用すること
- **注意**: `postMessage` は高さに変化があった場合のみ送信するよう実装する

### 17.4 図表の標準的記法

- **視認性優先**: 図表のサイズを無理に縮小せず、視認性が確保できる十分なサイズ（例：レーダーチャートなら 230〜250pt）を維持した上で必要に応じてページ数を増やす
- **垂直スタック**: 複数の図表は `flex-row` 等で横並びにせず、**中央寄せの垂直スタック（縦並び）** で配置し、レイアウトの破綻を防止する
- **図表背景の透明化**: 図表コンテナ（`.chart-container`）の `background` は必ず `transparent` または `none` とし、印刷時に不要なグレー矩形が出現することを防ぐ
- **構造の整合性**: `.page` コンテナの開始・終了タグを厳密に管理し、文章量が増えてもタグのネストが壊れないよう配慮する
- **キャプション**: 図・表のすぐ下に番号付きキャプション（`.caption` クラス）を配置する（例：「図1：市場動向予測」「表2：費用比較」）
- **相互参照**: 本文中で「（表2参照）」「図3に示す通り」のように名指しすることで文書の論理構造を明確にする
- **漆黒配色**: 本文・キャプション・ページ番号は一貫して `#000`（漆黒）を使用する

***

*このガイドライン v1.6 に従うことで、LLM は文書の性質・データの性質・情報の重要度を正確に判断し、実戦的な情報密度と最高峰の印刷品質を両立させた「本物のビジネス文書」を Artifact として出力できるようになります。*
