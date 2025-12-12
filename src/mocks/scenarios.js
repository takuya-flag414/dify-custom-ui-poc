// src/mocks/scenarios.js

/**
 * JSONレスポンス生成用ヘルパー
 */
const createMockJson = (answer, citations = []) => {
  return JSON.stringify({
    answer: answer,
    citations: citations
  });
};

/**
 * FEモード検証用のシナリオ定義 (全8パターン網羅・ノード順序修正版)
 * 順序: Query Rewriter -> Intent Classifier -> (Execution) -> Answer
 */
export const scenarios = {

  // =================================================================
  // Pattern 1: Pure
  // =================================================================
  'pure': [
    // 1. クエリ整形 (Query Rewriter)
    {
      event: 'node_started',
      data: { title: 'Query Rewriter', node_type: 'llm' }
    },
    {
      event: 'node_finished',
      data: { title: 'Query Rewriter', outputs: { text: 'こんにちは' } }
    },
    // 2. 意図分類 (Intent Classifier)
    {
      event: 'node_started',
      data: { title: 'Intent Classifier', node_type: 'llm', inputs: { query: 'こんにちは' } }
    },
    {
      event: 'node_finished',
      data: { title: 'Intent Classifier', outputs: { text: 'CHAT' } }
    },
    // 3. 回答生成
    {
      event: 'node_started',
      data: { title: 'Casual LLM', node_type: 'llm' }
    },
    {
      event: 'message',
      answer: createMockJson(
        "こんにちは！\n私は社内AIアシスタントです。ドキュメントの解析、Web情報の検索、社内規定の確認など、様々なタスクをお手伝いできます。\n\n何かお手伝いできることはありますか？",
        []
      )
    },
    {
      event: 'node_finished',
      data: { title: 'Casual LLM', node_type: 'llm', status: 'succeeded' }
    },
    {
      event: 'message_end',
      metadata: { retriever_resources: [] }
    }
  ],

  // =================================================================
  // Pattern 2: Web Only
  // =================================================================
  'web_only': [
    // 1. クエリ整形 (ここが表示させたい「質問の要点を整理中...」)
    {
      event: 'node_started',
      data: { title: 'Query Rewriter', node_type: 'llm' }
    },
    {
      event: 'node_finished',
      data: { title: 'Query Rewriter', outputs: { text: 'React 2025 trends features' } }
    },
    // 2. 意図分類
    {
      event: 'node_started',
      data: { title: 'Intent Classifier', node_type: 'llm', inputs: { query: 'Reactの最新トレンドは？' } }
    },
    {
      event: 'node_finished',
      data: { title: 'Intent Classifier', outputs: { text: 'SEARCH' } }
    },
    // 3. Web検索
    {
      event: 'node_started',
      data: { title: 'Perplexity Search', node_type: 'tool', inputs: { query: 'React 2025 trends' } }
    },
    {
      event: 'node_finished',
      data: { title: 'Perplexity Search', outputs: { text: '[Search Results...]' } }
    },
    {
      event: 'node_started',
      data: { title: 'SEARCH LLM', node_type: 'llm' }
    },
    {
      event: 'message',
      answer: createMockJson(
        "### 結論\nWeb検索の結果、Reactの最新トレンドとして以下の点が注目されています。\n\n### 詳細\n1. **React Compiler**: メモ化（useMemo, useCallback）の自動化が進み、開発体験が向上しています[1]。\n2. **Server Actions**: サーバーサイド処理とのシームレスな統合が標準化されています[2]。\n\nこれにより、ボイラープレートコードが大幅に削減される見込みです。",
        [
          { id: 'cite_1', type: 'web', source: 'React Blog: React Compiler', url: 'https://react.dev/blog' },
          { id: 'cite_2', type: 'web', source: 'TechCrunch: Frontend Trends 2025', url: 'https://techcrunch.com/react' }
        ]
      )
    },
    {
      event: 'node_finished',
      data: { title: 'SEARCH LLM', node_type: 'llm' }
    },
    {
      event: 'message_end',
      metadata: { retriever_resources: [] }
    }
  ],

  // =================================================================
  // Pattern 3: RAG Only
  // =================================================================
  'rag_only': [
    {
      event: 'node_started',
      data: { title: 'Query Rewriter', node_type: 'llm' }
    },
    {
      event: 'node_finished',
      data: { title: 'Query Rewriter', outputs: { text: '経費精算 締切 ルール' } }
    },
    {
      event: 'node_started',
      data: { title: 'Intent Classifier', node_type: 'llm', inputs: { query: '経費精算の締切はいつ？' } }
    },
    {
      event: 'node_finished',
      data: { title: 'Intent Classifier', outputs: { text: 'LOGICAL' } }
    },
    {
      event: 'node_started',
      data: { title: '社内ナレッジ検索', node_type: 'knowledge-retrieval', inputs: { query: '経費精算 締切' } }
    },
    {
      event: 'node_finished',
      data: { title: '社内ナレッジ検索', outputs: { result: '[Doc chunks...]' } }
    },
    {
      event: 'node_started',
      data: { title: 'SEARCH LLM', node_type: 'llm' }
    },
    {
      event: 'message',
      answer: createMockJson(
        "### 回答\n社内規定によると、経費精算の締切は以下の通りです。\n\n- **通常経費**: 毎月第3営業日 17:00まで[1]\n- **交通費**: 月末締め、翌月第2営業日まで[2]\n\n期限を過ぎた場合、翌月処理となりますのでご注意ください。",
        [
          { id: 'cite_1', type: 'rag', source: '経費精算マニュアル_2025年度版.pdf', url: null },
          { id: 'cite_2', type: 'rag', source: '総務部_FAQ集.xlsx', url: null }
        ]
      )
    },
    {
      event: 'node_finished',
      data: { title: 'SEARCH LLM', node_type: 'llm' }
    },
    {
      event: 'message_end',
      metadata: { retriever_resources: [] }
    }
  ],

  // =================================================================
  // Pattern 4: Hybrid
  // =================================================================
  'hybrid': [
    {
      event: 'node_started',
      data: { title: 'Query Rewriter', node_type: 'llm' }
    },
    {
      event: 'node_finished',
      data: { title: 'Query Rewriter', outputs: { text: '生成AI セキュリティ規定' } }
    },
    {
      event: 'node_started',
      data: { title: 'Intent Classifier', node_type: 'llm' }
    },
    {
      event: 'node_finished',
      data: { title: 'Intent Classifier', outputs: { text: 'SEARCH' } }
    },
    {
      event: 'node_started',
      data: { title: 'Perplexity Search', node_type: 'tool' }
    },
    {
      event: 'node_finished',
      data: { title: 'Perplexity Search' }
    },
    {
      event: 'node_started',
      data: { title: '社内ナレッジ検索', node_type: 'knowledge-retrieval' }
    },
    {
      event: 'node_finished',
      data: { title: '社内ナレッジ検索' }
    },
    {
      event: 'node_started',
      data: { title: 'SEARCH LLM', node_type: 'llm' }
    },
    {
      event: 'message',
      answer: createMockJson(
        "### 結論\n社内外の情報を統合して回答します。\n\n### 詳細比較\n\n- **世の中の標準**: 一般的なセキュリティ標準（NIST等）では、AIへの個人情報入力は厳格に管理すべきとされています[1]。\n\n- **当社の規定**: 当社の「ITセキュリティガイドライン」においても、**顧客情報のAI入力は原則禁止**されています[2]。ただし、承認済みのサンドボックス環境に限り、利用が許可されています。\n\nWeb上の標準と比較しても、当社の規定は一般的な水準を満たしています。",
        [
          { id: 'cite_1', type: 'web', source: 'NIST AI Risk Management Framework', url: 'https://nist.gov/ai' },
          { id: 'cite_2', type: 'rag', source: 'ITセキュリティガイドライン_v3.pdf', url: null }
        ]
      )
    },
    {
      event: 'node_finished',
      data: { title: 'SEARCH LLM', node_type: 'llm' }
    },
    {
      event: 'message_end',
      metadata: { retriever_resources: [] }
    }
  ],

  // =================================================================
  // Pattern 5: File Only
  // =================================================================
  'file_only': [
    // ファイル抽出 (Fileありの場合、Query Rewriterよりも先に走る場合がありますが、YAML上は抽出→Code→Query Rewriterです)
    {
      event: 'node_started',
      data: { title: 'ドキュメント抽出', node_type: 'document-extractor', inputs: { file: 'upload_file_id' } }
    },
    {
      event: 'node_finished',
      data: { title: 'ドキュメント抽出', outputs: { content: 'Extracting...' } }
    },
    {
      event: 'node_started',
      data: { title: 'Query Rewriter', node_type: 'llm' }
    },
    {
      event: 'node_finished',
      data: { title: 'Query Rewriter', outputs: { text: 'ProjectX Kickoff Summary' } }
    },
    {
      event: 'node_started',
      data: { title: 'Intent Classifier', node_type: 'llm' }
    },
    {
      event: 'node_finished',
      data: { title: 'Intent Classifier', outputs: { text: 'LOGICAL' } }
    },
    {
      event: 'node_started',
      data: { title: 'Document LLM', node_type: 'llm' }
    },
    {
      event: 'message',
      answer: createMockJson(
        "### 要約\nアップロードされたファイルを解析しました。このドキュメントは「プロジェクトX」のキックオフ資料のようです[1]。\n\n### 主なポイント\n- **目的**: 業務プロセスの自動化[1]\n- **期間**: 2025年4月〜9月\n- **体制**: 開発チーム5名",
        [
          { id: 'cite_1', type: 'document', source: 'ProjectX_Kickoff.pptx', url: null }
        ]
      )
    },
    {
      event: 'node_finished',
      data: { title: 'Document LLM', node_type: 'llm' }
    },
    {
      event: 'message_end',
      metadata: { retriever_resources: [] }
    }
  ],

  // =================================================================
  // Pattern 6: File + Web
  // =================================================================
  'file_web': [
    {
      event: 'node_started',
      data: { title: 'ドキュメント抽出', node_type: 'document-extractor' }
    },
    {
      event: 'node_finished',
      data: { title: 'ドキュメント抽出' }
    },
    {
      event: 'node_started',
      data: { title: 'Query Rewriter', node_type: 'llm' }
    },
    {
      event: 'node_finished',
      data: { title: 'Query Rewriter', outputs: { text: 'File content vs React best practices' } }
    },
    {
      event: 'node_started',
      data: { title: 'Intent Classifier', node_type: 'llm' }
    },
    {
      event: 'node_finished',
      data: { title: 'Intent Classifier', outputs: { text: 'SEARCH' } }
    },
    {
      event: 'node_started',
      data: { title: 'Perplexity Search', node_type: 'tool', inputs: { query: 'File content check' } }
    },
    {
      event: 'node_finished',
      data: { title: 'Perplexity Search' }
    },
    {
      event: 'node_started',
      data: { title: 'Hybrid LLM', node_type: 'llm' }
    },
    {
      event: 'message',
      answer: createMockJson(
        "### 分析結果\nファイル内の記述コードについて、最新のドキュメントと照らし合わせました。\n\nファイル内で使用されている `componentWillMount` [1] は、Reactの最新バージョンでは非推奨となっています。\n公式ドキュメント[2]によると、代わりに `useEffect` フックの使用が推奨されています。\n\nリファクタリングを検討することをお勧めします。",
        [
          { id: 'cite_1', type: 'document', source: 'LegacyCode.js', url: null },
          { id: 'cite_2', type: 'web', source: 'React Docs: Effects', url: 'https://react.dev/reference/react/useEffect' }
        ]
      )
    },
    {
      event: 'node_finished',
      data: { title: 'Hybrid LLM', node_type: 'llm' }
    },
    {
      event: 'message_end',
      metadata: { retriever_resources: [] }
    }
  ],

  // =================================================================
  // Pattern 7: File + RAG
  // =================================================================
  'file_rag': [
    {
      event: 'node_started',
      data: { title: 'ドキュメント抽出', node_type: 'document-extractor' }
    },
    {
      event: 'node_finished',
      data: { title: 'ドキュメント抽出' }
    },
    {
      event: 'node_started',
      data: { title: 'Query Rewriter', node_type: 'llm' }
    },
    {
      event: 'node_finished',
      data: { title: 'Query Rewriter', outputs: { text: '請求書 支払い規定 チェック' } }
    },
    {
      event: 'node_started',
      data: { title: 'Intent Classifier', node_type: 'llm' }
    },
    {
      event: 'node_finished',
      data: { title: 'Intent Classifier', outputs: { text: 'LOGICAL' } }
    },
    {
      event: 'node_started',
      data: { title: '社内ナレッジ検索', node_type: 'knowledge-retrieval' }
    },
    {
      event: 'node_finished',
      data: { title: '社内ナレッジ検索' }
    },
    {
      event: 'node_started',
      data: { title: 'Hybrid LLM', node_type: 'llm' }
    },
    {
      event: 'message',
      answer: createMockJson(
        "### チェック結果\n提出された請求書（ファイル）と、社内の支払い規定（RAG）を照合しました。\n\n1. **支払サイト**: 請求書は「翌月末払い」[1]となっていますが、社内規定[2]とも一致しており問題ありません。\n2. **費目**: 「交際費」として計上されていますが、規定により事前申請番号の記載が必要です。\n\nファイル内には申請番号が見当たらないため、確認をお願いします。",
        [
          { id: 'cite_1', type: 'document', source: '請求書_株式会社A.pdf', url: null },
          { id: 'cite_2', type: 'rag', source: '購買管理規定.pdf', url: null }
        ]
      )
    },
    {
      event: 'node_finished',
      data: { title: 'Hybrid LLM', node_type: 'llm' }
    },
    {
      event: 'message_end',
      metadata: { retriever_resources: [] }
    }
  ],

  // =================================================================
  // Pattern 8: Full
  // =================================================================
  'full': [
    {
      event: 'node_started',
      data: { title: 'ドキュメント抽出', node_type: 'document-extractor' }
    },
    {
      event: 'node_finished',
      data: { title: 'ドキュメント抽出' }
    },
    {
      event: 'node_started',
      data: { title: 'Query Rewriter', node_type: 'llm' }
    },
    {
      event: 'node_finished',
      data: { title: 'Query Rewriter', outputs: { text: 'Integrated Analysis' } }
    },
    {
      event: 'node_started',
      data: { title: 'Intent Classifier', node_type: 'llm' }
    },
    {
      event: 'node_finished',
      data: { title: 'Intent Classifier', outputs: { text: 'SEARCH' } }
    },
    // 同時並行検索（を模倣して連続実行）
    {
      event: 'node_started',
      data: { title: 'Perplexity Search', node_type: 'tool' }
    },
    {
      event: 'node_finished',
      data: { title: 'Perplexity Search' }
    },
    {
      event: 'node_started',
      data: { title: '社内ナレッジ検索', node_type: 'knowledge-retrieval' }
    },
    {
      event: 'node_finished',
      data: { title: '社内ナレッジ検索' }
    },
    {
      event: 'node_started',
      data: { title: 'Hybrid LLM', node_type: 'llm' }
    },
    {
      event: 'message',
      answer: createMockJson(
        "### 総合分析レポート\nアップロードされた「事業計画書案」について、社内実績と市場動向の両面から分析しました。\n\n### 計画書の分析\n提案されている「AIカスタマーサポート」機能[1]は、コスト削減効果が高いとされています。\n\n### 社内実績 (RAG)\n過去の類似プロジェクト「ChatBot 2023」[2]では、導入により問い合わせが30%削減された実績があり、計画の実現性は高いと判断できます。\n\n### 市場動向 (Web)\nまた、競合他社も同様の機能をリリースしており[3]、市場競争力を維持するためには早期のリリースが重要です。\n\n**結論**: 本計画は妥当性が高く、推進を推奨します。",
        [
          { id: 'cite_1', type: 'document', source: '2025_事業計画案.docx', url: null },
          { id: 'cite_2', type: 'rag', source: 'プロジェクト完了報告書_ChatBot2023.pdf', url: null },
          { id: 'cite_3', type: 'web', source: 'TechNews: Customer Support Trends', url: 'https://technews.com/ai-support' }
        ]
      )
    },
    {
      event: 'node_finished',
      data: { title: 'Hybrid LLM', node_type: 'llm' }
    },
    {
      event: 'message_end',
      metadata: { retriever_resources: [] }
    }
  ]
};

/**
 * シナリオごとの推奨質問リスト (Mock Suggestions)
 */
export const scenarioSuggestions = {
  'pure': [
    'Web検索を有効にするには？',
    '社内規定を検索したい',
    'ファイルを要約して'
  ],
  'web_only': [
    'React Server Componentsとは？',
    'Next.jsの最新機能について',
    'Vue.jsとの比較'
  ],
  'rag_only': [
    '申請書のフォーマットは？',
    '承認フローの詳細',
    '緊急時の連絡先'
  ],
  'hybrid': [
    '具体的な禁止事項は？',
    '承認プロセスの詳細は？',
    'ガイドラインのURL'
  ],
  'file_only': [
    'スケジュールの詳細は？',
    'コストの内訳は？',
    'リスク要因について'
  ],
  'file_web': [
    'マイグレーションの手順は？',
    'パフォーマンスへの影響',
    '代替ライブラリの提案'
  ],
  'file_rag': [
    '法務部の連絡先',
    '修正案の作成',
    '承認フローの確認'
  ],
  'full': [
    '次のステップは？',
    'リスク管理表の作成',
    'ステークホルダーへの報告'
  ]
};