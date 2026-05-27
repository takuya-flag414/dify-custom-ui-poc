# 新しいArtifactブロックの追加方法

本ドキュメントでは、新規スライドパターンや新規ドキュメントブロックタイプを追加する手順をStep-by-stepで解説します。

---

## Part 1: 新規スライドパターンの追加（JsonSlide）

### 例: `VideoSlide`（動画・サムネイル紹介スライド）を追加する

---

### Step 1: JSONスキーマを定義する

新しいスライドタイプがAIから出力するJSON構造を決定します。  
これはAIのシステムプロンプト（またはDifyワークフロー）側にも定義が必要です。

```json
{
  "id": "slide-x",
  "layout_type": "video_slide",
  "content": {
    "title": "動画タイトル",
    "description": "動画の説明文",
    "videoUrl": "https://example.com/video.mp4",
    "thumbnailHint": "会議室での発表シーン",
    "duration": "3:45"
  }
}
```

**決定すべき事項:**
- `layout_type` の文字列キー（スネークケースで命名: `video_slide`）
- `content` オブジェクト内のフィールド名と型

---

### Step 2: Reactコンポーネントを作成する

新規ファイル: `src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/VideoSlide.jsx`

```jsx
// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/VideoSlide.jsx

/**
 * VideoSlide - 動画・サムネイル紹介スライド
 * @param {Object} content - { title, description, videoUrl, thumbnailHint, duration }
 * @param {boolean} isStatic - アニメーションを無効化するかどうか
 */
const VideoSlide = ({ content, isStatic = false }) => {
    const { title, description, videoUrl, thumbnailHint, duration } = content;

    return (
        <div className="json-slide-layout modern-indigo-video">
            {/* スライドタイトル */}
            <h2 className="slide-title">{title}</h2>

            {/* 動画サムネイルエリア */}
            <div className="video-thumbnail-area">
                {videoUrl ? (
                    <video
                        src={videoUrl}
                        controls
                        className="video-player"
                    />
                ) : (
                    <div className="video-placeholder">
                        <span className="video-icon">▶</span>
                        <p>{thumbnailHint || '動画を挿入'}</p>
                        {duration && <span className="video-duration">{duration}</span>}
                    </div>
                )}
            </div>

            {/* 説明文 */}
            {description && (
                <p className="slide-description">{description}</p>
            )}
        </div>
    );
};

export default VideoSlide;
```

---

### Step 3: テーマのindex.jsにマッピングを登録する

既存ファイルを編集: `src/components/Artifacts/JsonSlide/themes/modern-indigo/index.js`

```javascript
// 既存のimport文に追加
import VideoSlide from './slides/VideoSlide'; // ← 追加

export const modernIndigoMap = {
    // ... 既存のマッピング ...

    // === 新規追加 ===
    video_slide: VideoSlide,    // 正式キー
    video: VideoSlide,          // エイリアス（AIの出力揺れ対応）
};
```

> **他のテーマ（`corporate-modern`）にも対応が必要な場合**  
> 同様に `corporate-modern/index.js` にも登録してください。  
> または `corporate-modern` のマップで `modern-indigo` の `VideoSlide` を流用することも可能です。

---

### Step 4: CSSスタイルを追加する（任意）

`theme.css` またはスライドコンポーネント内でスタイルを定義します。

```css
/* テーマのtheme.cssまたはコンポーネント内のscoped CSSに追加 */

.modern-indigo-video {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 40px;
    background: var(--slide-bg-main);
}

.modern-indigo-video .video-thumbnail-area {
    width: 100%;
    aspect-ratio: 16/9;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
}

.modern-indigo-video .video-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #fff;
    background: var(--slide-primary);
}
```

---

### Step 5: PPTXエクスポートへの対応（任意）

PPTXエクスポートを追加する場合は:

> [!WARNING]
> **PPTX描画スクリプトの作成に関する注意**  
> 以下のコード例のように、PPTXのエクスポート処理（`pptxgenjs`）は、ReactのUI（HTML/CSS）とは全く異なります。
> 図形やテキストの配置場所、サイズ、色をすべてコード上で数値指定する、非常に地道な制作（手作業での座標合わせ）が必要になる点を認識しておいてください。

1. `src/utils/pptx/themes/modern-indigo/slides/VideoSlideRenderer.ts` を作成
2. `BaseRenderer` を継承して `render()` メソッドを実装
3. `src/utils/pptx/themes/modern-indigo/index.ts` でレジストリに登録

