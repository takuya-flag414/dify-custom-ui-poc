# **macOS Sequoia & Apple Intelligence デザインシステム定義書：React Webアプリケーションのための実装ガイド**

## **序論：Liquid GlassとIntelligenceの融合**

Appleのヒューマンインターフェイスは、macOS Big Surでの劇的な刷新以降、「Liquid Glass（液体のようなガラス）」という概念を基盤に進化を続けてきた。そして2025年、macOS Sequoia（macOS 15）および次世代のインターフェイスデザイン（通称 "Tahoe"）において、この哲学は新たな次元へと到達した。それは、生成的AIである「Apple Intelligence」の統合による、インターフェイスそのものの「知性化」である。

本レポートは、世界最高峰のUI/UXデザイナーおよびフロントエンドエンジニアの視点から、この最新のデザイン言語をWebテクノロジー（Reactおよび現代的なCSS）を用いて再構築するための包括的な定義書である。単なるスタイルガイドの模倣ではなく、Appleが目指す「Hierarchy（階層）」、「Harmony（調和）」、「Consistency（一貫性）」という三原則を、Webブラウザという異なるレンダリングエンジンの上で物理的かつ視覚的に再現するためのエンジニアリング仕様書として機能することを目的とする1。

特に、Apple Intelligenceがもたらす「Glowing Gradient（発光するグラデーション）」や、文脈に応じて変容する「Writing Tools」のUIパターンは、従来の静的なDOM構造では表現しきれない動的な複雑さを含んでいる。本稿では、光の屈折、物理演算に基づくモーション、そしてセマンティックな色彩設計を深く掘り下げ、Reactアプリケーションにおいてこれらを忠実に、かつパフォーマンスを損なうことなく実装するためのアーキテクチャを提示する。

## ---

**第1章：Material System (マテリアルシステム) \- 光と深度の物理シミュレーション**

macOSのUIにおける「素材感」は、背景色と不透明度の単純な組み合わせではない。それは、背景にあるコンテンツをぼかし（Blur）、彩度を強調し（Vibrancy）、さらに光源からの微細な反射とノイズを加えた複雑なレイヤー合成の結果である。Webにおいてこれを再現するには、backdrop-filterプロパティの高度な制御と、ブラウザのレンダリングパイプラインへの深い理解が不可欠となる。

### **1.1 Liquid Glassの物理特性とWeb実装**

macOS Sequoiaにおけるウィンドウやサイドバーの素材は、ユーザーに「浮遊感」と「コンテキストの維持」を同時に提供するために設計されている。このガラス素材は、背後にある壁紙やウィンドウの色を透かすだけでなく、その色味を鮮やかに変調させる特性を持つ。

#### **1.1.1 階層構造に基づくマテリアルレシピ**

AppleのHIGでは、ウィンドウ内の要素を役割に応じて明確に区別するために、異なる物理特性を持つマテリアルを定義している。React実装においては、これらを再利用可能なCSS変数またはStyled Componentとして定義し、コンテキストに応じて適用する戦略をとる。

| Material Token | Context | Light Mode Appearance | Dark Mode Appearance | Blending Logic |
| :---- | :---- | :---- | :---- | :---- |
| mat-sidebar | サイドバー、ナビゲーション | rgba(245, 245, 247, 0.6) \+ blur(20px) | rgba(30, 30, 30, 0.6) \+ blur(20px) | 彩度強調 (saturate: 180%) を伴う厚いガラス |
| mat-header | ツールバー、ヘッダー | rgba(255, 255, 255, 0.4) \+ blur(30px) | rgba(30, 30, 30, 0.4) \+ blur(30px) | 背景との境界を曖昧にする薄いガラス |
| mat-hud | Apple Intelligenceパネル、OSD | rgba(255, 255, 255, 0.75) \+ blur(50px) | rgba(40, 40, 40, 0.75) \+ blur(50px) | 非常に強いブラーと高い輝度を持つ「発光体」に近いガラス |
| mat-popover | メニュー、ツールチップ | rgba(255, 255, 255, 0.6) \+ blur(40px) | rgba(35, 35, 35, 0.6) \+ blur(40px) | 明確なエッジを持つ浮遊要素 |

詳細分析と実装戦略:  
mat-sidebar の実装において最も重要なのは saturate(180%) という値である。これはWeb標準の backdrop-filter: blur(...) だけでは再現できない、macOS特有の「Vibrancy」を生み出す鍵となる。背景にある色がグレーであっても、ガラス越しに見ると鮮やかな色彩として知覚されるのはこの彩度ブーストの効果である2。  
また、mat-hud（Head-Up Display）はApple Intelligenceのインターフェイス（Writing Toolsなど）で多用される新しいマテリアルである。これは従来のHUDよりも明るく、背景をほとんど隠すほど強力なブラー（50px以上）が適用される。CSSにおいては、複数のドロップシャドウ（Inner ShadowとOuter Shadow）を組み合わせることで、ガラスの厚みとエッジのハイライト（Specular Highlights）をシミュレートする必要がある4。

