// src/components/Artifacts/MermaidViewer.jsx
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// ビジネスシーン向けのプロフェッショナルなテーマでMermaidを初期化する関数
const initializeMermaid = (currentTheme) => {
    const isDark = currentTheme === 'dark';
    
    const themeVariables = {
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        background: 'transparent',
        // フローチャート/一般
        primaryColor: isDark ? '#27272a' : '#f4f4f5', // zinc 800 / zinc 100
        primaryBorderColor: isDark ? '#3f3f46' : '#e4e4e7', // zinc 700 / zinc 200
        primaryTextColor: isDark ? '#fafafa' : '#18181b', // zinc 50 / zinc 900
        lineColor: isDark ? '#a1a1aa' : '#71717a', // zinc 400 / zinc 500
        
        // シーケンス図/その他
        actorBkg: isDark ? '#27272a' : '#f4f4f5',
        actorBorder: isDark ? '#3f3f46' : '#e4e4e7',
        actorTextColor: isDark ? '#fafafa' : '#18181b',
        signalColor: isDark ? '#a1a1aa' : '#71717a',
        signalTextColor: isDark ? '#e4e4e7' : '#27272a',
        
        // ラベル関係
        labelBoxBkgColor: isDark ? '#18181b' : '#ffffff',
        labelBoxBorderColor: isDark ? '#3f3f46' : '#e4e4e7',
        labelTextStyle: isDark ? 'fill: #e4e4e7; color: #e4e4e7;' : 'fill: #27272a; color: #27272a;',
        
        // 代替（secondary）カラー - 目立たせたい特定のアクティブノード用
        secondaryColor: isDark ? '#1e3a8a' : '#eff6ff', // blue 900 / blue 50
        secondaryBorderColor: isDark ? '#1e40af' : '#bfdbfe', // blue 800 / blue 200
        secondaryTextColor: isDark ? '#eff6ff' : '#1e3a8a', // blue 50 / blue 900
    };

    const themeCSS = `
        /* ノードの形状と枠線の太さ */
        .node rect, .node circle, .node polygon, .node path {
            rx: 8px !important;
            ry: 8px !important;
            stroke-width: 1.5px !important;
        }
        /* シーケンス図のライフラインや矢印 */
        .actor {
            stroke-width: 1.5px !important;
            rx: 6px !important;
            ry: 6px !important;
        }
        .messageLine0, .messageLine1 {
            stroke-width: 1.5px !important;
        }
        /* リレーション接続線 */
        .edgePath .path {
            stroke-width: 1.5px !important;
        }
        /* テキストスタイルの補正 */
        text {
            font-weight: 500 !important;
        }
        /* フローチャートのエッジラベル背景 */
        .edgeLabel rect {
            rx: 4px !important;
            ry: 4px !important;
        }
        /* シーケンス採番バッジの背景（丸） */
        circle.sequenceNumber {
            fill: #71717a !important;
            stroke: #71717a !important;
        }
        /* シーケンス採番バッジの数字テキスト（白文字で太字） */
        text.sequenceNumber {
            fill: #ffffff !important;
            font-size: 11px !important;
            font-weight: 600 !important;
        }
    `;

    mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables,
        themeCSS,
        securityLevel: 'loose',
        suppressErrorRendering: true, // エラー発生時の自動DOM描画（爆弾マークなど）を抑制する
        flowchart: { useMaxWidth: false },
        sequence: { useMaxWidth: false },
        gantt: { useMaxWidth: false },
        class: { useMaxWidth: false },
        state: { useMaxWidth: false },
        er: { useMaxWidth: false },
        pie: { useMaxWidth: false },
        journey: { useMaxWidth: false },
        git: { useMaxWidth: false },
        mindmap: { useMaxWidth: false },
        timeline: { useMaxWidth: false },
    });
};

// 初回読み込み時の初期設定 (デフォルトはライトモード想定)
initializeMermaid('light');

/**
 * Mermaidのコードを受け取り、高精細なSVGとしてレンダリングするコンポーネント
 */
const MermaidViewer = ({ chartCode, onError }) => {
    const containerRef = useRef(null);
    const [svg, setSvg] = useState('');
    const [error, setError] = useState(null);
    const [theme, setTheme] = useState(() => 
        document.documentElement.getAttribute('data-theme') || 'light'
    );

    // HTMLのdata-theme属性の変更を監視し、テーマステートを更新する
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    const newTheme = document.documentElement.getAttribute('data-theme') || 'light';
                    setTheme(newTheme);
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!chartCode) return;

        let isMounted = true;

        const renderChart = async () => {
            try {
                setError(null);
                if (onError) onError(null); // エラー情報をリセット
                
                // Mermaidレンダリングは常にライトモード（白い紙背景などでも違和感のないデザイン）で固定
                initializeMermaid('light');

                // レンダリング用のユニークなIDを作成
                const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
                
                // mermaid.render は非同期関数です
                const { svg: renderedSvg } = await mermaid.render(id, chartCode);
                if (isMounted) {
                    setSvg(renderedSvg);
                }
            } catch (err) {
                // パースエラーの場合はエラー状態にし、フォールバック表示を行います
                if (isMounted) {
                    const errMsg = err.message || 'Mermaidのレンダリングに失敗しました。';
                    setError(errMsg);
                    if (onError) onError(errMsg); // 親コンポーネントへエラーを通知
                }
            }
        };

        renderChart();

        return () => {
            isMounted = false;
        };
    }, [chartCode, theme]);

    // レンダリングされたSVGのインラインスタイルをクリアし、
    // レスポンシブ化およびベクターデータとしての描画品質を最大化する調整を行います。
    useEffect(() => {
        if (!svg || !containerRef.current) return;

        const svgElement = containerRef.current.querySelector('svg');
        if (svgElement) {
            // Mermaidが自動付与する max-width などのインラインスタイル制限を解除
            svgElement.removeAttribute('style');
            svgElement.style.width = '100%';
            svgElement.style.height = 'auto';
            svgElement.style.maxWidth = '100%';
            
            // 精密なベクターレンダリング品質を保つためのヒント属性を設定
            svgElement.setAttribute('shape-rendering', 'geometricPrecision');
            svgElement.setAttribute('text-rendering', 'geometricPrecision');
        }
    }, [svg]);

    if (error) {
        return (
            <div className="mermaid-error-container" style={{ padding: '16px', border: '1px dashed #ff4d4f', borderRadius: '8px', background: '#fff2f0', color: '#ff4d4f', width: '100%' }}>
                <div className="mermaid-error-message" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    ダイアグラムを生成中、または文法エラーがあります。
                </div>
                <pre className="mermaid-fallback-code" style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflowX: 'auto', color: '#333' }}>
                    <code>{chartCode}</code>
                </pre>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef} 
            className="mermaid-viewer-container"
            style={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                overflow: 'visible',
                // スケーリング（ズーム）時のぼやけを防ぐためのCSS
                willChange: 'transform',
                backfaceVisibility: 'hidden'
            }}
            dangerouslySetInnerHTML={{ __html: svg }} 
        />
    );
};

export default MermaidViewer;
