// src/mockData.js

/**
 * FEモード検証用のモックデータ定義
 * Updated: 2025-11-28
 */

// サイドバー用の会話リスト
export const mockConversations = [
  { id: 'mock_1', name: '🤖 AI Assistant Demo' },
  { id: 'mock_2', name: '💻 Code Generation Test' },
  { id: 'mock_3', name: '📊 Market Analysis (Table)' },
  { id: 'mock_4', name: '🎨 Creative Studio (MD)' },
  { id: 'mock_5', name: '🐛 Error Simulation' },
];

// 履歴読み込み用のメッセージデータ (IDで紐づけ)
export const mockMessages = {
  'mock_1': [
    {
      id: 'm1_u1',
      role: 'user',
      text: 'このAIアシスタントは何ができますか？',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: 'm1_a1',
      role: 'ai',
      text: `# AIアシスタント機能紹介

私は**高度なAIアシスタント**です。以下のようなタスクをお手伝いできます。

## 主な機能

1.  **質問への回答**: 日常的な疑問から専門的な知識まで幅広くお答えします。
2.  **文章作成**: ブログ記事、メール、レポートなどの下書きを作成します。
3.  **コード生成**: Python, JavaScript, Reactなどのプログラミングコードを生成・解説します。
4.  **データ分析**: 提供されたデータを分析し、洞察を提供します。

## 特徴

*   ✨ **高速な応答**: リアルタイムに近い速度で回答を生成します。
*   📚 **豊富な知識**: 最新の情報を踏まえた回答を心がけています。
*   🔒 **セキュリティ**: 会話内容は安全に保護されます。

何かお手伝いできることはありますか？`,
      citations: [],
      suggestions: ['コードを書いて', 'ニュースを教えて', '分析をお願い'],
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 5000).toISOString(),
    }
  ],
  'mock_2': [
    {
      id: 'm2_u1',
      role: 'user',
      text: 'ReactとTailwind CSSを使って、モダンなカードコンポーネントを作って。',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'm2_a1',
      role: 'ai',
      text: `はい、ReactとTailwind CSSを使用したモダンなカードコンポーネントの例です。
ガラスモーフィズム（Glassmorphism）効果を取り入れたデザインにしました。

\`\`\`jsx
import React from 'react';

const ModernCard = ({ title, description, imageUrl }) => {
  return (
    <div className="max-w-sm rounded-2xl overflow-hidden shadow-lg bg-white/30 backdrop-blur-md border border-white/20">
      {imageUrl && (
        <img className="w-full h-48 object-cover" src={imageUrl} alt={title} />
      )}
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2 text-gray-800">{title}</div>
        <p className="text-gray-700 text-base">
          {description}
        </p>
      </div>
      <div className="px-6 pt-4 pb-2">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300">
          詳細を見る
        </button>
      </div>
    </div>
  );
};

export default ModernCard;
\`\`\`

### 使用方法

このコンポーネントは以下のように使用します。

\`\`\`jsx
<ModernCard
  title="美しい風景"
  description="このカードはTailwind CSSのbackdrop-blurユーティリティを使用して、背景をぼかす効果を実現しています。"
  imageUrl="https://example.com/image.jpg"
/>
\`\`\`

Tailwindの設定で \`backdrop-filter\` が有効になっていることを確認してください。`,
      citations: [],
      suggestions: ['ボタンの色を変えたい', 'ダークモード対応は？', 'TypeScript版は？'],
      timestamp: new Date(Date.now() - 1000 * 60 * 30 + 5000).toISOString(),
    }
  ],
  'mock_3': [
    {
      id: 'm3_u1',
      role: 'user',
      text: '2024年の主要なSaaS市場の成長率を表で比較したいです。',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
      id: 'm3_a1',
      role: 'ai',
      text: `2024年のSaaS市場における主要セクターの成長率予測をまとめました。

## SaaS市場成長率比較 (2024年予測)

| セクター | 成長率 (YoY) | 市場規模 (億ドル) | トレンド |
| :--- | :---: | :---: | :--- |
| **AI & 機械学習** | 35% 🚀 | 500 | 生成AIの爆発的普及 |
| **サイバーセキュリティ** | 15% | 800 | ゼロトラスト需要の増加 |
| **コラボレーション** | 10% | 450 | ハイブリッドワークの定着 |
| **CRM / Sales** | 12% | 900 | データ主導の顧客管理 |
| **HR Tech** | 8% | 300 | 従業員体験(EX)の重視 |

### 分析

*   **AI分野**が圧倒的な成長を見せており、多くの企業が予算を重点配分しています[1]。
*   **セキュリティ**は依然として優先度が高く、安定した成長を続けています[2]。

詳細なレポートが必要な場合はお知らせください。`,
      citations: [
        { id: 'c1', type: 'web', source: 'Gartner Market Forecast 2024', url: 'https://example.com/gartner' },
        { id: 'c2', type: 'web', source: 'IDC SaaS Tracker', url: 'https://example.com/idc' }
      ],
      suggestions: ['AI分野の詳細', '2025年の予測は？', '日本市場の動向'],
      timestamp: new Date(Date.now() - 1000 * 60 * 60 + 5000).toISOString(),
    }
  ],
  'mock_4': [
    {
      id: 'm4_u1',
      role: 'user',
      text: 'Markdownの表示テストをしたいので、複雑な構造の文章を作って。',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'm4_a1',
      role: 'ai',
      text: `# Markdown表示テスト用ドキュメント

これはMarkdownのレンダリング能力をテストするための**複雑なドキュメント**です。

## 1. テキスト装飾

*   通常テキスト
*   *イタリック（強調）*
*   **ボールド（強い強調）**
*   ***イタリックかつボールド***
*   ~~取り消し線~~
*   \`インラインコード\`

## 2. リスト構造

### 順序なしリスト
- レベル1
  - レベル2
    - レベル3
      - レベル4

### 順序付きリスト
1. 手順A
2. 手順B
   1. 詳細B-1
   2. 詳細B-2
3. 手順C

## 3. 引用 (Blockquote)

> "成功とは、失敗から失敗へと、情熱を失わずに進む能力のことだ。"
>
> — *ウィンストン・チャーチル*

## 4. 数式 (KaTeX/MathJax対応の場合)

もし数式プラグインが入っていれば、以下のように表示されます。

$$
E = mc^2
$$

## 5. リンクと画像

[Google](https://google.com) へのリンクです。

![ダミー画像](https://via.placeholder.com/150 "プレースホルダー")

## 6. 水平線
---
セクションの区切りです。
---

以上です。`,
      citations: [],
      suggestions: ['もっと複雑に', '数式を詳しく', 'テーブルを追加'],
      timestamp: new Date(Date.now() - 1000 * 60 * 15 + 5000).toISOString(),
    }
  ],
  'mock_5': [
    {
      id: 'm5_u1',
      role: 'user',
      text: 'システムエラーが発生した場合の表示を確認したい。',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: 'm5_a1',
      role: 'ai',
      text: `申し訳ありません。システム内部でエラーが発生しました。

**エラー詳細:**
\`500 Internal Server Error\`

再試行するか、しばらく待ってからアクセスしてください。`,
      citations: [],
      suggestions: ['再試行', 'サポートに連絡'],
      timestamp: new Date(Date.now() - 1000 * 60 * 5 + 1000).toISOString(),
    }
  ]
};

