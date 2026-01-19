# Desktop Intelligence "Studios" - Phase A 基本設計書

- **Project**: 社内AIチャットボット開発プロジェクト (Desktop Intelligence Era)
- **Version**: 1.0.0
- **Date**: 2026-01-18
- **Reference**: Phase A Requirements, DESIGN_RULE.md

## 1. アーキテクチャ概要

Phase Aでは、バックエンド（Dify）に接続せず、Reactフロントエンドのみで完結する「High-Fidelity Prototype」を構築する。
データ永続化は行わず、ブラウザのメモリ（React Context）およびLocalStorage（セッション復帰用）を利用して、**「入室体験」と「没入感」**の実証にフォーカスする。

### 1.1. 技術スタック & ライブラリ

- **Core**: React 18+ (Vite)
- **State Management**: React Context API + Custom Hooks
- **Styling**: Tailwind CSS + CSS Modules (for complex gradients)
- **Animation**: Framer Motion (必須: Spring Physics)
- **Icons**: Lucide React (UI), Emojis (Studio Icons)

## 2. データモデル設計

### 2.1. Studio Object (Interface Definition)

各「Studio」を定義するデータ構造。Dify連携を見据えつつ、フロントエンドの表示制御に必要なプロパティを持たせる。

```typescript
type IntelligenceColor = 'cyan' | 'magenta' | 'yellow' | 'blue' | 'orange' | 'green' | 'purple';

interface Studio {
  id: string;              // UUID
  name: string;            // 表示名 (例: "Translation Studio")
  description: string;     // 短い説明
  icon: string;            // 絵文字 または SVGパス (Phase Aは絵文字推奨)
  themeColor: IntelligenceColor; // Apple Intelligence Glowの基調色

  // Context Configuration (The "Preset")
  systemPrompt: string;    // Difyへの指示 (System Instruction)
  knowledgeFiles: MockFile[]; // 仮想的な添付ファイルリスト

  // UI Configuration
  inputPlaceholder: string; // ChatInputのプレースホルダー (例: "翻訳するテキストを入力...")
  welcomeMessage: string;   // 入室時の初回メッセージ
}

interface MockFile {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'md';
}

```

### 2.2. Default Studios (プリセットデータ)

初回起動時にユーザーが利用可能なデフォルトのStudio定義。

| Studio Name | Icon | Color | Purpose |
| --- | --- | --- | --- |
| **General** | ⚪️ | blue | 汎用的な検索・対話 (Web Search有効) |
| **Coder** | 💻 | cyan | エンジニアリング、コード生成、レビュー |
| **Writer** | ✍️ | orange | ブログ、日報、メール作成支援 |
| **Translator** | 🌏 | magenta | 多言語翻訳、ニュアンス調整 |

## 3. コンポーネント構成設計

`src/components/Studios/` 配下に新規コンポーネント群を展開する。

### 3.1. ディレクトリ構造案

```text
src/
├── components/
│   ├── Studios/
│   │   ├── StudioGallery.tsx       // エントリー画面（グリッド）
│   │   ├── StudioCard.tsx          // ガラス質感のカード
│   │   ├── ActiveStudioHeader.tsx  // チャット画面ヘッダー
│   │   └── Wizard/                 // 作成ウィザード
│   │       ├── StudioWizardModal.tsx
│   │       ├── StepIdentity.tsx
│   │       └── StepContext.tsx
│   └── Layout/
│       └── AmbientGlow.tsx         // 背景の環境光制御
├── context/
│   └── StudioContext.tsx           // 選択中のStudio状態管理
└── hooks/
    └── useAmbientTheme.ts          // テーマカラー遷移ロジック

```

### 3.2. 主要コンポーネント詳細仕様

#### A. AmbientGlow (Background System)

- **責務**: アプリケーション全体の背景色（光）を管理する。
- **実装**:
- CSS `conic-gradient` を使用した巨大な回転する円盤を配置し、`blur(80px)` でぼかす。
- `themeColor` propsを受け取り、Gradientの `stop-color` をCSS Variables経由で滑らかに遷移（`transition: --color-primary 1s ease`）させる。

#### B. StudioCard (Interaction)

