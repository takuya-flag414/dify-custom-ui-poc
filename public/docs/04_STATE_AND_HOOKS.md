# 04. 状態管理とフック

## コンテキスト (Context)

### `AuthContext` (`src/context/AuthContext.jsx`)
アプリケーション全体の認証状態を管理します。
- **`user`**: 現在ログインしているユーザー情報（ID, 名前, ロール, 設定など）。
- **`isAuthenticated`**: ログイン済みかどうかのフラグ。
- **`login(credentials)`**: ログイン処理を実行し、トークンを保存します。
- **`logout()`**: ログアウト処理を実行し、トークンを破棄します。
- **`switchRole(role)`**: デバッグ用などでユーザーロールを切り替える機能。

## 主要カスタムフック (Hooks)

### `useChat` (`src/hooks/useChat.js`)
チャット機能の最も重要なロジックをカプセル化しています。
- **メッセージ管理**: `messages` 配列の追加、更新、削除。
- **送信処理**: `handleSendMessage` でユーザー入力を受け取り、API経由でAIに送信します。
- **ストリーミング制御**: AIからのストリーミングレスポンスを受信し、逐次更新します。
- **再生成/編集**: `handleRegenerate`, `handleEdit` でメッセージの再生成や編集を行います。
- **停止**: `stopGeneration` で生成中の処理を中断します。

### `useConversations` (`src/hooks/useConversations.ts`)
会話リストの管理を行います。
- **一覧取得**: APIから会話リストを取得し、`conversations` 状態を更新します。
- **新規作成**: `handleConversationCreated` で新しい会話を開始します。
- **削除/リネーム**: `handleDeleteConversation`, `handleRenameConversation` で会話の管理を行います。
- **ページネーション**: 無限スクロールなどに対応するための追加読み込みロジック（実装状況による）。

### `useSettings` (`src/hooks/useSettings.ts`)
ユーザーごとの設定を管理します。
- **設定保存**: テーマ、言語、プロンプト設定などをLocalStorageまたはバックエンドに保存します。
- **設定適用**: アプリ起動時に保存された設定を読み込み、適用します。

### `useApiConfig` (`src/hooks/useApiConfig.ts`)
API接続設定を管理します。
- **環境変数読み込み**: `.env` ファイルなどからデフォルトの設定を読み込みます。
- **ユーザー上書き**: ユーザーが設定画面で入力したAPIキーやURLを優先して使用します。
- **永続化**: 設定をLocalStorageに保存し、次回起動時も維持します。

### その他のフック
- **`useTheme`**: ダークモード/ライトモードの切り替えロジック。
- **`useInspector`**: メッセージインスペクターの開閉状態と選択中メッセージの管理。
- **`useTutorial`**: 初回ユーザー向けのチュートリアル状態管理。
- **`useOnboarding`**: 新規ユーザーのオンボーディングフロー管理。
- **`useErrorIntelligence`**: 高度なエラーハンドリングとリトライロジックの管理。
