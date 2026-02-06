# Gemini Store Selector 実装計画 (Dual Dify Core Architecture)

本ドキュメントは、DESIGN_RULE.md に基づく「macOS Sequoia」スタイルのUIと、バックエンドB（ディレクトリサービス）連携を実現するための実装計画です。
Phase A（モック）とPhase B（通信実装）に分割して記述します。

## Phase A: Visual Mockup (UI/UX Implementation)

このフェーズでは、API通信を行わず、UIの挙動とアニメーション物理（Spring Physics）、および「Liquid Glass」マテリアルの実装に焦点を当てます。

### 1. コンポーネント設計方針

**ContextSelector.jsx の拡張:**

* 「社内データ (Enterprise)」モードが選択された時のみ展開される「サブチャネルセレクター」を追加します。
* Framer Motion を使用し、リストの展開・収納に物理演算（Spring）を適用します。

**デザイン仕様:**

* **Material:** mat-popover (Blur 40px + Saturate 180%)
* **Interaction:** 選択時に "Active Indicator" (光る境界線) を表示。

### 2. Mock Data Definition

`src/mocks/storeData.js` を作成し、Backend Bが返す予定のJSON構造を定義します。

```javascript
// src/mocks/storeData.js

// macOSスタイルのアイコンマッピング定義
export const STORE_ICONS = {
    'sales': 'chart.bar.fill',       // 営業
    'tech': 'terminal.fill',         // 技術
    'hr': 'person.2.crop.square.stack', // 人事
    'rules': 'text.book.closed.fill', // 規定
    'default': 'folder.fill'
};

// Backend Bからのレスポンスを模したモックデータ
export const MOCK_STORES = [
    {
        id: 'fileSearchStores/mock_sales_001',
        display_name: '営業・マーケティング本部',
        category: 'sales',
        description: '顧客提案書、営業マニュアル、市場調査レポート'
    },
    {
        id: 'fileSearchStores/mock_tech_002',
        display_name: '開発・技術部',
        category: 'tech',
        description: 'API仕様書、アーキテクチャ設計図、技術検証ログ'
    },
    {
        id: 'fileSearchStores/mock_rules_003',
        display_name: '全社規定・コンプライアンス',
        category: 'rules',
        description: '就業規則、経費精算ガイドライン、セキュリティポリシー'
    }
];

```

### 3. UI Implementation (ContextSelector.jsx Modification)

既存の `ContextSelector.jsx` に、ストア選択ロジックを追加します。
（注: Phase Aでは `MOCK_STORES` を直接 import して使用します）

