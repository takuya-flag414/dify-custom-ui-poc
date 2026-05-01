# **Genspark風AIスライド生成メカニズムの技術調査およびアーキテクチャ実装レポート**

## **自律型AIエージェントによるスライド生成のパラダイムシフト**

近年、大規模言語モデル（LLM）の進化により、単純なテキスト生成から、複雑な構造を持つデジタル成果物の自律的な生成へと技術の焦点が移行している。元BaiduおよびMicrosoftの役員らによって設立されたMainFunc Inc.が開発するGensparkは、その代表的なプラットフォームであり、従来の「リンクの羅列」を提供する検索エンジンから脱却し、ユーザーのクエリに基づいて「Sparkpage」と呼ばれる動的なまとめページや、ビジネス品質のプレゼンテーションスライドをリアルタイムで生成するAIエージェントワークスペースを提供している1。

Gensparkの「AI Slides」機能は、単純にプロンプトをテンプレートに流し込む従来型のスライドジェネレーターとは一線を画している。内部ではMixture-of-Agents（MoA）アーキテクチャや「Super Agent」と呼ばれるタスクオーケストレーション層が稼働し、Web上の最新情報を深くリサーチ（Deep Research）してファクトチェックを行い、その結果を視覚的なスライドデッキとして構造化するプロセスを自律的に実行している4。また、生成されたスライドは単なる静止画ではなく、テキストの編集、レイアウトの変更、PDFやPowerPoint（PPTX）形式へのエクスポートが可能である7。

本レポートでは、GensparkのAIスライド生成機能におけるフロントエンドの描画メカニズム、デザインテンプレートの構造化手法、LLMからの出力制御フォーマット、画像やMermaid.js等を用いたアセット統合プロトコル、そして高精度なエクスポート機能の仕組みについて網羅的な技術調査を実施する。さらに、これらの分析に基づき、Dify、React、Tailwind CSSなどのオープンソース技術を活用して同等の機能を再現するための技術アーキテクチャと推奨スタックを提案する。

## **フロントエンド・フレームワークとランタイムエンジン**

AIによって生成されたコンテンツをブラウザ上でスライドとして描画するためには、堅牢かつ柔軟なフロントエンド・フレームワークが不可欠である。Markdownをベースとした静的サイトジェネレーターやスライドライブラリは古くから存在するが、LLMと連携する現代の動的アプリケーションにおいては、DOM（Document Object Model）の操作効率と状態管理の容易さが求められる。

### **スライド表示ライブラリの比較とGensparkのアプローチ**

Markdownやテキストベースの入力をスライドに変換するオープンソースのライブラリとして、Reveal.js、Marp、Slidevが広く知られている。これらはそれぞれ異なる設計思想を持っており、LLMと統合する際のアプローチも大きく異なる。以下の表に、各ライブラリの技術的特性とAI統合における適合性を示す。

| フレームワーク | 基盤技術とアーキテクチャ | AI統合におけるメリット | AI統合におけるデメリット |
| :---- | :---- | :---- | :---- |
| **Marp** | Markdownベースの静的レンダリングエンジン。CLIによる変換が主軸9。 | 構文がシンプルであり、LLMにプレーンなMarkdownを出力させるだけで実装可能9。 | レイアウトの微調整や複雑なインタラクティブUIの構築が困難。デザインの自由度が低い10。 |
| **Slidev** | Vue 3およびViteを基盤とした開発者向けスライドライブラリ。WindiCSS/Tailwindを内包9。 | VueコンポーネントをMarkdown内に埋め込むことができ、リッチな表現が可能9。 | LLMにVueのコンポーネント構文を正しく出力させる難易度が高く、構文エラーによるレンダリング停止のリスクがある10。 |
| **Reveal.js** | HTML/CSS/JavaScriptベースの老舗フレームワーク。深いDOMツリー構造を持つ11。 | プラグインエコシステムが豊富で、高度なアニメーションやトランジション制御が可能9。 | LLMに冗長なHTMLタグ（セクションのネスト等）を出力させる必要があり、トークン消費が増大しハルシネーションを誘発しやすい11。 |

Gensparkが採用しているフロントエンドアーキテクチャは、これらの既存の静的Markdownスライドライブラリをそのまま利用するものではない。ModaのようなFigmaクラスのWebGPUを用いた2Dベクターキャンバスではなく、標準的なHTMLとCSS（DOMベース）で構築された独自のコンポーネント・レンダリングエンジンを採用していると分析される8。実際にオープンソース化されているGensparkのクローン実装（Open Genspark）のコードベースを確認すると、Next.js 15、React 19、Tailwind CSSを用いた仮想DOMベースのアプローチが取られている13。

### **ページ送りとアニメーションのランタイムエンジン**

Reactベースのアーキテクチャにおいて、スライドの「ページ送り」や「アニメーション」を司るランタイムエンジンは、CSSトランジションまたはReact専用のアニメーションライブラリによって制御される。具体的には、Framer Motionのようなライブラリが採用されることが標準的である13。

