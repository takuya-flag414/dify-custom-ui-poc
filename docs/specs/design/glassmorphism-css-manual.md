# Glassmorphism CSS 実装マニュアル

## 概要

**Glassmorphism（グラスモーフィズム）** は、半透明で背景がぼやけて見える磨りガラスのようなエフェクトが特徴的なデザイントレンドです。Mac OS Big Sur にも採用されており、Pinterest や Dribbble などでも広く使われています。

このマニュアルでは、Glassmorphism の CSS 実装方法を基礎から解説し、**オレンジ・ブルー・パープル・グリーン・ピンク・モノクロ**など複数のカラーパレットに対応した実装例を紹介します。

---

## 実装の4大ポイント

Glassmorphism を構成する重要な要素は以下の4点です。

1. **`backdrop-filter: blur()`** でガラスの背後をぼかす
2. **半透明の背景色**（`rgba()`）でガラス感を出す
3. **半透明のボーダー**でガラスの厚みと光の方向を表現する
4. **`box-shadow`** で輪郭をはっきりさせ、浮遊感を演出する

---

## HTML 構造

```html
<div class="bg">
  <div class="glass">
    <h1>Glassmorphism</h1>
    <p>
      Lorem ipsum dolor sit amet consectetur adipisicing elit.
      Mollitia laborum inventore nulla illum, eaque sint culpa.
    </p>
  </div>
</div>
```

| 要素 | クラス名 | 役割 |
|------|----------|------|
| 外側 `div` | `.bg` | 背景画像・グラデーションを設定するラッパー |
| 内側 `div` | `.glass` | ガラスエフェクトを適用するカード要素 |

---

## ベース CSS（共通部分）

```css
/* Google Fonts の読み込み（任意） */
@import url("https://fonts.googleapis.com/css2?family=Heebo:wght@900&display=swap");

/* 簡易リセット */
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

/* 背景コンテナ */
.bg {
  background-color: #000; /* 画像がない場合のフォールバック */
  background-image: url("bg.jpg"); /* 背景画像のパス */
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  width: 100%;
  min-height: 100vh;
  padding: 60px 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ガラス本体（共通ベース） */
.glass {
  width: 100%;
  max-width: 600px;
  padding: 30px;
  border-radius: 15px;
  background-color: rgba(255, 255, 255, 0.1);       /* ① 半透明背景 */
  border: 1px solid rgba(255, 255, 255, 0.4);        /* ② ボーダー（上・左） */
  border-right-color: rgba(255, 255, 255, 0.2);      /* ② ボーダー（右） */
  border-bottom-color: rgba(255, 255, 255, 0.2);     /* ② ボーダー（下） */
  -webkit-backdrop-filter: blur(20px);               /* ③ ぼかし（Safari 対応） */
  backdrop-filter: blur(20px);                       /* ③ ぼかし */
  box-shadow: 0 5px 20px rgba(255, 152, 79, 0.5);    /* ④ 影（カラー調整可） */
}

/* ガラス内テキスト */
.glass h1 {
  text-align: center;
  color: #fff;
  font-family: "Heebo", sans-serif;
  font-size: 50px;
  font-weight: bold;
  letter-spacing: 0.06em;
}

.glass p {
  margin-top: 20px;
  color: #fff;
  font-size: 16px;
  line-height: 1.7;
}
```

---

## CSS プロパティ詳細解説

### ① 背景色：`background-color: rgba()`

```css
background-color: rgba(255, 255, 255, 0.1);
```

- `opacity` プロパティは使わない。`opacity` を使うと内部のテキストも透過してしまう
- `rgba()` の第4引数（アルファ値）で透明度を制御する（`0.0`〜`1.0`）
- 透明度の目安：`0.05`〜`0.15` が自然なガラス感を生む

### ② ボーダー：ガラスの厚みと光源の表現

```css
border: 1px solid rgba(255, 255, 255, 0.4);   /* 上・左（明るく） */
border-right-color: rgba(255, 255, 255, 0.2);  /* 右（暗く） */
border-bottom-color: rgba(255, 255, 255, 0.2); /* 下（暗く） */
```

- 左上と右下でボーダーの透明度を変えることで、左上から光が当たっているように見える
- 上・左を `0.4`、右・下を `0.2` とすることで立体感が生まれる

### ③ ぼかし：`backdrop-filter: blur()`

```css
-webkit-backdrop-filter: blur(20px); /* Safari / iOS Chrome 対応 */
backdrop-filter: blur(20px);
```

- 要素の **背後** にグラフィック効果を適用するプロパティ
- `blur()` の値が大きいほどぼかしが強くなる（目安：`10px`〜`30px`）
- Firefox は一部バージョンで非対応（ブラウザ設定の変更が必要）
- IE は非対応

