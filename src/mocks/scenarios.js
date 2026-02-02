// src/mocks/scenarios.js

/**
 * JSONレスポンス生成用ヘルパー
 * @param {string} answer - 回答テキスト
 * @param {Array} citations - 引用配列
 * @param {Array} smartActions - Smart Actions配列（オプション）
 * @param {string} thinking - Chain-of-Thought用思考プロセス（オプション）
 */
const createMockJson = (answer, citations = [], smartActions = [], thinking = '') => {
  // thinking を answer より先に配置（ストリーミング時に thinking が先に表示されるように）
  const obj = {};
  if (thinking) {
    obj.thinking = thinking;
  }
  obj.answer = answer;
  obj.citations = citations;
  if (smartActions.length > 0) {
    obj.smart_actions = smartActions;
  }
  return JSON.stringify(obj);
};

/**
 * JSONレスポンス生成用ヘルパー (```json コードブロック形式)
 * この形式はLLMが```jsonで囲んで返すケースを再現するためのもの
 * @param {string} answer - 回答テキスト
 * @param {Array} citations - 引用配列
 * @param {Array} smartActions - Smart Actions配列（オプション）
 * @param {string} thinking - Chain-of-Thought用思考プロセス（オプション）
 */
const createMockJsonCodeBlock = (answer, citations = [], smartActions = [], thinking = '') => {
  // thinking を answer より先に配置（ストリーミング時に thinking が先に表示されるように）
  const jsonObj = {};
  if (thinking) {
    jsonObj.thinking = thinking;
  }
  jsonObj.answer = answer;
  jsonObj.citations = citations;
  if (smartActions.length > 0) {
    jsonObj.smart_actions = smartActions;
  }
  return '```json\n' + JSON.stringify(jsonObj, null, 2) + '\n```';
};

// =================================================================
// Chain-of-Thought (thinking) テンプレート定義
// =================================================================

/**
 * 各検索モード×AIスタイル用のthinkingテンプレート
 * ContextSelector.jsx のモード定義に対応
 */
const thinkingTemplates = {
  // オート（ファイルなし）: standard
  pure: {
    efficient: "- **分析**: ユーザーの質問を分類\n- **判断**: 雑談として即座に応答",
    partner: "- **ユーザー認識**: 初回のあいさつ\n- **文脈分析**: カジュアルな会話\n- **発話戦略**: フレンドリーに応答、次のアクションを提案"
  },
  // オート（ファイルあり）: standard_file
  file_only: {
    efficient: "- **分析**: 添付ファイルの内容確認\n- **判断**: ドキュメント要約タスクとして処理",
    partner: "- **ファイル確認**: ドキュメントを読み込み中\n- **内容把握**: 構造と要点を整理\n- **発話戦略**: わかりやすく要約して説明"
  },
  // スピード（ファイルなし）: fast
  fast_pure: {
    efficient: "- **モード**: 高速応答（検索省略）\n- **戦略**: 既存知識で即座に回答",
    partner: "- **モード**: 高速応答モード\n- **認識**: スピード重視のリクエスト\n- **戦略**: シンプルかつ迅速に回答"
  },
  // スピード（ファイルあり）: fast_file
  fast_file: {
    efficient: "- **モード**: 高速応答\n- **処理**: ファイル内容の即座の分析",
    partner: "- **モード**: 高速応答モード\n- **ファイル処理**: 内容を素早く把握\n- **戦略**: 要点を簡潔に抽出して回答"
  },
  // ハイブリッド（ファイルなし）: hybrid
  hybrid: {
    efficient: "- **検索戦略**: 社内DB + Web検索を並行実行\n- **情報統合**: 内部・外部情報を照合して回答を構築",
    partner: "- **検索モード**: ハイブリッド検索\n- **戦略**: 社内規定とWeb情報を統合\n- **発話戦略**: 信頼性の高い総合回答を構築"
  },
  // ハイブリッド（ファイルあり）: hybrid_file
  full: {
    efficient: "- **処理**: ファイル + 社内DB + Web検索\n- **分析**: 3ソースの情報を統合して総合判断",
    partner: "- **検索モード**: ハイブリッド検索（ファイル含む）\n- **分析**: ファイル内容を社内・Web情報と照合\n- **戦略**: 包括的な回答を作成"
  },
  // 社内データ（ファイルなし）: enterprise
  rag_only: {
    efficient: "- **検索対象**: 社内ナレッジベースのみ\n- **分析**: 社内規定・ドキュメントを参照して回答",
    partner: "- **検索モード**: 社内データ限定\n- **戦略**: 社内規定に基づいた正確な回答\n- **配慮**: コンプライアンスを意識した表現"
  },
  // 社内データ（ファイルあり）: enterprise_file
  file_rag: {
    efficient: "- **処理**: ファイル + 社内ナレッジ\n- **分析**: 添付資料と社内規定を照合",
    partner: "- **ファイル処理**: 添付ドキュメントを確認\n- **照合**: 社内規定と比較分析\n- **戦略**: 規定遵守の観点から回答"
  },
  // Web検索（ファイルなし）: deep
  web_only: {
    efficient: "- **検索対象**: Webのみ（Perplexity API）\n- **分析**: 最新のWeb情報を収集・整理",
    partner: "- **検索モード**: Web検索モード\n- **情報収集**: 最新のWeb情報を調査\n- **発話戦略**: 出典を明示して回答"
  },
  // Web検索（ファイルあり）: deep_file
  file_web: {
    efficient: "- **処理**: ファイル + Web検索\n- **分析**: 添付資料とWeb情報を照合",
    partner: "- **ファイル確認**: 添付ドキュメントを読み込み\n- **Web検索**: 最新情報と照らし合わせ\n- **戦略**: 両者を統合して回答"
  },
  // ========== Auto Demo (Log based) ==========
  auto_demo: {
    efficient: "", // Not used in this demo
    partner: "- **ユーザーの意図**: 今日の東京の天気に関する最新情報を求めている。\n- **情報の分解**: 天気（晴れ/曇り/雨/雪）、気温（最高/最低）、降水確率、風、湿度などの要素を抽出。\n- **構成案**: まず概要を提示し、気象庁とウェザーニュースの詳細な情報を加える。さらに、Yahoo!天気の情報から、システム管理者が関心を持ちそうな指数（乾燥、風邪注意など）を提示する。\n- **戦略**: 各情報源から得られた情報を統合し、ユーザーが包括的な理解を得られるように努める。特に、システム管理者が日々の業務で考慮すべき点（例：乾燥対策、寒さ対策）を強調する。"
  }
};

