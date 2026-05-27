# テストコードの実行と記述ルール

本ドキュメントでは、`src/tests/` ディレクトリ内のテストコードの実行方法と記述規則を解説します。

---

## 1. テストの概要

本プロジェクトのテストは、アプリケーション内に組み込まれたカスタムテストフレームワーク（DevToolsパネル経由）を使用しています。

> **特徴**:  
> JestやVitestなどの外部テストフレームワークではなく、アプリ自体に内蔵されたテストランナーです。  
> 開発者向けの「DevTools」パネルからUIで実行・確認できます。

---

## 2. テストの構成

```
src/tests/
├── index.js           ← テストの登録テーブル・カテゴリ定義
├── basic/             ← 基本テスト（FEモック使用・外部通信不要）
│   ├── chatFlow.js       ← チャットの基本フロー確認
│   ├── historyLoad.js    ← 会話履歴の読み込みテスト
│   ├── messageActions.js ← メッセージ操作のテスト
│   └── moduleIntegrity.js← モジュールの正常インポート確認
└── api/               ← APIテスト（Real/BEモックのみ実行可能）
    ├── connectionTest.js ← APIへの疎通確認
    └── streamingTest.js  ← SSEストリーミングの動作確認
```

---

## 3. テストカテゴリ

テストは2つのカテゴリに分類されています：

| カテゴリ | アイコン | 説明 | 実行可能モード |
|---|---|---|---|
| **基本テスト (basic)** | 🟢 | UIとロジックの基本動作確認 | FE・BE・OFFすべて |
| **APIテスト (api)** | 🔵 | 実際のAPIへの疎通・ストリーミング確認 | BE・OFFのみ |

---

## 4. テストの実行方法

### 4.1 DevToolsパネルからの実行（推奨）

1. 開発サーバーを起動する（`npm run dev`）
2. ブラウザでアプリを開く
3. DevToolsパネルを開く（画面内の開発者ツールボタン、またはキーボードショートカット）
4. テストタブを選択
5. 実行したいテストカテゴリを選択して「実行」ボタンをクリック

### 4.2 モードによる実行可能なテストの違い

```
VITE_DEFAULT_MOCK_MODE=FE（FEモック）の場合:
  → 基本テスト (basic) のみ実行可能
  → APIテストはスキップされる

VITE_DEFAULT_MOCK_MODE=OFF（本番同等）/ BE（BEモック）の場合:
  → 基本テスト + APIテスト の両方が実行可能
```

### 4.3 コードから直接実行する場合

```javascript
// テストを手動実行するイメージ
import { getAvailableTests } from './tests/index';
import { DEFAULT_MOCK_MODE } from './config/env';

const tests = getAvailableTests(DEFAULT_MOCK_MODE);

for (const test of tests) {
    const result = await test.run();
    console.log(result.passed ? '✅ PASS' : '❌ FAIL', test.name, result.message);
}
```

---

## 5. テストコードの記述ルール

### 5.1 テストオブジェクトの構造

すべてのテストは以下のインターフェースに従って実装します：

```javascript
// テストオブジェクトの型定義
const myTest = {
    // テストの識別ID（ユニークであること）
    id: 'my-feature-test',

    // テスト名（DevToolsパネルに表示される）
    name: 'My Feature の動作確認',

    // テストが属するカテゴリ（'basic' または 'api'）
    category: 'basic',

    // テスト説明文
    description: 'My Feature が正しく動作することを確認するテスト',

    // テスト本体の関数（非同期可）
    // 戻り値: { passed: boolean, message: string }
    run: async () => {
        try {
            // テスト対象の処理を実行
            const result = await myFeature.doSomething();

            // アサーション（期待値と実際の値を比較）
            if (result !== 'expected-value') {
                return {
                    passed: false,
                    message: `期待値: 'expected-value', 実際の値: '${result}'`
                };
            }

            return {
                passed: true,
                message: 'My Feature は正常に動作しています'
            };
        } catch (error) {
            return {
                passed: false,
                message: `例外が発生しました: ${error.message}`
            };
        }
    },
};

export { myTest };
```

### 5.2 テストの命名規則

| 項目 | 規則 | 例 |
|---|---|---|
| **ファイル名** | `camelCase.js` | `chatFlow.js`, `historyLoad.js` |
| **テストID** | `kebab-case` のユニークな文字列 | `'chat-send-message'` |
| **テスト名** | 何をテストするかが分かる日本語 | `'メッセージ送信の基本フロー確認'` |
| **関数のexport** | named exportを使用 | `export { myTest };` |

### 5.3 基本テストの書き方

```javascript
// src/tests/basic/myFeature.js

/**
 * My Feature の基本動作テスト
 */
export const myFeatureTest = {
    id: 'my-feature-basic',
    name: 'My Feature 基本動作確認',
    category: 'basic',
    description: 'FEモックモードでも確認できる基本ロジックのテスト',
    run: async () => {
        // 外部APIに依存しない単純なロジックのテスト
        const input = 'test-input';
        const expected = 'TEST-INPUT';
        const actual = input.toUpperCase();

        if (actual !== expected) {
            return { passed: false, message: `変換失敗: ${actual} !== ${expected}` };
        }

        return { passed: true, message: '基本動作確認OK' };
    },
};
```

### 5.4 APIテストの書き方

```javascript
// src/tests/api/myApiTest.js

/**
 * APIへの疎通確認テスト（BEモックまたは本番APIが必要）
 */
export const myApiTest = {
    id: 'my-api-connection',
    name: 'My API 疎通確認',
    category: 'api',
    description: '実際のAPIエンドポイントへのリクエスト確認',
    run: async () => {
        try {
            // 実際のAPI呼び出し
            const response = await fetch('/api/health');
            if (!response.ok) {
                return { passed: false, message: `API応答エラー: ${response.status}` };
            }
            const data = await response.json();
            return { passed: true, message: `API疎通OK: ${JSON.stringify(data)}` };
        } catch (error) {
            return { passed: false, message: `ネットワークエラー: ${error.message}` };
        }
    },
};
```

---

## 6. 新しいテストをテストスイートに追加する手順

1. `src/tests/basic/` または `src/tests/api/` に新しいテストファイルを作成する

2. `src/tests/index.js` にインポートして登録する：

```javascript
// src/tests/index.js に追加
import { myFeatureTest } from './basic/myFeature'; // ← 追加

export const basicTests = [
    moduleIntegrityTest,
    chatFlowTest,
    historyLoadTest,
    messageActionsTest,
    myFeatureTest,  // ← 追加
];
```

---

## 7. 既存テストの構成（参考）

| ファイル | テスト内容 |
|---|---|
| `basic/moduleIntegrity.js` | 主要モジュールが正常にインポートできることを確認 |
| `basic/chatFlow.js` | チャットの基本送受信フローの確認 |
| `basic/historyLoad.js` | 会話履歴の読み込み処理の確認 |
| `basic/messageActions.js` | メッセージの削除・再生成等のアクション確認 |
| `api/connectionTest.js` | Dify API への接続確認 |
| `api/streamingTest.js` | SSEストリーミングの動作確認 |

---

*関連ドキュメント: [01_add-slide-theme.md](./01_add-slide-theme.md) | [02_add-artifact-block.md](./02_add-artifact-block.md)*
