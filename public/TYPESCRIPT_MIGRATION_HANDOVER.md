# TypeScript移行プロジェクト 引継ぎ資料

**更新日**: 2026-01-16  
**プロジェクト**: dify-custom-ui-poc

---

## 1. プロジェクト概要

JavaScriptからTypeScriptへの段階的移行プロジェクトです。  
`strict: false` + `allowJs: true` 設定により、JS/TSの共存を許可しながら安全に移行を進めています。

---

## 2. 現在の進捗状況

### 完了済み

| フェーズ | 内容 | ファイル数 |
|---------|------|-----------|
| 0 | TypeScript基盤設定 | ✅ 完了 |
| 1 | ユーティリティ (utils/) | ✅ 8/8 |
| 2 | 設定・定数 | 5/6 (scenarios.js保留) |
| 3 | API・サービス | ✅ 4/4 |
| 4 | カスタムフック | 8/9 (useChat.js保留) |
| 5 | AuthContext | ✅ 完了 |
| - | Reactコンポーネント | 14/71 |

### 変換済みファイル一覧

#### ユーティリティ (src/utils/)
- dateUtils.ts, timeUtils.ts, errorHandler.ts, citationMapper.ts
- llmOutputParser.ts, responseParser.ts, privacyDetector.ts, fileScanner.ts

#### 設定・定数
- src/config/featureFlags.ts
- src/hooks/chat/constants.ts
- src/mocks/mockUtils.ts, mockUsers.ts, data.ts

#### API・サービス
- src/api/dify.ts
- src/services/AuthService.ts, ChatServiceAdapter.ts
- src/mocks/MockStreamGenerator.ts

#### カスタムフック (src/hooks/)
- useApiConfig.ts, useSettings.ts, useTheme.ts, useLogger.ts
- useOnboarding.ts, useTutorial.ts, useInspector.ts, useConversations.ts

#### コンテキスト
- src/context/AuthContext.tsx

#### Reactコンポーネント（一部）
- Message: SkeletonLoader, AiKnowledgeBadge, SuggestionButtons, CitationList, SmartActionGroup, SystemErrorBlock
- Chat: ScrollToBottomButton, SuggestionCard, HistorySkeleton, MockModeSelect, RoleSelect, PrivacyConfirmDialog, PrivacyShieldButton
- Loading: SystemBootScreen

---

## 3. 残りの作業（優先度順）

### 高優先度

1. **Chat専用フック** (src/hooks/chat/)
   - perfTracker.js (2.9KB)
   - messageActions.js (4.6KB)
   - historyLoader.js (7.9KB)
   - messageEventHandlers.js (6.7KB)
   - nodeEventHandlers.js (11KB)

2. **共有コンポーネント** (src/components/Shared/)
   - 約15ファイル（FileIcons, SystemIcons, IntelligenceOrb等）

### 中優先度

3. **残りのReactコンポーネント** (~43ファイル)
   - Message: MessageBlock, ThinkingProcess等
   - Chat: ChatInput, ChatHistory, WelcomeScreen, AttachmentPopover等
   - Settings, Sidebar, Onboarding各種

### 低優先度（後日対応）

4. **大規模ファイル**
   - src/mocks/scenarios.js (47KB)
   - src/hooks/useChat.js (24KB)

5. **ルートファイル**
   - src/main.jsx → src/main.tsx
   - src/App.jsx → src/App.tsx
   - src/config/settingsConfig.jsx → settingsConfig.tsx

---

## 4. 技術的な注意点

### tsconfig.json の設定
```json
{
  "compilerOptions": {
    "strict": false,
    "allowJs": true,
    "jsx": "react-jsx"
  }
}
```

### 既知の回避策

1. **TextDecoderStream型エラー** (ChatServiceAdapter.ts:187)
   - `(stream.pipeThrough as any)` でキャスト

2. **JSXコンポーネントのインポート** (SystemBootScreen.tsx)
   - `require().default as React.FC<any>` を使用

### 検証コマンド
```bash
npx tsc --noEmit  # 型エラーの確認
npm run dev       # アプリ起動確認
```

---

## 5. 移行時の手順

1. 元の `.js/.jsx` ファイルを確認
2. 新しい `.ts/.tsx` ファイルを作成
3. 適切な型定義（interface/type）を追加
4. `npx tsc --noEmit` でエラーチェック
5. 元のJSファイルは残しておく（インポート互換性のため）

---

## 6. 参考資料

- 詳細計画: `.gemini/antigravity/brain/*/implementation_plan.md`
- 進捗管理: `.gemini/antigravity/brain/*/task.md`
- 型定義: `src/types/index.d.ts`

---

## 7. 次のセッションで行うべきこと

1. `npx tsc --noEmit` で現在のエラー状況を確認
2. Chat専用フック（perfTracker等）の変換から再開
3. 共有コンポーネント（Shared/）の変換
