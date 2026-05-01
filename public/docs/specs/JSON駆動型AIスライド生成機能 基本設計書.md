# **JSON駆動型AIスライド生成機能 基本設計書（フロントエンド）**

## **1\. システム構成概要**

Dify等から受け取る ArtifactData の artifact\_type に応じて、既存のHTML描画ルートとは別に、新しいJSON描画ルートへ分岐させます。

### **1.1 コンポーネントツリー**

App (または Artifactを表示する親コンポーネント)  
 ├─ \[条件分岐: artifact\_type \=== 'html\_slide'\]  
 │   └─ ArtifactPanel (既存: HTML描画)  
 │  
 └─ \[条件分岐: artifact\_type \=== 'json\_slide'\]  
     └─ PresentationPanel (新規: スライド表示のルート)  
         ├─ ErrorBoundary (スライド描画クラッシュ防止用)  
         │   └─ SlideRenderer (表示中のスライドを動的レンダリング)  
         │       ├─ TitleSlide  
         │       ├─ ContentSlide  
         │       ├─ SplitSlide  
         │       └─ QuoteSlide  
         │  
         └─ SlideNavigation (ページ送りコントロール)

## **2\. データモデル定義（TypeScript Interfaces）**

要件定義書で示されたJSONスキーマを、フロントエンドで扱うためのTypeScript型定義に落とし込みます。

// スライド全体のデータ構造  
export interface PresentationData {  
  presentation\_title: string;  
  theme: 'corporate-modern' | 'creative-dark' | 'minimal-light';  
  slides: SlideData\[\];  
}

// 各スライドのベース構造  
export interface SlideData {  
  id: string;  
  layout\_type: SlideLayoutType;  
  content: SlideContent;  
}

// サポートするレイアウトタイプ  
export type SlideLayoutType \= 'title\_slide' | 'content\_slide' | 'split\_slide' | 'quote\_slide';

// コンテンツのユニオン型（レイアウトに依存）  
export type SlideContent \=   
  | TitleSlideContent   
  | ContentSlideContent   
  | SplitSlideContent   
  | QuoteSlideContent;

// \--- 各レイアウトのコンテンツ詳細 \---

export interface TitleSlideContent {  
  title: string;  
  subtitle?: string;  
  author?: string;  
}

export interface ContentSlideContent {  
  title: string;  
  body\_text?: string;  
  bullet\_points?: string\[\];  
}

export interface SplitSlideContent {  
  title: string;  
  left\_column: string\[\];  
  right\_column: string\[\];  
}

export interface QuoteSlideContent {  
  quote: string;  
  author?: string;  
}

## **3\. コンポーネント設計詳細**

### **3.1 PresentationPanel (親コンポーネント)**

* **役割**: 新規Artifactを受け取り、JSONのパース、スライドのページング状態の管理、テーマの適用を行う。  
* **Props**:  
  * artifactContent: string (LLMから渡される生のJSON文字列)  
* **State**:  
  * currentSlideIndex: number (初期値: 0\)  
  * parsedData: PresentationData | null  
  * parseError: string | null (パース失敗時のフォールバック用)  
* **処理**:  
  * マウント時（または artifactContent 更新時）に JSON.parse を実行し parsedData に格納。  
  * 最上位の div に、16:9のアスペクト比を維持するCSS (aspect-video, w-full, max-w-4xl 等) を設定。  
  * theme に応じて特定のCSSクラス (例: theme-corporate-modern) をコンテナに付与。

### **3.2 SlideNavigation**

* **役割**: ユーザーがスライドを前後に移動するためのUI。  
* **Props**:  
  * currentIndex: number  
  * totalSlides: number  
  * onNext: () \=\> void  
  * onPrev: () \=\> void

### **3.3 SlideRenderer**

* **役割**: layout\_type を評価し、適切な具象コンポーネント（TitleSlide 等）へ処理を委譲する。  
* **Props**:  
  * slide: SlideData  
* **処理**:  
  * switch (slide.layout\_type) 文によるコンポーネントの分岐。  
  * 対応しない layout\_type の場合は、コンソールに警告を出力し、デフォルト表示（あるいはエラー表示）を行う。

## **4\. スタイリング・テーマ設計（Tailwind CSS）**

CSS変数とTailwindの設定を活用し、JSONの theme 指定でデザインが一変する仕組みを構築します。

### **4.1 CSS変数の定義方針 (グローバルCSSまたはモジュールCSS)**

/\* theme-corporate-modern の例 \*/  
.theme-corporate-modern {  
  \--slide-bg: \#ffffff;  
  \--slide-text-primary: \#1e293b; /\* slate-800 \*/  
  \--slide-text-secondary: \#64748b; /\* slate-500 \*/  
  \--slide-accent: \#2563eb; /\* blue-600 \*/  
  \--slide-font: 'Inter', sans-serif;  
}

### **4.2 Tailwindクラスの適用**

各スライドコンポーネント内では、上記のCSS変数を参照するカスタムカラークラス、またはインラインのCSS変数参照を用いてスタイリングを行います。

## **5\. アニメーション設計（Framer Motion）**

framer-motion を用いて実装します。

* **ページ遷移**: \<AnimatePresence mode="wait"\> で囲み、フェードイン・スライドインのアニメーションを設定。  
* **要素のスタッガー**: リスト要素などは variants を活用し、親の transition: { staggerChildren: 0.1 } によって順次表示（時間差フェードイン）させる。

## **6\. レイアウト安全対策（耐障害性UI設計）**

LLM生成データの文字数ブレによるレイアウト崩壊を防ぐため、コンポーネント実装において以下の防御的設計を徹底します。

### **6.1 Flex/Gridによる相対的レイアウト**

* 絶対座標（absolute）での配置は避け、flex または grid をベースとする。  
* タイトル等の固定領域には shrink-0 を付与し、コンテンツ領域には flex-grow を付与して余白を適切に消費させる。

### **6.2 オーバーフロー制御と自動縮小**

* **テキスト省略**: タイトルなど行数を制限すべき箇所にはTailwindの line-clamp-2 等を使用し、溢れた場合は三点リーダー（...）にする。  
* **コンテナクエリ**: 親要素（またはスライド全体）に @container を付与し、要素内の文字量やコンテナ幅に応じてフォントサイズ（@2xl:text-3xl 等）を動的に調整する。  
* **フェイルセーフのスクロール**: 最終手段として、コンテンツ領域のラッパーに overflow-y-auto を設定し、はみ出したテキストも閲覧可能にする（スクロールバーのスタイルは目立たないように調整）。

### **6.3 防御的プログラミング（Null安全と型チェック）**

* **オプショナルチェーンとデフォルト値**:  
  各コンポーネントのレンダリング部で、{content?.title ?? "タイトル未設定"} のようにNullish Coalescingを活用する。  
* **配列の安全チェック**:  
  bullet\_points などを .map() する際は、事前に Array.isArray(content?.bullet\_points) の判定を行う、あるいは (content?.bullet\_points || \[\]).map(...) の形式を徹底し、TypeErrorを回避する。

## **7\. エラーハンドリング方針**

1. **JSONパースエラー**:  
   PresentationPanel 内でJSON文字列のパースを try-catch でラップ。失敗時は「スライドデータの読み込みに失敗しました」というメッセージを含むフォールバックUIを表示する。  
2. **描画クラッシュの局所化**:  
   SlideRenderer を React の ErrorBoundary でラップする。特定のレイアウトコンポーネント内部で予期せぬ実行時エラーが発生した場合でも、アプリケーション全体を停止させず、そのスライドのみエラーメッセージを表示させる仕組みとする。