# 01. プロジェクト構造と技術スタック

## 技術スタック

本プロジェクトは、モダンなフロントエンド技術を使用して構築された、Dify (LLMアプリ開発プラットフォーム) のカスタムUI実装です。

- **Framework**: React 18+
- **Build Tool**: Vite
- **Language**: JavaScript / TypeScript (混在環境、移行中)
- **Styling**: 
  - Tailwind CSS (ユーティリティファースト)
  - Vanilla CSS (`index.css`, `App.css` - カスタムスタイル、アニメーション)
- **Animation**: Framer Motion (ページ遷移、UIインタラクション)
- **Icons**: Lucide React / Phosphor Icons
- **State Management**: React Context & Custom Hooks
- **Markdown Rendering**: React Markdown / Remark / Rehype

## ディレクトリ構造 (`src/`)

`src` ディレクトリは機能ごとに整理されています。

```
src/
├── api/             # API定義、型定義など
├── components/      # Reactコンポーネント
│   ├── Artifacts/   # 生成物表示パネル
│   ├── Auth/        # ログイン、認証関連
│   ├── Chat/        # チャットエリア、メッセージバブル、入力フォーム
│   ├── DevTools/    # 開発用ツール（テストパネルなど）
│   ├── Inspector/   # メッセージ詳細・引用インスペクター
│   ├── IntelligenceHUD/ # エラーハンドリング・通知UI
│   ├── Layout/      # アプリ全体のレイアウト（ヘッダーなど）
│   ├── Loading/     # ローディング画面
│   ├── Message/     # メッセージ内部部品（思考プロセス表示など）
│   ├── Onboarding/  # 初回ユーザー向けウィザード
│   ├── Settings/    # 設定モーダル・画面
│   ├── Shared/      # 汎用UIコンポーネント（ボタン、カード、モーダル）
│   ├── Sidebar/     # 左側のサイドバー（会話履歴）
│   ├── Studios/     # スタジオ機能（専用ワークスペース）
│   ├── Tools/       # ツール一覧・管理
│   ├── Tutorial/    # チュートリアルオーバーレイ
│   └── UI/          # 基本UI要素
├── config/          # 定数、環境設定、Feature Flags
├── context/         # React Context (AuthContextなど)
├── hooks/           # カスタムフック (ビジネスロジックの分離)
├── mocks/           # モックデータ、ハンドラー (Mock Service Worker等)
├── services/        # API通信、外部サービス連携ロジック
├── tests/           # テスト関連
├── types/           # TypeScript型定義
└── utils/           # ユーティリティ関数
```

## エントリーポイント

### `main.jsx`
アプリケーションのブートストラップを行います。
- `ReactDOM.createRoot` でReactアプリをマウント
- `StrictModel` の適用
- `AuthProvider` でアプリ全体をラップし、認証状態を供給

### `App.jsx`
アプリケーションのメインコンポーネントです。
- **ルーティング/ビュー管理**: `currentView` ステートにより、チャット、スタジオ、設定などのビューを切り替えます（React Routerは使用せず、SPAとしての独自のビュー制御を持っています）。
- **認証ガード**: 未認証ユーザーを `LoginScreen` へ誘導します。
- **レイアウト構成**: `AppLayout` コンポーネントを使用し、サイドバー、メインエリア、インスペクターパネルの3ペイン構成（または設定によっては2ペイン）を実現します。
- **グローバルステートの初期化**: `useChat`, `useConversations`, `useSettings` などの主要フックを初期化し、子コンポーネントにPropsとして渡します。
```