```jsx
// src/components/Shared/ContextSelector.jsx

// ... (既存のインポート)
import { MOCK_STORES, STORE_ICONS } from '../../mocks/storeData'; // Phase A用
// ※ Phase Bでは削除し、API経由に切り替えます

// --- Store List Item Component (Sub-menu) ---
const StoreItem = ({ store, isSelected, onClick }) => {
    // アイコン選択ロジック（簡易版）
    // 実際にはSVGコンポーネントをimportして使用することを推奨
    const IconComponent = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <path d="M12 10h.01" />
        </svg>
    );

    return (
        <motion.button
            layout
            onClick={onClick}
            className={`store-item ${isSelected ? 'active' : ''}`}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.05)" }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="store-icon-container">
                <IconComponent />
            </div>
            <div className="store-info">
                <span className="store-name">{store.display_name}</span>
                <span className="store-desc">{store.description}</span>
            </div>
            {isSelected && (
                <motion.div 
                    className="store-active-glow"
                    layoutId="storeGlow"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}
        </motion.button>
    );
};

// --- ContextSelector Component Update (Partial) ---
// 既存のContextSelectorコンポーネント内に追加

const ContextSelector = ({ settings, onSettingsChange }) => {
    // ... (既存のState)
    
    // [Phase A] 選択中のストアID管理
    const [activeStoreId, setActiveStoreId] = useState(null); 

    // Enterpriseモードが選ばれたか判定
    const currentModeId = useMemo(() => {
        // ... (既存のモード判定ロジック)
    }, [settings]);
    
    const isEnterpriseMode = currentModeId === 'enterprise';

    // ハンドラ
    const handleStoreSelect = (storeId) => {
        setActiveStoreId(storeId);
        // [Phase B] ここで親コンポーネントやGlobalStateにIDを伝播させる処理を追加
        console.log("Selected Store ID:", storeId);
    };

    return (
        <div className="context-selector-container">
             {/* ... (メインモード選択ボタン群) ... */}

             {/* Enterprise Mode Sub-Menu (Liquid Expand) */}
             <AnimatePresence>
                {isEnterpriseMode && (
                    <motion.div
                        className="enterprise-sub-panel"
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ 
                            opacity: 1, 
                            height: 'auto', 
                            marginTop: 12,
                            transition: { type: "spring", stiffness: 300, damping: 25 }
                        }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    >
                        <div className="sub-panel-header">
                            <span className="label">Knowledge Base Channel</span>
                            <span className="badge">Internal Only</span>
                        </div>
                        
                        <div className="store-grid">
                            {MOCK_STORES.map((store) => (
                                <StoreItem
                                    key={store.id}
                                    store={store}
                                    isSelected={activeStoreId === store.id}
                                    onClick={() => handleStoreSelect(store.id)}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
             </AnimatePresence>

             {/* ... (Advanced Settings Accordion) ... */}
        </div>
    );
};

```

### 4. Styling (CSS)

`src/components/Shared/ContextSelector.css` に、macOS Sequoia準拠のスタイルを追加します。

```css
/* src/components/Shared/ContextSelector.css */

/* Liquid Glass Sub-panel */
.enterprise-sub-panel {
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(20px) saturate(180%); /* Vibrancy */
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    margin-bottom: 8px;
}

/* Dark Mode Support */
:root[data-theme='dark'] .enterprise-sub-panel {
    background: rgba(30, 30, 30, 0.4);
    border-color: rgba(255, 255, 255, 0.1);
}

.sub-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding: 0 4px;
}

.sub-panel-header .label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.sub-panel-header .badge {
    font-size: 10px;
    background: rgba(0, 0, 0, 0.05);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--text-tertiary);
}

.store-grid {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.store-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s;
    width: 100%;
}

.store-item.active {
    background: rgba(0, 122, 255, 0.05); /* System Blue Tint */
}

.store-icon-container {
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
}

.store-item.active .store-icon-container {
    color: var(--sys-color-primary);
}

.store-info {
    z-index: 2;
    display: flex;
    flex-direction: column;
}

.store-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
}

.store-desc {
    font-size: 11px;
    color: var(--text-secondary);
    margin-top: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
}

/* Glowing Indicator (Apple Intelligence Gradient) */
.store-active-glow {
    position: absolute;
    inset: 0;
    border-radius: 10px;
    box-shadow: inset 0 0 0 1.5px var(--sys-color-primary);
    background: rgba(0, 122, 255, 0.05);
    pointer-events: none;
    z-index: 1;
}

```

## Phase B: Functional Implementation (API Integration)

このフェーズでは、モックデータを廃止し、Backend B (Directory Service) との通信、およびBackend A (Chat Core) へのパラメータ注入を実装します。

### 1. 環境変数の設定

`.env` ファイルにBackend B用のAPIキーを追加します。

```bash
# .env
VITE_DIFY_API_KEY=sk-backend-a-key...      # Chat/HybridQA用 (Backend A)
VITE_DIFY_MANAGEMENT_API_KEY=sk-backend-b-key... # Directory Service用 (Backend B)

```

### 2. API Service Layer Implementation

Backend Bの「ワークフロー実行API」を叩くための関数を実装します。

