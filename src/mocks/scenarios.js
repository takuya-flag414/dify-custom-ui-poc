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
  ],

  // =================================================================
  // Pattern 9: Fast Mode (Pure) - ログ再現: Difyとは？
  // =================================================================
  'fast_pure': [
    // Fastモード: 思考プロセス(Query Rewriter等)を省略し、即座に回答生成LLMから開始
    {
      event: 'node_started',
      data: { title: 'Answer Generator', node_type: 'llm' }
    },
    {
      event: 'message',
      answer: createMockJson(
        "### Difyとは\n\n**Dify**は、大規模言語モデル（LLM）を活用したエンタープライズ向けのAIチャットボット基盤です。このシステムは、社内向けに特化しており、OpenAIの軽量モデル「gpt-4o-mini」と、リアルタイムWeb検索機能を提供する「Perplexity API」を統合しています。\n\n#### 主な特徴\n- **コスト効率**: Difyは、テキスト対話にかかるコストを大幅に低下させることができるため、企業全体にAIアシスタントを導入する際の障壁を取り除きます。\n- **Web検索機能**: Perplexity APIを通じたWeb検索機能は、情報の取得を強化しますが、利用時には高コストが発生する可能性があります。\n- **ステートフルな対話**: Difyは対話履歴をコンテキストとして送信するため、連続した会話が可能ですが、それに伴うトークン消費が増加する特性があります。\n\nDifyは、企業の業務効率を向上させるための強力なツールとして位置付けられており、適切な管理と設定により、経済的に運用可能なAIソリューションを提供します。",
        []
      )
    },
    {
      event: 'node_finished',
      data: { title: 'Answer Generator', node_type: 'llm', status: 'succeeded' }
    },
    {
      event: 'message_end',
      metadata: { retriever_resources: [] }
    }
  ],

  // =================================================================
  // Pattern 10: Fast Mode (File) - ログ再現: コスト試算PDF
  // =================================================================
  'fast_file': [
    // ファイル抽出のみ実行
    {
      event: 'node_started',
      data: { title: 'ドキュメント抽出', node_type: 'document-extractor', inputs: { file: 'upload_file_id' } }
    },
    {
      event: 'node_finished',
      data: { title: 'ドキュメント抽出', status: 'succeeded' }
    },
    // 直ちに回答生成へ
    {
      event: 'node_started',
      data: { title: 'Answer Generator', node_type: 'llm' }
    },
    {
      event: 'message',
      answer: createMockJson(
        "### 概要\n\n本レポートは、**Dify**を基盤とした社内向けAIチャットボットの運用に関するコスト分析を提供します。特に、OpenAIの軽量モデル「gpt-4o-mini」とWeb検索機能を持つ「Perplexity API」を組み合わせた際の変動費構造に焦点を当てています。\n\n#### 主要な内容\n1. **エグゼクティブサマリー**:\n   - Difyの導入に向けた経済的実現可能性と予算策定の基礎を提供。\n   - コストの不確実性に対する詳細なシミュレーションを実施。\n\n2. **主要な発見と結論**:\n   - 知能のコモディティ化により、テキスト対話のコストが劇的に低下。\n   - Web検索機能は高コストであり、利用頻度によってコストが非対称になるリスク。\n   - Difyのアーキテクチャはトークン消費を増幅させる一方で、キャッシング機能によりコストを抑制。\n\n3. **コスト試算サマリー**:\n   - 月額コストの予測値をペルソナ別に示し、ユーザーの利用特性に基づいてコストを算出。\n\n4. **調査の背景と方法論**:\n   - 企業内での生成AI導入の必要性とリスクを明確化。\n\n5. **コスト構造の分析**:\n   - OpenAI gpt-4o-miniとPerplexity APIの価格構造と隠れたリスクを詳細に分析。\n\n6. **ペルソナ別コストシミュレーション**:\n   - Light User、Standard User、Heavy Userの3つのペルソナを定義し、それぞれの月額コストを試算。\n\n7. **戦略的推奨事項**:\n   - モデル選定の二極化、会話の要約機能の有効化、運用ガバナンスの強化などの推奨設定を提案。\n\n8. **最終結論**:\n   - Difyを利用したチャットボットの月額コストは「1社員あたりコーヒー1杯分」で運用可能。コストリスクを最小化しつつ、AIの恩恵を享受できる可能性を示唆。 \n\nこのように、Difyチャットボットの導入は、適切な管理と設定によって高いコスト効果を発揮することが期待されています。",
        []
      )
    },
    {
      event: 'node_finished',
      data: { title: 'Answer Generator', node_type: 'llm', status: 'succeeded' }
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
  ],
  'fast_pure': [
    'Difyのコストは？',
    'Perplexity APIとは？',
    'Difyの利点は？'
  ],
  'fast_file': [
    'Difyとは何ですか？',
    'gpt-4o-miniとは何ですか？',
    'コストはどの程度かかりますか？'
  ]
};