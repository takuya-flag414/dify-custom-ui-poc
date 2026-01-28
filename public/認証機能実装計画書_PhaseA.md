# 認証機能実装計画書 Phase A（モック）

| 項目 | 内容 |
|:---|:---|
| **プロジェクト名** | 社内 AI チャットボット認証機能 Phase A |
| **ドキュメント ID** | IMPL-AUTH-001 |
| **作成日** | 2026/01/28 |
| **関連ドキュメント** | [要件定義書](file:///c:/vscode-workspace/react/dify-custom-ui-poc/public/社内%20AI%20チャットボット認証機能%20要件定義書%20(Phase%201.5).md), [基本設計書](file:///c:/vscode-workspace/react/dify-custom-ui-poc/public/社内%20AI%20チャットボット認証機能%20基本設計書%20(Phase%201.5).md) |

---

## 1. 目的と背景

### 1.1. 目的

現在の仮実装（レガシー構造）を、正式仕様の**RBAC（ロールベースアクセス制御）**テーブル構造に移行する。

### 1.2. 移行のポイント

| 項目 | 現在（レガシー） | 移行後（正式仕様） |
|:---|:---|:---|
| **データ構造** | フラット配列 `MOCK_USERS` | 6テーブル構造（RBAC） |
| **ロール** | `'admin' \| 'user'` | `'admin' \| 'general' \| 'viewer'` |
| **Developer** | ロールの一種 | DevModeフラグ（環境変数制御） |
| **権限チェック** | `user.role === 'admin'` | `hasPermission(user, 'admin:access')` |
| **account_status** | なし | 0:無効 / 1:有効 / 2:退職 |

---

## 2. User Review Required

> [!IMPORTANT]
> ### DevModeの制御方法
> 開発者向け機能（RoleSelect、開発者オプション等）は環境変数 `VITE_DEV_MODE=true` で制御します。
> - 本番ビルド: 開発者UIは非表示
> - 開発環境: 環境変数で有効化可能

> [!WARNING]
> ### 後方互換性に関する注意
> 既存の `role: 'admin' | 'user' | 'developer'` を使用しているコードは段階的に移行します。
> 移行期間中は両方の形式をサポートしますが、`developer` ロールは `DevMode` フラグに置き換わります。

---

## 3. 現状分析

### 3.1. 現在のファイル構造

```
src/
├── mocks/
│   ├── mockUsers.js    ← フラット構造、正式RBACテーブルなし
│   └── mockUsers.ts    ← 同上（TypeScript版）
├── services/
│   └── AuthService.ts  ← account_status検証なし、権限解決なし
├── context/
│   └── AuthContext.tsx ← hasPermissionなし
├── components/
│   └── Chat/
│       └── RoleSelect.tsx  ← developer含む3ロール
└── config/
    ├── settingsConfig.jsx  ← allowedRoles で developer 使用
    └── featureFlags.ts     ← 既存のフィーチャーフラグ
```

### 3.2. 問題点

1. **RBAC非対応**: 正式仕様の6テーブル構造（users, roles, permissions, user_roles, role_permissions, departments）が存在しない
2. **account_status未実装**: 退職・無効化ユーザーの検証ロジックがない
3. **権限チェック未統一**: `user.role` による直接比較が散在
4. **Developer混在**: 開発用機能と正式ロールが混在

---

## 4. 実装ステップ

### Step A-1: モックデータ基盤（RBAC 6テーブル構造）

正式仕様準拠のRBACテーブル構造をJavaScriptでエミュレート。

---

#### [MODIFY] [mockUsers.ts](file:///c:/vscode-workspace/react/dify-custom-ui-poc/src/mocks/mockUsers.ts)

**変更内容**:

1. 6テーブル構造の定義を追加:
   - `MOCK_PERMISSIONS` - 権限定義（7権限）
   - `MOCK_ROLES` - 役割定義（admin, general, viewer）
   - `MOCK_ROLE_PERMISSIONS` - 役割-権限マッピング
   - `MOCK_DEPARTMENTS` - 組織階層
   - `MOCK_USERS` - 正式カラム構造へ移行
   - `MOCK_USER_ROLES` - ユーザー-役割マッピング

2. 既存の `MOCK_USERS` を正式仕様に準拠:
   ```typescript
   // Before
   {
     userId: 'xxx',
     role: 'admin',  // 単純ロール
     ...
   }
   
   // After
   {
     user_id: 'xxx',
     employee_code: 'EMP001',
     account_status: 1,  // 有効
     department_id: 1,
     ...
   }
   ```

3. 型定義の追加:
   - `AccountStatus = 0 | 1 | 2`
   - `RoleCode = 'admin' | 'general' | 'viewer'`
   - `PermissionCode` - 7種類の権限コード

---

#### [DELETE] [mockUsers.js](file:///c:/vscode-workspace/react/dify-custom-ui-poc/src/mocks/mockUsers.js)

TypeScript版に統一するため削除（参照箇所を `.ts` に変更）。

---

### Step A-2: AuthService の RBAC 対応

---

#### [MODIFY] [AuthService.ts](file:///c:/vscode-workspace/react/dify-custom-ui-poc/src/services/AuthService.ts)

**変更内容**:

1. **RBAC解決ロジックの実装**:
   ```typescript
   // ユーザーのロールを取得
   getUserRoles(userId: string): UserRole[]
   
   // ロールから実効権限を解決
   resolvePermissions(roles: UserRole[]): PermissionCode[]
   ```

2. **account_status検証の追加**:
   ```typescript
   // login() 内
   if (user.account_status === 0) {
     throw new Error('このアカウントは無効化されています');
   }
   if (user.account_status === 2) {
     throw new Error('このアカウントは退職済みです');
   }
   ```

3. **hasPermission ユーティリティ**:
   ```typescript
   hasPermission(user: UserProfile, permCode: PermissionCode): boolean {
     return user.permissions.includes(permCode);
   }
   ```

4. **UserProfile 型の拡張**:
   ```typescript
   interface UserProfile {
     userId: string;
     employeeCode?: string;
     email: string;
     name: string;
     departmentId?: number;
     departmentName?: string;
     accountStatus: AccountStatus;
     roles: UserRole[];           // 追加
     permissions: PermissionCode[]; // 追加
     preferences: UserPreferences;
   }
   ```

---

### Step A-3: AuthContext / useAuth の拡張

---

#### [MODIFY] [AuthContext.tsx](file:///c:/vscode-workspace/react/dify-custom-ui-poc/src/context/AuthContext.tsx)

**変更内容**:

1. **hasPermission 関数の追加**:
   ```typescript
   interface AuthContextValue {
     // ... 既存
     hasPermission: (permCode: PermissionCode) => boolean;
     getUserRoles: () => UserRole[];
   }
   ```

2. **DevModeフラグの追加**:
   ```typescript
   interface AuthContextValue {
     // ... 既存
     isDevMode: boolean;  // 環境変数から取得
   }
   ```

---

#### [NEW] [src/config/devMode.ts](file:///c:/vscode-workspace/react/dify-custom-ui-poc/src/config/devMode.ts)

**内容**:

```typescript
/**
 * 開発者モード判定
 * - 環境変数 VITE_DEV_MODE=true で有効化
 * - 本番では false
 */
export const IS_DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

/**
 * 開発者向け機能の表示判定
 */
export const shouldShowDevFeatures = (): boolean => {
  return IS_DEV_MODE;
};
```

---

### Step A-4: UI コンポーネントの権限制御対応

---

#### [MODIFY] [settingsConfig.jsx](file:///c:/vscode-workspace/react/dify-custom-ui-poc/src/config/settingsConfig.jsx)

**変更内容**:

`allowedRoles` を `requiredPermissions` に変更:

```jsx
// Before
{
  id: 'admin_console',
  allowedRoles: ['admin', 'developer'],
}

// After
{
  id: 'admin_console',
  requiredPermission: 'admin:access',  // 権限コードで制御
}

// 開発者オプションは DevMode で制御
{
  id: 'debug',
  devModeOnly: true,  // VITE_DEV_MODE=true でのみ表示
}
```

---

#### [MODIFY] [RoleSelect.tsx](file:///c:/vscode-workspace/react/dify-custom-ui-poc/src/components/Chat/RoleSelect.tsx)

**変更内容**:

1. DevMode時のみ表示するように修正
2. ロール選択肢を正式仕様に変更:
   ```typescript
   // DevModeでのロール切り替え（デバッグ目的）
   const ROLE_OPTIONS = [
     { value: 'admin', label: 'Admin', description: '管理者' },
     { value: 'general', label: 'General', description: '一般ユーザー' },
     { value: 'viewer', label: 'Viewer', description: '閲覧専用' },
   ];
   ```

---

#### [MODIFY] [Header.jsx](file:///c:/vscode-workspace/react/dify-custom-ui-poc/src/components/Layout/Header.jsx)

**変更内容**:

RoleSelect の表示を DevMode 条件付きに:

```jsx
{isDevMode && (
  <RoleSelect 
    currentRole={currentUser?.roles?.[0]?.roleCode || 'general'} 
    onRoleChange={handleRoleChange} 
  />
)}
```

---

### Step A-5: Dify 連携の userId 正式化

---

#### [MODIFY] [useChat.js](file:///c:/vscode-workspace/react/dify-custom-ui-poc/src/hooks/useChat.js)

**変更内容**:

Dify API 呼び出し時に正式な `userId` を使用:

```javascript
// Before（レガシー）
const userId = localStorage.getItem('app_user_id') || generateUUID();

// After（正式）
const { user } = useAuth();
const userId = user?.userId;
```

---

### Step A-6: 後方互換性対応

---

#### [MODIFY] [App.jsx](file:///c:/vscode-workspace/react/dify-custom-ui-poc/src/App.jsx)

**変更内容**:

1. `generateUUID` の完全な除去（AuthService に委譲済み）
2. `handleRoleChange` を DevMode 専用に変更
3. 権限ベースの UI 制御追加

---

## 5. ファイル変更一覧

| 操作 | ファイル | 概要 |
|:---|:---|:---|
| **[MODIFY]** | `src/mocks/mockUsers.ts` | 6テーブルRBAC構造への移行 |
| **[DELETE]** | `src/mocks/mockUsers.js` | TypeScript版に統一 |
| **[MODIFY]** | `src/services/AuthService.ts` | RBAC解決、account_status検証 |
| **[MODIFY]** | `src/context/AuthContext.tsx` | hasPermission、DevMode追加 |
| **[NEW]** | `src/config/devMode.ts` | DevMode判定ユーティリティ |
| **[MODIFY]** | `src/config/settingsConfig.jsx` | 権限ベースの制御へ移行 |
| **[MODIFY]** | `src/components/Chat/RoleSelect.tsx` | 正式ロールへ、DevMode専用化 |
| **[MODIFY]** | `src/components/Layout/Header.jsx` | RoleSelectのDevMode条件付き表示 |
| **[MODIFY]** | `src/hooks/useChat.js` | 正式userId使用 |
| **[MODIFY]** | `src/App.jsx` | レガシーコード除去、権限制御 |

---

## 6. 後方互換性戦略

### 6.1. マイグレーションマップ

| 旧ロール | 新ロール | 備考 |
|:---|:---|:---|
| `user` | `general` | 名称変更のみ |
| `admin` | `admin` | そのまま |
| `developer` | DevMode | 環境変数で制御 |

### 6.2. 段階的ロールアウト

1. **Phase 1**: 新しいRBAC構造を追加（既存コードは維持）
2. **Phase 2**: 参照箇所を順次移行
3. **Phase 3**: レガシーコードの削除

---

## 7. 検証計画

### 7.1. 型チェック（TypeScript）

```bash
npx tsc --noEmit
```

- すべての型エラーが解消されていることを確認

### 7.2. ビルド確認

```bash
npm run build
```

- ビルドが成功することを確認

### 7.3. 開発サーバー動作確認

```bash
npm run dev
```

以下のシナリオを手動で確認:

#### シナリオ1: ログイン動作
1. アプリにアクセス（ログイン画面が表示される）
2. `admin@example.com` / `password` でログイン
3. ログイン成功後、メイン画面に遷移
4. サイドバーに管理者向けメニューが表示される

#### シナリオ2: 一般ユーザーのログイン
1. `user@example.com` / `password` でログイン
2. 管理者専用メニュー（管理コンソール等）が非表示

#### シナリオ3: 退職ユーザーのログイン拒否
1. `retired@example.com` / `password` でログイン
2. 「このアカウントは退職済みです」エラーが表示

#### シナリオ4: DevMode の動作
1. 環境変数 `VITE_DEV_MODE=true` で起動
2. ヘッダーに RoleSelect が表示される
3. 設定画面に「開発者オプション」が表示される

#### シナリオ5: DevMode OFF の動作
1. 環境変数なし（または `VITE_DEV_MODE=false`）で起動
2. ヘッダーに RoleSelect が非表示
3. 設定画面に「開発者オプション」が非表示

### 7.4. Dify連携確認

1. ログイン後、チャットを送信
2. ブラウザの開発者ツール → Network で Dify API リクエストを確認
3. `user` パラメータに正式な `userId`（例: `usr_admin_001`）が含まれている

---

## 8. スケジュール（目安）

| ステップ | 工数目安 |
|:---|:---|
| Step A-1: モックデータ基盤 | 1-2時間 |
| Step A-2: AuthService RBAC対応 | 1-2時間 |
| Step A-3: AuthContext拡張 | 30分-1時間 |
| Step A-4: UI権限制御 | 1時間 |
| Step A-5: Dify連携 | 30分 |
| Step A-6: 後方互換性対応 | 30分 |
| 検証 | 1時間 |
| **合計** | **約5-8時間** |

---

## 9. 次のステップ

この計画書の承認後、以下の順序で実装を進めます:

1. Step A-1 → A-2 → A-3（データ層・サービス層）
2. Step A-4 → A-5（UI層・連携）
3. Step A-6（クリーンアップ）
4. 検証