CSS

/\* React/CSS Implementation Recipe for Intelligent HUD \*/  
.ai-hud-panel {  
  background: rgba(255, 255, 255, 0.75);  
  backdrop-filter: blur(50px) saturate(200%);  
  \-webkit-backdrop-filter: blur(50px) saturate(200%); /\* Safari support \*/  
  border: 1px solid rgba(255, 255, 255, 0.4);  
  box-shadow:   
    0 20px 50px rgba(0, 0, 0, 0.15), /\* Ambient shadow \*/  
    0 0 0 0.5px rgba(255, 255, 255, 0.5) inset; /\* Specular edge reflection \*/  
  border-radius: 22px;  
}

### **1.2 Vibrancyとブラウザのレンダリング制約**

macOSネイティブアプリは NSVisualEffectView を通じてOSレベルの合成エンジンを利用できるが、Webブラウザではそのアクセスが制限されている。特にChromeやFirefoxでは、OSの壁紙を透過して表示することは不可能である（Electronアプリで transparent: true を設定した場合を除く）。

したがって、Webアプリケーションとしてのデザインシステムでは、以下の二つのアプローチを並行して定義する必要がある。

1. **Immersive Web App Mode:** html または body 要素に疑似的な「デスクトップ壁紙」画像を配置し、その上でアプリケーションを展開することで、疑似的な透過効果を実現する手法。これにより、ユーザーはmacOSらしい奥行きを感じることができる。  
2. **Solid Fallback Mode:** backdrop-filter がサポートされていない環境や、パフォーマンス優先モードにおいては、透過度を下げたソリッドカラー（rgba(255, 255, 255, 0.95)など）へと優雅に退行（Graceful Degradation）する仕組み。

Insight:  
最新のSequoiaでは、ライトモードとダークモードの切り替えにおいて、単に色が反転するだけでなく、マテリアルの「温度感」が変化する。ライトモードでは寒色系の清潔なガラス、ダークモードでは暖色系の深みのあるガラスとなるよう、背景色のベースカラー（Tint Color）を微調整することが、プロフェッショナルな再現には不可欠である。

## ---

**第2章：Color System (カラーシステム) \- 知性を表現する色彩理論**

Apple Intelligenceの導入により、macOSのカラーパレットは拡張された。従来のシステムカラーに加え、AIの存在を示唆する「Ethereal Gradients（ اثるようなグラデーション）」が導入され、静的なUIに生命感を与えている。

### **2.1 Apple Intelligence Semantic Gradient**

Apple Intelligenceのブランドを象徴する「Glowing Orb」やUIの縁取り（Border Glow）は、ランダムな虹色ではない。それは特定の4色によって構成される、厳密に定義されたグラデーションシステムである。Deep Researchの結果、これらの色は以下の構成であることが判明している4。

| Color Name | Hex Code (Approx) | Role in Gradient | Emotional Connotation |
| :---- | :---- | :---- | :---- |
| **AI Cyan** | \#00FFFF | ベース、広がり | 知性、未来、明晰さ |
| **AI Magenta** | \#FF00FF | アクセント、深み | 創造性、人間味 |
| **AI Yellow** | \#FFD60A | ハイライト、エネルギー | 暖かさ、注意喚起 |
| **AI Blue** | \#007AFF | 締め色、安定 | 信頼、Appleのアイデンティティ |

Reactにおける実装戦略:  
これらの色は静止画として使用されることはない。常に「流体」として動き続けることがデザインの要件である。CSSの conic-gradient を使用し、それぞれの色を配置した上で、filter: blur() によって境界を溶かし合わせ、さらに animation プロパティで回転させることで、Apple Intelligence特有の「有機的な光」を再現する。

CSS

:root {  
  \--ai-gradient-cyan: \#00FFFF;  
  \--ai-gradient-magenta: \#FF00FF;  
  \--ai-gradient-yellow: \#FFD60A;  
  \--ai-gradient-blue: \#007AFF;  
}

.ai-glowing-border {  
  position: relative;  
  border-radius: inherit;  
}

.ai-glowing-border::before {  
  content: "";  
  position: absolute;  
  inset: \-2px; /\* Border width \*/  
  background: conic-gradient(  
    from 0deg,  
    var(--ai-gradient-cyan),  
    var(--ai-gradient-magenta),  
    var(--ai-gradient-yellow),  
    var(--ai-gradient-blue),  
    var(--ai-gradient-cyan)  
  );  
  filter: blur(8px); /\* The glow spread \*/  
  z-index: \-1;  
  animation: ai-spin 4s linear infinite;  
}

