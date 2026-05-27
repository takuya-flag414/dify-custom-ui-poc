# ディレクトリ構造

本ドキュメントでは、`src/` 配下の各フォルダ・ファイルの役割を解説します。  
開発作業を開始する前に、全体の構成を把握しておいてください。

---

## 1. トップレベル構造

```
dify-custom-ui-poc/
├── src/                   ← アプリケーションのソースコード（本ドキュメントの対象）
├── docs/                  ← ドキュメント群（本ドキュメント含む）
├── public/                ← 静的アセット（favicon等）
├── index.html             ← エントリーポイントHTML
├── vite.config.*          ← Viteビルド設定
├── package.json           ← パッケージ管理
├── tsconfig.json          ← TypeScript設定
└── .env                   ← 環境変数（Gitには含めない）
```

---

## 2. `src/` 配下の構造

```
src/
├── App.jsx                ← アプリケーションのルートコンポーネント・ルーティング
├── main.jsx               ← Reactのエントリーポイント（ReactDOM.render）
├── App.css                ← アプリ全体のグローバルスタイル
├── index.css              ← ベーススタイル・CSS変数定義（最も重要）
│
├── api/                   ← 低レベルのAPI通信処理
├── components/            ← UIコンポーネント群（最大のディレクトリ）
├── config/                ← アプリケーション設定
├── context/               ← React Context（グローバルステート）
├── hooks/                 ← カスタムフック
├── lib/                   ← 外部ライブラリのラッパー（Firebase等）
├── mocks/                 ← モックデータ
├── routes/                ← ルート定義
├── services/              ← ビジネスロジック・API通信サービス
├── tests/                 ← テストコード
├── types/                 ← TypeScript型定義
└── utils/                 ← 汎用ユーティリティ関数
```

---

## 3. 各フォルダの役割詳細

### `src/components/`

UIコンポーネントをカテゴリ別にフォルダ分けしています。

| フォルダ | 役割 |
|---|---|
| `Artifacts/` | AIが生成するArtifact（成果物）の表示パネル群。**本アプリの中核機能。** JsonSlide / JsonDocument / Mermaid / Drawioの各パネルが含まれる |
| `Chat/` | チャットUI本体（メッセージリスト・入力エリア等） |
| `Admin/` | 管理者向けUI |
| `Auth/` | 認証関連UI（ログイン画面等） |
| `Layout/` | ページ全体のレイアウトコンポーネント（サイドバー・ヘッダー等の配置） |
| `Sidebar/` | サイドバー（会話履歴・設定メニュー等） |
| `Message/` | 個別メッセージの描画コンポーネント（ThinkingProcess等） |
| `Settings/` | 設定画面UI |
| `Shared/` | 複数箇所で共有される汎用コンポーネント |
| `UI/` | ボタン・モーダル等の最小単位UIパーツ |
| `DevTools/` | 開発者向けデバッグツール |
| `Inspector/` | デバッグ用インスペクターパネル |
| `Loading/` | ローディング表示コンポーネント |
| `Mini/` | ミニチャット表示用コンポーネント |
| `Onboarding/` | 初回利用者向けオンボーディングUI |
| `Studios/` | スタジオ機能関連UI |
| `Tools/` | ツール系コンポーネント |
| `Tutorial/` | チュートリアル表示コンポーネント |
| `IntelligenceHUD/` | AI処理状況のHUD（ヘッドアップディスプレイ）表示 |

### `src/components/Artifacts/` の内部構造（重要）

```
Artifacts/
├── ArtifactPanel.jsx           ← Artifact種別の振り分けロジック（親コンポーネント）
├── ArtifactCard.jsx            ← チャット内に表示されるArtifactカードUI
├── JsonSlidePanel.jsx          ← スライド生成パネルのエントリー
├── JsonDocumentPanel.jsx       ← ドキュメント生成パネルのエントリー
├── MermaidPanel.jsx            ← Mermaidダイアグラムパネルのエントリー
├── DrawioPanel.jsx             ← Draw.ioフロー図パネルのエントリー
├── GeneratingArtifact.jsx      ← 生成中アニメーション
├── GeneratingArtifactSlide.jsx ← スライド生成中アニメーション
│
├── JsonSlide/                  ← スライド生成機能の内部実装
│   ├── PresentationPanel.jsx   ← スライドプレゼンテーション本体
│   ├── SlideRenderer.jsx       ← スライドのレンダリング制御
│   ├── SlideNavigation.jsx     ← スライドの前後移動UI
│   ├── EditModeModal.jsx       ← 編集モードのモーダル
│   ├── SlideFormEditor.jsx     ← スライド内容の編集フォーム
│   ├── config/
│   │   └── themeRegistry.js    ← テーマの登録・管理（テーマシステムの中枢）
│   ├── slides/                 ← 共通スライドコンポーネント（テーマ非依存）
│   └── themes/                 ← テーマ別の実装
│       ├── modern-indigo/      ← Modern Indigoテーマ
│       └── corporate-modern/   ← Corporate Modernテーマ
│
├── JsonDocument/               ← ドキュメント生成機能の内部実装
│   ├── JsonDocParser.jsx       ← ブロック種別→コンポーネントへのディスパッチ
│   ├── JsonDocRenderer.jsx     ← ページネーション管理・DocPageの生成
│   ├── JsonDocFormEditor.jsx   ← ドキュメント内容の編集フォーム
│   ├── blocks/                 ← ブロック種別ごとのUIコンポーネント
│   ├── components/             ← DocPage・EditableBlockWrapper等
│   ├── styles/                 ← ドキュメント専用CSS
│   └── utils/
│       └── usePagination.js    ← A4ページへの動的ページネーション処理
```