// =================================================================
// AIスタイル別 回答テンプレート定義
// =================================================================

/**
 * スタイル別の回答スニペット
 * - efficient: 簡潔・客観的・見出し多用・絵文字なし
 * - partner: 親しみやすい・対話的・絵文字使用・次のアクション提案
 */
const styleTemplates = {
  // ========== Fast Pure (高速モード・ファイルなし) ==========
  // ※スピードモードはJSON形式ではないため、Smart Actionsは表示されない
  fast_pure: {
    efficient: "### Difyとは\n\n**Dify**は、大規模言語モデル（LLM）を活用したエンタープライズ向けのAIチャットボット基盤です。\n\n### 特徴\n- **コスト効率**: gpt-4o-miniにより、テキスト対話コストを大幅に低減\n- **Web検索**: Perplexity APIによるリアルタイム情報取得（高コスト注意）\n- **ステートフル対話**: 会話履歴を保持し、連続した対話が可能\n\n### 留意点\n本モードはWeb/RAG検索がOFFのため、最新情報や社内規定の回答には対応していません。",
    partner: "こんにちは！🤖 Difyについてお聞きですね。\n\nDifyは、OpenAIの**gpt-4o-mini**を中心に構築された、社内向け**AIチャットボット基盤**です。Web検索（Perplexity API）との連携により、リアルタイムの情報も取得できる設計になっています。\n\n今は**高速モード**（Web/RAG OFF）で動作しているため、最新ニュースや社内規定への回答はできませんが、一般的な知識や文章作成・翻訳などはお任せください！ 💪\n\n他にも気になることがあれば、遠慮なくどうぞ！"
  },

  // ========== Fast File (高速モード・ファイルあり) ==========
  fast_file: {
    efficient: "### 概要\n\n本レポートは、**Dify**を基盤とした社内向けAIチャットボットの運用に関するコスト分析を提供します。\n\n### 主要ポイント\n1. **エグゼクティブサマリー**: 経済的実現可能性と予算策定の基礎を提示\n2. **コスト構造**: OpenAI gpt-4o-miniとPerplexity APIの価格分析\n3. **ペルソナ別試算**: Light/Standard/Heavyユーザー別の月額コスト\n\n### 結論\n適切な管理と設定により、月額コストは「1社員あたりコーヒー1杯分」で運用可能。",
    partner: "資料を確認しました！📄\n\nこのドキュメントは、**Difyチャットボットのコスト試算レポート**のようですね。\n\n内容を見てみると...\n- **gpt-4o-mini**を使うことで、テキスト対話のコストがかなり抑えられること\n- 一方、**Perplexity API**（Web検索）は利用頻度によってコストが跳ね上がるリスクがあること\n- ユーザータイプ別（ライト/スタンダード/ヘビー）のシミュレーションが載っています\n\n結論として、「**1人あたり月額コーヒー1杯分**」で運用できそう、とのことです！☕\n\nもっと詳しく見たい部分はありますか？例えば「コスト内訳」や「リスク要因」などを深掘りできますよ！"
  },

  // ========== Pure (Web/RAG ON だが検索なし) ==========
  pure: {
    efficient: "### 概要\n\n私は社内AIアシスタントです。以下のタスクに対応可能です。\n\n- **ドキュメント解析**: アップロードされたファイルの要約・分析\n- **Web情報検索**: 最新のWeb情報の取得\n- **社内規定確認**: RAGを通じた社内ナレッジ検索\n\nご質問をお待ちしています。",
    partner: "こんにちは！😊 私は社内AIアシスタントです。\n\nドキュメントの解析、Web情報の検索、社内規定の確認など、様々なタスクをお手伝いできます。\n\n何かお手伝いできることはありますか？"
  },

  // ========== Web Only ==========
  web_only: {
    efficient: "### 結論\n\nWeb検索の結果、Reactの最新トレンドとして以下が注目されています。\n\n### 詳細\n1. **React Compiler**: メモ化（useMemo, useCallback）の自動化[1]\n2. **Server Actions**: サーバーサイド処理とのシームレスな統合[2]\n\nボイラープレートコードが大幅に削減される見込みです。",
    partner: "Reactの最新トレンドについてお調べしました！🔍\n\n調べてみたところ、2025年に注目されているのは...\n\n**React Compiler**という新機能で、今まで手動で書いていた`useMemo`や`useCallback`を**自動化**してくれるようになるんです[1]。これは開発体験がかなり変わりそうですね！\n\nそれから**Server Actions**も標準化が進んでいて、サーバーサイドとの連携がより簡単になっています[2]。\n\n他にも気になる技術があればお調べしますよ！🚀"
  },

  // ========== RAG Only (社内データモード) ==========
  // ★smart_actionsはJSON要素として追加されるため、テンプレートからXMLタグを削除
  rag_only: {
    efficient: "### 回答\n\n社内規定によると、経費精算の締切は以下の通りです。\n\n- **通常経費**: 毎月第3営業日 17:00まで[1]\n- **交通費**: 月末締め、翌月第2営業日まで[2]\n\n期限を過ぎた場合、翌月処理となります。",
    partner: "経費精算の締切についてお調べしました！📅\n\n社内規定を確認したところ...\n\n- **通常経費**は毎月**第3営業日の17:00**が締切です[1]\n- **交通費**は月末締めで、翌月**第2営業日**までに申請が必要です[2]\n\n⚠️ 期限を過ぎると翌月処理になってしまうので、お気をつけくださいね！\n\n他にも経費関連でご不明点があれば聞いてください！"
  },

  // ========== Hybrid (Web + RAG) ==========
  hybrid: {
    efficient: "### 結論\n\n社内外の情報を統合して回答します。\n\n### 比較分析\n\n#### 一般基準\nNISTなどのセキュリティ標準では、AIへの個人情報入力は厳格に管理すべきとされています[1]。\n\n#### 当社規定\n当社の「ITセキュリティガイドライン」においても、**顧客情報のAI入力は原則禁止**です[2]。\n\n承認済みサンドボックス環境に限り、利用が許可されています。",
    partner: "生成AIのセキュリティ規定について、社内外の情報を照らし合わせてみました！🔐\n\nまず**世の中の標準**として、NISTなどでは「AIへの個人情報入力は厳格に管理すべき」とされています[1]。\n\n一方、**当社の規定**を確認すると...「ITセキュリティガイドライン」で**顧客情報のAI入力は原則禁止**となっていますね[2]。ただし、事前承認された**サンドボックス環境**なら利用OKとのことです。\n\n世の中の標準と比較しても、当社の規定は適切なレベルにあると言えそうです！✅\n\n他に確認したいことはありますか？"
  },

  // ========== File Only ==========
  file_only: {
    efficient: "### 要約\n\nアップロードされたファイルを解析しました。このドキュメントは「プロジェクトX」のキックオフ資料です[1]。\n\n### 主なポイント\n- **目的**: 業務プロセスの自動化\n- **期間**: 2025年4月〜9月\n- **体制**: 開発チーム5名",
    partner: "ファイルを確認しました！📄\n\nこれは「**プロジェクトX**」のキックオフ資料のようですね[1]。\n\n中身を見てみると...\n- **目的**: 業務プロセスの自動化を目指すプロジェクト\n- **期間**: 2025年4月から9月までの予定\n- **体制**: 開発チーム5名で進めるようです\n\nスケジュールやコストについてもっと詳しく見てみましょうか？"
  },

  // ========== File + Web ==========
  file_web: {
    efficient: "### 分析結果\n\nファイル内の記述コードを最新ドキュメントと照合しました。\n\n#### 問題点\nファイル内で使用されている `componentWillMount`[1] は、Reactの最新バージョンでは**非推奨**です。\n\n#### 推奨対応\n公式ドキュメント[2]によると、代わりに `useEffect` フックの使用が推奨されています。\n\nリファクタリングを検討してください。",
    partner: "ファイルの内容を最新のWeb情報と照らし合わせてみました！🔍\n\nファイル内で使われている`componentWillMount`[1]なんですが...実は**React最新版では非推奨**になっているんです。\n\n公式ドキュメント[2]を見ると、代わりに`useEffect`フックを使うことが推奨されていますね。\n\nこの部分のリファクタリング、お手伝いしましょうか？具体的なコード例もお見せできますよ！💡"
  },

  // ========== File + RAG ==========
  file_rag: {
    efficient: "### チェック結果\n\n請求書（ファイル）と社内支払い規定（RAG）を照合しました。\n\n#### 問題なし\n- **支払サイト**: 「翌月末払い」は規定[2]と一致\n\n#### 要確認\n- **費目**: 「交際費」は事前申請番号の記載が必要[2]\n- ファイル[1]内に申請番号が見当たりません\n\n確認をお願いします。",
    partner: "請求書と社内規定を照合してみました！📋\n\n**支払サイト**については「翌月末払い」となっていて、社内規定[2]と一致しているので**問題なし**です ✅\n\nただ、**1点確認が必要**です ⚠️\n\n「交際費」として計上されていますが、規定によると**事前申請番号の記載が必須**なんです[2]。ファイル[1]を見た限り、申請番号が見当たらないので、確認していただけますか？\n\n法務部への確認が必要でしたら、連絡先もお調べしますよ！"
  },

  // ========== Full (File + Web + RAG) ==========
  full: {
    efficient: "### 総合分析レポート\n\n「事業計画書案」について、社内実績と市場動向の両面から分析しました。\n\n#### 計画書の分析\n提案されている「AIカスタマーサポート」機能[1]は、コスト削減効果が高いとされています。\n\n#### 社内実績\n過去の類似プロジェクト「ChatBot 2023」[2]では、導入により問い合わせが30%削減。\n\n#### 市場動向\n競合他社も同様の機能をリリース[3]。早期リリースが重要。\n\n**結論**: 本計画は妥当性が高く、推進を推奨します。",
    partner: "事業計画書について、社内実績と市場動向の両面から分析してみました！📊\n\nまず計画書[1]で提案されている「**AIカスタマーサポート**」機能、コスト削減効果が期待できそうですね。\n\n**社内の実績**を見てみると...過去の「ChatBot 2023」プロジェクト[2]では、導入後に問い合わせが**30%削減**されたそうです！これは心強いデータですね 💪\n\n**市場動向**としては、競合他社も同様の機能をリリースし始めています[3]。競争力を維持するためにも、**早期リリース**が重要になりそうです。\n\n総合的に見て、この計画は**推進を推奨**します！✅\n\n次のステップとして、リスク管理表の作成などお手伝いしましょうか？"
  },

  // ========== Auto Demo (Log based) ==========
  auto_demo: {
    efficient: "", // Not used
    partner: "藤井さん、こんにちは！\nWeb情報をあわせて確認しました🔍\n\n今日の東京の天気についてお知らせしますね。概ね晴れ時々曇りで、最高気温は11℃、最低気温は3℃となるでしょう [1][2][3]。\n\n### ☀️ 全体的な天気概況\n\n東京は、2026年2月2日は概ね晴れ時々曇りとなるでしょう [2]。日中の最高気温は11℃まで上がり、夜間の最低気温は3℃まで下がる見込みです [2][3]。\n\n### 🌡️ 気象庁とウェザーニュースの詳細情報\n\n気象庁のデータによると、横浜の観測地点では気圧が1015.8 hPa、現在の気温は9.3℃で、北北西の風が7.5 m/sで吹いています [1]。\n\nウェザーニュースでは、今日の東京は「晴れ時々くもり」で、降水確率は午前が10%、午後が20%と予測しています [2]。\n\n### 💡 その他の注意点（Yahoo!天気より）\n\nYahoo!天気では、以下の指数が公開されています [3]：\n\n*   紫外線指数: 10（弱く、外出も安心）\n*   重ね着指数: 90（厚手のコートでしっかり防寒を）\n*   乾燥指数: 80（乾燥注意！保湿をしっかり）\n*   風邪注意指数: 80（加湿を心がけた方がよさそう）\n*   洗濯指数: 90（絶好の洗濯日和。バスタオルも速乾）\n*   傘指数: 10（傘なしでも心配なし）\n\n特に乾燥と風邪には注意が必要なようです。オフィス内の加湿や、ご自身の保湿対策も忘れずに行いましょう✅\n\n今日の天気は安定していますが、夕方から曇りとなり、雨や雪の降る可能性もあるため、注意が必要です [1][2][3][4]。伊豆諸島では雨や雷雨となる所がある見込みです [4]。"
  }
};