- **Design Rule**: `DESIGN_RULE.md` の "Liquid Glass" 準拠。
- **Visual**:
- Bg: `bg-white/5` (通常) -> `bg-white/10` (Hover)
- Border: `border-white/10`
- Backdrop: `backdrop-blur-2xl saturate-150`

- **Motion (Framer Motion)**:

```javascript
whileHover={{
  scale: 1.02,
  y: -5,
  boxShadow: "0 20px 40px -10px var(--glow-color-alpha)"
}}
transition={{ type: "spring", stiffness: 300, damping: 20 }}

```

#### C. StudioWizardModal (Creation Flow)

- **Design Rule**: macOSの設定パネル風UI。Acrylic Material。
- **Steps**:
- **Identity**: アイコン選択（Emoji Picker）、名前入力、カラーピッカー（7色の円形ボタン）。
- **Context**:
- Textarea: "System Instructions"（プレースホルダーに例文を表示）。
- Dropzone: "Knowledge Base"（ファイルをドロップした際のSpringアニメーション必須）。

## 4. ステート管理 & 画面遷移フロー

`StudioContext` を中心に、Global Stateとして「現在どこにいるか」を管理する。

### 4.1. Context Definition

```typescript
interface StudioContextType {
  studios: Studio[];          // 利用可能な全Studio
  activeStudioId: string | null; // null = Gallery表示中, string = Chat中
  
  enterStudio: (id: string) => void;
  exitStudio: () => void;     // Galleryに戻る
  createStudio: (data: Partial<Studio>) => void;
}

```

### 4.2. State Flow Diagram

1. **Boot**: `activeStudioId: null` → **StudioGallery** 表示。背景は blue (General)。
2. **Select**: ユーザーが "Coder" カードをクリック。
3. **Transition**: カードが画面全体に拡大（Layout Id Animation推奨）。
4. **State**: `activeStudioId` → `"coder-uuid"`。
5. **Theme**: 背景が blue から cyan へ 1.5秒かけてモーフィング。
6. **Active**: AppLayout が **ChatInterface** に切り替わる。

* **Header**: "Coder" アイコンと名前を表示。
- **ChatArea**: 履歴は空（Mock）、Welcome Message「コードの設計をお手伝いします」を表示。

1. **Exit**: サイドバーの「Home/Gallery」ボタン押下。
2. **State**: `activeStudioId` → `null`。
3. **Transition**: チャット画面が縮小してカードに戻る（逆再生）。

## 5. UIデザイン詳細仕様 (CSS Strategy)

Hexコードのハードコードを避け、Semantic Tokenを使用する。

### 5.1. Apple Intelligence Colors (CSS Variables)

`:root` に定義し、JSからクラス付与によって値を上書きするのではなく、Data Attribute等で制御する。

```css
/* data-theme="cyan" */
[data-theme="cyan"] {
  --glow-primary: #00FFFF;
  --glow-secondary: #0088FF;
  --glow-accent: #FFFFFF;
}

/* data-theme="magenta" */
[data-theme="magenta"] {
  --glow-primary: #FF00FF;
  --glow-secondary: #8800FF;
  --glow-accent: #FFCCCC;
}

```

### 5.2. Glass Material Classes (Tailwind Utility)

共通利用するクラスセット。

```css
.glass-panel {
  @apply bg-white/10 backdrop-blur-2xl backdrop-saturate-150 border border-white/20 shadow-xl;
}

.glass-button {
  @apply bg-white/20 hover:bg-white/30 active:scale-95 transition-all duration-200;
}

```

## 6. Phase A 実装ロードマップ

- **Step 1: Core Foundation**
- `StudioContext` 実装。
- `AmbientGlow` コンポーネントとテーマ切り替えロジックの実装。

- **Step 2: Gallery & Card**
- `StudioCard` のデザインと物理挙動実装。
- `StudioGallery` グリッドの実装。

- **Step 3: Wizard (Mock)**
- 作成モーダルのUI実装（入力値のバリデーション含む）。
- 新規作成したStudioがGalleryに追加されるロジック（メモリ内）。

- **Step 4: Active Chat Integration**
- 既存の `ChatArea` を改修し、`activeStudioId` がある場合のヘッダー/入力欄の表示切り替えに対応させる。

```