@keyframes ai-spin {  
  from { transform: rotate(0deg); }  
  to { transform: rotate(360deg); }  
}

Insight:  
このグラデーションは、テキストの選択範囲（Proofreading中）や、Writing Toolsパネルの外周など、AIが能動的に機能している場面でのみ使用される。装飾過多を避け、ここぞという場面でのみ使用することが、ユーザーに「機能している」という確信を与えるための鍵となる7。

### **2.2 Semantic System Colors**

基本となるUIカラーは、ダークモード対応とアクセシビリティを考慮した「セマンティックトークン」として定義する。FigmaやCSS Variablesにおける命名規則は、色の名前（Red, Blue）ではなく、その役割（Error, Action）に基づくべきである8。

* **Action / Key Color:**  
  * sys-color-primary: Light \#007AFF / Dark \#0A84FF (System Blue)  
  * ボタン、アクティブな選択状態、リンクに使用。Sequoiaでは、以前のバージョンよりもわずかに彩度が高められている傾向がある10。  
* **Feedback Colors:**  
  * sys-color-success: Light \#34C759 / Dark \#30D158 (Green)  
  * sys-color-warning: Light \#FF9500 / Dark \#FF9F0A (Orange)  
  * sys-color-danger: Light \#FF3B30 / Dark \#FF453A (Red)  
* **Neutral Surfaces:**  
  * sys-bg-base: Light \#FFFFFF / Dark \#1E1E1E  
  * sys-bg-alt: Light \#F5F5F7 / Dark \#000000

開発者への注意:  
Reactコンポーネント内では、決してハードコードされたHex値を使用してはならない。必ず var(--sys-color-primary) のようなCSS変数を参照することで、OSのテーマ変更に即座に追従するレスポンシブな色彩設計が可能となる。また、color-mix() 関数を活用することで、基本色からホバー状態やプレス状態の色を動的に生成する手法も推奨される。

## ---

**第3章：Typography System (タイポグラフィシステム) \- 情報の階層化**

macOSのタイポグラフィは、San Francisco (SF) フォントファミリーを中心に構築されている。Webアプリケーションにおいてネイティブアプリのような質感を出すためには、単にフォントを指定するだけでなく、サイズごとのトラッキング（文字間隔）やレンダリングの妙を再現する必要がある。

### **3.1 Font Stack Strategy**

Webにおける最大の課題は、すべてのデバイスにSan Franciscoフォントがインストールされているわけではない点である。Appleデバイス向けにはネイティブフォントを使用し、それ以外には高品質なフォールバックを提供するスタックを構築する11。

CSS

:root {  
  \--font\-sans: \-apple-system, BlinkMacSystemFont, "SF Pro", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;  
  \--font\-mono: "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;  
  \--font\-rounded: "SF Pro Rounded", \-apple-system, BlinkMacSystemFont, sans-serif;  
}

Insight:  
Sequoiaのデザインでは、数値表示や柔らかい印象を与えたい箇所（例：リマインダーの時刻設定や、AIによる提案チップ）に SF Pro Rounded が積極的に採用されている。Webでは font-family に明示的にこれを含めるか、Webフォントとしてロードする必要があるが、システムフォントとしての利用がパフォーマンス上最適である。

### **3.2 Dynamic Type Scale & Tracking**

Appleのタイポグラフィの真髄は、フォントサイズに応じてトラッキング（Letter Spacing）が動的に変化することにある。大きな文字はタイトに（詰め気味に）、小さな文字はワイドに（広めに）設定することで、あらゆるサイズでの可読性を担保している。ReactのDesign Systemでは、サイズとトラッキングをセットにしたMixinやUtility Classを作成すべきである14。

| Style Name | Size (pt/px) | Weight | Tracking (em) | Usage Context |
| :---- | :---- | :---- | :---- | :---- |
| **Large Title** | 34px | Regular | \-0.02 | ページ最上部の主要タイトル |
| **Title 1** | 28px | Regular | \-0.015 | セクションヘッダー |
| **Title 2** | 22px | Medium | \-0.01 | カードタイトル、重要な小見出し |
| **Headline** | 17px | Semibold | \-0.01 | 本文中の見出し、強調 |
| **Body** | 17px | Regular | 0 | 一般的な本文、段落 |
| **Callout** | 16px | Regular | 0 | 補足情報、引用 |
| **Subheadline** | 15px | Regular | 0 | ツールバー、リストの副題 |
| **Footnote** | 13px | Regular | \+0.01 | 注釈、タイムスタンプ |
| **Caption 1** | 12px | Medium | \+0.02 | ラベル、補助的なステータス |
| **Caption 2** | 11px | Medium | \+0.03 | 極小のメタデータ |

