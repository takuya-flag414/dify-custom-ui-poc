# 05. APIとサービス

## APIクライアント

### `DifyClient` (`src/services/DifyClient.ts`)
Dify APIとの直接的な通信を担当するベースクライアントです。
- **HTTPメソッド**: `get`, `post`, `patch`, `delete` のラッパーメソッドを提供。
- **ヘッダー管理**: Authorizationヘッダー（APIキー）の自動付与。
- **エラーハンドリング**: 共通のエラー処理とレスポンスの正規化。

## サービスアダプター

### `ChatServiceAdapter` (`src/services/ChatServiceAdapter.ts`)
UIとAPIクライアントの間を取り持つアダプターパターンを実装しています。
- **`sendMessage`**: ユーザー入力をDify APIの期待する形式に変換して送信します。
- **`getHistory`**: 会話履歴を取得し、UIコンポーネントが扱いやすい形式に変換します。
- **`uploadFile`**: ファイルアップロード処理を抽象化します。
- **モック切り替え**: `mockMode` フラグにより、実際のAPI呼び出しかモックデータかを透過的に切り替えます。

### `BackendBServiceAdapter` (`src/services/BackendBServiceAdapter.ts`)
セカンダリバックエンド（ストア管理など）との連携を担当します。
- **ストアリスト取得**: 利用可能なAIエージェント/ストアの一覧を取得します。
- **認証**: 独自の認証メカニズム（必要に応じて）を処理します。

## 認証サービス

### `AuthService` (`src/services/AuthService.ts`)
ユーザー認証に関するロジックを集約しています。
- **ログイン/サインアップ**: 認証サーバー（またはDifyの認証エンドポイント）へのリクエスト。
- **セッション管理**: トークンの検証とリフレッシュ。
- **パスワードリセット**: パスワード再設定フローの処理。

## 設定と環境変数 (`src/config/`)

アプリケーションの動作を制御する設定ファイル群です。

### `config/env.js`
環境変数を読み込み、定数としてエクスポートします。
- `VITE_API_URL`: Dify APIのエンドポイント。
- `VITE_API_KEY`: デフォルトのAPIキー（開発用）。
- `DEFAULT_MOCK_MODE`: デフォルトのモックモード設定。

### `config/featureFlags.ts`
機能の有効/無効を切り替えるフラグ定義です。
- `USE_SETTINGS_MODAL`: 設定画面をモーダルで表示するかどうか。
- `ENABLE_FILE_UPLOAD`: ファイルアップロード機能を有効にするか。
- `SHOW_DO_NOT_TRAIN_TOGGLE`: 「学習に使用しない」トングルの表示制御。