### ④ 影：`box-shadow`

```css
box-shadow: 0 5px 20px rgba(R, G, B, 0.5);
```

- 影の色は **背景色に近い色** を使うと自然に馴染む
- アルファ値 `0.3`〜`0.6` が視認性と自然さのバランスが良い

---

## カラーパレット別 実装例

各パレットは `.glass` の `box-shadow` と、必要に応じて背景グラデーションを変更するだけで切り替えられます。

### カラーパレット一覧

| パレット名 | 背景グラデーション（目安） | `box-shadow` カラー |
|------------|--------------------------|----------------------|
| 🟠 オレンジ | `#ff6a00` → `#ee0979` | `rgba(255, 152, 79, 0.5)` |
| 🔵 ブルー | `#1a1a2e` → `#16213e` | `rgba(70, 130, 255, 0.5)` |
| 🟣 パープル | `#6a0572` → `#11998e` | `rgba(180, 100, 255, 0.5)` |
| 🟢 グリーン | `#134e5e` → `#71b280` | `rgba(80, 200, 120, 0.5)` |
| 🩷 ピンク | `#f953c6` → `#b91d73` | `rgba(255, 100, 180, 0.5)` |
| ⬛ モノクロ | `#0f0f0f` → `#3a3a3a` | `rgba(200, 200, 200, 0.3)` |

---

### 🟠 オレンジ パレット

```css
.bg {
  background-image: linear-gradient(135deg, #ff6a00, #ee0979);
}

.glass {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-right-color: rgba(255, 255, 255, 0.2);
  border-bottom-color: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  box-shadow: 0 5px 20px rgba(255, 152, 79, 0.5);
}
```

---

### 🔵 ブルー パレット

```css
.bg {
  background-image: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
}

.glass {
  background-color: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-right-color: rgba(255, 255, 255, 0.15);
  border-bottom-color: rgba(255, 255, 255, 0.15);
  border-radius: 15px;
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  box-shadow: 0 5px 20px rgba(70, 130, 255, 0.5);
}
```

---

### 🟣 パープル パレット

```css
.bg {
  background-image: linear-gradient(135deg, #6a0572, #ab83a1, #11998e);
}

.glass {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-right-color: rgba(255, 255, 255, 0.2);
  border-bottom-color: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  box-shadow: 0 5px 20px rgba(180, 100, 255, 0.5);
}
```

---

### 🟢 グリーン パレット

```css
.bg {
  background-image: linear-gradient(135deg, #134e5e, #71b280);
}

.glass {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-right-color: rgba(255, 255, 255, 0.2);
  border-bottom-color: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  box-shadow: 0 5px 20px rgba(80, 200, 120, 0.5);
}
```

---

### 🩷 ピンク パレット

```css
.bg {
  background-image: linear-gradient(135deg, #f953c6, #b91d73);
}

.glass {
  background-color: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-right-color: rgba(255, 255, 255, 0.2);
  border-bottom-color: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  box-shadow: 0 5px 20px rgba(255, 100, 180, 0.5);
}
```

---

### ⬛ モノクロ パレット

```css
.bg {
  background-image: linear-gradient(135deg, #0f0f0f, #3a3a3a);
}

.glass {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-right-color: rgba(255, 255, 255, 0.1);
  border-bottom-color: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  box-shadow: 0 5px 20px rgba(200, 200, 200, 0.3);
}
```

---

## CSS カスタムプロパティ（変数）を使った管理方法

カラーパレットの切り替えをより効率的に行うには、**CSS カスタムプロパティ（変数）** を活用します。テーマごとにクラスを付け替えるだけで全体の色調を一括変更できます。

