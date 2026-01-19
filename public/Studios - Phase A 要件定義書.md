# Desktop Intelligence "Studios" - Phase A 要件定義書

**Project:** 社内AIチャットボット開発プロジェクト (Desktop Intelligence Era)  
**Version:** 1.0.0 (Draft)  
**Date:** 2026-01-18  
**Author:** Lead Engineer & PM Partner

---

## 1. コンセプト定義: "Studios" (スタジオ)

従来の「チャットボットと会話する」というパラダイムを捨て、**「目的に特化した作業空間（Studio）に入室する」**という新しいUXを提供する。

ユーザーは「翻訳」「コーディング」「日報作成」といった業務ごとに定義されたStudioを選択する。Studioには、あらかじめ**優秀な助手（プロンプト）と必要な資料（コンテキスト）**がプリセットされており、入室した瞬間から作業に没頭できる環境が整っている。

### キーワード

- **Context-First**: 誰と話すかではなく、何をする場所か。
- **Immersion**: アプリケーション全体の色味や振る舞いが、作業内容に合わせて変化する。
- **Asset Management**: プロンプトとナレッジを資産（Asset）として管理・共有する。

---

## 2. Phase A 開発スコープ

Phase Aでは、バックエンド（Dify API）との連携は行わず、**「Frontend Mockup & Experience Design」**に集中する。Windows環境においてmacOS Sequoiaの世界観を完全に再現し、ユーザー体験の質（Look & Feel）を確立することをゴールとする。

### In Scope (実装対象)

- **Studio Gallery (Launchpad)**: スタジオ一覧を表示・選択するメイン画面。
- **Studio Creation Wizard**: 新しいスタジオを作成するための設定モーダル。
- **Ambient Intelligence System**: スタジオ選択に応じた環境光（Glow）の動的遷移。
- **Mock Chat Interface**: スタジオ入室後のダミーチャット画面と、ヘッダー/入力欄のバリエーション表示。

### Out of Scope (対象外)

- Dify APIへの実際の接続（モックデータを使用）。
- 認証機能の複雑な制御（現状の簡易認証を維持）。
- 作成したスタジオの永続化（LocalStorageまたはメモリ内での一時保存で対応）。

---

## 3. 機能要件 (UI/UX Specifications)

### 3.1. Studio Gallery (The Entry)

アプリケーションのホーム画面。ユーザーが所有するStudioがグリッド状に並ぶ。

**UI構成:**

- **Grid Layout**: ゆったりとした余白（`gap-6`以上）を持ったレスポンシブグリッド。
- **Glass Cuboids**: 各Studioは、厚みを感じさせるガラスの直方体（カード）として表現。
- **Material**: `backdrop-filter: blur(20px) saturate(180%)`
- **Border**: 半透明の白いボーダー (`white/10`) + 内部シャドウによる厚み表現。

**Visual Identity:**

- **Icon**: 中央に浮遊する3Dライクなアイコン（絵文字またはSVG）。
- **Theme Color**: カードのエッジや背景に、そのStudioのテーマカラーがほのかに滲む。

**Interaction:**

- **Hover Effect**: マウスオーバー時、カードが物理的に浮上（Scale & Y-axis translation）し、Glowが強まる。
- **Transition**: クリックすると、カードが拡大して画面全体を覆うようなトランジションを経て、チャット画面へ遷移する。

### 3.2. Studio Creation Wizard

新しいStudioを作成するためのウィザード。macOSのシステム設定パネルのような質感。

**UI構成:**

- **Modal Window**: 画面中央に表示されるAcrylic Materialのウィンドウ。
- **Steps**:
    1. **Identity**: 名前、アイコン、テーマカラー（7色のApple Intelligenceカラーから選択）。
    2. **Instruction**: 「あなたは〇〇です」というシステムプロンプトの入力。
    3. **Knowledge**: 参照ファイルのドラッグ＆ドロップエリア。

**UX:**

- ファイルドロップ時、吸い込まれるような物理アニメーション（Spring Physics）。
- 設定完了時、新しいStudioカードがGalleryに生成されるエフェクト。

### 3.3. Active Studio Interface (Chat Screen)

Studio入室後の画面。

- **Header**:
  - 現在滞在しているStudioのアイコンと名前を表示。
  - 背景にはStudioのテーマカラーがAmbient Glowとして流体的に漂う。
- **Chat Input**:
  - プレースホルダー文言をStudioごとにカスタマイズ（例: 「翻訳したいテキストを入力...」）。

---

## 4. デザイン・技術要件 (DESIGN_RULE.md 準拠)

### 4.1. Design System

- **Typography**: SF Pro (macOS) / Inter (Windows fallback)。
- **Corner Radius**:
  - Window/Panel: `22px` (Smooth Corner)
  - Inner Elements: `12px` - `16px`
- **Lighting (Apple Intelligence Glow)**:
  - CSS `conic-gradient` と `filter: blur(80px)` を組み合わせ、画面外周をゆっくりと回転する光を実装。
  - Studioのテーマカラーに応じて、Gradientの配色 (`cyan`, `magenta`, `yellow`, `blue` 等) を動的に書き換える。

### 4.2. Animation (Framer Motion)

線形（Linear）な動きは禁止。すべて物理演算に基づく。

**Spring Config:**

```javascript
// Standard Interaction
{ stiffness: 300, damping: 30 }

// Page Transition
{ stiffness: 200, damping: 25 }

```

**Micro-interactions:**

- ボタン押下時の `scale`: `0.95`。
- ホバー時の `y`: `-5px` (Levitation)。

---

## 5. ロードマップ (Future Vision)

### Phase B: Dify Integration (Engine Connection)

- **Workflow Routing**: 作成したStudioのデータを、単一のDifyワークフローへ動的に注入するロジックの実装。
- **Variable Injection**: フロントエンドで設定した `sys_prompt` や `knowledge_files` をDify APIの `inputs` パラメータとして送信。

### Phase C: Collaboration (Team Sharing)

- **Shared Studios**: 作成したStudioをURLまたはチーム共有機能で他ユーザーに配布。
- **Marketplace**: 社内の優秀なプロンプトエンジニアが作ったStudioをランキング形式で公開する「Internal Studio Store」。

```