// ファイルアップロード時のテンプレート回答
export const mockStreamResponseWithFile = {
  text: `アップロードされたファイル **{filename}** を解析しました。

## 📄 ファイル概要

このドキュメントは、**2025年度のプロジェクト計画書**のようです。以下の主要なセクションが含まれています。

1.  **プロジェクトの目的**: 業務効率化とコスト削減
2.  **スコープ**: 国内全拠点への新システム導入
3.  **スケジュール**: 4月開始、10月本稼働予定

### 💡 重要なポイント

*   **予算**: 総額5,000万円が計上されています[1]。
*   **リスク**: レガシーシステムからのデータ移行に懸念点が挙げられています[2]。
*   **体制**: プロジェクトマネージャー1名、開発メンバー5名の体制です。

### 📊 データ分析

ファイル内のデータを分析した結果、Q3にリソースが不足する可能性があります。

> "10月のリリース直前は、テスト工数が現在の見積もりの1.5倍必要になる可能性がある。"

この点について、追加の対策を検討することをお勧めします。`,
  citations: [
    { id: 'file_cite_1', type: 'document', source: '{filename} (P.3)', url: null },
    { id: 'file_cite_2', type: 'document', source: '{filename} (P.12)', url: null },
    { id: 'web_cite', type: 'web', source: 'システム移行のベストプラクティス', url: 'https://example.com/migration' }
  ],
  suggestions: [
    'リスク対策案を教えて',
    'スケジュールの詳細',
    '予算の内訳は？'
  ]
};

// ファイルなし時のテンプレート回答
export const mockStreamResponseNoFile = {
  text: `ご質問ありがとうございます。Web検索とデータベースを参照して回答を作成しました。

## 🔍 調査結果

最新の情報によると、以下のトレンドが確認されています。

### 1. 主要な動向
現在、この分野では**自動化とAIの統合**が急速に進んでいます[1]。特に、生成AIを活用した業務プロセスの最適化が注目されています。

### 2. 具体的な事例
*   **企業A**: カスタマーサポートの80%を自動化
*   **企業B**: データ分析時間を1/10に短縮

## 📈 統計データ

| 項目 | 2023年 | 2024年(予測) |
| :--- | :---: | :---: |
| 市場規模 | 100億ドル | 150億ドル |
| 導入企業率 | 35% | 60% |

## 💡 考察

この傾向は今後も続くと予想されます。早期の導入が競争優位性につながるでしょう[2]。

さらに詳しい情報が必要な場合は、特定のトピックについて深掘りできますので、お申し付けください。`,
  citations: [
    { id: 'web1', type: 'web', source: 'Tech Trends 2025', url: 'https://example.com/trends' },
    { id: 'rag1', type: 'rag', source: '社内レポート_v2.pdf', url: null }
  ],
  suggestions: [
    'もっと詳しく教えて',
    '導入のメリットは？',
    'コスト感を知りたい'
  ]
};

// 既存のテンプレート(後方互換性のため残す)
export const mockStreamResponse = mockStreamResponseNoFile;