このアーキテクチャの最大の利点は、「データの状態（State）」と「描画ロジック（View）」の完全な分離である。LLMはアニメーションのCSSキーフレームやJavaScriptのイベントリスナーを記述する必要はなく、単に「スライドのコンテンツデータ」を生成するだけでよい15。フロントエンドのReactアプリケーションがそのデータを配列として受け取り、Framer Motion等のコンポーネントでラップすることで、プログレッシブな要素の表示（トランジション）や、キーボード操作による滑らかなページ遷移を自動的に適用する13。これにより、LLMのトークン生成の負担を最小限に抑えつつ、ブラウザ上でのリッチなユーザー体験を担保している。

## **デザインテンプレートの構造化手法**

AIプレゼンテーションツールにおいて、LLMに直接「生のデザインコード（生のCSSやインラインスタイル）」を記述させるアプローチは、深刻なレイアウト崩れやブランド一貫性の喪失を引き起こす原因となる。これを防ぐため、高度なAIシステムはデザインシステムの抽象化とコンポーネント指向の開発手法を取り入れている。

### **デザイントークンによる一貫性の担保**

デザインの一貫性を確保するための中心的なメカニズムが「デザイントークン（Design Tokens）」である。デザイントークンとは、カラーコード（例：\#0055ff）や余白のピクセル値（例：24px）といったハードコードされた数値を、プラットフォームに依存しない意味的な変数（例：color-primary、spacing-large）として定義する手法である16。

GensparkのUIエンジンにおいては、LLMが自律的に色やフォントを決定して生コードを出力するのではなく、事前に定義されたデザイントークンを選択する仕組みが取られている。ユーザーが「プロフェッショナルモード」や「クリエイティブモード」を選択した際、システムはそれに紐づくトークンのセット（テンプレートエンジン）をアクティブにする7。LLMは生成時に {"theme": "corporate-blue"} といったメタデータを出力するにとどまり、フロントエンド側でそのトークンを実際のCSS変数に変換して適用する16。これにより、複数のスライド間でのタイポグラフィやカラーパレットの完全な一貫性が保証される。

### **Tailwind CSSとコンポーネント・ライブラリの活用**

デザイントークンを実際のDOM要素に適用するランタイムとして、Tailwind CSSが極めて効果的に機能する。Tailwind CSSはユーティリティファーストのCSSフレームワークであり、事前にコンパイルされたクラス名（例：text-slate-800、bg-blue-500、p-4）を組み合わせてUIを構築する13。

実際のシステム構築においては、LLMにTailwindのクラス名を直接予測させるのではなく、Reactのコンポーネント（例：\<TwoColumnSlide /\> や \<DataChartSlide /\>）を事前に定義しておく手法が取られる。LLMは「どのコンポーネントを使用するか」という識別子と「そこに流し込むテキストデータ」のみを出力する。フロントエンド側では、受け取った識別子に基づき、内部にTailwind CSSがハードコードされたReactコンポーネントを呼び出す15。これにより、LLMの推論リソースを「コンテンツの論理的構造」に集中させつつ、出力されるデザインの品質は常にプロのデザイナーが作成したTailwindの定義に依存させることが可能となり、レイアウトの破綻を物理的に防ぐことができる。

## **LLMからの出力制御（データフォーマット）**

LLMが生成したコンテンツをシステム側で安全かつ予測可能な形で処理するためには、LLMの出力フォーマットを厳密に制御する必要がある。GensparkをはじめとするプロダクションレベルのAIアプリケーションでは、HTMLやMarkdownではなく、JSON（JavaScript Object Notation）フォーマットを中間表現として採用している20。

### **JSONフォーマットによる構造化の優位性**

LLMに直接HTMLを出力させた場合、閉じタグの欠落やネストの不整合が発生しやすく、これがDOMの破損やレンダリングエラーに直結する22。JSONを利用することで、LLMを「文章の執筆者」ではなく「データプロセッサー」として振る舞わせることができる22。JSONはプログラミング言語との親和性が極めて高く、フロントエンドのReactコンポーネントへ直接データをプロパティ（Props）として渡すことが容易である。

スライド生成におけるJSONスキーマは、単なるテキストの配列ではなく、各スライドのレイアウト意図、タイトル、箇条書きの階層、および統合すべきメディアのメタデータを包括的に定義する構造を持つ15。以下に、スライド生成を目的としたJSONスキーマの構造の例を示す。

| JSONキー | データ型 | 役割と制御内容 |
| :---- | :---- | :---- |
| presentation\_title | String | デッキ全体を統括するタイトル。 |
| theme\_token | String | フロントエンド側で適用すべきデザイントークン（カラースキーム）。 |
| slides | Array | 各スライドのデータを格納する配列。 |
| slides\[i\].layout\_type | String | 事前定義されたReactコンポーネント（例：title\_slide, split\_content）を指定する列挙型（Enum）。 |
| slides\[i\].content | Object | タイトル、サブタイトル、本文の箇条書き（Array of Strings）を格納するキーバリューペア。 |
| slides\[i\].media | Object | 挿入すべき画像生成用プロンプト、またはMermaid.jsのソースコードを格納する。 |

