# ローカル環境構築手順

本ドキュメントでは、ローカル開発環境のセットアップ手順を解説します。  
初めて参画する開発者は、このドキュメントを最初から最後まで実施してください。

---

## 1. 前提条件

### 必要なソフトウェア

| ソフトウェア | 推奨バージョン | 備考 |
|---|---|---|
| **Node.js** | 18.x 以上（LTS推奨） | [公式サイト](https://nodejs.org/) からダウンロード |
| **npm** | 9.x 以上 | Node.jsに同梱 |
| **Git** | 最新版 | リポジトリのクローンに使用 |

> **Node バージョン管理**:  
> `nvm`（Node Version Manager）や `volta` の使用を推奨します。  
> `.nvmrc` ファイルがある場合は `nvm use` コマンドで自動的に適切なバージョンに切り替わります。

---

## 2. リポジトリのクローンとセットアップ

```bash
# リポジトリをクローン
git clone <リポジトリURL>
cd dify-custom-ui-poc

# 依存パッケージのインストール
npm install
```

---

## 3. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成します。  
`.env.example`（あれば）をコピーするか、以下の一覧を参考に設定してください。

```bash
# .env.example をコピーして作成（推奨）
cp .env.example .env
```

### 環境変数一覧

環境変数は `src/config/env.ts` で一元管理されています。

#### 🔑 API 設定

| 変数名 | 必須 | デフォルト値 | 説明 |
|---|---|---|---|
| `VITE_USE_ENV_API_CONFIG` | 任意 | `false` | `true` にすると下記の ENV_API_KEY / URL 設定が優先される |
| `VITE_API_KEY_A` | 条件付き | - | Backend A (チャット) の Dify API キー |
| `VITE_API_URL_A` | 条件付き | `https://api.dify.ai/v1` | Backend A の API ベースURL |
| `VITE_API_KEY_B` | 条件付き | - | Backend B (ナレッジ管理) の Dify API キー |
| `VITE_API_URL_B` | 条件付き | `https://api.dify.ai/v1` | Backend B の API ベースURL |

> **注意**: `VITE_USE_ENV_API_CONFIG=false` の場合、APIキーはFirestore経由（SecureVaultService）で管理されます。  
> ローカル開発では `true` に設定してAPIキーを直接指定する方法が簡便です。

#### 🎛️ モック設定

| 変数名 | 必須 | デフォルト値 | 説明 |
|---|---|---|---|
| `VITE_DEFAULT_MOCK_MODE` | 任意 | `OFF` | `OFF` / `FE` / `BE` のいずれかを指定 |
| `VITE_SIMULATE_FE_ERROR` | 任意 | `false` | `true` にするとFEモード時にエラーを疑似発生させる |

**モックモードの詳細:**

| モード | 説明 |
|---|---|
| `OFF` | 本番同等。外部APIへの実通信を行う |
| `FE` | フロントエンドのみ（外部通信なし）。UIの動作確認に使用 |
| `BE` | バックエンドモックを使用 |

#### 🖥️ UI 表示制御

| 変数名 | 必須 | デフォルト値 | 説明 |
|---|---|---|---|
| `VITE_SHOW_HEADER` | 任意 | `false` | ヘッダーを表示する場合は `true` |
| `VITE_SHOW_TOKEN_USAGE` | 任意 | `false` | トークン使用量を表示する場合は `true` |
| `VITE_ENABLE_WEB_SEARCH` | 任意 | `true` | Web検索（Deep）モードを非表示にする場合は `false` |
| `VITE_ENABLE_INTERNAL_DATA` | 任意 | `true` | 社内データモードを非表示にする場合は `false` |
| `VITE_ENABLE_SPECIFY_WEBSITE` | 任意 | `true` | 「Webサイトを指定」を非表示にする場合は `false` |
| `VITE_ENABLE_CREATE_ARTIFACT` | 任意 | `true` | 「Artifactを作成」を非表示にする場合は `false` |
| `VITE_ENABLE_MESSAGE_EDIT` | 任意 | `true` | メッセージ編集機能を無効化する場合は `false` |
| `VITE_ENABLE_MESSAGE_REGENERATE` | 任意 | `true` | 回答の再生成機能を無効化する場合は `false` |

### .env 設定例（ローカル開発向け）

```dotenv
# ローカル開発用 .env サンプル

# APIキーを環境変数から直接指定（Firestore不要にする）
VITE_USE_ENV_API_CONFIG=true
VITE_API_KEY_A=app-xxxxxxxxxxxxxxxxxxxx
VITE_API_URL_A=https://api.dify.ai/v1
VITE_API_KEY_B=app-yyyyyyyyyyyyyyyyyy
VITE_API_URL_B=https://api.dify.ai/v1

# モックモード（APIを使いたくない時は FE）
VITE_DEFAULT_MOCK_MODE=OFF

# UI表示
VITE_SHOW_HEADER=false
VITE_SHOW_TOKEN_USAGE=false
```

> ⚠️ **`.env` ファイルは絶対に Git にコミットしないこと。**  
> `.gitignore` に `.env` が含まれていることを確認してください。

---

## 4. 開発サーバーの起動

```bash
# 開発サーバーを起動（ホットリロード有効）
npm run dev
```

起動が成功すると、以下のようなメッセージが表示されます：

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

ブラウザで `http://localhost:5173/` を開いてください。

---

## 5. その他の npm スクリプト

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー起動（ホットリロード有効） |
| `npm run build` | プロダクションビルド（`dist/` に出力） |
| `npm run preview` | ビルド成果物のプレビュー |
| `npm run test` | テストの実行 |
| `npm run lint` | ESLint によるコード検査 |

---

## 6. よくあるトラブルシューティング

### ポートが使用中の場合

```bash
# 別のポートで起動
npm run dev -- --port 3000
```

### 依存関係のエラーが出る場合

```bash
# node_modules を削除して再インストール
rm -rf node_modules
npm install
```

### 環境変数が読み込まれない場合

- ファイル名が `.env`（先頭にドット）であることを確認
- `VITE_` プレフィックスが付いていることを確認（Viteの仕様）
- 開発サーバーを再起動する

---

*関連ドキュメント: [01_system-architecture.md](./01_system-architecture.md) | [03_directory-structure.md](./03_directory-structure.md)*