```typescript
// VideoSlideRenderer.ts のイメージ
import { BaseRenderer } from '../../../core/BaseRenderer';

export class VideoSlideRenderer extends BaseRenderer {
    async render(slideData: SlideData, slideIndex: number): Promise<void> {
        const slide = this.pptx.addSlide({ masterName: 'MASTER_MODERN_INDIGO_CONTENT' });
        const { title, description, thumbnailHint } = slideData.content;

        // タイトル
        slide.addText(title, {
            x: '5%', y: '5%', w: '90%', h: 0.8,
            fontSize: 28, bold: true, color: this.config.colors.text.primary
        });

        // サムネイルプレースホルダー
        slide.addShape('rect', {
            x: '5%', y: '18%', w: '90%', h: '55%',
            fill: { color: this.config.colors.primary }
        });

        if (thumbnailHint) {
            slide.addText(thumbnailHint, {
                x: '5%', y: '18%', w: '90%', h: '55%',
                color: 'FFFFFF', fontSize: 14, align: 'center', valign: 'middle'
            });
        }

        // 説明文
        if (description) {
            slide.addText(description, {
                x: '5%', y: '78%', w: '90%', h: 0.6,
                fontSize: 14, color: this.config.colors.text.secondary
            });
        }
    }
}
```

---

## Part 2: 新規ドキュメントブロックの追加（JsonDocument）

### 例: `callout`ブロック（コールアウトボックス）を追加する

---

### Step 1: JSONスキーマを定義する

```json
{
  "type": "callout",
  "variant": "warning",
  "title": "注意",
  "text": "このセクションには重要な情報が含まれています。"
}
```

---

### Step 2: ブロックコンポーネントを作成する

新規ファイル: `src/components/Artifacts/JsonDocument/blocks/DocCallout.jsx`

```jsx
// src/components/Artifacts/JsonDocument/blocks/DocCallout.jsx

const VARIANT_STYLES = {
    info:    { borderColor: '#3b82f6', bgColor: '#eff6ff', icon: 'ℹ️' },
    warning: { borderColor: '#f59e0b', bgColor: '#fffbeb', icon: '⚠️' },
    danger:  { borderColor: '#ef4444', bgColor: '#fef2f2', icon: '🚨' },
    success: { borderColor: '#10b981', bgColor: '#ecfdf5', icon: '✅' },
};

/**
 * DocCallout - コールアウトボックス
 * @param {Object} block - { type, variant, title, text }
 */
const DocCallout = ({ block }) => {
    const style = VARIANT_STYLES[block.variant] || VARIANT_STYLES.info;

    return (
        <div style={{
            border: `2px solid ${style.borderColor}`,
            borderRadius: '6px',
            padding: '12px 16px',
            backgroundColor: style.bgColor,
            margin: '8px 0',
        }}>
            <strong style={{ color: style.borderColor }}>
                {style.icon} {block.title}
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem' }}>{block.text}</p>
        </div>
    );
};

export default DocCallout;
```

---

### Step 3: JsonDocParser.jsx に登録する

既存ファイルを編集: `src/components/Artifacts/JsonDocument/JsonDocParser.jsx`

```javascript
// 既存のimport文に追加
import DocCallout from './blocks/DocCallout'; // ← 追加

// BLOCK_COMPONENTS マッピングに追加
const BLOCK_COMPONENTS = {
    heading:        DocHeading,
    rich_text:      DocRichText,
    table:          DocTable,
    svg:            DocSvg,
    list:           DocList,
    chart:          DocChart,
    toc:            DocTOC,
    cover:          DocCover,
    letter_header:  DocLetterHeader,
    callout:        DocCallout,    // ← 追加
};
```

---

### Step 4: usePagination.js に高さ推定を追加する（任意）

ページネーションの精度を上げるために、新ブロックの高さ推定値を追加します。

既存ファイルを編集: `src/components/Artifacts/JsonDocument/utils/usePagination.js`

```javascript
// estimateBlockHeight 関数内に追加
const estimateBlockHeight = (block) => {
    switch (block.type) {
        // ... 既存のケース ...
        case 'callout':
            return 80; // コールアウトボックスの推定高さ
        default:
            return 80;
    }
};
```

---

## チェックリスト

### JsonSlide（スライド）追加時

- [ ] `layout_type` の文字列キーを決定した
- [ ] JSONスキーマ（`content` フィールド）を定義した
- [ ] Reactコンポーネントを作成した
- [ ] テーマの `index.js` にマッピングを登録した（正式キー＋エイリアス）
- [ ] 対象の全テーマ（`modern-indigo`, `corporate-modern`等）に対応した
- [ ] CSSスタイルを追加した
- [ ] PPTXエクスポートに対応した（任意）

### JsonDocument（ドキュメント）追加時

- [ ] ブロックの `type` 名を決定した
- [ ] JSONスキーマを定義した
- [ ] `blocks/Doc[BlockName].jsx` を作成した
- [ ] `JsonDocParser.jsx` の `BLOCK_COMPONENTS` に登録した
- [ ] `usePagination.js` の `estimateBlockHeight` に高さ推定を追加した

---

*関連ドキュメント: [01_add-slide-theme.md](./01_add-slide-theme.md) | [../phase2-core-features/01_artifact-json-slide.md](../phase2-core-features/01_artifact-json-slide.md)*