### **レイアウトの破綻を防ぐための制約（Constraints）手法**

LLMにJSONを出力させる際、単に「JSONで出力せよ」とプロンプトで指示するだけでは、幻覚による不要なテキストの混入（JSONブロック前後のマークダウンバッククォート等）や、スキーマ違反が発生するリスクがある20。これを防ぐための高度な制約手法として、以下の技術が導入される。

第一に、OpenAI等が提供する「Structured Outputs（構造化出力）」機能の活用である。APIコール時に response\_format: { "type": "json\_schema" } を指定し、厳密なJSONスキーマを定義することで、モデルは指定されたスキーマに100%合致するJSONを生成することが強制される24。

第二に、バックエンドにおける自己修復（Self-Healing）とバリデーション・ループの実装である。Pydantic（Python環境）やZod（JavaScript/TypeScript環境）といったスキーマバリデーションライブラリを用い、LLMの出力をパースする。万が一、配列の要素数が多すぎる（例：スライドの箇条書きが長すぎてUIをはみ出す）といった論理的な制約違反があった場合、エラー内容をプロンプトに付与してLLMに再生成を要求するループ処理を行う20。これにより、フロントエンドに到達する前に不正なデータがブロックされ、レイアウトの崩壊を未然に防ぐことができる。

## **アセット（画像・図解）の統合プロトコル**

プレゼンテーションの品質は、テキスト情報の質だけでなく、付随する視覚的アセット（画像や図解）の説得力に大きく依存する。Gensparkのアーキテクチャでは、テキスト生成エージェントとは別の特化型エージェントやレンダリングエンジンを呼び出し、これらを非同期に統合するプロトコルが実装されている。

### **Mermaid.jsを用いた図解の動的レンダリングとセキュリティリスク**

システム構成図、フローチャート、ガントチャートなどの論理的・構造的な情報を視覚化するために、オープンソースのJavaScriptライブラリであるMermaid.jsが広く利用されている25。LLMは、特定のレイアウト（例：diagram\_slide）が選択された場合、JSONペイロード内にMermaid固有のマークダウン風構文をテキストデータとして出力する26。

フロントエンドでは、このテキストデータを受け取り、DOMにマウントされた後に mermaid.render() または mermaid.run() APIを呼び出すことで、リアルタイムにブラウザ上でSVG画像として描画する28。この手法は、事前レンダリングされた静的画像とは異なり、スライドのテーマ（ライト・ダークモードなど）に合わせてCSSで動的にスタイルを変更できるという大きな利点がある28。

しかし、サードパーティ（この場合はLLM）が生成したMermaidコードをフロントエンドで動的にレンダリングする処理には、深刻なセキュリティリスクが伴う。Mermaidの機能には、特定のノードにハイパーリンクを付与したり、JavaScriptのコールバック関数（クリックイベント）をバインドする機能が含まれている28。過去にDifyなどの著名なオープンソースプラットフォームにおいて、このMermaidのイベントバインディング機能を悪用したクロスサイトスクリプティング（XSS）の脆弱性（CVE-2026-21866）が報告されている29。

このリスクを回避するための必須のプロトコルとして、Mermaidの初期化時に必ず securityLevel: 'strict'（または sandbox）を設定することが挙げられる28。これにより、レンダリングがサンドボックス化されたiframe内で行われるか、危険なタグやスクリプトが強力にサニタイズされ、悪意のあるプロンプトインジェクションによるブラウザ側での任意コード実行を完全にブロックすることが可能となる。

### **Nano Banana Pro（Gemini 3 Pro Image）による高精細画像の統合**

写真、インフォグラフィック、UIモックアップなどの複雑な視覚要素の生成には、Gensparkのクリエイティブモードの裏側でも稼働している「Nano Banana Pro（Gemini 3 Pro Image）」が利用される30。

従来の拡散モデル（Stable Diffusionや初期のMidjourney等）を用いたスライドツールは、画像内に文字をレンダリングしようとすると、意味不明なアルファベットの羅列（ハルシネーション）を生成してしまうという致命的な弱点を抱えていた31。しかし、Google DeepMindが開発したNano Banana Proは、Gemini 3 Proのマルチモーダル推論コアを基盤としており、多言語における「完璧なテキストレンダリング（Perfect Text Rendering）」を実現している33。さらに、プレゼンテーションに最適な16:9のアスペクト比を正確に維持しつつ、最大4Kの超高解像度でネイティブ出力が可能である34。

システム上の統合プロトコルとしては、主たるLLM（スライド構成を司るエージェント）が各スライドの文脈を分析し、「Nano Banana Proに対する詳細な画像生成プロンプト（配置すべきテキストや指定スタイルを含む）」をJSONデータとして出力する32。バックエンドはこのプロンプトを受け取って非同期に画像生成APIを呼び出し、生成されたアセットのURLをフロントエンドに返す遅延読み込み（Lazy Loading）アーキテクチャを採用することで、スライド全体の生成体感速度を損なわないよう設計されている36。