実装上の重要事項:  
Webのデフォルトである16px基調に対し、macOSのUIコントロール（サイドバーのリスト項目など）は歴史的に13pxや14pxが基準となっていることが多い。Webアプリとして実装する場合、本文は読みやすさを考慮して16px（1rem）とするが、ナビゲーションやツールバーなどの「UIパーツ」に関しては13-14pxを採用することで、デスクトップアプリとしての密度感（Density）を再現できる。

## ---

**第4章：Window Anatomy & Spatial Layout (ウィンドウ構造と空間レイアウト)**

macOS Sequoiaのデザインにおける最も顕著な物理的特徴は、ハードウェアの形状（MacBookのディスプレイの角丸）とソフトウェアの形状が調和する「Concentricity（同心円性）」の追求である。

### **4.1 The Great Corner Radius Shift**

従来のmacOS（Catalina以前）ではウィンドウのコーナー半径（Corner Radius）は10px前後であったが、Big Sur以降拡大し、Sequoiaおよび将来のTahoeデザインにおいては、さらに大きな半径（16px〜22px）が標準化されつつある15。

* **Standard Window Radius:** 16px  
  * これはWebアプリケーションのコンテナ（モーダルやメインカード）に適用すべき基準値である。  
  * **Insight:** 半径が大きくなることで、四隅のコンテンツエリア（特に情報密度の高いテーブルやグリッド）が削られる問題が発生する。これに対処するため、コンテンツには十分なパディング（最低16px以上、理想的には20px）を設けることが必須となる。

### **4.2 Traffic Lights (Window Controls) の配置**

ウィンドウ左上の3つのボタン（閉じる、最小化、最大化）は、macOSのアイデンティティそのものである。これらの配置はピクセル単位で厳密に決まっており、Webアプリでカスタムタイトルバーを実装する際には以下の数値を遵守する必要がある17。

* **ボタン直径:** 12px  
* **ボタン間隔:** 8px  
* **左余白 (Padding Left):** 13px 〜 20px  
  * 標準的なサイドバー付きウィンドウでは、サイドバーの幅やアイコンの配置バランスにより **18px \- 20px** 程度の余白が取られる傾向にある。Sequoiaでは、より広めの余白（Relaxed Spacing）が好まれる。  
* **上余白 (Padding Top):** 垂直方向の中央揃え（タイトルバーの高さに依存）。標準的な52pxのタイトルバーの場合、上から約20pxの位置中心となる。

**Reactコンポーネント設計:**

JavaScript

const WindowControls \= () \=\> (  
  \<div className\="flex gap-2 pl-5 items-center h-full group"\>  
    \<div className\="w-3 h-3 rounded-full bg-\[\#FF5F57\] border border-\[rgba(0,0,0,0.1)\] group-hover:flex items-center justify-center"\>  
       {/\* SVG icon for close (on hover) \*/}  
    \</div\>  
    \<div className\="w-3 h-3 rounded-full bg- border border-\[rgba(0,0,0,0.1)\]" /\>  
    \<div className\="w-3 h-3 rounded-full bg-\[\#28C840\] border border-\[rgba(0,0,0,0.1)\]" /\>  
  \</div\>  
);

ホバー時にのみアイコン（×, −, \+）を表示するインタラクションも忠実に実装する。

### **4.3 Unified Toolbarとサイドバーの融合**

Sequoiaでは、タイトルバーとツールバーが一体化した「Unified Toolbar」が採用されている。これにより、コンテンツ領域がウィンドウ上端まで広がっているように見え、没入感が高まる。

* **Sidebar Width:** デフォルト 260px。リサイズ可能範囲は 200px 〜 320px。  
* **Visual Integration:** サイドバーの背景色はタイトルバーエリアまで拡張され、Traffic Lightsはサイドバーの上に配置される。メインコンテンツエリアとの境界には、1pxの非常に薄いボーダー（rgba(0,0,0,0.1)）またはシャドウが引かれる。

## ---

**第5章：Apple Intelligence UI Patterns (Apple Intelligence UIパターン)**

本レポートのハイライトである。Apple IntelligenceのUIは、ユーザーの思考を拡張するツールとして、邪魔にならず、かつ必要な時には明確な存在感を放つよう設計されている。

### **5.1 The "Siri Orb" Animation System**

AIが待機中あるいは処理中であることを示す「Siri Orb」のアニメーションは、画面の枠外から光が溢れ出すような演出が特徴である。これは、AIがデバイスの枠を超えてクラウドやコンテキスト全体と繋がっていることを暗喩している20。

Webでの再現手法:  
ビデオファイル（mp4/webm）を使用するのが最も手軽だが、解像度の問題やループの不自然さを避けるため、CSSとCanvasを用いたプロシージャルな実装が望ましい。

