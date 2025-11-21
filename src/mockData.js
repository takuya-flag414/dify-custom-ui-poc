// src/mockData.js

/**
 * FEモード検証用のモックデータ定義
 */

// サイドバー用の会話リスト
export const mockConversations = [
  { id: 'mock_1', name: '📝 UI検証: Markdown & 出典' },
  { id: 'mock_2', name: '📚 UI検証: RAG & 複合ソース' }, // 更新
  { id: 'mock_3', name: '⚠️ UI検証: エラー & 境界値' },
];

// 履歴読み込み用のメッセージデータ (IDで紐づけ)
export const mockMessages = {
  'mock_1': [
    {
      id: 'm1_u1',
      role: 'user',
      text: 'DifyのRAG機能について、特徴を教えてください。',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: 'm1_a1',
      role: 'ai',
      text: 'Difyの**RAG (Retrieval-Augmented Generation)** 機能は、独自の知識データをAIに組み込むための仕組みです。\n\n主な特徴は以下の通りです：\n\n1.  **自動データ処理**: テキストのクリーニングや分割（チャンク化）を自動で行います[1]。\n2.  **ハイブリッド検索**: キーワード検索とベクトル検索を組み合わせ、精度の高い情報抽出を実現します[2]。\n\n詳しくは公式ドキュメントをご確認ください。',
      citations: [
        { id: 'c1', type: 'web', source: 'Dify Documentation (RAG)', url: 'https://docs.dify.ai/features/rag' },
        { id: 'c2', type: 'document', source: '社内技術仕様書_v1.2.pdf', url: null } // PDFファイル
      ],
      suggestions: ['対応しているファイル形式は？', 'ハイブリッド検索のメリットは？'],
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 5000).toISOString(),
    }
  ],
  'mock_2': [
    {
      id: 'm2_u1',
      role: 'user',
      text: '来期の予算計画について、社内規定と市場動向を踏まえて教えて。',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'm2_a1',
      role: 'ai',
      text: '来期の予算計画策定における重要ポイントをまとめました。\n\n### 1. 社内規定に基づく要件\n経理規程第12条により、**11月末までに一次案の提出**が義務付けられています[1]。また、今年度よりIT投資枠の申請フローが変更されています[2]。\n\n### 2. 市場動向 (Web情報)\n最新の市場調査によると、SaaS関連のコストは年々上昇傾向にあり、**15%のバッファ**を見込むことが推奨されています[3]。\n\n### 3. 過去のデータ\n昨年度の予算消化率は98%でした。詳細な内訳は添付のエクセルファイルを参照しました[4]。',
      citations: [
        { id: 'c_rag_1', type: 'rag', source: '経理規程集 第4版', url: null }, // RAG (内部ナレッジ)
        { id: 'c_doc_1', type: 'document', source: 'IT投資ガイドライン改正案.docx', url: null }, // Wordファイル
        { id: 'c_web_1', type: 'web', source: '2025年 SaaS市場トレンドレポート', url: 'https://example.com/report' },
        { id: 'c_doc_2', type: 'document', source: '2024年度_予算消化実績.xlsx', url: null } // Excelファイル
      ],
      suggestions: ['IT投資枠の上限は？', '経理規程のリンクは？'],
      timestamp: new Date(Date.now() - 1000 * 60 * 30 + 5000).toISOString(),
    }
  ],
  'mock_3': [
    {
      id: 'm3_u1',
      role: 'user',
      text: 'エラー時の表示はどうなりますか？',
      timestamp: new Date(Date.now() - 1000 * 60).toISOString(),
    },
    {
      id: 'm3_a1',
      role: 'ai',
      text: '**エラーが発生しました**\n\n申し訳ありませんが、システム内部で予期せぬエラーが発生しました。',
      citations: [],
      suggestions: ['再試行する'],
      timestamp: new Date(Date.now() - 1000 * 60 + 1000).toISOString(),
    }
  ]
};

// 新規チャット送信時のストリーミング用レスポンス
export const mockStreamResponse = {
  text: 'これは **FEモード (機能強化版)** での生成テストです。\n\n現在、以下の3パターンの出典表示をテストしています。\n\n1. **Web検索**: 地球儀アイコン\n2. **内部ナレッジ(RAG)**: データベースアイコン\n3. **添付ファイル**: 拡張子に応じたアイコン\n\n出典リストのアイコンが正しく出し分けられているか確認してください。',
  citations: [
    { id: 'new_c1', type: 'web', source: 'React公式サイト', url: 'https://react.dev' },
    { id: 'new_c2', type: 'rag', source: '社内開発ガイドライン (Wiki)', url: null },
    { id: 'new_c3', type: 'document', source: '要件定義書.pdf', url: null },
    { id: 'new_c4', type: 'document', source: 'API仕様書.xlsx', url: null }
  ],
  suggestions: ['次のテスト項目は？', '履歴モードに戻る']
};