## **エクスポート（PDF/PPTX）の仕組み**

Webブラウザ上でHTMLおよびCSSとして動的に描画されたスライドを、ビジネス現場で流通する静的なPDFファイルや、編集可能なPowerPoint（PPTX）ファイルに高精度に変換することは、アーキテクチャ設計における最も複雑な課題の一つである。

### **Headless Chromeを利用したPDFエクスポート**

HTMLスライドを視覚的な崩れなくPDF化するための業界標準アプローチは、PuppeteerやPlaywrightを利用したHeadless Chrome環境でのレンダリングである38。

バックエンド（Node.jsサーバーやサーバーレス関数）上でHeadlessブラウザをインスタンス化し、生成済みのスライドのURL（またはレンダリングされたHTML文字列）を読み込ませる。この際、CSSの @media print メディアクエリを活用し、スライドのサイズ（通常は1920x1080ピクセル、16:9比率）に合わせた印刷ページ設定をブラウザに強制する。ページの読み込みとMermaid.js等による非同期のSVG描画が完了するのを待機（networkidle0等のイベントフックを利用）した上で、page.pdf() APIを呼び出して出力する38。

このアプローチにより、Tailwind CSSによる複雑なレイアウト、Webフォント、動的に生成された図解など、ユーザーがブラウザの画面上で見ているものと完全に同一の「ピクセルパーフェクト」なPDFが担保される。

### **PptxGenJSを用いたPPTX変換メカニズムと技術的制約**

編集可能なPowerPointファイル（PPTX）へのエクスポートには、PptxGenJSのようなJavaScriptライブラリ、あるいはバックエンドでの python-pptx が利用される39。PPTXファイルのデータ構造は「Office Open XML（OOXML）」というXMLベースの独自フォーマットであり、HTMLやCSSのDOMツリーをそのまま保存することはできない40。

したがって、エクスポート処理においては、LLMが生成した「スライド構造のJSONデータ」を中間層でパースし、PptxGenJSのオブジェクト生成API（slide.addText(), slide.addShape(), slide.addImage()）へとマッピングするトランスパイラ（変換器）を実装する必要がある39。この変換により、出力されたPPTXファイルは、ネイティブのテキストボックスや図形要素を保持し、ユーザーがダウンロード後にPowerPoint上で自由に編集を継続できるという強みを持つ39。

しかし、ここには重大な技術的制約が存在する。Tailwind CSSで高度にスタイリングされたネストの深いレイアウトや、Mermaid.jsで動的生成された複雑なSVGノードは、OOXMLのプリミティブな図形オブジェクトへのマッピングが極めて困難である。Genspark等のプラットフォームではこの問題を回避するため、複雑なHTML要素やグラフについては、上述のHeadless Chrome等を用いてバックエンドで一度PNG画像（Base64エンコード）としてキャプチャし、PPTXスライド内に静的画像として貼り付けるというフォールバック（代替）機構を採用している41。エクスポートされたPPTXにおいて、一部の表やグラフが画像化されてしまい編集できない現象は、このアーキテクチャ上の妥協点に起因している41。

## **推定技術アーキテクチャ図と構成要素リスト**

ここまでの技術調査を踏まえ、Gensparkが採用していると推測されるスライド生成機能の全体アーキテクチャ、およびそれを構成する技術要素を論理的レイヤーごとにリストアップする。

* **フロントエンド層 (User Interface & View)**  
  * **Next.js / React**: コンポーネントベースの仮想DOMレンダリング。状態管理による高速なUI更新13。  
  * **Tailwind CSS**: デザイントークンに基づくユーティリティクラスによる安全なスタイリング13。  
  * **Framer Motion**: コンポーネント間（ページ送り）の滑らかなアニメーション制御14。  
  * **Mermaid.js**: 厳格なセキュリティ設定（securityLevel: 'strict'）下での動的SVG図解レンダリング28。  
* **バックエンド・オーケストレーション層 (Agents & Logic)**  
  * **Multi-Agent Router**: プロンプトを解析し、検索、コンテンツ生成、画像生成のタスクを非同期に振り分ける分散処理ルーター6。  
  * **Deep Research Engine**: ExaやTavilyなどの検索APIを統合し、外部Web情報を収集・ファクトチェックするモジュール43。  
  * **JSON Schema Validator**: Pydantic等を活用し、LLMが出力したJSON構造を検証し、不整合があれば修復ループを回すミドルウェア20。  
* **基盤AIモデル層 (LLM & Media Generation)**  
  * **テキスト/推論コア**: GPT-4o または Claude 3.5 Sonnet（複雑なスキーマ出力と論理構成に優れるモデル）3。  
  * **画像生成コア**: Gemini 3 Pro Image (Nano Banana Pro) （高解像度かつ文字入力に特化した画像生成）30。  
