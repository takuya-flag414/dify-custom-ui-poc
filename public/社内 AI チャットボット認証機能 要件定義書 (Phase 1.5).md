# 社内 AI チャットボット認証機能 要件定義書 (Phase 1.5)

| 項目                | 内容                                                              |
| :------------------ | :---------------------------------------------------------------- |
| **プロジェクト名**  | 社内 AI チャットボット開発プロジェクト (Desktop Intelligence Era) |
| **ドキュメント ID** | REQ-AUTH-001                                                      |
| **バージョン**      | 1.1                                                               |
| **作成日**          | 2026/01/07                                                        |
| **更新日**          | 2026/01/07 (アーキテクチャ分析反映)                               |

---

## 1. 開発の目的と背景

### 1.1. 目的

本開発の目的は、AI チャットボットにおいて「個」を確立し、セキュアかつパーソナライズされた体験を提供するための**認証基盤（アカウント機能）**を実装することである。

これまでの「端末（ブラウザ）依存の UUID 自動生成」方式を廃止し、DB に登録された資格情報に基づく認証を導入することで、以下の実現を目指す。

- **セキュリティの向上**: 誰が AI を利用しているかを明確にし、アクセス制御を可能にする。
- **体験の継続性**: デバイスやブラウザが変わっても、会話履歴や設定（AI の口調、RAG 設定など）を引き継げるようにする。
- **パーソナライズの深化**: ユーザー属性（部署、役割）に応じたプロアクティブな情報提案の基盤を作る。

### 1.2. 背景

現在（Phase 1 完了時点）は、PoC としての利用障壁を下げるため、アクセスするだけで自動的に ID が発行される仕組みを採用している。しかし、本番運用（Production）を見据えた場合、以下の課題が顕在化している。

- ブラウザのキャッシュクリアで履歴が消失する。
- 機密性の高いドキュメントを扱う際、ユーザー認証がない状態ではリスクが高い。
- 「思考のパートナー」として信頼関係を築くには、AI がユーザーを個人として認知する必要がある。

## 2. システム概要

### 2.1. コンセプト

**"Entrace to Intelligence" (知性への入り口)**

単なるセキュリティゲート（ログイン画面）ではなく、AI との対話が始まる「期待感を醸成する空間」として設計する。macOS Sequoia の世界観を踏襲し、認証プロセス自体が未来的で心地よい体験となることを目指す。

### 2.2. ターゲットユーザー

- **全社員**: 将来的には数千人規模を想定
- **管理者**: ユーザー管理を行う情報システム部

### 2.3. 利用環境

- **OS**: Windows 10/11 (主力), macOS
- **Browser**: Google Chrome, Microsoft Edge
- **UI Framework**: React (Vite) + Tailwind CSS (macOS Styling)

### 2.4. アーキテクチャ方針 (Decoupled Auth Model)

本システムは、ユーザー認証と AI 推論エンジンを疎結合に保つアーキテクチャを採用する。

- **Authentication Layer (Client/DB)**:
  - ユーザーの本人確認（メール/パスワード認証）およびセッション管理は、React アプリケーションと独自のユーザー DB 間で完結させる。
  - Dify 側にはログイン機能を持たせず、推論 API としてのみ利用する。
- **Identity Mapping (ID 連携)**:
  - 認証成功時に DB から取得した一意な `userId` (User Identifier) を、Dify API 呼び出し時の `user` パラメータとして動的に注入する。
  - これにより、Dify 側では「どのユーザーの会話履歴か」を識別・分離するが、Dify 自体がパスワード等を管理することはない。

## 3. 機能要件 (Functional Requirements)

### 3.1. 認証・アカウント管理 (Auth Core)

| ID             | 機能項目           | 要件詳細                                                                                                                                                                                 | 備考                                                                |
| :------------- | :----------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| **F-AUTH-001** | **ログイン**       | ・メールアドレスとパスワードによる認証を行う。<br>・認証成功時、サーバーから発行されたトークンをセキュアに保持する。<br>・認証失敗時、ユーザーフレンドリーなエラーメッセージを表示する。 | 初回はモック DB または Firebase Auth 等を利用想定                   |
| **F-AUTH-002** | **サインアップ**   | ・新規ユーザーアカウントを作成する機能。<br>・必須項目: メールアドレス、パスワード、表示名。<br>・パスワード強度チェック（8 文字以上、英数混在等）を行う。                               | 社内ツールのため、将来的には SSO 化または管理者招待制への移行を検討 |
| **F-AUTH-003** | **ログアウト**     | ・現在のセッションを破棄し、ログイン画面へ遷移する。<br>・ローカルに保存された機密情報（キャッシュされた会話等）をクリアする。                                                           | サイドバー下部の設定メニュー内に配置                                |
| **F-AUTH-004** | **セッション維持** | ・ブラウザを閉じても、一定期間は再ログイン不要で利用可能とする（永続化）。<br>・アクセストークンの有効期限管理を行う。                                                                   |                                                                     |
| **F-AUTH-005** | **パスワード管理** | ・入力時に「目のアイコン」でパスワードの表示/非表示を切り替え可能とする。                                                                                                                |                                                                     |

### 3.2. ユーザープロファイル (User Profile)