1. **Mesh Gradient:** 4色（Cyan, Magenta, Yellow, Blue）の大きな円形グラデーション（Blob）を作成する。  
2. **Organic Motion:** 各Blobを異なる周期と軌道で動かす。これにはCSSの @keyframes で transform: translate(...) scale(...) を組み合わせるか、JavaScriptでPerlin Noiseを用いて座標を計算する手法が有効である23。  
3. **Edge Masking:** コンテナの端で光が「回り込む」ような表現をするために、mask-image プロパティを使用してアルファマスクを適用する。

### **5.2 Writing Tools Panel Design**

テキストを選択した際に現れる「Writing Tools」パネルは、Apple Intelligenceの主要な接点である。このパネルのデザインは、従来のコンテキストメニューとは一線を画している7。

* **形状:** border-radius: 20px 程度の強い丸みを持つピル型に近い長方形。  
* **マテリアル:** 非常に明るいHUDマテリアル（前述）。  
* **レイアウト:**  
  * **Header:** "Describe your change..." というプロンプト入力欄が上部に固定。  
  * **Body:** Proofread, Rewrite, Summarize などのアクションボタンが並ぶ。  
  * **Interaction:** 各項目はホバーすると、パネルの幅いっぱいに広がるのではなく、わずかに内側にマージンを持った角丸長方形としてハイライトされる（Inset Highlightパターン）。

React実装における要件:  
このパネルは、選択されたテキストの近くにフローティング配置する必要がある。Floating UI (旧 Popper.js) などのライブラリを使用し、テキスト選択範囲（Selection Range）の BoundingClientRect を取得して、適切な位置（通常は選択範囲の下または上）に配置するロジックを実装する。

### **5.3 Text Shimmer & Highlighting**

AIがテキストを校正（Proofread）している間、対象のテキストには特別なハイライト処理が施される。

* **Glowing Underline:** テキストの下に、AIグラデーションカラーのラインが引かれ、左から右へと光が走るアニメーション。  
* **Implementation:** background-image に線形グラデーションを設定し、background-size を 200% にして background-position をアニメーションさせることで、光が流れる効果を作る。

CSS

.ai-proofreading-text {  
  text-decoration: none;  
  background-image: linear-gradient(  
    90deg,   
    var(--ai-gradient-cyan),   
    var(--ai-gradient-magenta),   
    var(--ai-gradient-yellow),   
    var(--ai-gradient-cyan)  
  );  
  background-size: 200% 100%;  
  background-position: 100% 0;  
  \-webkit-background-clip: text;  
  background-clip: text;  
  color: transparent;  
  animation: ai-text-shimmer 2s linear infinite;  
}

ただし、可読性を維持するため、文字色自体を透明にするのではなく、アンダーライン（border-bottom または疑似要素）に対してこのエフェクトを適用するバリエーションも考慮すべきである。

## ---

**第6章：Motion & Interaction Physics (モーションとインタラクション物理)**

macOSの操作感が心地よいのは、すべてのアニメーションが物理法則に基づいているからである。Web特有の「リニアで機械的な動き」を排除し、質量と摩擦を感じさせる「Spring（バネ）」アニメーションを導入する。

### **6.1 Spring Animation Parameters**

Appleの標準的なスプリングアニメーションは、過度なバウンス（跳ね返り）を抑え、素早くターゲットに収束する特性を持つ。interpolatingSpring のパラメータをWebアニメーションライブラリ（Framer MotionやReact Spring）にマッピングする25。

**推奨パラメータ (Framer Motion):**

* **Standard UI Transition (Modals, Panels):**  
  * type: "spring"  
  * stiffness: 250 (剛性：動き出しの速さ)  
  * damping: 25 (減衰：止まりやすさ)  
  * mass: 1 (質量)  
  * **解説:** これにより、キビキビとした動き出し（Snappy）と、吸い付くような停止（Smooth Settling）が両立する。  
* **Bouncy Feedback (Icons, Selection):**  
  * stiffness: 300  
  * damping: 15  
  * **解説:** わずかなオーバーシュート（行き過ぎて戻る動き）を許容し、遊び心とフィードバックの強さを表現する。

### **6.2 Gesture Interactions**

macOSユーザーはトラックパッドでのジェスチャー操作に慣れ親しんでいる。Webアプリにおいても、以下のジェスチャーをサポートすることでネイティブ感を高めることができる。

* **Swipe to Go Back:** 2本指での左右スワイプによるナビゲーション。  
* **Rubber Banding:** コンテンツの端に到達した際に、スクロールが少し行き過ぎて戻るエフェクト。これはCSSの overscroll-behavior: none を設定した上で、JSでスクロール位置に応じた transform を適用することで、よりリッチな抵抗感を演出できる。

## ---

**第7章：Iconography (アイコノグラフィ) \- SF Symbolsの統合**

macOSのUIアイコンは、テキストと同じウェイト（太さ）を持つように設計された「SF Symbols」で統一されている。Webでの実装にはSVGを使用するが、以下の点に注意が必要である。

### **7.1 Optical Weights & Scaling**

