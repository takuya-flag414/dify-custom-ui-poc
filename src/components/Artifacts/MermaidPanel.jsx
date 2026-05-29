// src/components/Artifacts/MermaidPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MermaidViewer from './MermaidViewer';
import { detectMermaidType, MERMAID_DIAGRAM_MAP } from '../../utils/mermaidHelper';
import './ArtifactPanel.css'; // ボタン、ヘッダー、背景などの共通CSSを共有
import { getArtifactIcon, getArtifactColor } from '../../utils/artifactIconHelper';
import './MermaidPanel.css';  // Mermaid専用レイアウトのCSS

// アイコンコンポーネントの定義
const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const CopyIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const DiagramIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
);

const ZoomInIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="11" y1="8" x2="11" y2="14"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
);

const ZoomOutIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
);

const DownloadIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const ImageIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
);

const MoreIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="19" cy="12" r="1"></circle>
        <circle cx="5" cy="12" r="1"></circle>
    </svg>
);

/**
 * MermaidPanel - Mermaidダイアグラム専用表示パネル
 */
const MermaidPanel = ({ isOpen, onClose, artifact, streamingMessage, onSendMessage }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [zoomOffset, setZoomOffset] = useState(0);
    const [panelWidth, setPanelWidth] = useState(0);
    const [viewerError, setViewerError] = useState(null); // レンダリングエラーを保持するステート

    const panelRef = useRef(null);

    // 生成中かどうかのフラグ
    const isGeneratingArtifact = streamingMessage && streamingMessage.isStreaming && streamingMessage.artifact;
    const shouldShowPanel = artifact || isGeneratingArtifact;

    // ストリーミング中または確定済みのコンテンツの取得
    const streamingArtifact = isGeneratingArtifact ? streamingMessage.artifact : null;
    const displayContent = streamingArtifact?.artifact_content || artifact?.content || '';
    const displayTitle = streamingArtifact?.artifact_title || artifact?.title || artifact?.label || '無題のダイアグラム';
    const displayType = streamingArtifact?.artifact_type || artifact?.type || 'mermaid_generic';
    const displayFileName = artifact?.fileName || null; // ファイル名を取得

    // コンテンツが更新された場合、エラー情報をリセットする
    useEffect(() => {
        setViewerError(null);
    }, [displayContent]);

    // ダイアグラム種別の解決 (日本語マッピング)
    let subType = 'generic';
    if (displayType.startsWith('mermaid_')) {
        subType = displayType.substring(8);
    } else {
        subType = detectMermaidType(displayContent);
    }
    const typeInfo = MERMAID_DIAGRAM_MAP[subType] || MERMAID_DIAGRAM_MAP.generic;

    // パネル幅の監視と自動ズーム (Auto Fit)
    useEffect(() => {
        const panelEl = panelRef.current;
        if (!panelEl) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                setPanelWidth(entry.contentRect.width);
            }
        });

        resizeObserver.observe(panelEl);
        return () => resizeObserver.disconnect();
    }, [shouldShowPanel, isOpen]);

    // ウィンドウ幅に応じた最適な拡大率の再計算
    useEffect(() => {
        if (panelWidth === 0) return;

        // パネル左右の余白等を考慮した有効幅
        const availableWidth = panelWidth - 48;
        const baseWidth = 720; // 基準サイズ

        let optimalZoom = Math.floor((availableWidth / baseWidth) * 100);
        let finalZoom = optimalZoom + zoomOffset;

        // ズーム幅を制限 (最小30%〜最大250%)
        finalZoom = Math.max(30, Math.min(250, finalZoom));
        setZoomLevel(finalZoom);
    }, [panelWidth, zoomOffset]);

    // 拡大・縮小・リセット処理
    const handleZoomIn = () => {
        setZoomOffset(prev => Math.min(150, prev + 10));
    };

    const handleZoomOut = () => {
        setZoomOffset(prev => Math.max(-80, prev - 10));
    };

    const handleZoomReset = () => {
        setZoomOffset(0);
    };

    // クリップボードへのコピー処理 (Mermaidコードブロックとしてコピー)
    const handleCopy = async () => {
        if (isCopied) return;
        try {
            const copyText = `# ${displayTitle}\n\n\`\`\`mermaid\n${displayContent}\n\`\`\``;
            await navigator.clipboard.writeText(copyText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('コピーに失敗しました:', err);
        }
    };

    // ダウンロード時のベース名決定処理
    const getDownloadFileName = () => {
        if (displayFileName) {
            // 拡張子（.mmd, .md等）があれば除去したベース名にする
            return displayFileName.replace(/\.[^/.]+$/, "");
        }
        return displayTitle;
    };

    // Markdown形式でのダウンロード処理
    const handleDownloadMarkdown = () => {
        try {
            const baseName = getDownloadFileName();
            const safeTitle = baseName.replace(/[\\/:*?"<>|]/g, '_');
            const fileContent = `# ${displayTitle}\n\n\`\`\`mermaid\n${displayContent}\n\`\`\``;
            const blob = new Blob([fileContent], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safeTitle}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setIsMenuOpen(false);
        } catch (err) {
            console.error('ダウンロードに失敗しました:', err);
        }
    };

    // SVG形式でのダウンロード処理
    const handleDownloadSVG = () => {
        try {
            const svgElement = document.querySelector('.mermaid-panel-content svg');
            if (!svgElement) return;

            // SVGのHTML構造をシリアライズ化して文字列データにする
            const svgString = new XMLSerializer().serializeToString(svgElement);
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const baseName = getDownloadFileName();
            const safeTitle = baseName.replace(/[\\/:*?"<>|]/g, '_');
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safeTitle}.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setIsMenuOpen(false);
        } catch (err) {
            console.error('SVGのダウンロードに失敗しました:', err);
        }
    };

    // 高解像度PNG形式でのダウンロード処理 (3倍サイズ)
    const handleDownloadPNG = () => {
        try {
            const svgElement = document.querySelector('.mermaid-panel-content svg');
            if (!svgElement) return;

            const baseName = getDownloadFileName();
            const safeTitle = baseName.replace(/[\\/:*?"<>|]/g, '_');
            
            // 1. オリジナルのサイズを算出
            const svgRect = svgElement.getBoundingClientRect();
            const viewBox = svgElement.getAttribute('viewBox');
            let width = svgRect.width || 800;
            let height = svgRect.height || 600;
            
            if (viewBox) {
                const parts = viewBox.split(' ');
                if (parts.length === 4) {
                    width = parseFloat(parts[2]);
                    height = parseFloat(parts[3]);
                }
            }

            // 2. スケール係数を設定してCanvasサイズを拡大 (高精細化)
            const scale = 3;
            const canvas = document.createElement('canvas');
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');

            // 3. 背景色は常に白 (Mermaidレンダリングがライト固定であるため)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 4. SVG文字列からImageオブジェクト経由でCanvasに描画
            let svgString = new XMLSerializer().serializeToString(svgElement);
            
            // CORS汚染防止のため、外部リソースへの@importを除外
            svgString = svgString.replace(/@import\s+url\([^)]+\);?/gi, '');

            // Blob URLによるCanvasのCORS汚染を防ぐため、Base64形式のData URIに変換
            const base64Svg = window.btoa(unescape(encodeURIComponent(svgString)));
            const dataUrl = 'data:image/svg+xml;base64,' + base64Svg;

            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // 5. DataURLを生成してダウンロードを実行
                const pngUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = pngUrl;
                a.download = `${safeTitle}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                setIsMenuOpen(false);
            };
            img.src = dataUrl;
        } catch (err) {
            console.error('PNGのダウンロードに失敗しました:', err);
        }
    };

    // AIに修正を依頼する処理
    const handleFixRequest = () => {
        if (!onSendMessage || !viewerError) return;

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
${displayContent}
\`\`\`
`;
        onSendMessage(promptText);
    };

    return (
        <AnimatePresence>
            {shouldShowPanel && (
                <motion.div
                    ref={panelRef}
                    className={`artifact-panel mermaid-panel ${isOpen ? 'open' : ''} ${isGeneratingArtifact ? 'ai-generating' : ''}`}
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: isOpen ? 0 : '100%', opacity: isOpen ? 1 : 0 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{
                        type: 'spring',
                        stiffness: 250,
                        damping: 25,
                        mass: 1
                    }}
                >
                    {/* ヘッダーセクション */}
                    <div className="artifact-header">
                        <div className="artifact-title-group">
                            <div className="artifact-icon" style={{ backgroundColor: `${getArtifactColor(displayType)}15` }}>
                                {(() => {
                                    const Icon = getArtifactIcon(displayType);
                                    return <Icon size={20} style={{ color: getArtifactColor(displayType) }} />;
                                })()}
                            </div>
                            <div className="artifact-header-info">
                                <span className="artifact-title" title={displayFileName || displayTitle}>
                                    {displayFileName || displayTitle}
                                    {isGeneratingArtifact && <span className="typing-cursor"></span>}
                                </span>
                                <span className="artifact-type-badge-panel">
                                    {typeInfo.label}
                                    {displayFileName && ` (${displayTitle})`}
                                </span>
                            </div>
                        </div>

                        <div className="artifact-actions">
                            {/* ズームコントロール */}
                            <div className="artifact-zoom-controls">
                                <button className="zoom-btn" onClick={handleZoomOut} title="縮小">
                                    <ZoomOutIcon />
                                </button>
                                <button
                                    className="zoom-label-btn auto-fit-active"
                                    onClick={handleZoomReset}
                                    title="フィット (Auto Fit)"
                                >
                                    {zoomLevel}%
                                </button>
                                <button className="zoom-btn" onClick={handleZoomIn} title="拡大">
                                    <ZoomInIcon />
                                </button>
                            </div>

                            <div style={{ width: 1, height: 20, backgroundColor: 'var(--color-border)', margin: '0 4px' }} />

                            {/* アクションメニュー */}
                            <div className="artifact-action-group">
                                <button
                                    className={`artifact-action-btn primary action-more-btn ${isMenuOpen ? 'active' : ''}`}
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    title="アクション"
                                    disabled={isGeneratingArtifact}
                                >
                                    <MoreIcon />
                                </button>

                                {isMenuOpen && (
                                    <>
                                        <div className="artifact-menu-backdrop" onClick={() => setIsMenuOpen(false)} />
                                        <div className="artifact-actions-menu">
                                            <button className="artifact-menu-item" onClick={handleDownloadMarkdown}>
                                                <DownloadIcon />
                                                <span>Markdown (.md)</span>
                                            </button>
                                            <button className="artifact-menu-item" onClick={handleDownloadSVG}>
                                                <DownloadIcon />
                                                <span>ベクター画像 (.svg)</span>
                                            </button>
                                            <button className="artifact-menu-item" onClick={handleDownloadPNG}>
                                                <ImageIcon />
                                                <span>高画質画像 (.png)</span>
                                            </button>
                                            <div className="artifact-menu-divider" />
                                            <button
                                                className={`artifact-menu-item ${isCopied ? 'copied' : ''}`}
                                                onClick={handleCopy}
                                                disabled={isCopied}
                                            >
                                                {isCopied ? <CheckIcon /> : <CopyIcon />}
                                                <span>{isCopied ? 'コピー完了' : 'コードをコピー'}</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div style={{ width: 1, height: 20, backgroundColor: 'var(--color-border)', margin: '0 4px' }} />

                            <button className="artifact-close-btn" onClick={onClose} title="閉じる">
                                <CloseIcon />
                            </button>
                        </div>
                    </div>

                    {/* ダイアグラムの描画ボディ部 (紙の背景を持たず直接描画) */}
                    <div className="artifact-body mermaid-panel-body" style={{ overflow: 'auto' }}>
                        {viewerError ? (
                            <div className="mermaid-error-panel">
                                <div className="mermaid-error-banner">
                                    <h4 className="mermaid-error-title">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                            <line x1="12" y1="9" x2="12" y2="13"></line>
                                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                        </svg>
                                        レンダリングエラーが発生しました
                                    </h4>
                                    <p className="mermaid-error-desc">
                                        ダイアグラムのレンダリング中にエラーが検出されました。構文（シンタックス）に不整合がある可能性があります。
                                    </p>
                                    <pre className="mermaid-error-details">
                                        <code>{viewerError}</code>
                                    </pre>
                                </div>

                                <div className="mermaid-error-code-section">
                                    <span className="mermaid-error-code-label">対象のソースコード:</span>
                                    <pre className="mermaid-error-code-block">
                                        <code>{displayContent}</code>
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                minWidth: `${720 * (zoomLevel / 100)}px`,
                                display: 'flex',
                                justifyContent: 'center',
                                paddingBottom: '64px',
                                width: '100%'
                            }}>
                                <div
                                    className="mermaid-panel-content"
                                    style={{
                                        transform: `scale(${zoomLevel / 100})`,
                                        transformOrigin: 'top center',
                                        transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <MermaidViewer chartCode={displayContent} onError={setViewerError} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 固定フッター領域：エラー時に「AIに修正を依頼する」ボタンを配置 */}
                    {viewerError && (
                        <div className="mermaid-panel-footer">
                            <button 
                                className="mermaid-fix-btn"
                                onClick={handleFixRequest}
                                title="AIにエラー内容を送信して修正を依頼します"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                </svg>
                                AIに修正を依頼する
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MermaidPanel;
