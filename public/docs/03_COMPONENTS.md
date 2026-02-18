# 03. コンポーネントアーキテクチャ

## レイアウト構造

アプリケーションの基本レイアウトは `src/components/Layout` および `App.jsx` で定義されています。

### `AppLayout`
3ペイン構成（サイドバー、メインエリア、右側パネル）を管理するグリッドレイアウトコンポーネントです。
- **Sidebar**: 左側のナビゲーションエリア。
- **Main**: 中央のコンテンツエリア（チャットやスタジオ）。
- **Right Panel**: インスペクターまたはアーティファクトパネルを表示するエリア。
- **Responsive**: 画面サイズに応じてレイアウトを調整します。

### `Sidebar`
会話履歴のリストを表示・管理します。
- **ConversationList**: 会話アイテムのレンダリング。
- **NewChatButton**: 新規チャット作成ボタン。
- **ViewSwitcher**: チャット、スタジオ、ツールなどのビュー切り替えタブ。

### `Header`
アプリケーション上部のナビゲーションバーです。
- **ModelSelector**: 使用するAIモデルの選択。
- **UserMenu**: ユーザー設定やログアウトへのアクセス。
- **MockModeToggle**: モックモードの切り替えスイッチ。

## チャットエリア (`src/components/Chat`)

### `ChatArea`
チャットインターフェースのメインコンテナです。
- **MessageList**: メッセージのスクロール可能なリスト。
- **InputArea**: ユーザー入力フォーム。

### `Message` (`src/components/Message`)
個々のメッセージバブルを表示します。
- **MessageBubble**: メッセージ本文のスタイルとレイアウト。
- **ThinkingProcess**: 思考プロセスの表示コンポーネント。
- **CitationList**: 引用元のリスト表示。
- **ActionButtons**: コピー、再生、評価などのアクションボタン。

## パネルコンポーネント

### `InspectorPanel` (`src/components/Inspector`)
メッセージの詳細情報を表示するパネルです。
- **TabInterface**: 「思考」「引用」「JSON」などのタブ切り替え。
- **RawDataViewer**: JSONデータなどの生データ表示。

### `ArtifactPanel` (`src/components/Artifacts`)
生成物を表示・操作するパネルです。
- **Preview**: コードやMarkdownのプレビュー。
- **Actions**: ダウンロード、コピーなどの操作。

### `SettingsArea` (`src/components/Settings`)
ユーザー設定を管理する画面です。
- **ProfileSettings**: プロフィール情報の編集。
- **GeneralSettings**: テーマや言語の設定。
- **ApiConfig**: APIキーやエンドポイントの設定。

## デザインシステム (`src/components/Shared`, `src/components/UI`)

再利用可能なUIコンポーネント群です。

- **GlassCard**: ガラスモーフィズム効果を持つカードコンポーネント。
- **Button**: サイズ、バリアント（Primary/Secondary/Ghost）を持つボタン。
- **Modal**: オーバーレイモーダルダイアログ。
- **Toast**: 通知メッセージ表示コンポーネント。
- **Loading**: 各種ローディングインジケーター（Siri Orb風など）。

## 開発ツール (`src/components/DevTools`)

開発支援用のコンポーネントです。
- **TestPanel**: API接続テストや特定機能のデバッグを行うパネル。
- **LogViewer**: アプリケーションログを表示するコンソール。
