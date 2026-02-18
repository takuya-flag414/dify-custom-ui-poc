# 06. 開発ガイド

## セットアップ

このプロジェクトをローカル環境で実行するための手順です。

### 必須要件
- Node.js (v18以上推奨)
- npm または yarn

### インストール
リポジトリをクローンした後、依存関係をインストールします。
```bash
npm install
```

### 開発サーバーの起動
ホットリロード機能付きの開発サーバーを立ち上げます。
```bash
npm run dev
```
ブラウザで `http://localhost:5173` (ポートは設定による) にアクセスしてアプリを確認します。

## ビルド

本番環境向けの最適化されたビルドを生成します。

```bash
npm run build
```
ビルド成果物は `dist` ディレクトリに出力されます。

## プレビュー

ビルド後のアプリケーションをローカルでプレビューします（デプロイ前の確認用）。

```bash
npm run preview
```

## コーディング規約と構造

### ファイル命名規則
- **コンポーネント**: PascalCase (例: `ChatArea.jsx`, `AppLayout.tsx`)
- **フック**: camelCase, prefix `use` (例: `useChat.js`)
- **ユーティリティ/サービス**: camelCase または PascalCase (例: `api.js`, `AuthService.ts`)
- **定数/設定**: camelCase または SCREAMING_SNAKE_CASE (例: `config.js`, `FEATURE_FLAGS.ts`)

### コンポーネント構造
可能な限り、以下の構造を維持してください。
1. **Imports**: React, ライブラリ, ローカルコンポーネント, フック, スタイルの順。
2. **Types/Interfaces**: TypeScriptの場合、PropsやStateの型定義。
3. **Component Definition**: 関数コンポーネント。
   - Hooksの呼び出し
   - 派生ステート (useMemo)
   - 副作用 (useEffect)
   - イベントハンドラー
   - JSXレンダリング

## トラブルシューティング

### モックモードについて
APIキーがない場合やバックエンドがオフラインの場合は、`src/config/env.js` または `.env` ファイルで `DEFAULT_MOCK_MODE` を `'FE'` に設定することで、モックデータを使用してUIの開発を進めることができます。

### スタイルの競合
Tailwind CSSとVanilla CSS (`App.css`) を併用しています。`z-index` や `position` の競合に注意してください。グローバルなスタイル変更は `index.css`、コンポーネント固有の複雑なスタイルは `App.css` またはCSS Modulesの使用を検討してください。

### エラーハンドリング
APIエラーが発生した場合、`IntelligenceHUD` が自動的にキャッチしてユーザーに通知します。開発中はコンソールログ (`F12`) も併せて確認してください。`useLogger` フックを使用すると、画面上のログビューワーにもログを出力できます。