---

### `src/hooks/`

React カスタムフックの置き場所。

| ファイル / フォルダ | 役割 |
|---|---|
| `useChat.js` | **最重要。** チャット機能全体の状態管理（メッセージ・ストリーミング・Artifact等）。約60KB |
| `chat/` | useChat.jsから切り出した各種サブモジュール |
| `chat/historyLoader.js` | 会話履歴のFirestoreからの読み込み |
| `chat/nodeEventHandlers.js` | Dify SSEイベント（node_started等）のハンドリング |
| `chat/messageEventHandlers.js` | メッセージイベントの処理 |
| `chat/messageActions.js` | メッセージ操作（送信・削除・再生成等）のアクション |
| `chat/constants.ts` | チャット関連の定数定義 |
| `chat/perfTracker.js` | パフォーマンス計測ユーティリティ |
| `useConversations.ts` | 会話一覧の管理フック |
| `useSettings.ts` | ユーザー設定の管理フック |
| `useTheme.ts` | テーマ（ライト/ダーク）の管理フック |
| `useApiConfig.ts` | API設定の管理フック |

---

### `src/services/`

ビジネスロジックとAPI通信を担うサービス層。

| ファイル | 役割 |
|---|---|
| `ChatServiceAdapter.ts` | Dify APIへのSSEストリーミングリクエスト処理。チャットの主通信路 |
| `AuthService.ts` | Firebase Authenticationを使った認証処理全般（ログイン・ログアウト・ユーザー情報管理） |
| `SecureVaultService.ts` | Firestoreに保存されたAPIキー等の機密データの暗号化・復号処理 |
| `BackendBServiceAdapter.ts` | Backend B（ナレッジ管理）との通信アダプター |
| `DifyClient.ts` | ナレッジストア一覧の取得ユーティリティ |
| `AiAnalyticsService.ts` | AI利用状況のアナリティクス処理 |

---

### `src/config/`

アプリケーション設定ファイル。

| ファイル | 役割 |
|---|---|
| `env.ts` | **最重要。** 全環境変数（`VITE_*`）を一元管理・エクスポート |
| `featureFlags.ts` | 機能フラグの管理（特定機能のON/OFF） |
| `devMode.ts` | 開発モードの判定 |
| `settingsConfig.tsx` | 設定画面の項目定義 |
| `thinkingRenderRules.ts` | AI思考プロセスの表示ルール |
| `seasonalBackgrounds.ts` | 季節ごとの背景設定 |

---

### `src/utils/`

汎用ユーティリティ関数群。

| ファイル / フォルダ | 役割 |
|---|---|
| `pptx/` | PPTXエクスポートエンジン |
| `docx/` | DOCXエクスポートエンジン |
| `slideTypeMapper.js` | スライドタイプ変更時のデータ変換・マッピングロジック |
| `responseParser.ts` | AIレスポンスの解析・Artifact抽出処理 |
| `mermaidHelper.js` | Mermaidコードのタイプ判定・ラベルマッピング |
| `errorHandler.ts` | エラー処理の共通ロジック |
| `privacyDetector.ts` | 個人情報検出処理 |
| `messageSerializer.ts` | メッセージデータのシリアライズ |

---

### `src/lib/`

外部ライブラリのラッパー・初期化処理。

| ファイル | 役割 |
|---|---|
| `firebase.ts` | Firebase SDKの初期化・設定 |

---

### `src/types/`

TypeScript の型定義ファイル群。  
コンポーネント・サービス間で共有する型はここに集約します。

---

### `src/tests/`

テストコードの置き場所。  
詳細は [03_test-guide.md](../phase3-extension-guide/03_test-guide.md) を参照。

---

*関連ドキュメント: [01_system-architecture.md](./01_system-architecture.md) | [02_local-setup.md](./02_local-setup.md)*
