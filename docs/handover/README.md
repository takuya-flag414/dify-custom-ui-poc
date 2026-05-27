# フロントエンド引き継ぎドキュメント

本ディレクトリは、フロントエンドアプリケーションの引き継ぎを目的としたドキュメント体系です。  
開発の属人化を防ぎ、新規参画者・開発者・運用担当者がスムーズに業務を開始できるように整備されています。

## 📚 ドキュメント構成

```
handover/
├── README.md                              ← このファイル（索引）
├── phase1-environment/                    ← Phase 1: 環境構築と全体像（初参画者向け）
│   ├── 01_system-architecture.md
│   ├── 02_local-setup.md
│   └── 03_directory-structure.md
├── phase2-core-features/                  ← Phase 2: コア機能の詳細仕様（開発者向け）★最優先
│   ├── 01_artifact-json-slide.md
│   ├── 02_artifact-json-document.md
│   ├── 03_artifact-mermaid.md
│   ├── 04_artifact-drawio.md
│   ├── 05_streaming-chat.md
│   └── 06_export-pptx-docx.md
└── phase3-extension-guide/                ← Phase 3: 拡張ガイドライン（運用・保守向け）
    ├── 01_add-slide-theme.md
    ├── 02_add-artifact-block.md
    └── 03_test-guide.md
```

---

## 🎯 読み進め方ガイド

| あなたの状況 | 推奨する読み進め方 |
|---|---|
| **初めて参画する開発者** | Phase 1 → Phase 2 の順に読む |
| **特定機能（Artifact等）を修正したい開発者** | Phase 2 の該当ドキュメントを直接参照 |
| **新しいスライドテーマや機能を追加したい** | Phase 2 → Phase 3 の順に読む |
| **テスト・運用・保守担当者** | Phase 3 を中心に参照 |

---

## 📋 フェーズ別概要

### Phase 1: 環境構築と全体像（初参画者向け）

| ドキュメント | 内容 |
|---|---|
| [01_system-architecture.md](./phase1-environment/01_system-architecture.md) | システム全体のアーキテクチャ図（フロント・BFF・Firebase・Dify等の関係性） |
| [02_local-setup.md](./phase1-environment/02_local-setup.md) | ローカル開発環境の構築手順（Nodeバージョン・.env設定・起動コマンド） |
| [03_directory-structure.md](./phase1-environment/03_directory-structure.md) | `src/` 配下の各フォルダの役割一覧 |

### Phase 2: コア機能の詳細仕様（開発者向け）★最優先

| ドキュメント | 内容 |
|---|---|
| [01_artifact-json-slide.md](./phase2-core-features/01_artifact-json-slide.md) | JsonSlide（スライド生成）機能の詳細仕様・テーマシステム |
| [02_artifact-json-document.md](./phase2-core-features/02_artifact-json-document.md) | JsonDocument（ドキュメント生成）機能・ページネーション・編集機能 |
| [03_artifact-mermaid.md](./phase2-core-features/03_artifact-mermaid.md) | MermaidViewer（ダイアグラム生成）機能・エラーハンドリング |
| [04_artifact-drawio.md](./phase2-core-features/04_artifact-drawio.md) | DrawioPanel（フロー図生成）・iframe連携仕様 |
| [05_streaming-chat.md](./phase2-core-features/05_streaming-chat.md) | AIストリーミングチャットと状態管理の仕組み |
| [06_export-pptx-docx.md](./phase2-core-features/06_export-pptx-docx.md) | PPTXおよびDOCXエクスポート処理の仕組み |

### Phase 3: 拡張ガイドライン（運用・保守向け）

| ドキュメント | 内容 |
|---|---|
| [01_add-slide-theme.md](./phase3-extension-guide/01_add-slide-theme.md) | 新しいスライドテーマの追加方法（Step-by-step） |
| [02_add-artifact-block.md](./phase3-extension-guide/02_add-artifact-block.md) | 新しいArtifactブロックの追加方法（Step-by-step） |
| [03_test-guide.md](./phase3-extension-guide/03_test-guide.md) | テストコードの実行と記述ルール |

---

## 📝 ドキュメント更新方針

- **更新タイミング**: 機能追加・仕様変更が発生した際は、対応するドキュメントを必ず更新する
- **フォーマット**: Markdown形式で記述する
- **図の作成**: アーキテクチャ図などはMermaid記法を使用する
- **ファイルパス**: 常に `src/` からの相対パスで記述する（絶対パスは使用しない）

---

*最終更新: 2026-05*