// =================================================================
// シナリオ定義 (AIスタイル対応版)
// =================================================================

/**
 * FEモード検証用のシナリオ定義
 * 
 * 各シナリオは { efficient: [...], partner: [...] } の形式で、
 * AIスタイルに応じて異なる回答を返します。
 * 
 * 後方互換のため、配列形式のシナリオも引き続きサポートされます。
 */
export const scenarios = {

  // =================================================================
  // Pattern 1: Pure
  // =================================================================
  'pure': {
    efficient: [
      { event: 'node_started', data: { title: 'Query Rewriter', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Query Rewriter', outputs: { text: 'こんにちは' } } },
      { event: 'node_started', data: { title: 'Intent Classifier', node_type: 'llm', inputs: { query: 'こんにちは' } } },
      { event: 'node_finished', data: { title: 'Intent Classifier', outputs: { text: 'CHAT' } } },
      { event: 'node_started', data: { title: 'General LLM', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJsonCodeBlock(styleTemplates.pure.efficient, [], [], thinkingTemplates.pure.efficient)
      },
      { event: 'node_finished', data: { title: 'General LLM', node_type: 'llm', status: 'succeeded' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ],
    partner: [
      { event: 'node_started', data: { title: 'Query Rewriter', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Query Rewriter', outputs: { text: 'こんにちは' } } },
      { event: 'node_started', data: { title: 'Intent Classifier', node_type: 'llm', inputs: { query: 'こんにちは' } } },
      { event: 'node_finished', data: { title: 'Intent Classifier', outputs: { text: 'CHAT' } } },
      { event: 'node_started', data: { title: 'General LLM', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJsonCodeBlock(styleTemplates.pure.partner, [], [], thinkingTemplates.pure.partner)
      },
      { event: 'node_finished', data: { title: 'General LLM', node_type: 'llm', status: 'succeeded' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ]
  },

  // =================================================================
  // Pattern 2: Web Only
  // =================================================================
  'web_only': {
    efficient: [
      { event: 'node_started', data: { title: 'Query Rewriter', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Query Rewriter', outputs: { text: 'React 2025 trends features' } } },
      { event: 'node_started', data: { title: 'Intent Classifier', node_type: 'llm', inputs: { query: 'Reactの最新トレンドは？' } } },
      { event: 'node_finished', data: { title: 'Intent Classifier', outputs: { text: 'SEARCH' } } },
      { event: 'node_started', data: { title: 'Perplexity Search', node_type: 'tool', inputs: { query: 'React 2025 trends' } } },
      { event: 'node_finished', data: { title: 'Perplexity Search', outputs: { text: '[Search Results...]' } } },
      { event: 'node_started', data: { title: 'SEARCH LLM', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJsonCodeBlock(
          styleTemplates.web_only.efficient,
          [
            { id: 'cite_1', type: 'web', source: 'React Blog: React Compiler', url: 'https://react.dev/blog' },
            { id: 'cite_2', type: 'web', source: 'TechCrunch: Frontend Trends 2025', url: 'https://techcrunch.com/react' }
          ],
          [],
          thinkingTemplates.web_only.efficient
        )
      },
      { event: 'node_finished', data: { title: 'SEARCH LLM', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ],
    partner: [
      { event: 'node_started', data: { title: 'Query Rewriter', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Query Rewriter', outputs: { text: 'React 2025 trends features' } } },
      { event: 'node_started', data: { title: 'Intent Classifier', node_type: 'llm', inputs: { query: 'Reactの最新トレンドは？' } } },
      { event: 'node_finished', data: { title: 'Intent Classifier', outputs: { text: 'SEARCH' } } },
      { event: 'node_started', data: { title: 'Perplexity Search', node_type: 'tool', inputs: { query: 'React 2025 trends' } } },
      { event: 'node_finished', data: { title: 'Perplexity Search', outputs: { text: '[Search Results...]' } } },
      { event: 'node_started', data: { title: 'SEARCH LLM', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJsonCodeBlock(
          styleTemplates.web_only.partner,
          [
            { id: 'cite_1', type: 'web', source: 'React Blog: React Compiler', url: 'https://react.dev/blog' },
            { id: 'cite_2', type: 'web', source: 'TechCrunch: Frontend Trends 2025', url: 'https://techcrunch.com/react' }
          ],
          [],
          thinkingTemplates.web_only.partner
        )
      },
      { event: 'node_finished', data: { title: 'SEARCH LLM', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ]
  },

  // =================================================================
  // =================================================================
  // Pattern 3: RAG Only
  // =================================================================
  'rag_only': {
    efficient: [
      { event: 'node_started', data: { title: 'Query Rewriter', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Query Rewriter', outputs: { text: '経費精算 締切 ルール' } } },
      { event: 'node_started', data: { title: 'Intent Classifier', node_type: 'llm', inputs: { query: '経費精算の締切はいつ？' } } },
      { event: 'node_finished', data: { title: 'Intent Classifier', outputs: { text: 'LOGICAL' } } },
      { event: 'node_started', data: { title: '社内ナレッジ検索', node_type: 'knowledge-retrieval', inputs: { query: '経費精算 締切' } } },
      { event: 'node_finished', data: { title: '社内ナレッジ検索', outputs: { result: '[Doc chunks...]' } } },
      { event: 'node_started', data: { title: 'SEARCH LLM', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJson(
          styleTemplates.rag_only.efficient,
          [
            { id: 'cite_1', type: 'rag', source: '経費精算マニュアル_2025年度版.pdf', url: null },
            { id: 'cite_2', type: 'rag', source: '総務部_FAQ集.xlsx', url: null }
          ],
          // ★全5種類のSmart Actions
          [
            { type: 'retry_mode', label: 'Web検索モードで再試行', icon: 'refresh-cw', payload: { mode: 'web_only' } },
            { type: 'suggested_question', label: '申請書のテンプレートは？', icon: 'file-text', payload: { text: '経費精算の申請書テンプレートはどこにありますか？' } },
            { type: 'web_search', label: 'Web検索で再確認', icon: 'globe', payload: {} },
            { type: 'deep_dive', label: 'もっと詳しく解説', icon: 'sparkles', payload: {} },
            { type: 'navigate', label: '経費精算システムを開く', icon: 'external-link', payload: { url: 'https://example.com/expense' } }
          ],
          thinkingTemplates.rag_only.efficient
        )
      },
      { event: 'node_finished', data: { title: 'SEARCH LLM', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ],
    partner: [
      { event: 'node_started', data: { title: 'Query Rewriter', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Query Rewriter', outputs: { text: '経費精算 締切 ルール' } } },
      { event: 'node_started', data: { title: 'Intent Classifier', node_type: 'llm', inputs: { query: '経費精算の締切はいつ？' } } },
      { event: 'node_finished', data: { title: 'Intent Classifier', outputs: { text: 'LOGICAL' } } },
      { event: 'node_started', data: { title: '社内ナレッジ検索', node_type: 'knowledge-retrieval', inputs: { query: '経費精算 締切' } } },
      { event: 'node_finished', data: { title: '社内ナレッジ検索', outputs: { result: '[Doc chunks...]' } } },
      { event: 'node_started', data: { title: 'SEARCH LLM', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJson(
          styleTemplates.rag_only.partner,
          [
            { id: 'cite_1', type: 'rag', source: '経費精算マニュアル_2025年度版.pdf', url: null },
            { id: 'cite_2', type: 'rag', source: '総務部_FAQ集.xlsx', url: null }
          ],
          // ★全5種類のSmart Actions
          [
            { type: 'retry_mode', label: 'Web検索モードで再試行', icon: 'refresh-cw', payload: { mode: 'web_only' } },
            { type: 'suggested_question', label: '申請書のテンプレートは？', icon: 'file-text', payload: { text: '経費精算の申請書テンプレートはどこにありますか？' } },
            { type: 'web_search', label: 'Web検索で再確認', icon: 'globe', payload: {} },
            { type: 'deep_dive', label: 'もっと詳しく解説', icon: 'sparkles', payload: {} },
            { type: 'navigate', label: '経費精算システムを開く', icon: 'external-link', payload: { url: 'https://example.com/expense' } }
          ],
          thinkingTemplates.rag_only.partner
        )
      },
      { event: 'node_finished', data: { title: 'SEARCH LLM', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ]
  },

  // =================================================================
  // Pattern 4: Hybrid
  // =================================================================
  'hybrid': {
    efficient: [
      { event: 'node_started', data: { title: 'Query Rewriter', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Query Rewriter', outputs: { text: '生成AI セキュリティ規定' } } },
      { event: 'node_started', data: { title: 'Intent Classifier', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Intent Classifier', outputs: { text: 'SEARCH' } } },
      { event: 'node_started', data: { title: 'Perplexity Search', node_type: 'tool' } },
      { event: 'node_finished', data: { title: 'Perplexity Search' } },
      { event: 'node_started', data: { title: '社内ナレッジ検索', node_type: 'knowledge-retrieval' } },
      { event: 'node_finished', data: { title: '社内ナレッジ検索' } },
      { event: 'node_started', data: { title: 'SEARCH LLM', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJson(
          styleTemplates.hybrid.efficient,
          [
            { id: 'cite_1', type: 'web', source: 'NIST AI Risk Management Framework', url: 'https://nist.gov/ai' },
            { id: 'cite_2', type: 'rag', source: 'ITセキュリティガイドライン_v3.pdf', url: null }
          ],
          [],
          thinkingTemplates.hybrid.efficient
        )
      },
      { event: 'node_finished', data: { title: 'SEARCH LLM', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ],
    partner: [
      { event: 'node_started', data: { title: 'Query Rewriter', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Query Rewriter', outputs: { text: '生成AI セキュリティ規定' } } },
      { event: 'node_started', data: { title: 'Intent Classifier', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Intent Classifier', outputs: { text: 'SEARCH' } } },
      { event: 'node_started', data: { title: 'Perplexity Search', node_type: 'tool' } },
      { event: 'node_finished', data: { title: 'Perplexity Search' } },
      { event: 'node_started', data: { title: '社内ナレッジ検索', node_type: 'knowledge-retrieval' } },
      { event: 'node_finished', data: { title: '社内ナレッジ検索' } },
      { event: 'node_started', data: { title: 'SEARCH LLM', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJson(
          styleTemplates.hybrid.partner,
          [
            { id: 'cite_1', type: 'web', source: 'NIST AI Risk Management Framework', url: 'https://nist.gov/ai' },
            { id: 'cite_2', type: 'rag', source: 'ITセキュリティガイドライン_v3.pdf', url: null }
          ],
          [],
          thinkingTemplates.hybrid.partner
        )
      },
      { event: 'node_finished', data: { title: 'SEARCH LLM', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ]
  },

  // =================================================================
  // Pattern 5: File Only
  // =================================================================
  'file_only': {
    efficient: [
      { event: 'node_started', data: { title: 'ドキュメント抽出', node_type: 'document-extractor', inputs: { file: 'upload_file_id' } } },
      { event: 'node_finished', data: { title: 'ドキュメント抽出', outputs: { content: 'Extracting...' } } },
      { event: 'node_started', data: { title: 'Query Rewriter', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Query Rewriter', outputs: { text: 'ProjectX Kickoff Summary' } } },
      { event: 'node_started', data: { title: 'Intent Classifier', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Intent Classifier', outputs: { text: 'LOGICAL' } } },
      { event: 'node_started', data: { title: 'Document LLM', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJson(
          styleTemplates.file_only.efficient,
          [{ id: 'cite_1', type: 'document', source: 'ProjectX_Kickoff.pptx', url: null }],
          [],
          thinkingTemplates.file_only.efficient
        )
      },
      { event: 'node_finished', data: { title: 'Document LLM', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ],
    partner: [
      { event: 'node_started', data: { title: 'ドキュメント抽出', node_type: 'document-extractor', inputs: { file: 'upload_file_id' } } },
      { event: 'node_finished', data: { title: 'ドキュメント抽出', outputs: { content: 'Extracting...' } } },
      { event: 'node_started', data: { title: 'Query Rewriter', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Query Rewriter', outputs: { text: 'ProjectX Kickoff Summary' } } },
      { event: 'node_started', data: { title: 'Intent Classifier', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Intent Classifier', outputs: { text: 'LOGICAL' } } },
      { event: 'node_started', data: { title: 'Document LLM', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJson(
          styleTemplates.file_only.partner,
          [{ id: 'cite_1', type: 'document', source: 'ProjectX_Kickoff.pptx', url: null }],
          [],
          thinkingTemplates.file_only.partner
        )
      },
      { event: 'node_finished', data: { title: 'Document LLM', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ]
  },

  // =================================================================
  // Pattern 6: File + Web
  // =================================================================
  'file_web': {
    efficient: [
      { event: 'node_started', data: { title: 'ドキュメント抽出', node_type: 'document-extractor' } },
      { event: 'node_finished', data: { title: 'ドキュメント抽出' } },
      { event: 'node_started', data: { title: 'Query Rewriter', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Query Rewriter', outputs: { text: 'File content vs React best practices' } } },
      { event: 'node_started', data: { title: 'Intent Classifier', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Intent Classifier', outputs: { text: 'SEARCH' } } },
      { event: 'node_started', data: { title: 'Perplexity Search', node_type: 'tool', inputs: { query: 'File content check' } } },
      { event: 'node_finished', data: { title: 'Perplexity Search' } },
      { event: 'node_started', data: { title: 'Hybrid LLM', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJson(
          styleTemplates.file_web.efficient,
          [
            { id: 'cite_1', type: 'document', source: 'LegacyCode.js', url: null },
            { id: 'cite_2', type: 'web', source: 'React Docs: Effects', url: 'https://react.dev/reference/react/useEffect' }
          ],
          [],
          thinkingTemplates.file_web.efficient
        )
      },
      { event: 'node_finished', data: { title: 'Hybrid LLM', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ],
    partner: [
      { event: 'node_started', data: { title: 'ドキュメント抽出', node_type: 'document-extractor' } },
      { event: 'node_finished', data: { title: 'ドキュメント抽出' } },
      { event: 'node_started', data: { title: 'Query Rewriter', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Query Rewriter', outputs: { text: 'File content vs React best practices' } } },
      { event: 'node_started', data: { title: 'Intent Classifier', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Intent Classifier', outputs: { text: 'SEARCH' } } },
      { event: 'node_started', data: { title: 'Perplexity Search', node_type: 'tool', inputs: { query: 'File content check' } } },
      { event: 'node_finished', data: { title: 'Perplexity Search' } },
      { event: 'node_started', data: { title: 'Hybrid LLM', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJson(
          styleTemplates.file_web.partner,
          [
            { id: 'cite_1', type: 'document', source: 'LegacyCode.js', url: null },
            { id: 'cite_2', type: 'web', source: 'React Docs: Effects', url: 'https://react.dev/reference/react/useEffect' }
          ],
          [],
          thinkingTemplates.file_web.partner
        )
      },
      { event: 'node_finished', data: { title: 'Hybrid LLM', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ]
  },

  // =================================================================
  // Pattern 7: File + RAG
  // =================================================================
  'file_rag': {
    efficient: [
      { event: 'node_started', data: { title: 'ドキュメント抽出', node_type: 'document-extractor' } },
      { event: 'node_finished', data: { title: 'ドキュメント抽出' } },
      { event: 'node_started', data: { title: 'Query Rewriter', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Query Rewriter', outputs: { text: '請求書 支払い規定 チェック' } } },
      { event: 'node_started', data: { title: 'Intent Classifier', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Intent Classifier', outputs: { text: 'LOGICAL' } } },
      { event: 'node_started', data: { title: '社内ナレッジ検索', node_type: 'knowledge-retrieval' } },
      { event: 'node_finished', data: { title: '社内ナレッジ検索' } },
      { event: 'node_started', data: { title: 'Hybrid LLM', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJson(
          styleTemplates.file_rag.efficient,
          [
            { id: 'cite_1', type: 'document', source: '請求書_株式会社A.pdf', url: null },
            { id: 'cite_2', type: 'rag', source: '購買管理規定.pdf', url: null }
          ],
          [],
          thinkingTemplates.file_rag.efficient
        )
      },
      { event: 'node_finished', data: { title: 'Hybrid LLM', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ],
    partner: [
      { event: 'node_started', data: { title: 'ドキュメント抽出', node_type: 'document-extractor' } },
      { event: 'node_finished', data: { title: 'ドキュメント抽出' } },
      { event: 'node_started', data: { title: 'Query Rewriter', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Query Rewriter', outputs: { text: '請求書 支払い規定 チェック' } } },
      { event: 'node_started', data: { title: 'Intent Classifier', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Intent Classifier', outputs: { text: 'LOGICAL' } } },
      { event: 'node_started', data: { title: '社内ナレッジ検索', node_type: 'knowledge-retrieval' } },
      { event: 'node_finished', data: { title: '社内ナレッジ検索' } },
      { event: 'node_started', data: { title: 'Hybrid LLM', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJson(
          styleTemplates.file_rag.partner,
          [
            { id: 'cite_1', type: 'document', source: '請求書_株式会社A.pdf', url: null },
            { id: 'cite_2', type: 'rag', source: '購買管理規定.pdf', url: null }
          ],
          [],
          thinkingTemplates.file_rag.partner
        )
      },
      { event: 'node_finished', data: { title: 'Hybrid LLM', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ]
  },

  // =================================================================
  // Pattern 8: Full
  // =================================================================
  'full': {
    efficient: [
      { event: 'node_started', data: { title: 'ドキュメント抽出', node_type: 'document-extractor' } },
      { event: 'node_finished', data: { title: 'ドキュメント抽出' } },
      { event: 'node_started', data: { title: 'Query Rewriter', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Query Rewriter', outputs: { text: 'Integrated Analysis' } } },
      { event: 'node_started', data: { title: 'Intent Classifier', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Intent Classifier', outputs: { text: 'SEARCH' } } },
      { event: 'node_started', data: { title: 'Perplexity Search', node_type: 'tool' } },
      { event: 'node_finished', data: { title: 'Perplexity Search' } },
      { event: 'node_started', data: { title: '社内ナレッジ検索', node_type: 'knowledge-retrieval' } },
      { event: 'node_finished', data: { title: '社内ナレッジ検索' } },
      { event: 'node_started', data: { title: 'Hybrid LLM', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJson(
          styleTemplates.full.efficient,
          [
            { id: 'cite_1', type: 'document', source: '2025_事業計画案.docx', url: null },
            { id: 'cite_2', type: 'rag', source: 'プロジェクト完了報告書_ChatBot2023.pdf', url: null },
            { id: 'cite_3', type: 'web', source: 'TechNews: Customer Support Trends', url: 'https://technews.com/ai-support' }
          ],
          [],
          thinkingTemplates.full.efficient
        )
      },
      { event: 'node_finished', data: { title: 'Hybrid LLM', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ],
    partner: [
      { event: 'node_started', data: { title: 'ドキュメント抽出', node_type: 'document-extractor' } },
      { event: 'node_finished', data: { title: 'ドキュメント抽出' } },
      { event: 'node_started', data: { title: 'Query Rewriter', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Query Rewriter', outputs: { text: 'Integrated Analysis' } } },
      { event: 'node_started', data: { title: 'Intent Classifier', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'Intent Classifier', outputs: { text: 'SEARCH' } } },
      { event: 'node_started', data: { title: 'Perplexity Search', node_type: 'tool' } },
      { event: 'node_finished', data: { title: 'Perplexity Search' } },
      { event: 'node_started', data: { title: '社内ナレッジ検索', node_type: 'knowledge-retrieval' } },
      { event: 'node_finished', data: { title: '社内ナレッジ検索' } },
      { event: 'node_started', data: { title: 'Hybrid LLM', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJson(
          styleTemplates.full.partner,
          [
            { id: 'cite_1', type: 'document', source: '2025_事業計画案.docx', url: null },
            { id: 'cite_2', type: 'rag', source: 'プロジェクト完了報告書_ChatBot2023.pdf', url: null },
            { id: 'cite_3', type: 'web', source: 'TechNews: Customer Support Trends', url: 'https://technews.com/ai-support' }
          ],
          [],
          thinkingTemplates.full.partner
        )
      },
      { event: 'node_finished', data: { title: 'Hybrid LLM', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ]
  },

  // =================================================================
  // Pattern 9: Fast Mode (Pure)
  // ※スピードモードはJSON形式ではなく生Markdownを返す
  // =================================================================
  'fast_pure': {
    efficient: [
      { event: 'node_started', data: { title: 'Answer Generator', node_type: 'llm' } },
      {
        event: 'message',
        answer: styleTemplates.fast_pure.efficient  // 生Markdown（JSON形式ではない）
      },
      { event: 'node_finished', data: { title: 'Answer Generator', node_type: 'llm', status: 'succeeded' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ],
    partner: [
      { event: 'node_started', data: { title: 'Answer Generator', node_type: 'llm' } },
      {
        event: 'message',
        answer: styleTemplates.fast_pure.partner  // 生Markdown（JSON形式ではない）
      },
      { event: 'node_finished', data: { title: 'Answer Generator', node_type: 'llm', status: 'succeeded' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ]
  },

  // =================================================================
  // Pattern 10: Fast Mode (File)
  // ※スピードモードはJSON形式ではなく生Markdownを返す
  // =================================================================
  'fast_file': {
    efficient: [
      { event: 'node_started', data: { title: 'ドキュメント抽出', node_type: 'document-extractor', inputs: { file: 'upload_file_id' } } },
      { event: 'node_finished', data: { title: 'ドキュメント抽出', status: 'succeeded' } },
      { event: 'node_started', data: { title: 'Answer Generator', node_type: 'llm' } },
      {
        event: 'message',
        answer: styleTemplates.fast_file.efficient  // 生Markdown（JSON形式ではない）
      },
      { event: 'node_finished', data: { title: 'Answer Generator', node_type: 'llm', status: 'succeeded' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ],
    partner: [
      { event: 'node_started', data: { title: 'ドキュメント抽出', node_type: 'document-extractor', inputs: { file: 'upload_file_id' } } },
      { event: 'node_finished', data: { title: 'ドキュメント抽出', status: 'succeeded' } },
      { event: 'node_started', data: { title: 'Answer Generator', node_type: 'llm' } },
      {
        event: 'message',
        answer: styleTemplates.fast_file.partner  // 生Markdown（JSON形式ではない）
      },
      { event: 'node_finished', data: { title: 'Answer Generator', node_type: 'llm', status: 'succeeded' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ]
  },

  // =================================================================
  // Pattern 11: Auto Demo (Log Based Logic)
  // =================================================================
  'auto_demo': {
    efficient: [], // Not used
    partner: [
      { event: 'node_started', data: { title: 'LLM_Intent_Analysis', node_type: 'llm' } },
      {
        event: 'node_finished', data: {
          title: 'LLM_Intent_Analysis',
          outputs: {
            text: '```json\n' + JSON.stringify({
              thinking: "今日の天気はリアルタイム情報のため、Web検索が必要です。RAGは不要です。",
              category: "TASK",
              requires_rag: false,
              requires_web: true,
              resultLabel: "判定: 🛠️ タスク実行 → 🌐 Webで情報を探します"
            }, null, 2) + '\n```'
          }
        }
      },
      { event: 'node_started', data: { title: 'LLM_Search_Strategy', node_type: 'llm' } },
      {
        event: 'node_finished', data: {
          title: 'LLM_Search_Strategy',
          outputs: {
            text: '```json\n' + JSON.stringify({
              reasoning: "東京の天気という単純な事実検索であり、迅速な回答が求められるため、search_modeは\"fast\"を選択。モデルは低コストな\"sonar\"を選択。気象庁の情報を参照するため、ドメインを指定。",
              search_mode: "fast",
              selected_model: "sonar",
              query_main: "今日の東京の天気",
              query_alt: "東京都 天気予報",
              recency: "day",
              target_domains: ["jma.go.jp", "yahoo.co.jp", "weathernews.jp"],
              domain_filter: ["jma.go.jp", "yahoo.co.jp", "weathernews.jp"] // Add domain_filter for display consistency
            }, null, 2) + '\n```'
          }
        }
      },
      { event: 'node_started', data: { title: 'Perplexity Search', node_type: 'tool', inputs: { query: '今日の東京の天気' } } },
      { event: 'node_finished', data: { title: 'Perplexity Search', outputs: { text: '[Search Results...]' } } },
      { event: 'node_started', data: { title: 'LLM_Search_Partner', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJsonCodeBlock(
          styleTemplates.auto_demo.partner,
          [
            { id: 'cite_1', type: 'web', source: '気象庁｜最新の気象データ', url: 'https://www.data.jma.go.jp/stats/data/mdrr/synopday/data1s.html' },
            { id: 'cite_2', type: 'web', source: '東京の天気 - ウェザーニュース', url: 'https://weathernews.jp/onebox/tenki/tokyo/' },
            { id: 'cite_3', type: 'web', source: '東京（東京）の天気 - Yahoo!天気・災害', url: 'https://weather.yahoo.co.jp/weather/jp/13/4410.html' },
            { id: 'cite_4', type: 'web', source: '東京都の天気 - Yahoo!天気・災害', url: 'https://weather.yahoo.co.jp/weather/jp/13/' }
          ],
          [],
          thinkingTemplates.auto_demo.partner
        )
      },
      { event: 'node_finished', data: { title: 'LLM_Search_Partner', node_type: 'llm', status: 'succeeded' } },
      { event: 'message_end', metadata: { retriever_resources: [] } }
    ]
  }
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