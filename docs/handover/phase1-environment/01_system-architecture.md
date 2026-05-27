# システムアーキテクチャ図

本ドキュメントでは、フロントエンドアプリケーションのシステム全体構成と、各コンポーネント間の関係を解説します。

---

## 1. 全体アーキテクチャ概要

本アプリケーションは、社内向けAIチャットボット基盤として設計されています。ユーザーはブラウザ上でAIと会話し、その結果をリアルタイムに「Artifact（成果物）」として生成・閲覧・編集・エクスポートすることができます。

```mermaid
graph TB
    subgraph "ブラウザ (フロントエンド)"
        UI["React アプリ\n(Vite + React 18)"]
        Hooks["カスタムフック\nuseChat.js 等"]
        Artifacts["Artifact パネル\n(JsonSlide / JsonDoc / Mermaid / Drawio)"]
    end

    subgraph "Firebase (認証・データ永続化)"
        Auth["Firebase Authentication\n(AuthService.ts)"]
        Firestore["Cloud Firestore\n(会話履歴・ユーザー設定)"]
        Vault["SecureVaultService.ts\n(APIキー等の機密データ)"]
    end

    subgraph "Backend A (LLM API)"
        DifyA["Dify API / Chat Completions\n(ChatServiceAdapter.ts)"]
        LLM["LLM (GPT / Gemini 等)"]
    end

    subgraph "Backend B (ナレッジ管理)"
        DifyB["Dify Knowledge API\n(BackendBServiceAdapter.ts)"]
        KB["ナレッジベース\n(ドキュメント・ストア)"]
    end

    UI --> Hooks
    Hooks --> Artifacts
    UI -->|"認証確認"| Auth
    Auth --> Firestore
    Hooks -->|"APIキー取得"| Vault
    Vault --> Firestore
    Hooks -->|"SSE ストリーミング"| DifyA
    DifyA --> LLM
    UI -->|"ナレッジストア一覧取得"| DifyB
    DifyB --> KB
```

---

## 2. フロントエンド内部のコンポーネント関係

```mermaid
graph LR
    subgraph "エントリーポイント"
        App["App.jsx\n(ルーティング制御)"]
    end

    subgraph "チャットレイヤー"
        Chat["Chat コンポーネント群\nsrc/components/Chat/"]
        useChat["useChat.js\n(最上位の状態管理)"]
        ChatAdapter["ChatServiceAdapter.ts\n(API通信)"]
    end

    subgraph "Artifact レイヤー"
        Panel["ArtifactPanel.jsx\n(Artifactの種別振り分け)"]
        JsonSlide["JsonSlidePanel.jsx\n(スライド描画)"]
        JsonDoc["JsonDocumentPanel.jsx\n(ドキュメント描画)"]
        Mermaid["MermaidPanel.jsx\n(ダイアグラム描画)"]
        Drawio["DrawioPanel.jsx\n(フロー図描画)"]
    end

    subgraph "ユーティリティ・エクスポート"
        PPTXEngine["PptxExportEngine\nsrc/utils/pptx/"]
        DocxEngine["DocxExportEngine\nsrc/utils/docx/"]
    end

    App --> Chat
    App --> Panel
    Chat --> useChat
    useChat --> ChatAdapter
    Panel --> JsonSlide
    Panel --> JsonDoc
    Panel --> Mermaid
    Panel --> Drawio
    JsonSlide --> PPTXEngine
    JsonDoc --> DocxEngine
```

---

## 3. 主要コンポーネントの役割一覧

| コンポーネント / サービス | ファイルパス | 役割 |
|---|---|---|
| **App.jsx** | `src/App.jsx` | ルーティング・全体レイアウトの制御 |
| **useChat.js** | `src/hooks/useChat.js` | チャット機能の最上位ステート管理（約60KB） |
| **ChatServiceAdapter** | `src/services/ChatServiceAdapter.ts` | Dify APIへのSSEストリーミングリクエスト処理 |
| **BackendBServiceAdapter** | `src/services/BackendBServiceAdapter.ts` | Backend B（ナレッジ管理）との通信 |
| **AuthService** | `src/services/AuthService.ts` | Firebase Authenticationによる認証管理 |
| **SecureVaultService** | `src/services/SecureVaultService.ts` | Firestoreに暗号化保存されたAPIキーの取得 |
| **DifyClient** | `src/services/DifyClient.ts` | ナレッジストア一覧取得のユーティリティ |
| **ArtifactPanel** | `src/components/Artifacts/ArtifactPanel.jsx` | AIレスポンスのArtifact種別を判定し、適切なパネルへ振り分ける |
| **JsonSlidePanel** | `src/components/Artifacts/JsonSlidePanel.jsx` | プレゼンスライドのメインパネル |
| **JsonDocumentPanel** | `src/components/Artifacts/JsonDocumentPanel.jsx` | ドキュメントのメインパネル |
| **MermaidPanel** | `src/components/Artifacts/MermaidPanel.jsx` | Mermaidダイアグラムのメインパネル |
| **DrawioPanel** | `src/components/Artifacts/DrawioPanel.jsx` | Draw.ioフロー図のメインパネル |

---

## 4. データフロー：AIメッセージからArtifact表示まで

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant UI as チャットUI
    participant useChat as useChat.js
    participant Adapter as ChatServiceAdapter
    participant Dify as Dify API (LLM)
    participant Panel as ArtifactPanel

    User->>UI: メッセージを入力・送信
    UI->>useChat: sendMessage() を呼び出し
    useChat->>Adapter: fetchStreamResponse() でSSEリクエスト開始
    Adapter->>Dify: POST /chat-messages (SSE)

    loop ストリーミング中
        Dify-->>Adapter: SSEイベント（text / node_finished 等）
        Adapter-->>useChat: nodeEventHandlers.js でイベント振り分け
        useChat-->>UI: streamingMessage ステートを更新
        UI-->>Panel: Artifact コンテンツをリアルタイム反映
    end

    Dify-->>Adapter: message_end イベント
    Adapter-->>useChat: ストリーミング完了・ステート確定
    useChat-->>Panel: 最終的な artifact データを確定表示
```

---

## 5. 認証フロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as App.jsx
    participant Auth as AuthService.ts
    participant Firebase as Firebase Authentication
    participant Vault as SecureVaultService.ts
    participant Firestore as Cloud Firestore

    User->>App: アプリにアクセス
    App->>Auth: onAuthStateChanged() を監視
    Auth->>Firebase: 認証状態を確認
    Firebase-->>Auth: 未ログインの場合
    Auth-->>App: ログイン画面へリダイレクト

    User->>App: ログイン操作
    App->>Auth: signIn() を呼び出し
    Auth->>Firebase: Firebase 認証実行
    Firebase-->>Auth: 認証トークン発行
    Auth-->>App: ログイン成功・UIアクセス許可

    App->>Vault: getApiConfig() を呼び出し
    Vault->>Firestore: Firestoreからユーザーの設定取得
    Firestore-->>Vault: 暗号化されたAPIキーを返却
    Vault-->>App: 復号されたAPIキー情報を返却
```

---

*関連ドキュメント: [02_local-setup.md](./02_local-setup.md) | [../phase2-core-features/05_streaming-chat.md](../phase2-core-features/05_streaming-chat.md)*
