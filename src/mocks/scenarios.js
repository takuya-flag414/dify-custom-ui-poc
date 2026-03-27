// src/mocks/scenarios.js
import sampleA4Html from './artifact_sample_html/sample_a4_document_04.html?raw';

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
  // Pattern: HTML A4 Document
  // =================================================================
  'html_a4_document': {
    efficient: [
      { event: 'node_started', data: { title: 'LLM_Intent_Analysis', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'LLM_Intent_Analysis', outputs: { text: '```json\n{"category": "ARTIFACT_GEN", "artifact_type": "html_document"}\n```' } } },
      { event: 'node_started', data: { title: 'Artifact_Generator', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJson(
          "A4サイズのビジネスドキュメントを作成しました。",
          [
            { id: 'cite_1', type: 'rag', source: '事業計画ガイドライン.pdf', url: null }
          ],
          [],
          "ご要望に基づき、プロフェッショナルなA4書式のドキュメントを生成します。"
        )
      },
      {
        event: 'message',
        answer: JSON.stringify({
          artifact: {
            artifact_title: "2026年度 事業戦略報告書",
            artifact_type: "html_document",
            artifact_content: sampleA4Html
          }
        })
      },
      { event: 'node_finished', data: { title: 'Artifact_Generator', node_type: 'llm', status: 'succeeded' } },
      { event: 'message_end', metadata: { usage: { total_tokens: 5000 } } }
    ],
    partner: [
      { event: 'node_started', data: { title: 'LLM_Intent_Analysis', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'LLM_Intent_Analysis', outputs: { text: '```json\n{"category": "ARTIFACT_GEN", "artifact_type": "html_document", "thinking": "A4ドキュメントの作成ですね！承知いたしました。内容を構成して作成します。"} \n```' } } },
      { event: 'node_started', data: { title: 'Artifact_Generator', node_type: 'llm' } },
      {
        event: 'message',
        answer: createMockJson(
          "高品質なA4ビジネスドキュメントを作成しました！📄✨\n\n右側のパネルで、マルチページ構成のレポートをご確認いただけます。印刷にも適したプロフェッショナルなレイアウトになっています。",
          [
            { id: 'cite_1', type: 'rag', source: '事業計画ガイドライン.pdf', url: null }
          ],
          [
            { type: 'suggested_question', label: 'PDFとして保存したい', icon: 'file-text', payload: { text: 'PDFでの保存方法を教えて' } },
            { type: 'suggested_question', label: '内容を修正して', icon: 'edit', payload: { text: '内容の修正をお願い' } }
          ],
          "プロフェッショナルなA4書式でドキュメントを構成しています。しばらくお待ちください..."
        )
      },
      {
        event: 'message',
        answer: JSON.stringify({
          artifact: {
            artifact_title: "2026年度 事業戦略報告書",
            artifact_type: "html_document",
            artifact_content: sampleA4Html
          }
        })
      },
      { event: 'node_finished', data: { title: 'Artifact_Generator', node_type: 'llm', status: 'succeeded' } },
      { event: 'message_end', metadata: { usage: { total_tokens: 5500 } } }
    ]
  },


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
  // Pattern 12: Artifact Demo (ドキュメント生成デモ) - 既存Markdown型
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
  // Pattern 13: HTML Artifact Demo (HTML直接生成方式 v2.0)
  // =================================================================
  'html_artifact_demo': {
    efficient: [], // Not implemented
    partner: [
      // 1. Intent Analysis
      { event: 'node_started', data: { title: 'LLM_Intent_Analysis', node_type: 'llm' } },
      {
        event: 'node_finished', data: {
          title: 'LLM_Intent_Analysis',
          outputs: {
            text: '```json\n' + JSON.stringify({
              thinking: "高度なレポート形式での出力をリクエストされています。HTML直接生成モード（Artifact v2.0）でリッチなドキュメントを生成します 📄",
              category: "ARTIFACT",
              requires_rag: true,
              requires_web: false,
              resultLabel: "判定: 📄 HTML Artifactモード → リッチドキュメントを生成します"
            }, null, 2) + '\n```'
          }
        }
      },
      // 2. RAG Search
      { event: 'node_started', data: { title: '社内ナレッジ検索', node_type: 'knowledge-retrieval', inputs: { query: '売上 分析 レポート' } } },
      { event: 'node_finished', data: { title: '社内ナレッジ検索', outputs: { result: '[Doc chunks...]' } } },
      // 3. Artifact Generator LLM
      { event: 'node_started', data: { title: 'LLM_Artifact_Generator', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'LLM_Artifact_Generator', node_type: 'llm' } },
      // 4. Code_HTML_Sanitizer (v2.0 新規ノード)
      { event: 'node_started', data: { title: 'Code_HTML_Sanitizer', node_type: 'code' } },
      { event: 'node_finished', data: { title: 'Code_HTML_Sanitizer', node_type: 'code' } },
      // 5. メッセージ出力
      {
        event: 'message',
        answer: JSON.stringify({
          artifact_title: '2025年度 Q4 売上分析レポート',
          artifact_type: 'html_document',
          artifact_content: `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>2025年度 Q4 売上分析レポート</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>
<style>
:root {
  /* 印刷物基準のフォント定義 */
  --font-body: 'Hiragino Mincho ProN', 'Yu Mincho', 'MS Mincho', serif;
  --font-heading: 'Hiragino Sans', 'Yu Gothic Medium', 'Meiryo', sans-serif;
  --font-mono: 'Courier New', 'Osaka-Mono', monospace;
  
  /* 印刷基準のサイズ設定 */
  --text-base: 10.5pt;
  --text-sm:   9pt;
  --text-h1:   22pt;
  --text-h2:   16pt;
  --text-h3:   12pt;
  --leading-body:    1.9;
  --leading-heading: 1.3;

  /* theme-modern カラーパレット */
  --primary: #1e5f8e;
  --primary-light: #dce4eb;
  --accent: #e67e22;
  --text: #333333;
  --text-sub: #777777;
  --bg: #ffffff;
  --bg-section: #f0f4f8;
  --border: #cccccc;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-body);
  color: var(--text);
  background: var(--bg);
  padding: 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
h1, h2, h3, th, .kpi-value, .kpi-change, .cover-page h1, .subtitle, .meta {
  font-family: var(--font-heading);
}
.page {
  max-width: 900px;
  margin: 0 auto;
  padding: 48px 40px;
  margin-bottom: 60px;
}
.cover-page {
  text-align: center;
  padding: 120px 40px;
  background: linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%);
  color: white;
  border-radius: 0;
}
.cover-page h1 {
  font-size: var(--text-h1);
  font-weight: 800;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
  line-height: var(--leading-heading);
}
.cover-page .subtitle {
  font-size: var(--text-h2);
  opacity: 0.85;
  margin-bottom: 40px;
}
.cover-page .meta {
  font-size: var(--text-sm);
  opacity: 0.7;
}
.content-page { background: var(--bg); }
h2 {
  font-size: var(--text-h2);
  font-weight: 700;
  color: var(--primary);
  margin: 32px 0 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--primary);
  line-height: var(--leading-heading);
  break-before: avoid; 
  break-after: avoid;
}
h3 {
  font-size: var(--text-h3);
  font-weight: 600;
  color: var(--primary);
  margin: 24px 0 12px;
  line-height: var(--leading-heading);
  break-before: avoid; 
  break-after: avoid;
}
p { margin-bottom: 16px; color: var(--text); }
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin: 24px 0;
}
.kpi-card {
  padding: 24px;
  background: var(--bg-section);
  border: 1px solid var(--border);
  border-radius: 12px;
  text-align: center;
}
.kpi-value {
  font-size: 32px;
  font-weight: 800;
  color: var(--primary);
  margin-bottom: 4px;
}
.kpi-label {
  font-size: 13px;
  color: var(--text-sub);
  font-weight: 500;
}
.kpi-change {
  font-size: 12px;
  margin-top: 4px;
  font-weight: 600;
}
.kpi-change.up { color: #16a34a; }
.kpi-change.down { color: #dc2626; }
table {
  width: 100%;
  border-collapse: collapse;
  margin: 24px 0;
}
th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}
th {
  background: var(--bg-section);
  font-weight: 600;
  color: var(--text-sub);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.chart-container {
  position: relative;
  width: 100%;
  max-width: 700px;
  margin: 32px auto;
  padding: 24px;
  background: var(--bg-section);
  border-radius: 12px;
  border: 1px solid var(--border);
}
.highlight-box {
  background: var(--primary-light);
  border-left: 4px solid var(--primary);
  padding: 16px 20px;
  margin: 24px 0;
  border-radius: 0 8px 8px 0;
  font-size: 14px;
}
</style>
</head>
<body>
<section class="page cover-page" style="page-break-after: always; padding: 20mm 18mm;">
  <h1>2025年度 Q4 売上分析レポート</h1>
  <div class="subtitle">第4四半期 業績サマリーと今後の展望</div>
  <div class="meta">作成日: 2026年3月22日 ｜ 作成者: 経営企画部</div>
</section>

<section class="page content-page" style="padding: 20mm 18mm;">
  <h2>エグゼクティブサマリー</h2>
  <p>2025年度第4四半期は、前年同期比で売上高が<strong>15.3%増</strong>と堅調に推移しました。特にSaaS事業の成長が全体を牽引し、ARRは初めて100億円を突破しました。</p>
  
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-value">¥42.8億</div>
      <div class="kpi-label">売上高</div>
      <div class="kpi-change up">▲ 15.3% YoY</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">¥12.1億</div>
      <div class="kpi-label">営業利益</div>
      <div class="kpi-change up">▲ 22.7% YoY</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">28.3%</div>
      <div class="kpi-label">営業利益率</div>
      <div class="kpi-change up">▲ 1.7pt</div>
    </div>
  </div>

  <div class="highlight-box">
    <strong>📌 重要ポイント:</strong> SaaS ARRが100億円を突破。解約率は1.2%と業界平均（3.5%）を大幅に下回っています。
  </div>

  <h2>四半期別売上推移</h2>
  <div class="chart-container">
    <canvas id="chart-quarterly"></canvas>
  </div>

  <h2>事業セグメント別実績</h2>
  <table>
    <thead>
      <tr><th>セグメント</th><th>売上高</th><th>前年比</th><th>構成比</th></tr>
    </thead>
    <tbody>
      <tr><td>SaaS事業</td><td>¥25.2億</td><td>+28.4%</td><td>58.9%</td></tr>
      <tr><td>コンサルティング</td><td>¥10.8億</td><td>+5.2%</td><td>25.2%</td></tr>
      <tr><td>ライセンス販売</td><td>¥4.5億</td><td>-3.1%</td><td>10.5%</td></tr>
      <tr><td>その他</td><td>¥2.3億</td><td>+12.0%</td><td>5.4%</td></tr>
    </tbody>
  </table>

  <h2>今後の展望と提言</h2>
  <h3>成長ドライバー</h3>
  <p>AI機能の強化により、SaaS事業のARPU向上が見込まれます。2026年度は海外展開を本格化し、アジア太平洋地域での売上拡大を推進します。</p>
  
  <h3>リスク要因</h3>
  <p>為替変動リスクおよび競合の価格競争激化に留意が必要です。継続的な製品差別化への投資を推奨します。</p>
</section>

<script>
document.addEventListener('DOMContentLoaded', function() {
  new Chart(document.getElementById('chart-quarterly'), {
    type: 'bar',
    data: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [{
        label: '2024年度',
        data: [32.5, 34.8, 35.2, 37.1],
        backgroundColor: 'rgba(30, 95, 142, 0.2)',
        borderColor: 'rgba(30, 95, 142, 0.6)',
        borderWidth: 1.5,
        borderRadius: 4
      }, {
        label: '2025年度',
        data: [36.1, 38.5, 40.2, 42.8],
        backgroundColor: 'rgba(30, 95, 142, 0.7)',
        borderColor: 'rgba(30, 95, 142, 1)',
        borderWidth: 1.5,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: '四半期別売上高（億円）', font: { size: 14, weight: '600' } }
      },
      scales: {
        y: { beginAtZero: false, min: 25, ticks: { callback: v => '¥' + v + '億' } }
      }
    }
  });
  // postMessage で親フレームに高さ通知
  window.parent.postMessage({ type: 'artifact-resize', height: document.documentElement.scrollHeight }, '*');
});
<\/script>
</body>
</html>`,
          answer: '2025年度Q4の売上分析レポートを作成しました！📄 Chart.jsグラフを含むリッチなHTMLドキュメントです。右側のパネルでご確認ください。',
          citations: [
            { id: 'cite_1', type: 'rag', source: '2025年度_四半期業績報告.xlsx', url: null },
            { id: 'cite_2', type: 'rag', source: '経営企画_KPIダッシュボード.pdf', url: null }
          ]
        })
      },
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 2100, completion_tokens: 3200, total_tokens: 5300 } } }
    ]
  },

  // =================================================================
  // Pattern 14: HTML Business Document (モノクロ・フォーマル文書)
  // =================================================================
  'html_business_document': {
    efficient: [],
    partner: [
      { event: 'node_started', data: { title: 'LLM_Intent_Analysis', node_type: 'llm' } },
      {
        event: 'node_finished', data: {
          title: 'LLM_Intent_Analysis',
          outputs: {
            text: '```json\n' + JSON.stringify({
              thinking: "公式な案内状の形式での出力をリクエストされています。Artifact v2.0仕様に基づき、日本のビジネスマナーに則ったフォーマルなモノクロ文書を生成します 📄",
              category: "ARTIFACT",
              requires_rag: true,
              requires_web: false,
              resultLabel: "判定: 📄 HTML Artifactモード → フォーマル文書を生成します"
            }, null, 2) + '\n```'
          }
        }
      },
      { event: 'node_started', data: { title: 'LLM_Artifact_Generator', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'LLM_Artifact_Generator', node_type: 'llm' } },
      { event: 'node_started', data: { title: 'Code_HTML_Sanitizer', node_type: 'code' } },
      { event: 'node_finished', data: { title: 'Code_HTML_Sanitizer', node_type: 'code' } },
      {
        event: 'message',
        answer: JSON.stringify({
          artifact_title: 'ITインフラ基盤刷新に関するご提案書',
          artifact_type: 'html_document',
          artifact_content: `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>ITインフラ基盤刷新に関するご提案書</title>
<!-- [検証用] 許可されていない非CDN外部スクリプト -->
<script src="https://example.com/malicious.js"></script>
<!-- [検証用] fetchによる外部通信 -->
<script>
  fetch("https://example.com/api");
</script>
<!-- [検証用] localStorageの利用 -->
<script>
  localStorage.setItem("test", "data");
  sessionStorage.setItem("test", "data");
  let xhr = new XMLHttpRequest();
</script>
<style>
:root {
  --font-body: 'Hiragino Mincho ProN', 'Yu Mincho', 'MS Mincho', serif;
  --font-heading: 'Hiragino Sans', 'Yu Gothic Medium', 'Meiryo', sans-serif;
  --text-base: 11pt;
  --leading-body: 1.6;
  --page-width: 210mm;
  --page-height: 297mm;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
@page {
  size: A4;
  margin: 0;
}
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: transparent;
}
body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-body);
  letter-spacing: 0.02em;
  color: #000;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
}
.page {
  width: var(--page-width);
  min-height: var(--page-height);
  margin: 0 auto;
  padding: 25mm 25mm;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  position: relative;
  page-break-after: always;
  display: flex;
  flex-direction: column;
}
@media print {
  body { background: none; display: block; }
  .page {
    margin: 0;
    box-shadow: none;
    height: 296.8mm; /* 297mmだとブラウザにより2枚目に溢れる可能性があるため微調整 */
    width: 210mm;
  }
}
.page-footer {
  position: absolute;
  bottom: 10mm;
  left: 0;
  width: 100%;
  text-align: center;
  font-size: 9pt;
  color: #666;
}
.cover-page {
  justify-content: space-between;
  padding: 40mm 25mm 50mm; /* パディングを控えめにし、中央はjustifyで埋める */
}
.cover-title-group { text-align: center; width: 100%; }
.cover-subtitle { font-size: 1.4em; margin-bottom: 5mm; letter-spacing: 0.2em; }
.cover-title { font-size: 2.4em; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 5mm 0; font-weight: normal; }
.cover-meta { width: 100%; text-align: right; }
.cover-client { text-align: left; width: 100%; font-size: 1.2em; }
.date { text-align: right; margin-bottom: 5mm; }
.recipient { margin-bottom: 8mm; font-size: 1.1em; }
.sender { text-align: right; margin-bottom: 12mm; }
h2.section-title {
  font-size: 1.4em;
  font-weight: normal;
  border-bottom: 1px solid #000;
  margin-bottom: 6mm;
  padding-bottom: 2mm;
}
.salutation { margin-bottom: 4mm; }
.main-text {
  text-indent: 1em;
  margin-bottom: 4mm;
  text-align: justify;
}
.complimentary-close { text-align: right; margin-bottom: 12mm; }
.item-list { margin-left: 1.5em; margin-bottom: 8mm; }
.item-list li { margin-bottom: 3mm; }
.budget-table {
  width: 100%;
  border-collapse: collapse;
  margin: 6mm 0;
}
.budget-table th, .budget-table td {
  border: 1px solid #000;
  padding: 3mm;
  text-align: left;
}
.budget-table th { background: #eee; font-weight: normal; }
.end-marker { text-align: right; font-weight: bold; margin-top: 10mm; }
</style>
</head>
<body>
  <div class="page cover-page" style="page-break-after: always;">
    <div class="cover-client">株式会社フューチャー・システムズ<br>代表取締役社長　佐藤　健一　様</div>
    <div class="cover-title-group">
      <div class="cover-subtitle">次世代IT基盤構築に向けた</div>
      <h1 class="cover-title">ITインフラ基盤刷新に関するご提案書</h1>
    </div>
    <div class="cover-meta">
      提出日：2026年 3月 23日<br><br>
      日商インテリジェント株式会社<br>
      執行役員　営業統括本部長<br>
      小坂　卓也
    </div>
    <div class="page-footer">1 / 4</div>
  </div>
  <div class="page" style="page-break-after: always;">
    <div class="date">2026年 3月 23日</div>
    <div class="recipient">株式会社フューチャー・システムズ　御中</div>
    <div class="sender">
      日商インテリジェント株式会社<br>
      小坂　卓也
    </div>
    <h2 class="section-title">1. はじめに</h2>
    <div class="salutation">謹啓　春陽の候、貴社におかれましては益々ご清栄のこととお慶び申し上げます。</div>
    <div class="main-text">
      平素は格別のご高配を賜り、厚く御礼申し上げます。さて、この度、貴社の更なる成長を支える強固な事業基盤の構築に向け、「次世代ITインフラ基盤の刷新」についてご提案させていただきます。
    </div>
    <div class="main-text">
      本提案は、貴社の将来的な事業拡大とセキュリティリスクへの対応を両立させることを目的としております。何卒ご高覧賜りますよう宜しくお願い申し上げます。
    </div>
    <div class="complimentary-close">敬白</div>
    <h2 class="section-title">2. 現状の課題と刷新の必要性</h2>
    <div class="main-text">
      現在の貴社IT基盤において、以下の課題が挙げられます。
    </div>
    <ul class="item-list">
      <li><strong>ハードウェアの老朽化：</strong> 導入から7年が経過したオンプレミスサーバーの保守期限が迫り、故障リスクが高まっています。</li>
      <li><strong>運用コストの高止まり：</strong> 物理インフラの維持管理にリソースが費やされ、戦略的投資へのリソースが不足しています。</li>
      <li><strong>セキュリティ要件の変化：</strong> リモートワークの常態化に伴い、従来型の境界防御では対応できないリスクが増大しています。</li>
    </ul>
    <div class="page-footer">2 / 4</div>
  </div>
  <div class="page" style="page-break-after: always;">
    <h2 class="section-title">3. 刷新後の全体構成案</h2>
    <div class="main-text">
      本提案では、「クラウドネイティブかつセキュアな基盤への移行」を核としております。
    </div>
    <h3 style="margin-bottom: 4mm; font-weight: normal;">(1) クラウド基盤への移行</h3>
    <div class="main-text" style="margin-bottom: 8mm;">
      物理サーバーを廃止し、スケーラビリティに優れたクラウド基盤へ移行します。これにより、ハードウェア更新の負担を解消し、柔軟なリソース調整を可能にします。
    </div>
    <h3 style="margin-bottom: 4mm; font-weight: normal;">(2) ゼロトラスト・セキュリティの実装</h3>
    <div class="main-text" style="margin-bottom: 8mm;">
      信頼されないネットワークを前提としたアーキテクチャを導入します。ID管理とエンドポイント防御を高度に連携させ、安全な業務環境を実現します。
    </div>
    <h2 class="section-title">4. 期待される効果</h2>
    <ul class="item-list">
      <li><strong>TCOの約30%削減：</strong> 物理資産の保有に伴う管理費、電力費、設置スペース費を削減。</li>
      <li><strong>システムの可用性向上：</strong> クラウドの冗長化機能を活用し、高い稼働率を確保。</li>
      <li><strong>人的リソースの転換：</strong> 定型運用業務の自動化により、IT部門を攻めの組織へと変革。</li>
    </ul>
    <div class="page-footer">3 / 4</div>
  </div>
  <div class="page">
    <h2 class="section-title">5. 導入スケジュール（案）</h2>
    <ul class="item-list">
      <li><strong>Phase 1: 環境分析・設計 (1〜2ヶ月目)</strong></li>
      <li><strong>Phase 2: 構築・検証 (3〜4ヶ月目)</strong></li>
      <li><strong>Phase 3: 本番移行・安定稼働 (5〜6ヶ月目)</strong></li>
    </ul>
    <h2 class="section-title">6. 概算費用</h2>
    <table class="budget-table">
      <tr><th>項目</th><th>概算費用（税抜）</th><th>備考</th></tr>
      <tr><td>初期構築・移行費</td><td>¥ 15,000,000</td><td>一式</td></tr>
      <tr><td>ライセンス初期費用</td><td>¥ 3,500,000</td><td>初期契約分</td></tr>
      <tr><td>月額ランニング費用</td><td>¥ 850,000 / 月</td><td>クラウド利用料等</td></tr>
    </table>
    <div class="main-text" style="margin-top: 10mm;">
      以上、貴社の未来を拓くパートナーとして、全力を尽くす所存でございます。
    </div>
    <div class="end-marker">以上</div>
    <div class="page-footer">4 / 4</div>
  </div>
  <script>
    window.parent.postMessage({ type: 'artifact-resize', height: document.documentElement.scrollHeight }, '*');
  </script>
</body>
</html>`,
          answer: 'ITインフラ基盤刷新に関するご提案書を複数ページ構成（全4ページ）のフォーマルな形式で作成しました。📄\\n\\n- 1ページ目: 表紙\\n- 2ページ目: 現状分析・背景\\n- 3ページ目: 提案の全体像・期待効果\\n- 4ページ目: スケジュール・概算予算\\n\\nWordのようにページが分かれた本格的なドキュメント構成となっています。右側のパネルで、スクロールして内容をご確認いただけます。',
          citations: []
        })
      },
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 1500, completion_tokens: 4500, total_tokens: 6000 } } }
    ]
  },

  // =================================================================
  // Pattern 15: HTML Statistical Report (統計報告書 - 複数ページ/グラフ/表)
  // =================================================================
  'html_statistical_report': {
    efficient: [],
    partner: [
      { event: 'node_started', data: { title: 'LLM_Intent_Analysis', node_type: 'llm' } },
      {
        event: 'node_finished', data: {
          title: 'LLM_Intent_Analysis',
          outputs: {
            text: '```json\n' + JSON.stringify({
              thinking: "統計データと比較分析を含む高度なレポート作成を承りました。HTML Artifact v1.2仕様に基づき、Chart.jsを使用した可視化とフォーマルなビジネス文書形式で生成します 📈",
              category: "ARTIFACT",
              requires_rag: true,
              requires_web: false,
              resultLabel: "判定: 📋 HTML統計レポート → 高度な可視化を含む文書を生成します"
            }, null, 2) + '\n```'
          }
        }
      },
      { event: 'node_started', data: { title: 'LLM_Artifact_Generator', node_type: 'llm' } },
      { event: 'node_finished', data: { title: 'LLM_Artifact_Generator', node_type: 'llm' } },
      { event: 'node_started', data: { title: 'Code_HTML_Sanitizer', node_type: 'code' } },
      { event: 'node_finished', data: { title: 'Code_HTML_Sanitizer', node_type: 'code' } },
      {
        event: 'message',
        answer: JSON.stringify({
          artifact_title: '2026年度 市場動向比較および統計分析報告書',
          artifact_type: 'html_document',
          artifact_content: `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>2026年度 市場動向比較および統計分析報告書</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>
    <script>
        // --- 修正: ポーリングによる初期化 (Guide 7.1, 8.2 準拠) ---
        function initChartWhenReady() {
            try {
                const configs = [
                    {
                        id: 'marketChart',
                        type: 'line',
                        data: {
                            labels: ['2023', '2024', '2025', '2026', '2027(予)', '2028(予)'],
                            datasets: [{ label: '市場規模 (十億円)', data: [380, 410, 445, 480, 520, 570], borderColor: '#1c4587', backgroundColor: 'rgba(28, 69, 135, 0.08)', fill: true, tension: 0.3 }]
                        },
                        options: {
                            locale: 'ja-JP',
                            responsive: true, maintainAspectRatio: false,
                            layout: { padding: { right: 30, left: 15, top: 10, bottom: 10 } },
                            plugins: { legend: { display: false }, title: { display: true, text: '国内市場規模の推移', font: { size: 13 } } },
                            scales: { y: { suggestedMin: 350, suggestedMax: 600 } }
                        }
                    },
                    {
                        id: 'sectorChart',
                        type: 'bar',
                        data: {
                            labels: ['製造', '金融', '小売', '公共'],
                            datasets: [
                                { label: '既存事業', data: [120, 90, 150, 80], backgroundColor: '#1c4587' },
                                { label: '新規DX', data: [60, 110, 40, 70], backgroundColor: '#8b0000' }
                            ]
                        },
                        options: {
                            responsive: true, maintainAspectRatio: false,
                            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } }, title: { display: true, text: 'セクター別需要内訳', font: { size: 13 } } },
                            scales: { x: { stacked: true }, y: { stacked: true } }
                        }
                    },
                    {
                        id: 'shareChart',
                        type: 'pie',
                        data: {
                            labels: ['Flag414', '競合A', '競合B', 'その他'],
                            datasets: [{ data: [28, 22, 18, 32], backgroundColor: ['#1c4587', '#8b0000', '#94a3b8', '#e2e8f0'] }]
                        },
                        options: {
                            responsive: true, maintainAspectRatio: false,
                            plugins: { legend: { position: 'right', labels: { boxWidth: 12 } }, title: { display: true, text: '市場占有率構成', font: { size: 13 } } }
                        }
                    },
                    {
                        id: 'performanceChart',
                        type: 'radar',
                        data: {
                            labels: ['コスト', '品質', '速度', 'サポート', '拡張性'],
                            datasets: [
                                { label: 'Flag414', data: [90, 95, 85, 95, 90], borderColor: '#1c4587', backgroundColor: 'rgba(28, 69, 135, 0.15)' },
                                { label: '業界平均', data: [75, 80, 70, 75, 80], borderColor: '#94a3b8', backgroundColor: 'rgba(148, 163, 184, 0.15)' }
                            ]
                        },
                        options: {
                            responsive: true, maintainAspectRatio: false,
                            plugins: { legend: { position: 'bottom' }, title: { display: true, text: '5軸レーダー比較分析', font: { size: 13 } } },
                            scales: { r: { suggestedMin: 0, suggestedMax: 100 } }
                        }
                    }
                ];

                if (typeof Chart === 'undefined') {
                    requestAnimationFrame(initChartWhenReady);
                    return;
                }

                let allInitialized = true;
                configs.forEach(config => {
                    const canvas = document.getElementById(config.id);
                    if (canvas) {
                        if (!window['chart_' + config.id]) {
                            window['chart_' + config.id] = new Chart(canvas.getContext('2d'), config);
                        }
                    } else {
                        allInitialized = false;
                    }
                });

                if (allInitialized) {
                    window.__chartInitFinished = true;
                } else {
                    requestAnimationFrame(initChartWhenReady);
                }
            } catch (e) {
                console.error("Init Error:", e);
                requestAnimationFrame(initChartWhenReady);
            }
        }
        initChartWhenReady();

        // --- リサイズ通知 (Guide 1.0 準拠) ---
        function notifyResize() {
            if (document.documentElement && document.documentElement.scrollHeight > 0) {
                window.parent.postMessage({ type: 'artifact-resize', height: document.documentElement.scrollHeight }, '*');
            }
        }

        // 継続的な通知(requestAnimationFrame)を廃止し、ResizeObserverで効率化
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => notifyResize());
            ro.observe(document.body);
        } else {
            notifyResize();
            setTimeout(notifyResize, 500);
        }
    </script>
    <style>
        /* --- 1. 基本変数の定義 (Guide 3.1, 4.3 準拠) --- */
        :root {
            /* ページ設定 */
            --page-width: 210mm;
            --page-height: 297mm;
            
            /* タイポグラフィ */
            --font-body:    "Hiragino Mincho ProN", "Yu Mincho", serif;
            --font-heading: "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
            --text-base: 10.5pt;
            --text-sm:   9pt;
            --text-h1:   24pt;
            --text-h2:   16pt;
            --text-h3:   12pt;

            /* カラーパレット (theme-color 準拠) */
            --color-primary:    #1a3a6e;
            --color-accent:     #c0392b;
            --color-heading:    #000;
            --color-body:       #000;
            --color-muted:      #000;
            --color-border:     #b0b8c1;
            --color-rule:       #1a3a6e;
            --color-bg-accent:  #eef2f7;
            --color-bg-cover:   #1a3a6e;
        }

        /* --- 2. リセット & ページ構造 (Guide 3.1 準拠) --- */
        @page { size: A4; margin: 0; }
        html, body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
        body { display: flex; flex-direction: column; align-items: center; }

        .page {
            width: var(--page-width);
            min-height: var(--page-height);
            margin: 0 auto;
            padding: 30mm 25mm;
            background: #fff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            box-sizing: border-box;
            position: relative;
            display: flex;
            flex-direction: column;
            font-family: var(--font-body);
            font-size: var(--text-base);
            color: var(--color-body);
            line-height: 1.7;
        }

        @media print {
            body { background: none; display: block; }
            .page { margin: 0; box-shadow: none; width: 210mm; height: 296.8mm; }
        }

        /* --- 3. コンポーネントスタイル --- */
        h1, h2, h3 { font-family: var(--font-heading); color: var(--color-heading); }
        h2 { font-size: var(--text-h2); border-bottom: 2px solid var(--color-rule); padding-bottom: 2pt; margin-bottom: 10pt; margin-top: 16pt; }
        h3 { font-size: var(--text-h3); margin-top: 12pt; margin-bottom: 6pt; }
        
        table { border-collapse: collapse; width: 100%; margin: 15pt 0; }
        th, td { border: 1px solid var(--color-border); padding: 8pt 10pt; font-size: 10pt; }
        th { background: var(--color-bg-accent); font-family: var(--font-heading); color: var(--color-primary); text-align: left; }
        
        .chart-container { width: 100%; height: 160pt; margin: 8pt auto 2pt auto; padding: 10pt; background: transparent; border: none; box-sizing: border-box; }
        .caption { text-align: center; font-size: 8.5pt; color: #000; margin-bottom: 15pt; font-family: var(--font-body); font-weight: normal; }
        
        /* Flex Layout Utilities */
        .flex-row { display: flex; gap: 20pt; align-items: flex-start; margin-bottom: 20pt; }
        .flex-item { flex: 1; min-width: 0; }
        
        /* KPI Cards */
        .kpi-row { display: flex; gap: 15pt; margin: 15pt 0; justify-content: center; }
        .kpi-card { flex: 1; padding: 12pt; background: var(--color-bg-accent); border-left: 4px solid var(--color-primary); border-radius: 4px; text-align: center; }
        .kpi-val { font-size: 20pt; font-weight: bold; color: var(--color-primary); display: block; }
        .kpi-label { font-size: 8.5pt; color: var(--color-muted); }
        .kpi-trend { font-size: 9pt; font-weight: bold; margin-left: 4pt; }
        .trend-up { color: var(--color-accent); }
        
        /* Badges */
        .badge { display: inline-block; padding: 2pt 6pt; border-radius: 10pt; font-size: 8pt; font-weight: bold; }
        .badge-success { background: #d1fae5; color: #065f46; } /* エメラルド・ミント (完了) */
        .badge-warning { background: #fef3c7; color: #92400e; } /* アンバー (保留) */
        .badge-primary { background: #dbeafe; color: #1e3a8a; } /* ブルー・インディゴ (進行中) */
        
        /* 表紙 (Guide 5.3 準拠) */
        .cover { background: var(--color-bg-cover); color: #fff; justify-content: space-between; padding: 30mm 25mm; }
        .cover-header { border-bottom: 1px solid rgba(255,255,255,0.4); padding-bottom: 10mm; }
        .cover-org { font-family: var(--font-heading); letter-spacing: 0.1em; opacity: 0.9; }
        .cover-title-block { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .cover-title { font-size: 32pt; font-family: var(--font-heading); color: #fff; line-height: 1.3; margin-bottom: 10pt; border: none; }
        .cover-subtitle { font-size: 14pt; opacity: 0.8; }
        .cover-footer-block { border-top: 1px solid rgba(255,255,255,0.4); padding-top: 10mm; }
        .cover-meta-table { width: 100%; }
        .cover-meta-table td { border: none; padding: 4pt 0; color: #fff; font-size: 10pt; }
        .cover-meta-table th { background: transparent; color: rgba(255,255,255,0.6); border: none; padding: 4pt 0; width: 80pt; font-size: 9pt; }

        .footer { position: absolute; bottom: 10mm; left: 0; width: 100%; text-align: center; font-size: var(--text-sm); color: var(--color-muted); }
    </style>
</head>
<body>
    <!-- PAGE 1: COVER -->
    <div class="page cover" style="page-break-after: always;">
        <div class="cover-header">
            <span class="cover-org">戦略分析部 / 市場動向調査チーム</span>
        </div>
        <div class="cover-title-block">
            <h1 class="cover-title">2026年度<br>市場動向比較および<br>統計分析報告書</h1>
            <p class="cover-subtitle">主要な業界指標の推移と競合他社の市場シェア分析</p>
        </div>
        <div class="cover-footer-block">
            <table class="cover-meta-table">
                <tr><th>提出先</th><td>経営会議 メンバー各位</td></tr>
                <tr><th>作成者</th><td>戦略分析部シニアアナリスト 佐藤 健太</td></tr>
                <tr><th>作成日</th><td>2026年3月24日</td></tr>
                <tr><th>機密区分</th><td>社外秘 (CONFIDENTIAL)</td></tr>
            </table>
        </div>
        <div class="footer">1 / 6</div>
    </div>

    <!-- PAGE 2: MARKET TREND -->
    <div class="page" style="page-break-after: always;">
        <h2>1. 市場規模の推移と予測</h2>
        <p>過去3年間における国内市場規模の推移を分析した結果（図1参照）、年平均成長率（CAGR）は4.2%を維持しています。特にデジタル化の加速に伴う需要増が顕著であり、2030年にかけて堅調な推移を見込んでいます。この背景には、既存インフラの老朽化に伴う刷新需要だけでなく、生成AIの急速な普及によるデータセンター投資の拡大が大きく寄与しています。</p>
        
        <p style="margin-top: 10pt;">2024年度の伸び率は、当初の予測を0.5ポイント上回るペースで推移しており、これは特にエンタープライズ領域における「クラウドネイティブ移行」が本格化したことが要因として挙げられます。将来予測においては、2027年以降に量子コンピューティングの商用化に向けた先行投資が開始されることで、さらに成長が加速するシナリオを描いています。</p>
        
        <div class="chart-container" style="height: 200pt; margin-top: 20pt;">
            <canvas id="marketChart"></canvas>
        </div>
        <div class="caption">図1：国内市場規模の推移（2023年〜2028年）</div>
        
        <div style="margin-top: 20pt;">
            <h3>1.1 市場成長の背景と外部要因</h3>
            <p>主要な成長要因として、クラウドシフトによるインフラ投資の増大に加え、特定業種におけるAI活用ニーズの顕在化が挙げられます。これにより、従来のハードウェア依存からサービス依存への構造的転換が進行しています。また、エネルギー効率への関心の高まり（Green IT）も、システムの高能率化に向けたリプレース需要を後押ししています。法規制の面でも、データ保護法案の強化に伴うセキュリティ基盤の再構築が不可欠となっており、全方位的に投資を促す環境が整っています。</p>
        </div>

        <div class="footer">2 / 6</div>
    </div>

    <!-- PAGE 3: SECTOR ANALYSIS -->
    <div class="page" style="page-break-after: always;">
        <h2>2. セクター別需要の詳細分析</h2>
        <p>需要構造の細部を報告します。製造業および金融業が依然として市場を牽引しており、特にDX投資が顕著です（図2参照）。2024Q1の実績では、製造業が全体の35%を占め、次いで金融業が28%と、トップ2セクターで過半数を維持しています。この傾向は、次期四半期も継続すると予測されます。</p>

        <div class="chart-container" style="height: 200pt; margin-top: 20pt;">
            <canvas id="sectorChart"></canvas>
        </div>
        <div class="caption">図2：主要セクター別需要構成</div>

        <div style="margin-top: 20pt;">
            <h3>2.1 各セクターの個別動向と投資傾向</h3>
            <p><strong>製造業:</strong> スマートファクトリー化に伴うエッジコンピューティング需要が高まっており、特に「AI画像診断による品質管理」への投資が予算全体の20%を占めています。これにより生産効率の飛躍的な向上が期待されています。</p>
            <p><strong>金融業:</strong> レガシーシステムのマイグレーションが佳境を迎えており、クラウドベースの基幹系システムへの移行が加速しています。ゼロトラスト・アーキテクチャの導入率は前年比で40%増加しました。</p>
            <p><strong>小売・その他:</strong> オムニチャネル推進に伴う顧客データ基盤(CDP)の構築が主流となっています。リアル店舗とECを融合させた体験向上のため、バックエンドの高度化が急務となっています。</p>
        </div>

        <div class="footer">3 / 6</div>
    </div>

    <!-- PAGE 4: MARKET SHARE & KPI -->
    <div class="page" style="page-break-after: always;">
        <h2>3. 市場占有率と主要経営指標</h2>
        <p>現在のマーケットポジションと健全性を報告します（図3参照）。</p>

        <div class="chart-container" style="height: 180pt; width: 85%; margin: 20pt auto;">
            <canvas id="shareChart"></canvas>
        </div>
        <div class="caption">図3：市場占有率の構成比</div>

        <div class="kpi-row" style="margin-top: 40pt;">
            <div class="kpi-card">
                <span class="kpi-label">営業利益率</span>
                <span class="kpi-val">12.4% <span class="kpi-trend trend-up">▲ 2.1%</span></span>
            </div>
            <div class="kpi-card">
                <span class="kpi-label">顧客維持率</span>
                <span class="kpi-val">94.8% <span class="kpi-trend trend-up">▲ 0.5%</span></span>
            </div>
            <div class="kpi-card">
                <span class="kpi-label">R&D投資比率</span>
                <span class="kpi-val">5.2% <span class="kpi-trend">─ 0.0%</span></span>
            </div>
        </div>

        <div class="footer">4 / 6</div>
    </div>

    <!-- PAGE 5: PERFORMANCE RADAR -->
    <div class="page" style="page-break-after: always;">
        <h2>4. 競合他社との多次元性能比較</h2>
        <p>自社（Flag414）と業界平均の性能比較を多角的に分析します。特にサポート体制と品質管理において高い評価を得ています（図4参照）。</p>

        <div class="chart-container" style="height: 250pt; margin-top: 30pt; padding: 30pt;">
            <canvas id="performanceChart"></canvas>
        </div>
        <div class="caption">図4：業界平均との多次元性能比較（5軸評価）</div>

        <div style="margin-top: 20pt;">
            <p>5つの評価軸（コスト、品質、速度、サポート、拡張性）において、自社は「品質」と「サポート」で圧倒的優位性を確立しています。業界最高水準の満足度を実現している要因は、24時間体制の専門サポートと、独自の品質検証フローにあります。一方で「コスト」面での評価は平均を下回っており、提供価値のプレミアム性を訴求するとともに、内部プロセスの効率化によるコストパフォーマンス向上が今後の課題となります。</p>
            <p style="margin-top: 10pt;">また、「拡張性」については、次世代API基盤の導入により競合との差別化をさらに深める計画です。これにより、マルチクラウド環境下での運用柔軟性を求める上位顧客層の獲得を確実にします。各評価軸の改善により、トータルバランスに優れた業界リーダーとしての地位を盤石にします。</p>
        </div>

        <div class="footer">5 / 6</div>
    </div>

    <!-- PAGE 6: BENCHMARK & SUMMARY -->
    <div class="page">
        <h2>5. 指標詳細および戦略的提言</h2>
        <p>最後に、具体的な製品満足度ランキングと改善施策の進捗状況を提示し、今後の総括をまとめます。</p>

        <div style="margin-top: 20pt;">
            <h3>5.1 顧客満足度および施策進捗</h3>
            <div class="flex-row">
                <div class="flex-item">
                    <table>
                        <thead><tr><th>順位</th><th>製品名</th><th>スコア</th></tr></thead>
                        <tbody>
                            <tr><td>🥇 1</td><td>Flag Plus</td><td>4.9</td></tr>
                            <tr><td>🥈 2</td><td>A-Series</td><td>4.3</td></tr>
                            <tr><td>🥉 3</td><td>C-Cloud</td><td>4.1</td></tr>
                        </tbody>
                    </table>
                    <div class="caption">表1：満足度ランキング</div>
                </div>
                <div class="flex-item">
                    <table>
                        <thead><tr><th>プロジェクト</th><th>ステータス</th></tr></thead>
                        <tbody>
                            <tr><td>UI/UX全面刷新</td><td><span class="badge badge-success">完了</span></td></tr>
                            <tr><td>API基盤強化</td><td><span class="badge badge-primary">進行中</span></td></tr>
                            <tr><td>海外拠点連携</td><td><span class="badge badge-warning">保留</span></td></tr>
                        </tbody>
                    </table>
                    <div class="caption">表2：改善施策の遂行状況</div>
                </div>
            </div>
        </div>

        <div style="margin-top: 30pt;">
            <h3>5.2 長期戦略に向けた包括的提言</h3>
            <p><strong>【短期（〜6ヶ月）】:</strong> 進行中の「API基盤強化」プロジェクトを第2四半期中に完遂することが最優先事項です。これに伴い、導入スピードを現行の2.5ヶ月から2.0ヶ月以下に短縮するオペレーションの自動化を推進します。</p>
            <p><strong>【中期（〜2年）】:</strong> セクターB（小売）における価格競争の激化に備え、標準化パッケージの拡充と、AIによる自動運用保守サービスを用いた「ランニングコストの低減」を実現し、顧客あたりの生涯価値(LTV)を最大化します。</p>
            <p><strong>【長期（3年〜）】:</strong> 国内市場の飽和を見据え、海外拠点の基盤連携を強化。グローバル規模でのデータ活用プラットフォームを構築し、地域に依存しない収益モデルを確立します。併せて、先端技術研究への継続投資により次世代の市場ルールを先導します。</p>
        </div>

        <div class="footer">6 / 6</div>
    </div>

    <script>
        // 印刷プレビューおよび全読み込み時用の即時トリガー
        if (typeof initChartWhenReady === 'function') initChartWhenReady();
    </script>
</body>
</html>`,
          answer: '「比較表」および関連する統計分析を含む、最新の市場動向報告書を作成しました。📄\\n\\n右側のArtifactパネルにて、Chart.jsを使用したインタラクティブなグラフや詳細な比較分析表をご確認いただけます。複数ページ（全3ページ）構成となっており、スクロールしてご覧いただけます。',
          citations: [
            { id: 'cite_1', type: 'rag', source: '2025年度_業界動向調査レポート.pdf', url: null },
            { id: 'cite_2', type: 'rag', source: '競合調査資料_2026Q1.xlsx', url: null }
          ]
        })
      },
      { event: 'message_end', metadata: { retriever_resources: [], usage: { prompt_tokens: 1800, completion_tokens: 4200, total_tokens: 6000 } } }
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
  ],
  'html_artifact_demo': [
    'グラフ付きで売上分析して',
    'リッチなHTMLレポートで出力して',
    'KPIダッシュボードを作って'
  ],
  'html_statistical_report': [
    '市場シェアの詳細を教えて',
    '2028年の予測の根拠は？',
    '競合C社の強みを分析して'
  ],
  'html_a4_document': [
    '内容をさらに詳しくして',
    '表のデータを更新して',
    'デザインを変更して'
  ]
};