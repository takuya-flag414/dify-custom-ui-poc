// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/SwimlaneSlide.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

/**
 * SwimlaneSlide - 一般化されたスキーマ主導型スイムレーンレンダラー
 * 
 * デザイン意図:
 * LLM（Dify等）のメッセージ設計意図（1枚のスライド構造）を100%完全に尊重し、
 * JSONデータスキーマ（phases, lanes[].type, steps[].flow_style / flow_color）に従って
 * 静的・ノンインタラクティブな状態でも圧倒的な可読性を発揮するプロフェッショナルなインフォグラフィックを描画。
 * 要素が多い高密度時（レーン数 > 5 または ステップ数 > 8）には、セルの縦伸びを防ぐために
 * payloadやdescriptionを通常表示から「わざと」非表示にし、ホバーツールチップに退避させます。
 */
const SwimlaneSlide = ({ content, isStatic = false }) => {
    // 親コンポーネントから渡された content から直接必要なデータを分割代入
    const { title, lanes = [], steps = [], annotations = [], phases = [] } = content || {};

    // ホバーされたステップのインデックスを保持する状態 (高密度時のツールチップ制御用)
    const [hoveredStep, setHoveredStep] = useState(null);

    // アニメーション設定
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.02 } }
    };

    // レーンやステップのデータが無い場合は "No data." を表示
    if (!lanes.length || !steps.length) {
        return <div className="w-full h-full flex items-center justify-center text-[var(--slide-text-secondary)]">No data.</div>;
    }

    // ==========================================
    // 🧪 一般化されたデータスケーリング計算
    // ==========================================
    const laneCount = lanes.length;
    const stepCount = steps.length;

    // 縮小倍率の下限リミッターを極限拡張 (10レーン/20ステップに完全耐性)
    const laneScale = Math.max(0.35, 4 / Math.max(4, laneCount));
    const stepScale = Math.max(0.3, 8 / Math.max(8, stepCount));

    // 高密度判定 (ある一定のレーン数・ステップ数を超えた場合)
    const isHighDensity = laneCount > 5 || stepCount > 8;

    // 各要素の動的サイズ計算 (cqi: 16:9比率に完全追従)
    const laneLabelFontSize = `${Math.max(0.55, 1.1 * laneScale)}cqi`;
    const laneLabelPadding = `${Math.max(0.1, 1.0 * laneScale)}cqi 0.8cqi`;
    
    const stepCellPadding = isHighDensity 
        ? `${Math.max(0.1, 0.4 * laneScale)}cqi 0.2cqi` 
        : `${Math.max(0.15, 0.8 * laneScale)}cqi 0.3cqi`;

    const stepNumFontSize = `${Math.max(0.45, 0.7 * stepScale)}cqi`;
    const stepTitleFontSize = `${Math.max(0.5, 1.0 * stepScale)}cqi`;
    const stepDescFontSize = `${Math.max(0.45, 0.85 * stepScale)}cqi`;
    const stepPayloadFontSize = `${Math.max(0.4, 0.7 * stepScale)}cqi`;
    const stepPayloadMarginTop = `${Math.max(0.1, 0.6 * stepScale)}cqi`;

    // ==========================================
    // 🎨 スケマティックカラー＆トポロジー定義
    // ==========================================

    // A. アクター（レーン）のシステムトポロジー別バッジ＆水平背景色定義
    const typeConfigs = {
        client: { bg: 'rgba(59, 130, 246, 0.04)', text: '#1E40AF', border: 'rgba(59, 130, 246, 0.15)', badge: '🖥️ Client' },
        frontend: { bg: 'rgba(139, 92, 246, 0.04)', text: '#5B21B6', border: 'rgba(139, 92, 246, 0.15)', badge: '💻 Web UI' },
        gateway: { bg: 'rgba(100, 116, 139, 0.04)', text: '#334155', border: 'rgba(100, 116, 139, 0.15)', badge: '⚙️ Gateway' },
        service: { bg: 'rgba(16, 185, 129, 0.04)', text: '#065F46', border: 'rgba(16, 185, 129, 0.15)', badge: '📦 Service' },
        database: { bg: 'rgba(168, 85, 247, 0.04)', text: '#6B21A8', border: 'rgba(168, 85, 247, 0.15)', badge: '💾 Database' },
        external: { bg: 'rgba(245, 158, 11, 0.04)', text: '#92400E', border: 'rgba(245, 158, 11, 0.15)', badge: '🌐 Ext API' }
    };

    // B. 論理フェーズ（縦ゾーニング）のカラーパレット定義
    const phaseColors = {
        blue: { bg: 'rgba(219, 234, 254, 0.16)', border: 'rgba(59, 130, 246, 0.25)', text: '#2563EB' },
        indigo: { bg: 'rgba(224, 231, 255, 0.16)', border: 'rgba(99, 102, 241, 0.25)', text: '#4F46E5' },
        emerald: { bg: 'rgba(209, 250, 229, 0.16)', border: 'rgba(16, 185, 129, 0.25)', text: '#059669' },
        gold: { bg: 'rgba(254, 243, 199, 0.16)', border: 'rgba(245, 158, 11, 0.25)', text: '#D97706' }
    };

    // C. 接続線の系統カラー定義
    const lineColors = {
        primary: 'var(--slide-primary)',
        blue: '#3B82F6',
        purple: '#8B5CF6',
        green: '#10B981',
        default: 'var(--slide-primary)'
    };

    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col overflow-hidden">
            {/* 1. ヘッダー: 他のスライドと完全に一致した固定デザイン */}
            <motion.div
                className="indigo-slide-header flex-shrink-0"
                style={{
                    marginBottom: '2.0cqi',
                    borderBottom: '2.5px solid var(--slide-primary)',
                    paddingBottom: '1.0cqi'
                }}
                {...(!isStatic && { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } })}
            >
                <h2 style={{ fontSize: '2.5cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    <SlideMarkdown content={title || 'Process Flow'} />
                </h2>
            </motion.div>

            {/* 2. スイムレーン本体 */}
            <motion.div
                variants={containerVariants}
                initial={isStatic ? "visible" : "hidden"}
                animate="visible"
                style={{
                    flex: 1,
                    minHeight: 0,
                    position: 'relative',
                    display: 'grid',
                    gridTemplateColumns: `14cqi repeat(${steps.length}, 1fr)`,
                    gridTemplateRows: `repeat(${lanes.length}, 1fr)`
                }}
            >
                {/* --- 🌟 ゾーニング 1: 縦の論理フェーズカラー帯の描画 (静的ゾーニングの真髄) --- */}
                {phases && phases.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        left: '14cqi',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        display: 'flex',
                        zIndex: 0,
                        pointerEvents: 'none'
                    }}>
                        {phases.map((phase, pIdx) => {
                            const start = phase.start_step || 1;
                            const end = phase.end_step || steps.length;
                            const widthPct = ((end - start + 1) / steps.length) * 100;
                            const col = phaseColors[phase.color] || phaseColors.blue;

                            return (
                                <div
                                    key={`phase-zone-${pIdx}`}
                                    style={{
                                        width: `${widthPct}%`,
                                        height: '100%',
                                        backgroundColor: col.bg,
                                        borderLeft: pIdx > 0 ? `1.5px dashed ${col.border}` : 'none',
                                        position: 'relative',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    {/* 縦ゾーンの最上部: フェーズ名見出し */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '0.4cqi',
                                        left: '0.8cqi',
                                        fontSize: '0.8cqi',
                                        fontWeight: 800,
                                        color: col.text,
                                        opacity: 0.85,
                                        letterSpacing: '0.02em',
                                        textTransform: 'uppercase'
                                    }}>
                                        {phase.name}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* --- 🌟 ゾーニング 2: レーンヘッダーと水平バリアー背景 (Row背景の連動) --- */}
                {lanes.map((lane, i) => {
                    // LLM指定のレーンタイプ設定を取得
                    const typeInfo = typeConfigs[lane.type] || { bg: 'transparent', text: 'var(--slide-text-primary)', border: 'transparent', badge: null };

                    return (
                        <React.Fragment key={`lane-bg-${i}`}>
                            {/* 左端のレーン名 (トポロジーバッジ付き) */}
                            <div style={{
                                gridColumn: 1,
                                gridRow: i + 1,
                                borderBottom: i < lanes.length - 1 ? '1px solid var(--slide-border)' : 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                justifyContent: 'center',
                                padding: laneLabelPadding,
                                zIndex: 3,
                                boxSizing: 'border-box'
                            }}>
                                {/* システムトポロジー極小バッジ */}
                                {typeInfo.badge && (
                                    <span style={{
                                        fontSize: `calc(${laneLabelFontSize} * 0.72)`,
                                        fontWeight: 800,
                                        color: typeInfo.text,
                                        backgroundColor: typeInfo.bg.replace('0.04', '0.12'), // バッジは少し濃い背景
                                        border: `1.5px solid ${typeInfo.border}`,
                                        padding: '0.05cqi 0.35cqi',
                                        borderRadius: '3px',
                                        marginBottom: '0.2cqi',
                                        letterSpacing: '0.02em',
                                        textTransform: 'uppercase'
                                    }}>
                                        {typeInfo.badge}
                                    </span>
                                )}
                                <span style={{
                                    fontWeight: 700,
                                    fontSize: laneLabelFontSize,
                                    color: 'var(--slide-text-primary)',
                                    lineHeight: 1.15
                                }}>
                                    {lane.label}
                                </span>
                            </div>
                            
                            {/* タイムライン領域の水平行背景 ＆ 区切り線 (アクター種別バッジ色と連動して超薄く敷く) */}
                            <div style={{
                                gridColumn: '2 / -1',
                                gridRow: i + 1,
                                borderBottom: i < lanes.length - 1 ? '1px solid var(--slide-border)' : 'none',
                                backgroundColor: typeInfo.bg, // アクター種別に完全に同期
                                zIndex: 0
                            }} />
                        </React.Fragment>
                    );
                })}

                {/* --- 🌟 ゾーニング 3: 直角・極細のフロー線 (実線・点線 ＆ 系統カラー) --- */}
                <div style={{
                    gridColumn: '2 / -1',
                    gridRow: '1 / -1',
                    position: 'relative',
                    zIndex: 1,
                    pointerEvents: 'none',
                    opacity: 0.75 // 線に系統色がつくため、視認性確保のために少し不透明度を上げる (0.45 -> 0.75)
                }}>
                    {steps.map((step, j) => {
                        const nextStep = steps[j + 1] || (step.flow_to ? steps.find(s => s.lane === step.flow_to) : null);
                        if (!nextStep && !step.flow_to) return null;

                        const lane1 = lanes.findIndex(l => l.id === step.lane);
                        const lane2 = nextStep ? lanes.findIndex(l => l.id === nextStep.lane) : lanes.findIndex(l => l.id === step.flow_to);

                        if (lane1 === -1 || lane2 === -1) return null;

                        const W = 100 / steps.length;
                        const W_H = 100 / lanes.length;

                        // 各ノード（点）の絶対座標(%)
                        const x1 = j * W + (W * 0.1);
                        const x2 = (j + 1) * W + (W * 0.1);
                        const y1 = (lane1 + 0.5) * W_H;
                        const y2 = (lane2 + 0.5) * W_H;

                        // LLM指定のフローカラーおよびスタイル（点線・実線）に同期
                        const isDashed = step.flow_style === 'dashed';
                        const color = lineColors[step.flow_color] || lineColors.default;
                        
                        const borderStyle = isDashed ? 'dashed' : 'solid';
                        const borderWidth = isDashed ? '1.5px' : '1px';

                        return (
                            <React.Fragment key={`line-${j}`}>
                                {lane1 === lane2 ? (
                                    // 同一レーン内の水平線
                                    <div style={{
                                        position: 'absolute',
                                        left: `${x1}%`, top: `calc(${y1}% - 0.5px)`,
                                        width: `${x2 - x1}%`,
                                        height: 0,
                                        borderBottom: `${borderWidth} ${borderStyle} ${color}`
                                    }} />
                                ) : (
                                    // 異なるレーン間の直角クランク線
                                    <>
                                        {/* 1. 前半の水平線 */}
                                        <div style={{
                                            position: 'absolute',
                                            left: `${x1}%`, top: `calc(${y1}% - 0.5px)`,
                                            width: `${(x2 - x1) / 2}%`,
                                            height: 0,
                                            borderBottom: `${borderWidth} ${borderStyle} ${color}`
                                        }} />
                                        {/* 2. 中間の垂直線 */}
                                        <div style={{
                                            position: 'absolute',
                                            left: `calc(${x1 + (x2 - x1) / 2}% - 0.5px)`,
                                            top: `${Math.min(y1, y2)}%`,
                                            width: 0,
                                            height: `${Math.abs(y2 - y1)}%`,
                                            borderLeft: `${borderWidth} ${borderStyle} ${color}`
                                        }} />
                                        {/* 3. 後半の水平線 */}
                                        <div style={{
                                            position: 'absolute',
                                            left: `${x1 + (x2 - x1) / 2}%`, top: `calc(${y2}% - 0.5px)`,
                                            width: `${(x2 - x1) / 2}%`,
                                            height: 0,
                                            borderBottom: `${borderWidth} ${borderStyle} ${color}`
                                        }} />
                                    </>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* --- D. ステップ情報の描画 (高密度時はわざと非表示 ＆ ホバーツールチップ表示) --- */}
                {steps.map((step, j) => {
                    const laneIdx = lanes.findIndex(l => l.id === step.lane);
                    if (laneIdx === -1) return null;

                    return (
                        <motion.div 
                            key={`step-${j}`} 
                            variants={{
                                hidden: { opacity: 0 },
                                visible: { opacity: 1, transition: { duration: 0.2 } }
                            }}
                            onMouseEnter={() => setHoveredStep(j)}
                            onMouseLeave={() => setHoveredStep(null)}
                            style={{
                                gridColumn: j + 2,
                                gridRow: laneIdx + 1,
                                zIndex: 2,
                                padding: stepCellPadding,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                position: 'relative',
                                cursor: isHighDensity ? 'pointer' : 'default'
                            }}
                        >
                            {/* 受信用のフラットな矢印（先頭以外） */}
                            {j > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    left: isHighDensity ? '-0.1cqi' : '-0.3cqi',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    borderTop: isHighDensity ? '0.15cqi solid transparent' : '0.3cqi solid transparent',
                                    borderBottom: isHighDensity ? '0.15cqi solid transparent' : '0.3cqi solid transparent',
                                    borderLeft: isHighDensity ? '0.3cqi solid var(--slide-primary)' : '0.5cqi solid var(--slide-primary)',
                                    zIndex: 4
                                }} />
                            )}

                            {/* 💡 インナーコンテナ: 背景を白にして背面の線・ゾーンカラーを隠すマスクを形成 */}
                            <div style={{
                                backgroundColor: '#ffffff', // スライド背景と同色の白
                                padding: isHighDensity ? '0.2cqi 0.3cqi' : '0.3cqi 0.5cqi',
                                borderRadius: '4px',
                                border: '1px solid var(--slide-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                maxWidth: '100%',
                                boxSizing: 'border-box',
                                position: 'relative'
                            }}>
                                {/* ステップ連番 (01, 02...) */}
                                <div style={{
                                    fontSize: stepNumFontSize,
                                    color: 'var(--slide-primary)',
                                    fontWeight: 700,
                                    marginBottom: '0.05cqi',
                                    letterSpacing: '0.05em'
                                }}>
                                    {(j + 1).toString().padStart(2, '0')}
                                </div>

                                {/* タイトル */}
                                <div style={{
                                    fontSize: stepTitleFontSize,
                                    fontWeight: 600,
                                    color: 'var(--slide-text-primary)',
                                    lineHeight: 1.15,
                                    wordBreak: 'break-all'
                                }}>
                                    <SlideMarkdown content={step.title} inline />
                                </div>

                                {/* 通常表示の制御: 高密度時は description と payload を「わざと」非表示にする */}
                                {!isHighDensity ? (
                                    <>
                                        {/* 通常表示: 説明文 */}
                                        {step.description && (
                                            <div style={{
                                                fontSize: stepDescFontSize,
                                                color: 'var(--slide-text-secondary)',
                                                marginTop: '0.2cqi',
                                                lineHeight: 1.2
                                            }}>
                                                <SlideMarkdown content={step.description} inline />
                                            </div>
                                        )}

                                        {/* 通常表示: ペイロード */}
                                        {step.payload && (
                                            <div style={{
                                                marginTop: stepPayloadMarginTop,
                                                paddingLeft: '0.4cqi',
                                                borderLeft: '1.5px solid var(--slide-primary)',
                                                fontFamily: 'monospace',
                                                fontSize: stepPayloadFontSize,
                                                color: 'var(--slide-text-primary)',
                                                opacity: 0.8,
                                                wordBreak: 'break-all',
                                                lineHeight: 1.1
                                            }}>
                                                {step.payload}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    /* 💡 インテリジェント・ホバーツールチップ (高密度時のみ) */
                                    <AnimatePresence>
                                        {hoveredStep === j && (step.description || step.payload) && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                                style={{
                                                    position: 'absolute',
                                                    bottom: '120%',
                                                    left: '50%',
                                                    transform: 'translateX(-50%)',
                                                    backgroundColor: '#1E293B',
                                                    color: '#FFFFFF',
                                                    padding: '0.8cqi 1cqi',
                                                    borderRadius: '6px',
                                                    width: '18cqi',
                                                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)',
                                                    zIndex: 9999,
                                                    boxSizing: 'border-box',
                                                    pointerEvents: 'none'
                                                }}
                                            >
                                                {/* 説明文 (ツールチップ内) */}
                                                {step.description && (
                                                    <div style={{ 
                                                        fontSize: '0.9cqi', 
                                                        fontWeight: 500, 
                                                        marginBottom: step.payload ? '0.4cqi' : 0, 
                                                        color: '#E2E8F0', 
                                                        lineHeight: 1.3 
                                                    }}>
                                                        {step.description}
                                                    </div>
                                                )}
                                                {/* ペイロードコード (ツールチップ内) */}
                                                {step.payload && (
                                                    <div style={{ 
                                                        fontSize: '0.8cqi', 
                                                        fontFamily: 'monospace', 
                                                        backgroundColor: '#0F172A', 
                                                        padding: '0.4cqi', 
                                                        borderRadius: '4px', 
                                                        wordBreak: 'break-all', 
                                                        color: '#38BDF8',
                                                        borderLeft: '2px solid var(--slide-primary)', 
                                                        lineHeight: 1.2 
                                                    }}>
                                                        {step.payload}
                                                    </div>
                                                )}
                                                {/* 下向きの小さな矢印 */}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: '50%',
                                                    transform: 'translateX(-50%)',
                                                    borderWidth: '6px',
                                                    borderStyle: 'solid',
                                                    borderColor: '#1E293B transparent transparent transparent'
                                                }} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* 3. 注釈 (フッター: 他のスライドと完全に同一にした固定デザイン) */}
            {annotations?.length > 0 && (
                <div
                    className="flex-shrink-0"
                    style={{
                        fontSize: '1.0cqi',
                        color: '#64748B',
                        marginTop: '1.5cqi',
                        paddingTop: '0.8cqi',
                        borderTop: '1px solid #E2E8F0',
                        lineHeight: 1.3
                    }}
                >
                    {annotations.map((note, idx) => (
                        <React.Fragment key={idx}>
                            <SlideMarkdown content={note} inline />
                            {idx < annotations.length - 1 && <span style={{ margin: '0 0.8cqi', opacity: 0.5 }}>|</span>}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SwimlaneSlide;