```typescript
// src/api/difyDirectory.ts
import { v4 as uuidv4 } from 'uuid';

// Backend B (Directory Service) Endpoint
const DIRECTORY_API_URL = '[https://api.dify.ai/v1/workflows/run](https://api.dify.ai/v1/workflows/run)';
const DIRECTORY_API_KEY = import.meta.env.VITE_DIFY_MANAGEMENT_API_KEY;

export interface GeminiStore {
    id: string;      // 内部ID (fileSearchStores/...)
    display_name: string; // 表示名
    create_time?: string;
}

/**
 * Backend Bを実行してストア一覧を取得する
 */
export const fetchGeminiStores = async (): Promise<GeminiStore[]> => {
    if (!DIRECTORY_API_KEY) {
        console.error("Directory API Key is missing");
        return [];
    }

    try {
        const response = await fetch(DIRECTORY_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DIRECTORY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: {
                    // Backend Bの条件分岐を「一覧表示」に固定するためのトリガー
                    option: "ファイル検索ストアの一覧を表示する？" 
                },
                response_mode: "blocking", // JSONを一括で受け取るためブロッキングモード
                user: `dir-client-${uuidv4()}`
            })
        });

        if (!response.ok) throw new Error('Failed to fetch stores');

        const data = await response.json();
        
        // Backend Bの出力フォーマットに合わせてパース
        // Backend BのYAML定義に基づくと、出力は 'text' または jsonノードの結果となる
        // ここでは outputs.result に JSON文字列が含まれている前提で処理
        const rawResult = data.data.outputs.result; 
        
        console.log("Directory Service Raw Response:", rawResult);

        // 文字列ならパース、オブジェクトならそのまま利用
        // 注意: Backend Bがマークダウンコードブロック ```json ... ``` を含む場合は除去が必要
        let cleanJson = rawResult;
        if (typeof rawResult === 'string') {
             cleanJson = rawResult.replace(/```json\n|\n```/g, '');
        }

        const stores = typeof cleanJson === 'string' ? JSON.parse(cleanJson) : cleanJson;
        
        return Array.isArray(stores) ? stores : [];

    } catch (error) {
        console.error("Directory Fetch Error:", error);
        return [];
    }
};

```

### 3. Integration Logic (Hooks Update)

#### A. ContextSelectorでのデータ取得

`ContextSelector.jsx` 内で `useEffect` を使用し、Enterpriseモードになった瞬間にデータを取得します。

```jsx
// src/components/Shared/ContextSelector.jsx (Phase B Update)

import { fetchGeminiStores } from '../../api/difyDirectory';

// ... inside component
const [stores, setStores] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
    if (isEnterpriseMode && stores.length === 0 && !isLoading) {
        const loadStores = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchGeminiStores();
                if (data && data.length > 0) {
                    setStores(data);
                } else {
                    setError("ストアが見つかりません");
                }
            } catch (err) {
                setError("読み込みエラー");
            } finally {
                setIsLoading(false);
            }
        };
        loadStores();
    }
}, [isEnterpriseMode]);

// ... レンダリング部分で MOCK_STORES の代わりに stores を使用
// ... ローディング表示 (Spinner) や エラー表示を追加

```

#### B. Chatリクエストへの注入 (useChat.js)

選択された `storeId` を `useChat` に渡し、APIリクエストの inputs に含めます。
これには、ChatArea や ChatInput から `selectedStoreId` を `sendMessage` に渡すフローの整備が必要です。

```javascript
// src/hooks/useChat.js

// sendMessage関数のシグネチャ修正
const sendMessage = async (message, attachments = [], options = {}) => {
    // options = { selectedStoreId: string, ... }
    
    // ...
    const payload = {
        query: message,
        inputs: {
            // Backend AのStartノードで定義した変数名に合わせる
            gemini_store_id: options.selectedStoreId || "" 
        },
        response_mode: "streaming",
        conversation_id: conversationId,
        user: userId,
        files: processedFiles
    };
    // ...
};

```

```

