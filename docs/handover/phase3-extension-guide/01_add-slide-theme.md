# 新しいスライドテーマの追加方法

本ドキュメントでは、新規スライドテーマ（例: `ocean-blue`）を追加する手順をStep-by-stepで解説します。

---

## 前提知識

このガイドを実施する前に、以下のドキュメントを読んでおくことを推奨します：
- [01_artifact-json-slide.md](../phase2-core-features/01_artifact-json-slide.md) ← テーマシステムの全体像

---

## テーマ追加の全体像

```
追加する作業対象ファイル:
  src/components/Artifacts/JsonSlide/
  ├── config/themeRegistry.js      ← 手順 5: テーマを登録
  └── themes/
      └── ocean-blue/              ← 手順 1〜4: 新規作成
          ├── index.js             ← 手順 2: レイアウトマップを定義
          ├── theme.css            ← 手順 3: テーマのCSSを定義
          └── slides/              ← 手順 4: テーマ固有スライドを作成（任意）
              └── TitleSlide.jsx
```

---

## Step 1: テーマフォルダを作成する

```
src/components/Artifacts/JsonSlide/themes/ocean-blue/
```

このフォルダ配下に以下のファイルを作成します。

---

## Step 2: index.js でレイアウトマップを定義する

新規ファイル: `themes/ocean-blue/index.js`

```javascript
// src/components/Artifacts/JsonSlide/themes/ocean-blue/index.js
import './theme.css';

// === 共通スライドコンポーネントを使用する場合 ===
// ルートの slides/ フォルダにある汎用コンポーネントを流用する
// （テーマ固有の実装が不要なスライドタイプは共通コンポーネントで代替）
import TitleSlide from '../modern-indigo/slides/TitleSlide'; // 流用例
import ContentSlide from '../modern-indigo/slides/ContentSlide';

// === テーマ固有コンポーネントを使用する場合 ===
// このテーマ専用のスライドを作成した場合はここでインポート
// import TitleSlide from './slides/TitleSlide'; // 自作の場合

export const oceanBlueMap = {
    // --- 正式なlayout_typeキー ---
    title_slide:    TitleSlide,
    content_slide:  ContentSlide, // フォールバック先（必ず定義すること）
    // 他のスライドタイプを追加...

    // --- エイリアス（AIの出力揺れを吸収） ---
    title:   TitleSlide,
    content: ContentSlide,
};
```

> **重要**: `content_slide` は必ず定義すること。未知の `layout_type` が来た場合のフォールバック先になります。

---

## Step 3: theme.css でCSSカスタムプロパティを定義する

新規ファイル: `themes/ocean-blue/theme.css`

テーマの色・フォント・装飾をCSSカスタムプロパティで定義します。  
既存テーマ（`modern-indigo/theme.css`）を参考に作成してください。

```css
/* src/components/Artifacts/JsonSlide/themes/ocean-blue/theme.css */

/* ========================================
 * Ocean Blue テーマ
 * ======================================== */

/* テーマを適用するスコープ（data-theme属性またはクラスで制御） */
.json-slide-theme-ocean-blue {

    /* --- カラーパレット --- */
    --slide-primary: #006994;          /* メインカラー（オーシャンブルー） */
    --slide-secondary: #00a8cc;        /* アクセントカラー */
    --slide-bg-main: #f0f8ff;          /* 背景色（薄い水色） */
    --slide-bg-dark: #004d6e;          /* ダーク背景（セクション区切り等） */
    --slide-text-primary: #003d54;     /* 主要テキスト色 */
    --slide-text-secondary: #5b8fa8;   /* 補助テキスト色 */
    --slide-accent: #00ccaa;           /* アクセント（グラフィック要素等） */

    /* --- タイポグラフィ --- */
    --slide-font-family: 'Noto Sans JP', 'Inter', sans-serif;
    --slide-font-size-title: 2.4rem;
    --slide-font-size-subtitle: 1.2rem;
    --slide-font-size-body: 0.9rem;

    /* --- 装飾 --- */
    --slide-border-radius: 8px;
    --slide-shadow: 0 4px 24px rgba(0, 105, 148, 0.1);
}
```