* **ドキュメント変換・エクスポート層 (Export Pipeline)**  
  * **PPTX Compiler**: PptxGenJSを利用し、JSONの中間データをOOXMLフォーマットにマッピングするコンバータ38。  
  * **PDF Renderer**: Node.js \+ Puppeteer (Headless Chrome)による、HTML/CSSのピクセルパーフェクトな静的PDF出力エンジン38。

## **Dify等を用いたオープンソース推奨スタックの提案**

以上のアーキテクチャを社内ツールや独自SaaSとして、オープンソース技術およびクラウドネイティブなツールセットで再現・構築するための推奨スタックと実装方針を以下に提案する。

### **推奨技術スタックの構成**

| レイヤー | 推奨技術・ライブラリ | 採用理由とシステム上の役割 |
| :---- | :---- | :---- |
| **ワークフロー・エージェント構築** | **Dify** (オープンソース版) | 直感的なノードベースのUIで、LLMのプロンプトチェーン、外部検索ツール（Web Search）の呼び出し、反復的なリサーチ（Loop）フローを視覚的に構築できるため43。 |
| **出力フォーマット制御** | **OpenAI API (Structured Outputs)** | LLMの出力を100%確実にJSONフォーマットに固定し、フロントエンドでのパースエラーを根絶するための基盤技術として必須24。 |
| **フロントエンドUI実装** | **Next.js \+ React \+ Tailwind CSS** | DifyのAPIエンドポイントからJSONを受け取り、事前に定義したReactコンポーネントにデータを流し込んでレンダリングする。Marp等よりも拡張性が高く、カスタムUIの構築に最適13。 |
| **動的アセット描画** | **Mermaid.js \+ Gemini API** | 論理図解はMermaidでテキストベースに生成し26、リッチな背景画像やインフォグラフィックは、テキスト描画に秀でたGoogleのNano Banana Pro APIを呼び出すハイブリッド構成31。 |
| **エクスポート処理** | **PptxGenJS \+ Puppeteer** | 編集可能なネイティブPPTXの生成はPptxGenJSでクライアントサイド/サーバーサイドで行い40、レイアウトを完全に維持したPDF出力にはサーバーレス環境でのPuppeteerを利用する38。 |

### **実装におけるベストプラクティスと開発手順**

1. **DifyによるDeep Researchワークフローの構築**: Difyのワークフロー機能を活用し、ユーザーのトピック入力から始まるプロセスを構築する。「Intent Identification（意図抽出）」ノードでプロンプトを解析後、「Iteration（反復）」ノードを用いて外部Web検索を行い、ファクトデータをメモリに蓄積する43。  
2. **JSONスキーマベースの出力ノードの設定**: ワークフローの最終段のLLMノードにおいて、前段で収集した情報を元に、スライド構成を定義した厳密なJSONスキーマ（slides配列内にtitle, bullet\_points, layout\_type, mermaid\_code等を持つ）で出力するよう設定し、DifyのAPIとして公開する。  
3. **React \+ Tailwindによるフロントエンドの統合**: Next.jsアプリケーションからDify APIを非同期で呼び出し、返却されたJSONデータをパースする。JSON内の layout\_type の値に応じて、Tailwind CSSでスタイリングされた専用のReactコンポーネントを動的にマウントしてスライドを描画する。Mermaidコンポーネントを実装する際は、XSS対策として必ず securityLevel: 'strict' を有効化する28。  
4. **エクスポートパイプラインの統合**: 画面上のUIとして「Export to PPTX / PDF」ボタンを実装する。PPTXエクスポート時は、フロントエンドが保持しているJSONの状態（State）をPptxGenJSに渡し、OOXMLを生成してダウンロードさせる。PDFエクスポート時は、対象スライドのURLをバックエンドのPuppeteer関数に渡し、バックグラウンドで描画・キャプチャしたPDFファイルをユーザーに返却するルーティングを構築する38。

### **図表のデザイン担保とコーポレートロゴ統合の実装方針**

Difyを活用して、グラフや表のデザイン安定化や、企業独自のブランディング（ロゴ等の統合）を行う場合は、以下のアーキテクチャをシステムに組み込むことを推奨する。

* **コンポーネント分離による図表の安定化（Professionalモードの再現）**  
  LLM（Dify）に直接HTMLやCSSのデザインコードを出力させるのではなく、純粋な「表データ」や「グラフ描画用の数値配列」のみをJSONで出力させる。フロントエンドのReact側でこのJSONを受け取り、内部にTailwind CSSでデザインがハードコードされたRechartsやChart.jsのコンポーネントにデータを流し込む。これにより、AIの幻覚によるレイアウト崩れを物理的に防ぐことができる。  
