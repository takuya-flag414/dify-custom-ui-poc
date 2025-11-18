// src/mockData.js

/**
 * FEモード検証用のモックデータ定義
 */

// サイドバー用の会話リスト
export const mockConversations = [
  { id: 'mock_1', name: '📝 UI検証: Markdown & 出典' },
  { id: 'mock_2', name: '📜 UI検証: 長文 & レイアウト' },
  { id: 'mock_3', name: '⚠️ UI検証: エラー & 境界値' },
];

// 履歴読み込み用のメッセージデータ (IDで紐づけ)
export const mockMessages = {
  'mock_1': [
    // 1往復目: ユーザー
    {
      id: 'm1_u1',
      role: 'user',
      text: 'DifyのRAG機能について、特徴を教えてください。',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1日前
    },
    // 1往復目: AI (Markdown, 出典, 提案あり)
    {
      id: 'm1_a1',
      role: 'ai',
      text: 'Difyの**RAG (Retrieval-Augmented Generation)** 機能は、独自の知識データをAIに組み込むための仕組みです。\n\n主な特徴は以下の通りです：\n\n1.  **自動データ処理**: テキストのクリーニングや分割（チャンク化）を自動で行います[1]。\n2.  **ハイブリッド検索**: キーワード検索とベクトル検索を組み合わせ、精度の高い情報抽出を実現します[2]。\n\n```python\n# 検索のイメージ\nresults = vector_search() + keyword_search()\n```\n\n詳しくは公式ドキュメントをご確認ください。',
      citations: [
        { id: 'c1', type: 'web', source: 'Dify Documentation (RAG)', url: 'https://docs.dify.ai/features/rag' },
        { id: 'c2', type: 'file', source: '社内技術仕様書_v1.2.pdf', url: null }
      ],
      suggestions: ['対応しているファイル形式は？', 'ハイブリッド検索のメリットは？'],
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 5000).toISOString(),
    },
    // 2往復目: ユーザー (連続した会話の確認)
    {
      id: 'm1_u2',
      role: 'user',
      text: '対応しているファイル形式は？',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1時間前
    },
    // 2往復目: AI (リスト表示, 出典なしパターン)
    {
      id: 'm1_a2',
      role: 'ai',
      text: '現在のバージョンでは、以下のファイル形式に対応しています。\n\n* PDF (`.pdf`)\n* Word (`.docx`)\n* Text (`.txt`, `.md`)\n* CSV (`.csv`)\n\n画像や音声ファイルへの対応も順次進められています。',
      citations: [], // 出典なし
      suggestions: [], // 提案なし
      timestamp: new Date(Date.now() - 1000 * 60 * 60 + 2000).toISOString(),
    }
  ],
  'mock_2': [
    {
      id: 'm2_u1',
      role: 'user',
      text: '非常に長い文章を表示したときのレイアウトを確認したいです。',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'm2_a1',
      role: 'ai',
      text: '承知いたしました。長文レイアウトの検証用テキストを出力します。\n\nこのテキストは、チャットバブルの最大幅、折り返し処理、およびスクロールの挙動を確認するためのものです。特にスマートフォンなどの狭い画面幅において、レイアウトが崩れないことを確認する必要があります。\n\n**Lorem Ipsum** is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.\n\n> 引用ブロックのテストです。\n> 複数行にわたる引用表示が、背景色やインデントを含めて正しくスタイルされているか確認してください。\n\n以上です。',
      citations: [],
      suggestions: ['テストを終了する', '別のパターンを試す'],
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
      text: '**エラーが発生しました**\n\n申し訳ありませんが、システム内部で予期せぬエラーが発生しました。しばらく時間をおいてから再度お試しください。\n\nError Code: `500 Internal Server Error`',
      citations: [],
      suggestions: ['再試行する'],
      timestamp: new Date(Date.now() - 1000 * 60 + 1000).toISOString(),
    }
  ]
};

// 新規チャット送信時のストリーミング用レスポンス
export const mockStreamResponse = {
  text: 'これは **FEモード (機能強化版)** での生成テストです。\n\nリアルタイムでMarkdownがレンダリングされる様子を確認してください。\n\n- **太字** や *斜体* の表示\n- [リンク](https://google.com) の動作\n- 出典番号 [1] [2] の付与\n\nこれらが正しく表示されていれば、フロントエンドの実装は正常です。',
  citations: [
    { id: 'new_c1', type: 'web', source: 'React公式サイト', url: 'https://react.dev' },
    { id: 'new_c2', type: 'file', source: 'UIデザインガイドライン.pdf' }
  ],
  suggestions: ['次のテスト項目は？', '履歴モードに戻る']
};