---

## Step 4: テーマ固有のスライドコンポーネントを作成する（任意）

既存テーマのコンポーネントを流用するだけでよい場合は、このステップは不要です。  
独自のビジュアルデザインが必要な場合のみ、スライドコンポーネントを作成します。

新規ファイル例: `themes/ocean-blue/slides/TitleSlide.jsx`

```jsx
// src/components/Artifacts/JsonSlide/themes/ocean-blue/slides/TitleSlide.jsx

/**
 * Ocean Blue テーマ専用 タイトルスライド
 * @param {Object} content - { title, subtitle, kicker }
 */
const TitleSlide = ({ content }) => {
    return (
        <div className="json-slide-layout json-slide-theme-ocean-blue ocean-blue-title">
            {content.kicker && (
                <p className="ocean-blue-kicker">{content.kicker}</p>
            )}
            <h1 className="ocean-blue-main-title">{content.title}</h1>
            {content.subtitle && (
                <p className="ocean-blue-subtitle">{content.subtitle}</p>
            )}
            {/* テーマ固有の装飾要素（波のSVG等）を追加可能 */}
        </div>
    );
};

export default TitleSlide;
```

---

## Step 5: themeRegistry.js にテーマを登録する

既存ファイルを編集: `config/themeRegistry.js`

```javascript
// src/components/Artifacts/JsonSlide/config/themeRegistry.js

import { corporateModernMap } from '../themes/corporate-modern';
import { modernIndigoMap } from '../themes/modern-indigo';
import { oceanBlueMap } from '../themes/ocean-blue'; // ← 追加

export const themeRegistry = {
    'corporate-modern': corporateModernMap,
    'modern-indigo':    modernIndigoMap,
    'ocean-blue':       oceanBlueMap,              // ← 追加
};
```

---

## Step 6: PPTXエクスポートへの対応（必要な場合）

PPTXエクスポートにも新テーマを対応させる場合は、以下も追加します。

> [!WARNING]
> **PPTX生成スクリプトは地道な制作作業になります**  
> `pptxgenjs` ではCSSが使えないため、新しいテーマを追加した際、PPTX側の出力も新しいデザインに合わせるには、各種図形やテキストの座標（x, y, w, h）や色をピクセル単位・パーセンテージ単位で手動指定する地道な実装作業が発生します。

```
src/utils/pptx/
└── themes/
    └── ocean-blue/        ← 新規作成
        ├── config.ts      ← テーマの色・フォントサイズ設定
        ├── palette.ts     ← カラーパレット
        ├── index.ts       ← グローバルレジストリへの登録
        └── slides/        ← スライド種別ごとのPPTX生成クラス
```

> 詳細は [06_export-pptx-docx.md](../phase2-core-features/06_export-pptx-docx.md) を参照してください。

---

## Step 7: 動作確認

1. 開発サーバーを起動して、AI にスライド生成を依頼する
2. AIのプロンプト or レスポンスに `"theme": "ocean-blue"` が含まれることを確認
3. スライドパネルでテーマセレクターから `ocean-blue` を選択して描画確認
4. 全スライドタイプが正常に表示されることを確認（特に `content_slide` フォールバック）

---

## チェックリスト

- [ ] `themes/ocean-blue/` フォルダを作成した
- [ ] `themes/ocean-blue/index.js` に `oceanBlueMap` をエクスポートした
- [ ] `content_slide` キーが `oceanBlueMap` に必ず定義されている
- [ ] `themes/ocean-blue/theme.css` にCSSカスタムプロパティを定義した
- [ ] `config/themeRegistry.js` に `'ocean-blue': oceanBlueMap` を追加した
- [ ] 動作確認が完了した

---

*関連ドキュメント: [02_add-artifact-block.md](./02_add-artifact-block.md) | [../phase2-core-features/01_artifact-json-slide.md](../phase2-core-features/01_artifact-json-slide.md)*
