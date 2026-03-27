# バグ報告書：HTMLアーティファクトにおけるチャート表示不具合について

## 1. 概要

HTMLアーティファクト内に複数のチャート（Chart.js）が含まれる場合、アーティファクトパネル内および印刷プレビューにおいてグラフが正しく表示されない事象が発生した。本報告書では、その発生原因の分析と実施した対策について記録する。

## 2. 発生事象の詳細

1. **パネル内表示の不具合**: アーティファクトパネルでドキュメントを表示した際、チャートが含まれるページ（6ページ、7ページ等）に移動しても、キャンバスが白紙のままでグラフが描画されない。
2. **印刷プレビューの不具合**: パネル右上のメニューから「印刷 / PDF」を選択して表示されるプレビュー画面において、すべてのチャートが欠落した状態で表示される。

## 3. 根本原因の分析

本不具合は、以下の3つの要因が重なったことで発生した。

### A. ページ分割による要素の分離（iframe化）

`ArtifactPanel` はA4ドキュメントのレイアウトを維持するため、HTMLを `page-break-after: always` の位置で分割し、ページごとに独立した `iframe` として描画する。
元のHTMLに含まれていた初期化スクリプトは、「ドキュメント内のすべてのキャンバス要素が揃っていること」を前提とした一括初期化ロジック（`if (!lineCanvas || !barCanvas ...)`）となっていたため、分割された各 `iframe` 内で実行されると、他ページにある要素が見つからず、初期化が停止（または無限待機）していた。

### B. 非同期描画と同期実行のタイミング競合

印刷処理（`handlePrintHtml`）では、新しいウィンドウを開き、HTMLを `document.write` した直後に `window.print()` を呼び出していた。
`Chart.js` の描画処理や、スクリプトによるキャンバスのポーリング（`requestAnimationFrame`）は非同期で実行されるため、これらが完了する前に同期的な `print()` 呼び出しによってブラウザの実行スレッドがブロックされ、描画が間に合わないままプレビューが生成されていた。

### C. アニメーションによる遅延

`Chart.js` のデフォルト設定では描画にアニメーションが伴うため、スクリプトが開始されてからグラフが完成するまでに一定の時間が必要となる。印刷のような即時性が求められる場面では、この遅延が欠落の要因となった。

## 4. 実施した対策

不具合の解消と安定した描画を実現するため、以下の修正を適用した。

### 1) グラフ初期化ロジックの改善 (Mocks)

- **ファイル**: `src/mocks/artifact_sample_html/sample_a4_document_02.html`
- **内容**: 複数のグラフを一括で初期化するのではなく、各キャンバス要素の存在を個別に確認し、存在するグラフのみを独立して初期化するように修正。
- **アニメーション停止**: 印刷時等の即時描画に対応するため、グラフのオプションに `animation: false` を設定。

```javascript
/* 修正後の初期化ロジック (抜粋) */
function initCharts() {
  if (typeof Chart === 'undefined') {
    requestAnimationFrame(initCharts);
    return;
  }

  // 各チャートIDを独立してチェックし、存在する場合のみ初期化
  const lineCanvas = document.getElementById('chart-sales-trend');
  if (lineCanvas && !lineCanvas.__initialized) {
    lineCanvas.__initialized = true;
    new Chart(lineCanvas, {
      type: 'line',
      options: { animation: false, ... } // アニメーション無効化
      // ...データ定義
    });
  }

  // 他のチャートも同様に独立して実行
  requestAnimationFrame(initCharts); // 継続的なポーリング
}
```

### 2) 実行権限の緩和 (Components)

- **ファイル**: `src/components/Artifacts/ArtifactPanel.jsx`
- **内容**: 分割表示用の `iframe` の `sandbox` 属性に `allow-same-origin` を追加。これにより、CDN（jsdelivr等）からのリソース読み込みの互換性と安定性を向上させた。

```javascript
/* 修正後の iframe 定義 */
<iframe
    ref={(el) => { iframeRefs.current[index] = el; }}
    sandbox="allow-scripts allow-same-origin" // allow-same-origin を追加
    srcDoc={pageHtml}
    // ...
/>
```

### 3) 印刷待機時間の導入 (Components)

- **ファイル**: `src/components/Artifacts/ArtifactPanel.jsx`
- **内容**: 印刷用ウィンドウの `load` イベント発生後、`setTimeout` を用いて **500ms の待機時間** を置いてから `window.print()` を実行するように変更。これにより、非同期の描画処理が完了する時間を確保した。

```javascript
/* 修正後の印刷処理 */
printWindow.addEventListener("load", () => {
    // 非同期のグラフ描画（Chart.js）の完了を待つためにわずかに待機
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500); // 500msのディレイ
});
```

## 5. 今後の対策と推奨事項

今後、エンジニアやAIがHTMLアーティファクトを作成する際は、以下のガイドラインに従うことを推奨する。

- **独立した初期化**: ページ分割（iframe化）を前提とし、特定の要素の有無に依存しない、要素ごとの初期化スクリプトを記述する。
- **描画負荷の考慮**: 印刷・エクスポートが想定される場合、アニメーションを無効化するか、描画完了を待機する仕組みを設ける。
- **ポーリングの活用**: 要素のレンダリングタイミングが前後する場合に備え、`requestAnimationFrame` 等を用いたキャンバスのポーリングを実装する。

以上
