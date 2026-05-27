# Dify Custom UI PoC

## 概要

本プロジェクトは、Dify APIをバックエンドに利用した社内向けAIチャットボット基盤のフロントエンドアプリケーション（PoC）です。
ユーザーとAIの対話を単なるテキストチャットにとどめず、動的に構造化された「成果物（Artifact）」としてリアルタイムに生成・編集・エクスポートする強力な機能を備えています。

## 主な機能

- **リアルタイムストリーミングチャット**: Dify API (SSE) を用いたストリーミング応答と会話の永続化
- **Artifact 機能**: AI の回答を以下の形式でリッチに描画・編集可能
  - **JsonSlide**: スライド形式での表示および PPTX エクスポート
  - **JsonDocument**: A4文書形式での表示および DOCX エクスポート
  - **MermaidViewer**: 各種ダイアグラムの SVG 描画および構文エラーのAI自動修正
  - **DrawioPanel**: フロー図の表示および XML 形式でのダウンロード
- **Firebase連携**: Authentication によるユーザー認証と Firestore による API キーのセキュアな管理

---

## 📚 開発・運用向けドキュメント

システムのアーキテクチャ、ローカル環境の構築手順、および各コア機能の詳細な仕様については、以下の「引き継ぎドキュメント」をご参照ください。  
開発に参画される方は、まずこちらの索引から順番にお読みいただくことを推奨します。

👉 **[フロントエンド引き継ぎドキュメント (索引)](./docs/handover/README.md)**

* **[Phase 1: 環境構築と全体像](./docs/handover/phase1-environment/)**  
  （アーキテクチャ、ローカルセットアップ手順、ディレクトリ構成）
* **[Phase 2: コア機能の詳細仕様](./docs/handover/phase2-core-features/)**  
  （Artifact機能の詳細仕様、ストリーミング通信ロジック、エクスポート仕様）
* **[Phase 3: 拡張ガイドライン](./docs/handover/phase3-extension-guide/)**  
  （新スライドテーマの追加、新ブロックの追加、テスト実行方法）

---

## クイックスタート

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

> **Note:** APIキーや環境変数の詳細な設定については、[ローカル環境構築手順](./docs/handover/phase1-environment/02_local-setup.md) をご確認ください。

---

*Built with [React](https://react.dev/) + [Vite](https://vitejs.dev/)*