SF Symbolsは、隣接するテキストのフォントウェイト（Regular, Medium, Semibold）に合わせて、アイコンの線の太さを自動的に調整する機能を持っている。Webでこれを再現するには、各アイコンのSVGに対して複数のウェイトバリエーションを用意するか、stroke-width プロパティをCSSで制御する必要がある。

* **Rule:** テキストが 13px Regular の場合、アイコンも Regular ウェイト（約1.5px stroke）を使用する。  
* **Alignment:** アイコンとテキストの垂直方向の配置（Vertical Alignment）は、単純な middle ではなく、ベースライン補正を行うことで視覚的な重心を合わせる。

### **7.2 Variable Color Icons**

Sequoiaでは、アイコンの一部に色を付ける「Hierarchical Rendering」や、マルチカラーのアイコンが多用される。SVGの fill プロパティだけでなく、fill-opacity や複数のパスを用いたレイヤー構造を採用し、親要素のカラー変数を継承（currentColor）させつつ、部分的に不透明度を変えることで、リッチな表現を可能にする。

## ---

**第8章：React Implementation Architecture (React実装アーキテクチャ)**

これまでのデザイン定義を、スケーラブルなReactアプリケーションとして実装するための技術的構成を提案する。

### **8.1 Theme Provider Strategy**

カラー、マテリアル、タイポグラフィ、スペーシングなどの全トークンは、Context API と CSS Variables を組み合わせたハイブリッドなProviderで管理する。

JavaScript

