# Dify Custom UI Documentation

このドキュメント群は、**AIエージェント**および開発者が、ソースコードを詳細に読み解くことなく、本プロジェクトの構造、機能、実装詳細を理解できるように構成されています。

## 目次

### 1. [プロジェクト構造と技術スタック (01_STRUCTURE.md)](./01_STRUCTURE.md)
   - ディレクトリ構成の解説
   - 主要な技術スタック (React, Vite, Tailwind, etc.)
   - エントリーポイントのロジック

### 2. [主要機能 (02_FEATURES.md)](./02_FEATURES.md)
   - スマートチャットとストリーミング
   - 思考プロセス (Chain of Thought) の可視化
   - アーティファクトパネル
   - スタジオ機能とインスペクター
   - モックモード (FE/BE)

### 3. [コンポーネントアーキテクチャ (03_COMPONENTS.md)](./03_COMPONENTS.md)
   - レイアウト構造 (AppLayout, Sidebar)
   - チャットエリアとメッセージ表示
   - 各種パネル (Inspector, Artifact, Settings)
   - デザインシステムと共通UI

### 4. [状態管理とフック (04_STATE_AND_HOOKS.md)](./04_STATE_AND_HOOKS.md)
   - 認証 (AuthContext)
   - チャットロジック (useChat)
   - 会話管理 (useConversations)
   - 設定とテーマ (useSettings, useTheme)

### 5. [APIとサービス (05_API_AND_SERVICES.md)](./05_API_AND_SERVICES.md)
   - Dify API クライアント
   - チャットサービスアダプター
   - 認証サービス
   - 環境変数と設定

### 6. [開発ガイド (06_DEVELOPMENT.md)](./06_DEVELOPMENT.md)
   - セットアップ手順
   - 開発フロー
   - トラブルシューティング

---
*Generated for AI Agents & Developers*
