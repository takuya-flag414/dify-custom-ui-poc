import React, { useState, useEffect } from 'react';
import MermaidViewer from '../../MermaidViewer';
import { detectMermaidType, MERMAID_DIAGRAM_MAP } from '../../../../utils/mermaidHelper';

/**
 * DocMermaid
 * JsonDocument内にMermaidダイアグラムを描画するためのブロックコンポーネントです。
 */
const DocMermaid = ({ block, onSendMessage }) => {
    const [viewerError, setViewerError] = useState(null);
    const content = block?.code || '';

    // コンテンツが更新された場合、エラー情報をリセットする
    useEffect(() => {
        setViewerError(null);
    }, [content]);

    // AIに修正を依頼する処理 (MermaidPanelのロジックを利用)
    const handleFixRequest = () => {
        if (!onSendMessage || !viewerError) return;

        const subType = detectMermaidType(content);
        
        // 図タイプ別の文法アドバイスマップ
        const syntaxAdviceMap = {
            flowchart: `
【フローチャート(graph)の文法ルール】
1. 宣言は \`graph TD\`（上から下）または \`graph LR\`（左から右）で開始する。
2. ノード形状: 処理=[角括弧]、判断={波括弧}、開始/終了=(丸括弧)、サブルーチン=[[二重角括弧]]、DB=[(シリンダー)]。
3. 矢印: \`-->\`（実線）、\`-.->\`（点線）、\`==>\`（太線）、\`-- ラベル -->\`（ラベル付き）。
4. 日本語を含むノードラベルや特殊文字はダブルクォートで囲む（例: \`A["日本語テキスト"]\`）。
`,
            sequence: `
【シーケンス図(sequenceDiagram)の文法ルール】
1. 参加者は \`participant 名前\` または \`actor 名前\` で宣言する。
2. メッセージ矢印: \`A->>B: 内容\`（実線）、\`A-->>B: 内容\`（点線）、\`A->>+B:\` / \`B-->>-A:\`（アクティベーション）。
3. 条件分岐: \`alt 条件 ... else 代替 ... end\`、ループ: \`loop 説明 ... end\`、並行: \`par ... and ... end\`。
4. メモ: \`Note over A,B: 説明\` または \`Note right of A: 説明\`。
`,
            er: `
【ER図(erDiagram)の文法ルール】
1. 関係線: \`ENTITY1 関係記号 ENTITY2 : "ラベル"\`。ラベルは必ずダブルクォートで囲む。
2. 関係記号の例: \`||--o{\`（一対多、必須-省略可）、\`}|--|{\`（多対多、必須）、\`||--||:\`（一対一）。
3. 属性定義: \`エンティティ名 { データ型 カラム名 "制約" }\`。PK/FK などはダブルクォートで囲む。
`,
            gantt: `
【ガントチャート(gantt)の文法ルール】
1. 先頭に \`title タイトル名\` と \`dateFormat YYYY-MM-DD\` を必ず記述する。
2. タスク書式: \`タスク名 : [状態,] [タスクID,] [開始日 または after タスクID,] 期間 または 終了日\`。
3. 状態: \`done\`（完了）、\`active\`（進行中）、\`crit\`（重要）。マイルストーン: \`milestone, ID, 日付, 0d\`。
4. 日付は必ず dateFormat で指定したフォーマット（YYYY-MM-DD）に揃える。
`,
            class: `
【クラス図(classDiagram)の文法ルール】
1. クラス定義: \`class クラス名 { +型 属性名 +メソッド名() }\`。可視性: \`+\`(public), \`-\`(private), \`#\`(protected)。
2. 継承: \`親 <|-- 子\`、実装: \`インタフェース <|.. クラス\`、集約: \`全体 o-- 部分\`、コンポジション: \`全体 *-- 部分\`。
3. ジェネリクス: \`List~型~\` の形式で記述する。
`,
            state: `
【状態遷移図(stateDiagram-v2)の文法ルール】
1. 開始/終了は \`[*]\` で表す（\`[*] --> 状態名\`・\`状態名 --> [*]\`）。
2. 遷移: \`状態A --> 状態B: イベント\`。複合状態（ネスト）: \`state 状態名 { ... }\`。
3. 日本語の状態名に記号が含まれる場合は \`state "日本語名" as state1\` のエイリアスを使用する。
`,
            journey: `
【ジャーニーチャート(journey)の文法ルール】
1. \`title タイトル名\` で図のタイトルを設定する。
2. \`section セクション名\` でフェーズを区切る。
3. ステップ書式: \`ステップ名: 満足度スコア(1〜5の整数): 担当者名\`（担当者は複数可、カンマ区切り）。
`,
            git: `
【Gitグラフ(gitGraph)の文法ルール】
1. \`commit\`、\`branch ブランチ名\`、\`checkout ブランチ名\`、\`merge ブランチ名\` を組み合わせて記述する。
2. コミットオプション: \`commit id: "ID" tag: "タグ" type: NORMAL|REVERSE|HIGHLIGHT\`。
3. デフォルトブランチは \`main\`（明示する場合: \`gitGraph TB:\` など）。
`,
            pie: `
【パイチャート(pie)の文法ルール】
1. 先頭に \`pie\`（または \`pie showData\`）と \`title タイトル名\` を記述する。
2. 各セグメント: \`"ラベル名" : 数値\`（ラベルは必ずダブルクォートで囲む）。
3. 数値は整数または実数。合計が100になる必要はない（割合で自動計算される）。
`,
            requirement: `
【要件図(requirementDiagram)の文法ルール】
1. 要件定義: \`requirement 要件ID { id: 番号  text: "説明（ダブルクォート必須）"  risk: low|medium|high  verifymethod: analysis|inspection|test|demonstration }\`。
2. 要素定義: \`element 要素ID { type: 要素種別 }\`。★重要★ \`element\` ブロック内に \`text:\` 属性は絶対に使用しない（エラーになる）。参照文書は \`docref: "文書名"\` で記述する。
3. 関係記述: \`要素ID - 関係名 -> 要件ID\` のみ使用する。★重要★ \`-->\` などの矢印記号は絶対に使用しない。
   - 使用可能な関係名: satisfies, relates, derives, refines, verifies, traces, contains。
4. IDは英数字のみ（例: R1, E1, req_login）。日本語IDは使用しない。
`,
            c4: `
【C4図(C4Context/C4Container/C4Component)の文法ルール】
1. 定義は必ず関数呼び出し形式を使用する（波括弧 { } によるブロック形式は使用しない）:
   - Person(id, "名前", "説明") または Person_Ext(id, "名前", "説明")
   - System(id, "名前", "説明") または System_Ext(id, "名前", "説明")
   - Container(id, "名前", "技術", "説明")
   - Component(id, "名前", "技術", "説明")
2. 関係: \`Rel(送り元ID, 送り先ID, "説明")\` のみ使用する。★重要★ \`-->\` などの矢印記号は絶対に使用しない。
3. タイトル: \`title タイトル名\`。バウンダリ: \`System_Boundary(id, "名前") { ... }\`。
`,
            architecture: `
【アーキテクチャ図(architecture-beta)の文法ルール】
1. グループ: \`group グループID(アイコン名)[タイトル]\`（入れ子: 末尾に \`in 親ID\`）。
2. サービス: \`service サービスID(アイコン名)[タイトル]\`（グループ内: 末尾に \`in グループID\`）。
3. 利用可能なアイコン: cloud, database, disk, internet, server のみ。
4. エッジ: \`サービスID:方向 --> 方向:サービスID\`（例: \`web:R --> L:db\`）。方向は T/B/L/R。
5. ★重要★ ラベル \`[ ]\` の中には改行・コロン・括弧・スラッシュなどの記号を絶対に含めない。
`,
        };

        const syntaxAdvice = syntaxAdviceMap[subType] || '';

        const promptText = `生成されたMermaidダイアグラムのレンダリング中に以下のエラーが発生しました。文法を修正し、正しいMermaidコードを再生成してください。
${syntaxAdvice}
■ 発生したエラーメッセージ：
\`\`\`
${viewerError}
\`\`\`

■ エラーが発生した元のソースコード：
\`\`\`mermaid
${content}
\`\`\`
`;
        onSendMessage(promptText);
    };

    return (
        <div className="doc-mermaid-container" style={{ margin: '32px 0', width: '100%' }}>
            {viewerError ? (
                <div className="mermaid-error-panel" style={{
                    border: '1px solid #fee2e2',
                    backgroundColor: '#fef2f2',
                    borderRadius: '8px',
                    padding: '16px'
                }}>
                    <div className="mermaid-error-banner" style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: '#b91c1c', display: 'flex', alignItems: 'center', fontSize: '14px', margin: '0 0 8px 0' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            レンダリングエラーが発生しました
                        </h4>
                        <p style={{ color: '#7f1d1d', fontSize: '13px', margin: 0 }}>
                            ダイアグラムのレンダリング中にエラーが検出されました。構文（シンタックス）に不整合がある可能性があります。
                        </p>
                        <pre style={{
                            backgroundColor: '#ffffff',
                            color: '#b91c1c',
                            padding: '12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            overflowX: 'auto',
                            marginTop: '12px',
                            border: '1px solid #fca5a5'
                        }}>
                            <code>{viewerError}</code>
                        </pre>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                            onClick={handleFixRequest}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                            AIに修正を依頼する
                        </button>
                    </div>
                </div>
            ) : (
                <div 
                    className="doc-mermaid-viewer-wrapper" 
                    style={{ 
                        width: '100%', 
                        display: 'flex', 
                        justifyContent: 'center'
                    }}
                >
                    <MermaidViewer chartCode={content} onError={setViewerError} />
                </div>
            )}
        </div>
    );
};

export default DocMermaid;