* **Mermaid図解の安全な画像化パイプライン** Difyのエコシステム内に存在する mermaid\_converter や md\_exporter といったプラグインを活用する。LLMが出力したMermaid記法を、Difyのバックエンド側で外部API（mermaid.ink等）を通じてあらかじめ静的な画像（PNG/SVG）に変換する27。これをフロントエンドに渡すことで、ブラウザ側でのレンダリングエラーやXSSリスクを回避しつつ、安定した品質で表示・エクスポートが可能となる。  
* **カスタムPPTXを通じた企業ロゴ・ブランドの統合**  
  企業のロゴやブランドカラー（テーマ）を適用する最も確実な方法は、ベースとなる「マスターPPTXテンプレート」を用意することである。Difyのファイルアップロード機能で自社仕様のPPTXを読み込ませ、oy-gen-pptx 等のプラグイン、あるいはバックエンドのPptxGenJS・python-pptx処理と組み合わせる。DifyのLLMが生成したスライドデータを、このマスターPPTXの指定されたプレースホルダー（テキストボックスや画像エリア）に流し込むことで、常に自社の企業ロゴが適切な位置に配置された、ブランドガイドライン準拠の編集可能な資料を生成できる。  
* **Webフロントエンドでのロゴ・オーバーレイ**  
  ブラウザのプレビュー画面上で企業ロゴを表示する場合は、Difyの出力JSONに設定された theme\_token やユーザー設定に基づき、Reactコンポーネント側でロゴ画像を絶対配置（absolute position）の透かしとしてレイヤー化する。

## **結論**

GensparkのAIスライド生成メカニズムは、単なるテキストからMarkdownへの変換という既存の枠組みを超え、マルチエージェントによる深い情報収集と、高度に抽象化されたフロントエンドアーキテクチャの融合によって成立している。LLMの出力を厳格なJSONスキーマで制御し、それをTailwind CSSによってカプセル化されたReactコンポーネントにマッピングすることで、AIの幻覚によるレイアウト崩壊を根本から防いでいる。また、Mermaid.jsのセキュアな動的レンダリングと、Nano Banana Proによる文字入り画像の生成を組み合わせることで、視覚的にも説得力のあるスライドを自律的に構築している。

エクスポートにおいては、編集可能性を重視するPPTX（PptxGenJS）と、視覚的忠実度を重視するPDF（Headless Chrome）という二つの異なるパイプラインを使い分け、ビジネスの現場で要求される実用性を担保している。

Dify、React、Tailwind CSS、そして強力なLLM API（Structured OutputsやGemini 3 Pro Image）といったオープンソース技術とクラウドサービスを組み合わせることで、Gensparkと同等の「リサーチからエクスポートまでの一貫した自律型スライド生成システム」を独自に構築することは十分に可能である。開発においては、中間データのスキーマ定義とバリデーション、そしてDOMレンダリングとOOXML変換間の技術的ギャップをどのように吸収するかが、プロジェクト成功の鍵となる。

#### **引用文献**