```css
/* デフォルト（オレンジ） */
:root {
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.4);
  --glass-border-sub: rgba(255, 255, 255, 0.2);
  --glass-shadow: rgba(255, 152, 79, 0.5);
  --bg-gradient-start: #ff6a00;
  --bg-gradient-end: #ee0979;
}

/* ブルーテーマ */
.theme-blue {
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.3);
  --glass-border-sub: rgba(255, 255, 255, 0.15);
  --glass-shadow: rgba(70, 130, 255, 0.5);
  --bg-gradient-start: #1a1a2e;
  --bg-gradient-end: #0f3460;
}

/* パープルテーマ */
.theme-purple {
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.4);
  --glass-border-sub: rgba(255, 255, 255, 0.2);
  --glass-shadow: rgba(180, 100, 255, 0.5);
  --bg-gradient-start: #6a0572;
  --bg-gradient-end: #11998e;
}

/* グリーンテーマ */
.theme-green {
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.4);
  --glass-border-sub: rgba(255, 255, 255, 0.2);
  --glass-shadow: rgba(80, 200, 120, 0.5);
  --bg-gradient-start: #134e5e;
  --bg-gradient-end: #71b280;
}

/* ピンクテーマ */
.theme-pink {
  --glass-bg: rgba(255, 255, 255, 0.12);
  --glass-border: rgba(255, 255, 255, 0.45);
  --glass-border-sub: rgba(255, 255, 255, 0.2);
  --glass-shadow: rgba(255, 100, 180, 0.5);
  --bg-gradient-start: #f953c6;
  --bg-gradient-end: #b91d73;
}

/* モノクロテーマ */
.theme-mono {
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-border-sub: rgba(255, 255, 255, 0.1);
  --glass-shadow: rgba(200, 200, 200, 0.3);
  --bg-gradient-start: #0f0f0f;
  --bg-gradient-end: #3a3a3a;
}

/* 変数を使った共通スタイル */
.bg {
  background-image: linear-gradient(135deg, var(--bg-gradient-start), var(--bg-gradient-end));
  background-size: cover;
  background-position: center;
  width: 100%;
  min-height: 100vh;
  padding: 60px 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.glass {
  width: 100%;
  max-width: 600px;
  padding: 30px;
  border-radius: 15px;
  background-color: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-right-color: var(--glass-border-sub);
  border-bottom-color: var(--glass-border-sub);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  box-shadow: 0 5px 20px var(--glass-shadow);
}
```

### HTML でのテーマ切り替え

```html
<!-- オレンジ（デフォルト） -->
<div class="bg">
  <div class="glass"> ... </div>
</div>

<!-- ブルーテーマ -->
<div class="bg theme-blue">
  <div class="glass"> ... </div>
</div>

<!-- パープルテーマ -->
<div class="bg theme-purple">
  <div class="glass"> ... </div>
</div>
```

---

## カスタマイズ パラメーター一覧

| プロパティ | 推奨値 | 効果 |
|------------|--------|------|
| `backdrop-filter: blur()` | `10px` 〜 `30px` | 値が大きいほど強いぼかし |
| `background-color` のアルファ値 | `0.05` 〜 `0.15` | 大きいほど白みがかる |
| `border` のアルファ値（上・左） | `0.3` 〜 `0.5` | ガラスの光沢感 |
| `border` のアルファ値（右・下） | `0.1` 〜 `0.25` | 光の陰影 |
| `box-shadow` のアルファ値 | `0.3` 〜 `0.6` | 影の濃さ |
| `border-radius` | `10px` 〜 `20px` | 角の丸み |

---

## ブラウザ互換性

| ブラウザ | `backdrop-filter` 対応 |
|----------|------------------------|
| Chrome 76以降 | ✅ 対応 |
| Edge 79以降 | ✅ 対応 |
| Safari 9以降 | ✅ 対応（`-webkit-` プレフィックス必要） |
| Firefox | ⚠️ `layout.css.backdrop-filter.enabled` を `true` に変更で有効化 |
| IE | ❌ 非対応 |

Firefox や IE でのフォールバックとして、`@supports` を使った条件分岐を検討してください。

```css
/* backdrop-filter が使えない環境向けのフォールバック */
@supports not (backdrop-filter: blur(1px)) {
  .glass {
    background-color: rgba(30, 30, 30, 0.75); /* 半透明の濃い背景で代替 */
  }
}
```

---

## 背景画像のベストプラクティス

- **鮮やかでカラフルな画像**を使うと、ぼかし効果が映える
- **抽象的なシェイプ（図形）が多め**の画像が最適
- [Freepik](https://www.freepik.com/) や [Unsplash](https://unsplash.com/) などのサイトから素材を取得できる
- グラデーションのみの背景でも十分なエフェクトが得られる

```css
/* 背景画像を使う場合 */
.bg {
  background-image: url("bg.jpg");
  background-size: cover;
  background-position: center center;
}

/* グラデーションのみの場合 */
.bg {
  background-image: linear-gradient(135deg, #1a1a2e, #0f3460, #533483);
}
```

---

## 参考リンク

- [元記事：web-dev.tech Glassmorphism 実装解説](https://web-dev.tech/front-end/css/glassmorphism/)
- [MDN: backdrop-filter](https://developer.mozilla.org/ja/docs/Web/CSS/backdrop-filter)
- [Can I Use: backdrop-filter](https://caniuse.com/css-backdrop-filter)
- [Glassmorphism UI Generator](https://glassmorphism.com/)