| ID             | 機能項目         | 要件詳細                                                                                                                                            | 備考                                 |
| :------------- | :--------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------- |
| **F-PROF-001** | **基本情報表示** | ・サイドバーおよび設定画面に、ユーザー名とアイコンを表示する。<br>・アイコン未設定時は、名前のイニシャルから自動生成する。                          | 現状の「Loading...」表示を実データ化 |
| **F-PROF-002** | **設定同期**     | ・「AI の口調」「テーマ設定(Light/Dark)」などの設定値をアカウントに紐づけて DB 保存する。<br>・ログイン時に DB から設定を取得し、端末間で同期する。 | アーキテクチャ分析に基づく要件追加   |

## 4. 非機能要件 (Non-Functional Requirements)

### 4.1. UI/UX 要件 (DESIGN_RULE.md 準拠)

本システムのログイン画面は、既存の Web フォームの常識を捨て、ネイティブアプリのような質感を持たせること。

- **Material System (Liquid Glass)**:
  - ログインパネルは `mat-hud` (Blur 50px + Saturate 200%) を採用し、背景が美しく透ける「磨りガラス」表現とする。
  - 背景には `FluidOrbBackground` を配置し、AI の知性を表現する Cyan/Magenta/Yellow/Blue のオーブが緩やかに浮遊すること。
- **Interaction (Spring Physics)**:
  - ログインボタンや入力フィールドのフォーカスアニメーションには Framer Motion (Spring: stiffness 250, damping 25) を適用する。
  - エラー時のシェイクアニメーション等も物理挙動に基づいた動きとする。
- **Typography**:
  - 入力文字は Inter または SF Pro を使用し、可読性を高める。
  - ラベルやプレースホルダーは `var(--color-text-sub)` を使用し、視覚的階層を保つ。

### 4.2. セキュリティ要件

- **通信の暗号化**: 全ての通信は HTTPS (TLS 1.2 以上) で行う。
- **パスワード保存**: DB 格納時は平文保存を禁止し、ソルト付きハッシュ化（bcrypt/Argon2 等）を行う（モック段階でも意識した設計とする）。
- **XSS/CSRF 対策**: 認証トークンの取り扱いにおいて、XSS 対策（HttpOnly Cookie 推奨だが、SPA 構成上の制約がある場合は LocalStorage 利用時のサニタイズ徹底）を講じる。

## 5. 開発スコープ (Phase 1.5)

### 5.1. In Scope (今回実装するもの)

- **ログイン画面 (UI)**: `DESIGN_RULE.md` に準拠した React コンポーネントの実装。
- **認証ロジック (Frontend)**: `useAuth` フックの作成、Context API による状態管理。
- **モック認証サーバー (Service)**: 入力されたメール/パスワードを検証する擬似的な非同期関数（遅延実行を含む）。
- **ID マッピング**: アプリ認証 ID (`userId`) を Dify API リクエストの `user` パラメータへ変換・送信するロジック。
- **オンボーディングとの統合**: 初回ログイン時のみオンボーディングを表示するロジックへの改修。

### 5.2. Out of Scope (今回は実装しない/Phase 2 以降)

- **SSO (Single Sign-On)**: Azure AD (Entra ID) や Google Workspace との連携。
- **パスワードリセット機能**: メール送信を伴う再設定フロー。
- **多要素認証 (MFA)**: アプリ認証や SMS 認証。
- **管理画面**: 全ユーザーを一覧・削除する管理者用 UI。

## 6. データモデル案 (DB Schema)

認証機能および設定同期のために想定されるデータ構造。
※ `uid` (略称) は使用せず、正式名称 `userId` を採用する。

**Users Collection (Table)**

```json
{
  "userId": "usr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", // User Identifier (Primary Key)
  "email": "employee@example.com", // ログインID
  "passwordHash": "$2b$10$...", // ハッシュ化パスワード
  "displayName": "山田 太郎", // 表示名
  "avatarUrl": "https://...", // アイコン画像URL (Optional)
  "role": "user", // user | admin
  "createdAt": "2026-01-07T00:00:00Z",
  "lastLoginAt": "2026-01-07T10:00:00Z",
  "settings": {
    // ユーザー設定 (デバイス間同期対象)
    "theme": "system", // light | dark | system
    "aiStyle": "partner", // partner | efficient
    "ragMode": "hybrid" // hybrid | search | rag
  }
}
```

````

## 7. アーキテクチャ・データフロー (Flow)

ユーザー認証から AI 応答までのフローを定義する。

```mermaid
graph TD
    User((User))

    subgraph "Client Side (Browser / React)"
        UI[Login UI / App Layout]
        AuthHook[useAuth Hook]
        Local[LocalStorage (Token)]
    end

    subgraph "Auth & Data Layer (Backend / DB)"
        AuthDB[(User DB)]
        note1[Table: Users<br/>PK: userId]
    end

    subgraph "AI Core (Dify Cloud)"
        DifyAPI[Dify API Gateway]
        Workflow[Workflow / RAG]
    end

    %% Flow
    User -->|1. Credentials Input| UI
    UI -->|2. Verify| AuthHook
    AuthHook -->|3. Query (by email)| AuthDB
    AuthDB --|4. Return User Profile (inc. userId)| AuthHook
    AuthHook --|5. Persist Session| Local

    UI -->|6. Chat Request (param: user = userId)| DifyAPI
    DifyAPI -->|7. Process (Isolated by userId)| Workflow

    %% Styles
    classDef db fill:#f9f,stroke:#333,stroke-width:2px;
    class AuthDB db;

```

```

````