1. Genspark super-agent: the rise of next-generation AI assistants and, 5月 1, 2026にアクセス、 [https://www.qed42.com/insights/genspark-super-agent-the-rise-of-next-generation-ai-assistants-and-how-it-compares-to-manus-ai](https://www.qed42.com/insights/genspark-super-agent-the-rise-of-next-generation-ai-assistants-and-how-it-compares-to-manus-ai)  
2. The Ultimate Guide to Genspark AI's Multi-Agent System \- NanoBits, 5月 1, 2026にアクセス、 [https://nanobits.beehiiv.com/p/this-ai-has-left-us-both-terrified-and-impressed-our-4-genspark-experiments](https://nanobits.beehiiv.com/p/this-ai-has-left-us-both-terrified-and-impressed-our-4-genspark-experiments)  
3. Genspark | Himalayas, 5月 1, 2026にアクセス、 [https://himalayas.app/companies/genspark](https://himalayas.app/companies/genspark)  
4. NextDocs vs Genspark: AI Presentation Builder Comparison (2026), 5月 1, 2026にアクセス、 [https://www.nextdocs.io/compare/genspark-vs-nextdocs](https://www.nextdocs.io/compare/genspark-vs-nextdocs)  
5. Sovereign Agents: In-Depth Research on Clawdbot/OpenClaw, 5月 1, 2026にアクセス、 [https://01.me/en/2026/01/clawdbot-openclaw-analysis/](https://01.me/en/2026/01/clawdbot-openclaw-analysis/)  
6. Genspark Review 2026 Is this Super Agent Better Than ChatGPT, 5月 1, 2026にアクセス、 [https://scribehow.com/page/Genspark\_Review\_2026\_Is\_this\_Super\_Agent\_Better\_Than\_ChatGPT\_\_GJtvBBC2S3q603HmdedjQg](https://scribehow.com/page/Genspark_Review_2026_Is_this_Super_Agent_Better_Than_ChatGPT__GJtvBBC2S3q603HmdedjQg)  
7. Genspark AI Review: An Honest Look at the Presentation Maker and, 5月 1, 2026にアクセス、 [https://getalai.com/blog/genspark-alternatives](https://getalai.com/blog/genspark-alternatives)  
8. Genspark AI Slides vs Moda: Which Is Better?, 5月 1, 2026にアクセス、 [https://moda.app/blog/genspark-ai-slides](https://moda.app/blog/genspark-ai-slides)  
9. Markdown-Based Presentation Tools: Marp, Slidev, and reveal.js, 5月 1, 2026にアクセス、 [https://dasroot.net/posts/2026/04/markdown-presentation-tools-marp-slidev-reveal-js/](https://dasroot.net/posts/2026/04/markdown-presentation-tools-marp-slidev-reveal-js/)  
10. how does Slidev compare with Marp? \#86 \- GitHub, 5月 1, 2026にアクセス、 [https://github.com/slidevjs/slidev/discussions/86](https://github.com/slidevjs/slidev/discussions/86)  
11. Choosing a slide library | Tony Cabaye \- GitHub Pages, 5月 1, 2026にアクセス、 [https://tonai.github.io/blog/posts/slide-libraries/](https://tonai.github.io/blog/posts/slide-libraries/)  
12. The HTML presentation framework | reveal.js, 5月 1, 2026にアクセス、 [https://revealjs.com/](https://revealjs.com/)  
13. ComposioHQ/open-genspark \- GitHub, 5月 1, 2026にアクセス、 [https://github.com/ComposioHQ/open-genspark](https://github.com/ComposioHQ/open-genspark)  
14. code-on-sunday/slide-deck-generator \- GitHub, 5月 1, 2026にアクセス、 [https://github.com/code-on-sunday/slide-deck-generator](https://github.com/code-on-sunday/slide-deck-generator)  
15. I vibe-coded the AI super agent app Genspark in a weekend, 5月 1, 2026にアクセス、 [https://composio.dev/content/i-vibe-coded-genspark-in-a-weekend](https://composio.dev/content/i-vibe-coded-genspark-in-a-weekend)  
16. Everything you need to know about design tokens \- Nulab, 5月 1, 2026にアクセス、 [https://nulab.com/learn/design-and-ux/design-tokens/](https://nulab.com/learn/design-and-ux/design-tokens/)  
17. Design System Generator | Design System Software \- Creately, 5月 1, 2026にアクセス、 [https://creately.com/lp/design-system-generator/](https://creately.com/lp/design-system-generator/)  
18. Genspark AI: Agent for AI Slides — Build Polished Presentations from, 5月 1, 2026にアクセス、 [https://canadiantechnologymagazine.com/genspark-ai-slides-one-prompt/](https://canadiantechnologymagazine.com/genspark-ai-slides-one-prompt/)  
19. 16 Best AI Full-Stack App Builders for Developers in 2026 \- VisionVix, 5月 1, 2026にアクセス、 [https://visionvix.com/best-ai-full-stack-app-builders/](https://visionvix.com/best-ai-full-stack-app-builders/)  
20. Generating Structured Output with LLMs (Part 1\) \- Ankur Singh, 5月 1, 2026にアクセス、 [https://ankur-singh.github.io/blog/structured-output](https://ankur-singh.github.io/blog/structured-output)  
21. Structured Prompting Techniques: XML & JSON Prompting Guide, 5月 1, 2026にアクセス、 [https://codeconductor.ai/blog/structured-prompting-techniques-xml-json/](https://codeconductor.ai/blog/structured-prompting-techniques-xml-json/)  
22. JSON prompting for LLMs \- IBM Developer, 5月 1, 2026にアクセス、 [https://developer.ibm.com/articles/json-prompting-llms/](https://developer.ibm.com/articles/json-prompting-llms/)  
23. Get consistent, well-formatted Markdown/JSON outputs from LLMs, 5月 1, 2026にアクセス、 [https://community.n8n.io/t/get-consistent-well-formatted-markdown-json-outputs-from-llms/80749](https://community.n8n.io/t/get-consistent-well-formatted-markdown-json-outputs-from-llms/80749)  
24. Structured Outputs \- LLM Parameter Guide \- Vellum, 5月 1, 2026にアクセス、 [https://www.vellum.ai/llm-parameters/structured-outputs](https://www.vellum.ai/llm-parameters/structured-outputs)  
25. History of Mermaid.js: Diagrams as Code to 85K Stars (2026), 5月 1, 2026にアクセス、 [https://www.taskade.com/blog/history-of-mermaid](https://www.taskade.com/blog/history-of-mermaid)  
26. Build diagrams with Mermaid JS \- Datadog Docs, 5月 1, 2026にアクセス、 [https://docs.datadoghq.com/notebooks/guide/build\_diagrams\_with\_mermaidjs/](https://docs.datadoghq.com/notebooks/guide/build_diagrams_with_mermaidjs/)  
27. Mermaid Converter \- Dify Marketplace, 5月 1, 2026にアクセス、 [https://marketplace.dify.ai/plugin/hjlarry/mermaid\_converter](https://marketplace.dify.ai/plugin/hjlarry/mermaid_converter)  
28. Usage \- Mermaid AI, 5月 1, 2026にアクセス、 [https://mermaid.ai/open-source/config/usage.html](https://mermaid.ai/open-source/config/usage.html)  
29. More than flowcharts: exploiting diagram renderers \- Snyk Labs, 5月 1, 2026にアクセス、 [https://labs.snyk.io/resources/exploiting-diagram-renderers/](https://labs.snyk.io/resources/exploiting-diagram-renderers/)  
30. Gemini 3 Pro Image (Nano Banana Pro) | Google AI Studio, 5月 1, 2026にアクセス、 [https://aistudio.google.com/models/gemini-3-pro-image](https://aistudio.google.com/models/gemini-3-pro-image)  
31. Nano Banana: How to Create Editable Slides \- SlideSpeak, 5月 1, 2026にアクセス、 [https://slidespeak.co/blog/guide-on-nano-banana-editable-text](https://slidespeak.co/blog/guide-on-nano-banana-editable-text)  
32. Nano Banana Pro Review: Is It Good for Presentation \- Smallppt, 5月 1, 2026にアクセス、 [https://smallppt.com/blog/ai-tools/nano-banana-pro-review](https://smallppt.com/blog/ai-tools/nano-banana-pro-review)  
33. Nano Banana Pro PPT \- AI Slides Maker \- Manus, 5月 1, 2026にアクセス、 [https://manus.im/tools/nano-banana-pro-slides](https://manus.im/tools/nano-banana-pro-slides)  
34. Best Way to Create Nano Banana Pro Slides Using Alai | Alai Blog, 5月 1, 2026にアクセス、 [https://getalai.com/de/blog/nano-banana-pro](https://getalai.com/de/blog/nano-banana-pro)  
35. Gemini Nano Banana Pro: A Technical Review for Life Sciences, 5月 1, 2026にアクセス、 [https://intuitionlabs.ai/pdfs/gemini-nano-banana-pro-a-technical-review-for-life-sciences.pdf](https://intuitionlabs.ai/pdfs/gemini-nano-banana-pro-a-technical-review-for-life-sciences.pdf)  
36. How to Use Nano Banana Pro for Presentations \- Alai, 5月 1, 2026にアクセス、 [https://getalai.com/ru/blog/how-to-use-nano-banana-pro-for-presentations](https://getalai.com/ru/blog/how-to-use-nano-banana-pro-for-presentations)  
37. Genspark AI Slides Tutorial: How to Create a Professional ... \- Scribe, 5月 1, 2026にアクセス、 [https://scribehow.com/page/Genspark\_AI\_Slides\_Tutorial\_How\_to\_Create\_a\_Professional\_Presentation\_\_IUIuVGaDTqiJPpOhK3o6Ew](https://scribehow.com/page/Genspark_AI_Slides_Tutorial_How_to_Create_a_Professional_Presentation__IUIuVGaDTqiJPpOhK3o6Ew)  
38. brandcraft \- SQUADS, 5月 1, 2026にアクセス、 [https://squads.sh/en/gutomec/private-squads-sh-aios/brandcraft](https://squads.sh/en/gutomec/private-squads-sh-aios/brandcraft)  
39. Generating PowerPoint Presentations Automatically with PptxGenJS, 5月 1, 2026にアクセス、 [https://www.clearpeaks.com/generating-powerpoint-presentations-automatically-with-pptxgenjs/](https://www.clearpeaks.com/generating-powerpoint-presentations-automatically-with-pptxgenjs/)  
40. gitbrent/PptxGenJS: Build PowerPoint presentations with ... \- GitHub, 5月 1, 2026にアクセス、 [https://github.com/gitbrent/PptxGenJS](https://github.com/gitbrent/PptxGenJS)  
41. AI Slides FAQ \- Genspark, 5月 1, 2026にアクセス、 [https://www.genspark.ai/docs/ai\_slides\_faq](https://www.genspark.ai/docs/ai_slides_faq)  
42. cannot exporting Genspark AI slide properly : r/genspark\_ai \- Reddit, 5月 1, 2026にアクセス、 [https://www.reddit.com/r/genspark\_ai/comments/1ksd236/cannot\_exporting\_genspark\_ai\_slide\_properly/](https://www.reddit.com/r/genspark_ai/comments/1ksd236/cannot_exporting_genspark_ai_slide_properly/)  
43. Deep Research Workflow in Dify: A Step-by-Step Guide \- Dify Blog, 5月 1, 2026にアクセス、 [https://dify.ai/blog/deep-research-workflow-in-dify-a-step-by-step-guide](https://dify.ai/blog/deep-research-workflow-in-dify-a-step-by-step-guide)  
44. n8n, Dify, and Mermaid Complete Guide \-- AI Agent and Diagram, 5月 1, 2026にアクセス、 [https://www.youngju.dev/blog/ai/2026-04-11-n8n-dify-mermaid-guide.en](https://www.youngju.dev/blog/ai/2026-04-11-n8n-dify-mermaid-guide.en)