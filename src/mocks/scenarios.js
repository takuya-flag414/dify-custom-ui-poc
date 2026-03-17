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
  // オート（ファイルなし）: standard
  pure: {
    efficient: "承知いたしました。ご質問内容を確認し、回答を作成いたします。",
    partner: "こんにちは！😊 ご質問ありがとうございます。その件について、すぐにお答えしますね。"
  },
  // オート（ファイルあり）: standard_file
  file_only: {
    efficient: "ファイルを受領しました。内容を確認し、要約して説明いたします。",
    partner: "ファイルをアップロードしていただきありがとうございます！📄 内容を確認しました。このドキュメントについてご説明します。"
  },
  // スピード（ファイルなし）: fast
  fast_pure: {
    efficient: "高速モードで応答します。即座に回答を作成します。",
    partner: "高速モードですね！承知しました。お待たせすることなく、すぐに回答しますね！⚡"
  },
  // スピード（ファイルあり）: fast_file
  fast_file: {
    efficient: "ファイルを確認しました。高速モードで分析結果を提示します。",
    partner: "ファイルの中身をパッと確認しました！👀 すぐに要点をお伝えしますね。"
  },
  // ハイブリッド（ファイルなし）: hybrid
  hybrid: {
    efficient: "社内DBとWeb検索を併用して調査します。最適な回答を統合します。",
    partner: "社内の規定と、Web上の最新情報の両方を確認しますね！🔍 情報を照らし合わせて、最適な回答をご用意します。"
  },
  // ハイブリッド（ファイルあり）: hybrid_file
  full: {
    efficient: "ファイル、社内DB、Web情報のすべてを確認します。総合的な分析を行います。",
    partner: "ファイルの内容に加えて、社内情報とWebの情報もあわせてチェックします！📚 徹底的に調べて、完璧な回答を目指しますね。"
  },
  // 社内データ（ファイルなし）: enterprise
  rag_only: {
    efficient: "社内ナレッジベースを検索します。規定に基づいて回答します。",
    partner: "社内規定を確認いたします。📚 関連する資料から、正確な情報をお伝えしますね。"
  },
  // 社内データ（ファイルあり）: enterprise_file
  file_rag: {
    efficient: "ファイルと社内規定を照合します。コンプライアンスチェックを行います。",
    partner: "アップロードされたファイルと、社内のルールを照らし合わせて確認しますね。🧐 齟齬がないかしっかりチェックします。"
  },
  // Web検索（ファイルなし）: deep
  web_only: {
    efficient: "Web検索を実行します。最新情報を収集して回答します。",
    partner: "最新のトレンドについてお調べしますね！🔍 Web上の情報を検索して、詳しくお伝えします。"
  },
  // Web検索（ファイルあり）: deep_file
  file_web: {
    efficient: "ファイル内容とWeb情報を比較します。最新動向との差異を分析します。",
    partner: "ファイルの内容を、Web上の最新情報と比較してみますね！🌏 新しい情報と照らし合わせて、アップデートが必要か確認します。"
  },
  // ========== Auto Demo (Log based) ==========
  auto_demo: {
    efficient: "", // Not used in this demo
    partner: "藤井さん、こんにちは！\nWeb情報をあわせて確認しました🔍\n\n今日の東京の天気についてお知らせしますね。概ね晴れ時々曇りで、最高気温は11℃、最低気温は3℃となるでしょう [1][2][3]。\n\n### ☀️ 全体的な天気概況\n\n東京は、2026年2月2日は概ね晴れ時々曇りとなるでしょう [2]。日中の最高気温は11℃まで上がり、夜間の最低気温は3℃まで下がる見込みです [2][3]。\n\n### 🌡️ 気象庁とウェザーニュースの詳細情報\n\n気象庁のデータによると、横浜の観測地点では気圧が1015.8 hPa、現在の気温は9.3℃で、北北西の風が7.5 m/sで吹いています [1]。\n\nウェザーニュースでは、今日の東京は「晴れ時々くもり」で、降水確率は午前が10%、午後が20%と予測しています [2]。\n\n### 💡 その他の注意点（Yahoo!天気より）\n\nYahoo!天気では、以下の指数が公開されています [3]：\n\n*   紫外線指数: 10（弱く、外出も安心）\n*   重ね着指数: 90（厚手のコートでしっかり防寒を）\n*   乾燥指数: 80（乾燥注意！保湿をしっかり）\n*   風邪注意指数: 80（加湿を心がけた方がよさそう）\n*   洗濯指数: 90（絶好の洗濯日和。バスタオルも速乾）\n*   傘指数: 10（傘なしでも心配なし）\n\n特に乾燥と風邪には注意が必要なようです。オフィス内の加湿や、ご自身の保湿対策も忘れずに行いましょう✅\n\n今日の天気は安定していますが、夕方から曇りとなり、雨や雪の降る可能性もあるため、注意が必要です [1][2][3][4]。伊豆諸島では雨や雷雨となる所がある見込みです [4]。"
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
  // ※スピードモードもJSON形式に変更し、Smart Actionsを表示するように修正
  fast_pure: {
    efficient: createMockJsonCodeBlock(
      "### Difyとは\n\n**Dify**は、大規模言語モデル（LLM）を活用したエンタープライズ向けのAIチャットボット基盤です。\n\n### 特徴\n- **コスト効率**: gpt-4o-miniにより、テキスト対話コストを大幅に低減\n- **Web検索**: Perplexity APIによるリアルタイム情報取得（高コスト注意）\n- **ステートフル対話**: 会話履歴を保持し、連続した対話が可能\n\n### 留意点\n本モードはWeb/RAG検索がOFFのため、最新情報や社内規定の回答には対応していません。",
      [],
      [
        { type: 'selection', label: 'コスト構造について詳しく', icon: 'list-checks', payload: { text: 'コスト構造について詳しく教えて' } },
        { type: 'selection', label: '利用可能なモデルは？', icon: 'git-branch', payload: { text: '利用可能なモデルを教えて' } },
        { type: 'selection', label: '導入のメリットは？', icon: 'sparkles', payload: { text: '導入のメリットを教えて' } }
      ]
    ),
    partner: createMockJsonCodeBlock(
      "こんにちは！🤖 Difyについてお聞きですね。\n\nDifyは、OpenAIの**gpt-4o-mini**を中心に構築された、社内向け**AIチャットボット基盤**です。Web検索（Perplexity API）との連携により、リアルタイムの情報も取得できる設計になっています。\n\n今は**高速モード**（Web/RAG OFF）で動作しているため、最新ニュースや社内規定への回答はできませんが、一般的な知識や文章作成・翻訳などはお任せください！ 💪\n\n他にも気になることがあれば、遠慮なくどうぞ！",
      [],
      [
        { type: 'selection', label: '何ができるの？', icon: 'list-checks', payload: { text: '具体的に何ができるか教えて' } },
        { type: 'selection', label: '使い方は簡単？', icon: 'git-branch', payload: { text: '使い方のヒントを教えて' } },
        { type: 'selection', label: '他のモードも試したい', icon: 'sparkles', payload: { text: '他の検索モードについて教えて' } }
      ]
    )
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
  // Special Pattern: Enterprise Pricing (From Log)
  // =================================================================
  'rag_only_pricing': {
    efficient: [], // Not implemented for this specific log replication
    partner: [
      // 1. Intent Analysis
      { event: 'node_started', data: { title: 'LLM_Intent_Analysis', node_type: 'llm' } },
      {
        event: 'node_finished', data: {
          title: 'LLM_Intent_Analysis',
          outputs: {
            text: '```json\n' + JSON.stringify({
              thinking: "本日もお疲れ様です、藤井さん。ピークマネージャーの料金規約を確認しますね💻",
              category: "RAG",
              requires_rag: true,
              requires_web: false,
              resultLabel: "判定: 🤖 処理 → 📁 社内データを確認します"
            }, null, 2) + '\n```'
          }
        }
      },
      // 2. RAG Search (Using constant key)
      { event: 'node_started', data: { title: 'ファイル検索ストアを指定して検索', node_type: 'tool', inputs: { query: 'ピークマネージャー 料金 規約' } } },
      { event: 'node_finished', data: { title: 'ファイル検索ストアを指定して検索', outputs: { result: '[Doc chunks...]' } } },
      
      // 3. Final Answer Generation (Using constant key)
      { event: 'node_started', data: { title: 'LLM_Search', node_type: 'llm' } },
      // The rest is the same...
      {
        event: 'message',
        answer: createMockJson(
          // Answer Body
          "### 結論 🚀\nピークマネージャーの料金に関する規約は、**利用料金の決定方法、支払い条件、料金変更・返還の原則、遅延損害金、契約期間、自動更新、および解約時の違約金**について細かく定められています。特に、**最低契約期間内の解約や自動更新の条件には注意が必要**です。システム運用・管理の観点から、これらの規約を正確に理解しておくことが重要です [1]。\n\n### 💡 詳細\n#### 利用料金と支払いについて\n-   **料金決定**: サービス利用料金は、別途当社が定めるか、申込書の契約内容欄に記載された金額となります [1]。\n-   **支払い方法**: 当社指定の方法（銀行振込、クレジットカード決済など）で、定められた期日までに支払う必要があります [1]。\n-   **費用負担**: 支払いにかかる手数料は利用者の負担です [1]。\n-   **公租公課**: 租税法規の変更による公租公課の増額分は利用者が負担します [1]。\n-   **日割り計算なし**: 月の途中でサービスを申し込む場合でも、日割り計算は行われません [1]。\n\n#### 料金の変更と返還\n-   **料金変更**: 当社は事前に利用者に通知することにより、利用料金を変更できるものとします [1]。\n-   **料金返還なし**: 当社の責めに帰すべき事由によらずサービスが使用できなくなった場合でも、料金の減額・返還や損害賠償は行われません。また、利用者が支払った料金は、理由の如何を問わず一切返還されません [1]。\n\n#### 遅延損害金\n-   支払いが遅延した場合、支払期日の翌日から完済まで、**年率14.6%**の遅延損害金が請求されることがあります [1]。\n\n#### 契約期間と更新\n-   **最低契約期間**: サービスの使用環境設定およびトレーニング完了日から**12ヶ月間**です [1]。\n-   **自動更新**: 契約期間満了日の属する月の1ヶ月前の末日までに、利用者から当社に対し書面による解約の意思表示がない場合、**契約期間は自動的に同一条件で1ヶ月間更新されます** [1]。\n-   **会員証**: ピークマネージャー会員証の契約期間は、メインの利用規約に準じます [2]。\n\n#### 解約と違約金\n-   **解約申告期間**: 解約を希望する場合、契約期間が満了する月の前月の1日から末日までの間に、当社指定の方法（PeakManagerサポートへの電話連絡など）で連絡が必要です [1]。\n-   **最低契約期間内の解約**: 最低契約期間内に契約を終了した場合、利用者は「**残月数 × 月額料金**」に相当する金額を違約金として支払う必要があります [1]。\n-   **利用資格喪失時の違約金**: 契約期間満了以外の事由でサービスの利用資格を喪失した場合、**10,000円（不課税）**の違約金が発生します [1]。\n-   **付随サービスの解約**: メインのピークマネージャーサービスを解約すると、付随するPeakManager CTIサービスやピークマネージャー会員証サービスも同時に解約されます [1]。\n\n#### PeakManager CTIサービスに関する特記事項\n-   **機器購入**: PeakManager CTIの利用には、当社が別途指定する機器の購入が必要となる場合がありますが、その購入代金は利用料金には含まれません [3]。\n-   **料金発生**: 対象機器を購入しない場合でも、CTIサービスに係る利用料金は発生します [3]。",
          
          // Citations
          [
            { id: "cite_1", type: "rag", source: "8.TORICOM利用料金【EPARKリラク＆エステ】", url: "null" },
            { id: "cite_2", type: "rag", source: "5.ピークマネージャー会員証利用規約【EPARKリラク＆エステ】", url: "null" },
            { id: "cite_3", type: "rag", source: "9．PeakManager CTI利用規約【EPARKリラク＆エステ】240501_商流OK　TelOK.pdf", url: "null" }
          ],

          // Smart Actions
          [
             { type: 'suggested_question', label: '料金の支払い方法は？', icon: 'help-circle', payload: { text: '料金の支払い方法は？' } },
             { type: 'suggested_question', label: '自動更新の条件は？', icon: 'clock', payload: { text: '自動更新の条件は？' } },
             { type: 'suggested_question', label: '解約時の違約金は？', icon: 'alert-triangle', payload: { text: '解約時の違約金は？' } }
          ],

          // Thinking Process
          "- **真意**: ユーザーはピークマネージャーの料金体系や関連する規約の詳細を知りたいと考えています。特にシステム管理者として、費用管理や契約更新、解約に関する具体的なルールを把握し、潜在的なリスクや運用上の注意点も理解したいはずです。\n- **分析**: 提供された社内ナレッジには、利用料金、支払い、変更、遅延、契約期間、更新、解約、違約金、そしてPeakManager CTIサービスに関する特記事項まで、詳細な情報が含まれています。これをカテゴリ別に整理し、システム管理者にとって重要なポイントを強調する必要があります。\n- **戦略**: 結論を冒頭に示し、その後、主要な規約項目を箇条書きで分かりやすく整理します。特に、自動更新、日割り計算なし、途中解約時の違約金、CTIの別途費用といった**金銭的な影響が大きい項目**にインサイトを加えることで、藤井様の業務に役立つ情報を提供します."
        )
      },
      { event: 'node_finished', data: { title: '検索結果から回答を生成中...', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 2480, completion_tokens: 1856, total_tokens: 4336 } } }
    ]
  },

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
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 845, completion_tokens: 128, total_tokens: 973 } } }
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
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 912, completion_tokens: 195, total_tokens: 1107 } } }
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
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
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
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
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
          // ★全6種類のSmart Actions (generate_document追加)
          [
            { type: 'retry_mode', label: 'Web検索モードで再試行', icon: 'refresh-cw', payload: { mode: 'web_only' } },
            { type: 'suggested_question', label: '申請書のテンプレートは？', icon: 'file-text', payload: { text: '経費精算の申請書テンプレートはどこにありますか？' } },
            { type: 'web_search', label: 'Web検索で再確認', icon: 'globe', payload: {} },
            { type: 'deep_dive', label: 'もっと詳しく解説', icon: 'sparkles', payload: {} },
            { type: 'navigate', label: '経費精算システムを開く', icon: 'external-link', payload: { url: 'https://example.com/expense' } },
            { type: 'generate_document', label: '📋 レポートとして出力', icon: 'file-text', payload: { text: '経費精算のルールをレポートにまとめて', artifact_type: 'summary_report' } }
          ],
          thinkingTemplates.rag_only.efficient
        )
      },
      { event: 'node_finished', data: { title: 'SEARCH LLM', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
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
          // ★全6種類のSmart Actions (generate_document追加)
          [
            { type: 'retry_mode', label: 'Web検索モードで再試行', icon: 'refresh-cw', payload: { mode: 'web_only' } },
            { type: 'suggested_question', label: '申請書のテンプレートは？', icon: 'file-text', payload: { text: '経費精算の申請書テンプレートはどこにありますか？' } },
            { type: 'web_search', label: 'Web検索で再確認', icon: 'globe', payload: {} },
            { type: 'deep_dive', label: 'もっと詳しく解説', icon: 'sparkles', payload: {} },
            { type: 'navigate', label: '経費精算システムを開く', icon: 'external-link', payload: { url: 'https://example.com/expense' } },
            { type: 'generate_document', label: '📋 レポートとして出力', icon: 'file-text', payload: { text: '経費精算のルールをレポートにまとめて', artifact_type: 'summary_report' } }
          ],
          thinkingTemplates.rag_only.partner
        )
      },
      { event: 'node_finished', data: { title: 'SEARCH LLM', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 1580, completion_tokens: 342, total_tokens: 1922 } } }
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
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
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
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
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
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
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
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
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
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
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
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
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
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
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
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
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
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
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
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
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
        answer: styleTemplates.fast_pure.efficient
      },
      { event: 'node_finished', data: { title: 'Answer Generator', node_type: 'llm', status: 'succeeded' } },
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
    ],
    partner: [
      { event: 'node_started', data: { title: 'Answer Generator', node_type: 'llm' } },
      {
        event: 'message',
        answer: styleTemplates.fast_pure.partner
      },
      { event: 'node_finished', data: { title: 'Answer Generator', node_type: 'llm', status: 'succeeded' } },
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
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
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
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
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
    ]
  },

  // =================================================================
  // Pattern 12: Artifact Demo (ドキュメント生成デモ)
  // =================================================================
  'artifact_demo': {
    efficient: [], // Not implemented
    partner: [
      // 1. Intent Analysis
      { event: 'node_started', data: { title: 'LLM_Intent_Analysis', node_type: 'llm' } },
      {
        event: 'node_finished', data: {
          title: 'LLM_Intent_Analysis',
          outputs: {
            text: '```json\n' + JSON.stringify({
              thinking: "レポート形式での出力をリクエストされています。Artifactモードで構造化ドキュメントを生成します 📋",
              category: "ARTIFACT",
              requires_rag: true,
              requires_web: false,
              resultLabel: "判定: 📋 Artifactモード → ドキュメントを生成します"
            }, null, 2) + '\n```'
          }
        }
      },
      // 2. RAG Search
      { event: 'node_started', data: { title: '社内ナレッジ検索', node_type: 'knowledge-retrieval', inputs: { query: '経費精算 ルール 締切' } } },
      { event: 'node_finished', data: { title: '社内ナレッジ検索', outputs: { result: '[Doc chunks...]' } } },
      // 3. Artifact Generator LLM
      { event: 'node_started', data: { title: 'LLM_Artifact_Generator', node_type: 'llm' } },
      {
        event: 'message',
        answer: JSON.stringify({
          artifact_title: '経費精算ルール まとめレポート',
          artifact_type: 'summary_report',
          artifact_content: '## 経費精算の基本ルール\n\n社内規定に基づく経費精算の重要ポイントをまとめました。\n\n### 1. 締切日\n\n| 経費種別 | 締切日 | 備考 |\n|---|---|---|\n| 通常経費 | 毎月第3営業日 17:00まで | 期限過ぎは翌月処理 |\n| 交通費 | 月末締め、翌月第2営業日まで | ICカード履歴推奨 |\n| 出張旅費 | 帰社後5営業日以内 | 領収書必須 |\n\n### 2. 申請方法\n\n1. **経費精算システム**にログイン\n2. 「新規申請」をクリック\n3. 費目を選択し、金額・日付・領収書を添付\n4. 承認者を選択して提出\n\n### 3. 注意事項\n\n- ❗ **5,000円以上**の経費は部長承認が必要\n- ❗ **交際費**は事前申請番号の記載が必須\n- ❗ 領収書がない場合は「領収書紛失届」を提出\n\n---\n\n*ℹ️ 詳細は「経費精算マニュアル_2025年度版.pdf」をご参照ください。*',
          answer: '経費精算のルールをレポートとしてまとめました！📋 右側のArtifactパネルでご確認ください。コピーボタンで内容をそのままクリップボードに保存できます。',
          citations: [
            { id: 'cite_1', type: 'rag', source: '経費精算マニュアル_2025年度版.pdf', url: null },
            { id: 'cite_2', type: 'rag', source: '総務部_FAQ集.xlsx', url: null }
          ]
        })
      },
      { event: 'node_finished', data: { title: 'LLM_Artifact_Generator', node_type: 'llm' } },
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 1580, completion_tokens: 842, total_tokens: 2422 } } }
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
              thinking: "こんにちは！藤井さん。東京の天気ですね、承知いたしました。最新の気象情報を確認してまいります！😊",
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
              reasoning: "より正確な情報をお伝えするため、気象庁やウェザーニュースなど、信頼できる複数の情報源を重点的にスキャンしますね。🔍",
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
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 780, completion_tokens: 145, total_tokens: 925 } } }
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
  ],
  'artifact_demo': [
    'チェックリスト形式で出力してほしい',
    'FAQ形式にまとめて',
    '比較表を作成して'
  ]
};