# **Draw.io アーティファクト フロントエンド実装設計書**

## **1\. スコープ範囲**

本実装は、Dify(LLM)によって生成されたDraw.ioのXMLデータを、フロントエンドでリッチにプレビューし、各種形式でエクスポートできるようにするための「受け入れ態勢」の構築を目的とします。

### **含まれるスコープ（In Scope）**

* **パーサーの拡張**: Difyからのレスポンスから artifact\_type: "drawio" を検知し、適切に抽出するロジックの追加（src/utils/responseParser.ts 等の修正）。  
* **Drawioコンポーネントの作成**: Draw.io XMLをレンダリングするためのビューアーコンポーネントと、操作パネルの作成。  
* **エクスポート機能の実装**: XMLデータのクリップボードコピー、生XMLファイル(.drawio)のダウンロード、SVG/PNG画像としてのダウンロード機能。  
* **FEモック環境の構築**: バックエンド（Dify）未接続状態でもUI開発・テストができるよう、scenarios.js にダミーのDraw.ioアーティファクトシナリオを追加。

### **含まれないスコープ（Out of Scope）**

* Dify側のプロンプトエンジニアリングや、ワークフロー・ツールの実装（将来フェーズ）。  
* フロントエンド上での、Draw.ioエディタを用いた「直接的な図の編集機能」（まずはプレビューと保存に特化）。  
* 既存バックエンドAPIのスキーマ変更。

## **2\. 期待されるJSONデータ構造（インターフェース定義）**

ご提示いただいた json\_document の構造をベースに、drawio 用のペイロードを定義します。XMLデータはエスケープされた文字列として artifact\_content に格納される（または artifact\_content.xml に格納される）想定です。

{  
  "answer": "経費精算のスイムレーン図を作成しました。ご確認ください。",  
  "thinking": "申請者、上長、経理部の3つのスイムレーンが必要。条件分岐を含めてXMLを構築する...",  
  "artifact\_title": "経費精算ワークフロー",  
  "artifact\_type": "drawio",  
  "artifact\_content": "\<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?\>\\n\<mxfile host=\\"app.diagrams.net\\" modified=\\"...\\" agent=\\"...\\" version=\\"...\\" type=\\"device\\"\>\\n  \<diagram id=\\"...\\" name=\\"Page-1\\"\>\\n    \<mxGraphModel dx=\\"...\\" dy=\\"...\\" grid=\\"1\\" ...\>\\n      \<root\>\\n        \<mxCell id=\\"0\\" /\>\\n        \<mxCell id=\\"1\\" parent=\\"0\\" /\>\\n        \<\!-- スイムレーンやノードの定義 \--\>\\n      \</root\>\\n    \</mxGraphModel\>\\n  \</diagram\>\\n\</mxfile\>"  
}

※ストリーミングパースの際、artifact\_content 内のXMLタグが途切れていてもクラッシュしないよう、パーサー側で安全な取り回しを行います。

## **3\. コンポーネントアーキテクチャ案**

以下の新規コンポーネントを作成し、既存のアーティファクトシステムに統合します。

### **3.1. DrawioPanel.jsx (新規)**

ArtifactPanel.jsx から artifact.type \=== 'drawio' の場合に呼び出されるメインラッパーです。

* **ヘッダー領域**: アーティファクトのタイトル（artifact\_title）を表示。  
* **ツールバー（アクション群）**:  
  * \[ コピー \]: XML文字列をクリップボードにコピー。  
  * \[ XML保存 \]: .drawio 拡張子でファイルをダウンロード。（**※新規追加要件**）  
  * \[ SVG保存 \]: ベクター画像としてダウンロード。  
  * \[ PNG保存 \]: ラスター画像としてダウンロード。  
  * \[ ズームイン / ズームアウト \]: プレビューの拡縮制御。

### **3.2. DrawioViewer.jsx (新規)**

XMLを実際に描画するコアコンポーネントです。

* **実装アプローチ**: Draw.io公式が提供している GraphViewer.js (Viewer API) を利用し、\<div\> 内にSVG要素として直接レンダリングします。  
* **エラーハンドリング**: XMLのパースエラー（LLMの生成ミスやストリーミング途中など）が発生した場合は、スケルトンまたは「レンダリングエラー」のフォールバックUIを表示します。

## **4\. 保存・エクスポート機能のロジック方針**

1. **XML (.drawio) 保存**  
   * 抽出した artifact\_content (XML文字列) を Blob (application/xml) に変換。  
   * \<a\> タグの download 属性を利用して \[artifact\_title\].drawio として保存。  
2. **SVG保存**  
   * DrawioViewer によって DOM にレンダリングされた \<svg\> 要素を取得。  
   * outerHTML を取得して Blob (image/svg+xml) 化しダウンロード。  
3. **PNG保存**  
   * 取得した SVG文字列を Blob URL に変換し、非表示の \<canvas\> 上で Image オブジェクトとして描画（drawImage）。  
   * canvas.toDataURL("image/png") で取得してダウンロード。

## **5\. FEモックモード用 シナリオ定義 (scenarios.js)**

フロントエンド単体で開発を進めるため、以下のモックシナリオを定義します。

* **トリガーワード**: "スイムレーン図" または "フロー図"  
* **モックの挙動**:  
  1. thinking プロセスがストリーミングで流れる（「Draw.ioのXMLを生成します...」）。  
  2. answer がストリーミングされる。  
  3. 同時に artifact オブジェクトが生成され、事前にハードコードした完全な Draw.io XML文字列が artifact\_content に流し込まれる。  
  4. フロントエンド側でツールバーやズーム、保存機能が正常に動作するかをテスト可能にする。