// ThemeProvider.jsx  
export const ThemeProvider \= ({ children }) \=\> {  
  const { theme } \= useSystemTheme(); // Detects 'light' or 'dark'

  // CSS変数をルートに注入  
  useEffect(() \=\> {  
    const root \= document.documentElement;  
    Object.entries(themeTokens\[theme\]).forEach((\[key, value\]) \=\> {  
      root.style.setProperty(\`--${key}\`, value);  
    });  
  }, \[theme\]);

  return \<ThemeContext.Provider value\={theme}\>{children}\</ThemeContext.Provider\>;  
};

このアプローチにより、Reactの再レンダリングを最小限に抑えつつ、CSSレベルでの高速なスタイリング変更が可能になる。

### **8.2 Component Composition Patterns**

ボタンやカードなどのコンポーネントは、AppleのHIGに準拠したバリエーション（Primary, Secondary, Ghost）をPropsとして受け取る設計とするが、同時に内部構造を柔軟に変更できるよう「Compound Components」パターンを採用する。

例：Sidebar コンポーネント

JavaScript

\<Sidebar\>  
  \<Sidebar.Header\>  
    \<SearchField placeholder\="Search" /\>  
  \</Sidebar.Header\>  
  \<Sidebar.Section title\="Favorites"\>  
    \<Sidebar.Item icon\={\<HomeIcon /\>} label="Home" active /\>  
    \<Sidebar.Item icon\={\<ClockIcon /\>} label="Recents" /\>  
  \</Sidebar.Section\>  
\</Sidebar\>

このように、構造を明示的に記述させることで、開発者は階層構造（Hierarchy）を意識しながらUIを構築できるようになる。

## ---

**第9章：Accessibility (アクセシビリティ) \- すべての人のためのデザイン**

Appleのデザインシステムにおいて、アクセシビリティは後付けの機能ではなく、デザインの根幹である。Web実装においても、WCAG準拠はもちろんのこと、macOS特有のフォーカス体験を再現する。

### **9.1 The "Halo" Focus Ring**

macOSのフォーカスリングは、単なる青い枠線ではない。要素の形状（角丸）に完全に追従し、外側にぼんやりと光る「ハロー（光輪）」効果を持つ。

CSS

:focus\-visible {  
  outline: none;  
  box-shadow:   
    0 0 0 1px \#FFFFFF, /\* Inner white stroke for contrast \*/  
    0 0 0 4px rgba(0, 122, 255, 0.5); /\* Outer glowing ring \*/  
  transition: box-shadow 0.2s ease-out;  
}

**Insight:** 内側に白（ダークモードでは黒）の細い線を入れることで、背景色が青に近い場合でも視認性を確保する（Double-Borderテクニック）28。

### **9.2 Reduced Transparency & Motion**

視覚過敏や乗り物酔いを起こしやすいユーザーのために、OSの設定（「透明度を下げる」「視差効果を減らす」）を検知し、スタイルを適応させる。

* @media (prefers-reduced-motion: reduce): すべてのスプリングアニメーションをオフにするか、シンプルなフェード（Opacity transition）に置き換える。  
* @media (prefers-reduced-transparency: reduce): backdrop-filter を無効にし、不透明な背景色を適用する。これにより、可読性が劇的に向上する。

## ---

**結論：Towards the Future of Interfaces**

本デザインシステム定義書は、macOS SequoiaとApple Intelligenceが提示する「静的な情報の枠を超えた、動的で知的なインターフェイス」をWeb上で具現化するための道標である。ReactとCSSの最新機能を駆使し、光（Material）、色（Intelligence Gradient）、動き（Spring Physics）を高度に融合させることで、Webアプリケーションはネイティブアプリとの境界を融解させることができる。

開発者は、このシステムを用いることで、単に「Appleっぽい」見た目を作るだけでなく、ユーザーが直感的に理解し、心地よく操作できる、真に人間中心的な（Human Interface）体験を創出することができるだろう。技術の進化と共に、この定義書もまた、Liquid Glassのように柔軟に形を変え、進化し続ける必要がある。

---

**免責事項:** 本レポートは、2026年1月時点でのmacOS 15 (Sequoia) およびApple Intelligenceのベータ版挙動、公開されているHIGの分析に基づいています。Appleのデザインは予告なく変更される可能性があります。

### **引用ソース一覧**

1 HIG Principles & Anatomy  
8 Semantic Tokens  
2 Material Physics & Blur  
20 AI Animation & Math  
15 Window Layout & Corners  
25 Motion Physics  
11 Typography Strategy  
17 Layout Metrics  
7 Writing Tools Patterns  
28 Accessibility Focus

#### **引用文献**

1. Human Interface Guidelines | Apple Developer Documentation, 1月 4, 2026にアクセス、 [https://developer.apple.com/design/human-interface-guidelines](https://developer.apple.com/design/human-interface-guidelines)  
2. backdrop-filter \- CSS \- MDN Web Docs, 1月 4, 2026にアクセス、 [https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)  
3. Vibrancy? · Issue \#293 · felixhageloh/uebersicht \- GitHub, 1月 4, 2026にアクセス、 [https://github.com/felixhageloh/uebersicht/issues/293](https://github.com/felixhageloh/uebersicht/issues/293)  
4. Recreating Apple's Liquid Glass Effect with Pure CSS \- DEV Community, 1月 4, 2026にアクセス、 [https://dev.to/kevinbism/recreating-apples-liquid-glass-effect-with-pure-css-3gpl](https://dev.to/kevinbism/recreating-apples-liquid-glass-effect-with-pure-css-3gpl)  
5. Apple Graphic Color Scheme \- Palettes \- SchemeColor.com, 1月 4, 2026にアクセス、 [https://www.schemecolor.com/apple-graphic.php](https://www.schemecolor.com/apple-graphic.php)  
6. How to create Apple Intelligence Effect \- React Native Animated Glow, 1月 4, 2026にアクセス、 [https://reactnativeglow.com/tutorials/apple-intelligence-glow](https://reactnativeglow.com/tutorials/apple-intelligence-glow)  
7. Use Writing Tools with Apple Intelligence on Mac, 1月 4, 2026にアクセス、 [https://support.apple.com/guide/mac-help/find-the-right-words-with-writing-tools-mchldcd6c260/mac](https://support.apple.com/guide/mac-help/find-the-right-words-with-writing-tools-mchldcd6c260/mac)  
8. Update 1: Tokens, variables, and styles – Figma Learn \- Help Center, 1月 4, 2026にアクセス、 [https://help.figma.com/hc/en-us/articles/18490793776023-Update-1-Tokens-variables-and-styles](https://help.figma.com/hc/en-us/articles/18490793776023-Update-1-Tokens-variables-and-styles)  
9. Introduction | Latest \- Backbase Design System, 1月 4, 2026にアクセス、 [https://designsystem.backbase.com/latest/design-tokens/semantic-colors/introduction-K7Gq5Ylx](https://designsystem.backbase.com/latest/design-tokens/semantic-colors/introduction-K7Gq5Ylx)  
10. Standard colors | Apple Developer Documentation, 1月 4, 2026にアクセス、 [https://developer.apple.com/documentation/uikit/standard-colors?language=objc](https://developer.apple.com/documentation/uikit/standard-colors?language=objc)  
11. System font stack CSS organized by typeface classification for every modern OS \- GitHub, 1月 4, 2026にアクセス、 [https://github.com/system-fonts/modern-font-stacks](https://github.com/system-fonts/modern-font-stacks)  
12. systemfontstack, 1月 4, 2026にアクセス、 [https://systemfontstack.com/](https://systemfontstack.com/)  
13. How to use Apple's San Francisco font on a webpage \- Stack Overflow, 1月 4, 2026にアクセス、 [https://stackoverflow.com/questions/32660748/how-to-use-apples-san-francisco-font-on-a-webpage](https://stackoverflow.com/questions/32660748/how-to-use-apples-san-francisco-font-on-a-webpage)  
14. Fonts \- Apple Developer, 1月 4, 2026にアクセス、 [https://developer.apple.com/fonts/](https://developer.apple.com/fonts/)  
15. Blog \- Tahoe Window Corners \- Michael Tsai, 1月 4, 2026にアクセス、 [https://mjtsai.com/blog/2025/10/16/tahoe-window-corners/](https://mjtsai.com/blog/2025/10/16/tahoe-window-corners/)  
16. Reclaiming the Screen: A Developer's Fix for macOS 26's Corners \- Medium, 1月 4, 2026にアクセス、 [https://medium.com/@makalin/reclaiming-the-screen-a-developers-fix-for-macos-26-s-corners-a28844a0974d](https://medium.com/@makalin/reclaiming-the-screen-a-developers-fix-for-macos-26-s-corners-a28844a0974d)  
17. When will macOS Fix Window Button Spacing? \- Reddit, 1月 4, 2026にアクセス、 [https://www.reddit.com/r/MacOS/comments/1mb0xkq/when\_will\_macos\_fix\_window\_button\_spacing/](https://www.reddit.com/r/MacOS/comments/1mb0xkq/when_will_macos_fix_window_button_spacing/)  
18. Incorrect padding around window buttons on Mac app \- Supernotes Community, 1月 4, 2026にアクセス、 [https://community.supernotes.app/t/incorrect-padding-around-window-buttons-on-mac-app/3434](https://community.supernotes.app/t/incorrect-padding-around-window-buttons-on-mac-app/3434)  
19. Default window-padding-x should align with macOS traffic lights \#3174 \- GitHub, 1月 4, 2026にアクセス、 [https://github.com/ghostty-org/ghostty/discussions/3174](https://github.com/ghostty-org/ghostty/discussions/3174)  
20. Is the the new Siri animation just a looping video file, or is it actually procedural? \- Reddit, 1月 4, 2026にアクセス、 [https://www.reddit.com/r/ios/comments/mdqnzb/is\_the\_the\_new\_siri\_animation\_just\_a\_looping/](https://www.reddit.com/r/ios/comments/mdqnzb/is_the_the_new_siri_animation_just_a_looping/)  
21. iOS Siri Animation Tutorial | After Effects \- YouTube, 1月 4, 2026にアクセス、 [https://www.youtube.com/watch?v=PZgxMqC079I](https://www.youtube.com/watch?v=PZgxMqC079I)  
22. How To Use the new Apple Intelligence Writing Tools\!\! \- YouTube, 1月 4, 2026にアクセス、 [https://www.youtube.com/watch?v=hzKA-5Trvuo](https://www.youtube.com/watch?v=hzKA-5Trvuo)  
23. 10 CSS Blob Effect Examples \- Subframe, 1月 4, 2026にアクセス、 [https://www.subframe.com/tips/css-blob-effect-examples](https://www.subframe.com/tips/css-blob-effect-examples)  
24. How to use Writing Tools with Apple Intelligence, 1月 4, 2026にアクセス、 [https://support.apple.com/en-us/121582](https://support.apple.com/en-us/121582)  
25. interpolatingSpring(mass:stiffness:damping:initialVelocity:) \- Apple Developer, 1月 4, 2026にアクセス、 [https://developer.apple.com/documentation/swiftui/animation/interpolatingspring(mass:stiffness:damping:initialvelocity:)](https://developer.apple.com/documentation/swiftui/animation/interpolatingspring\(mass:stiffness:damping:initialvelocity:\))  
26. Spring | Apple Developer Documentation, 1月 4, 2026にアクセス、 [https://developer.apple.com/documentation/SwiftUI/Spring](https://developer.apple.com/documentation/SwiftUI/Spring)  
27. Effortless UI Spring Animations: A Two-Parameter Approach, 1月 4, 2026にアクセス、 [https://www.kvin.me/posts/effortless-ui-spring-animations](https://www.kvin.me/posts/effortless-ui-spring-animations)  
28. What is \-webkit-focus-ring-color? \- Stack Overflow, 1月 4, 2026にアクセス、 [https://stackoverflow.com/questions/7538771/what-is-webkit-focus-ring-color](https://stackoverflow.com/questions/7538771/what-is-webkit-focus-ring-color)  
29. Color | Apple Developer Documentation, 1月 4, 2026にアクセス、 [https://developer.apple.com/design/human-interface-guidelines/color](https://developer.apple.com/design/human-interface-guidelines/color)  
30. Toolbars | Apple Developer Documentation, 1月 4, 2026にアクセス、 [https://developer.apple.com/design/human-interface-guidelines/toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)  
31. Sidebars | Apple Developer Documentation, 1月 4, 2026にアクセス、 [https://developer.apple.com/design/human-interface-guidelines/sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars)  
32. Design tokens – Material Design 3, 1月 4, 2026にアクセス、 [https://m3.material.io/foundations/design-tokens](https://m3.material.io/foundations/design-tokens)