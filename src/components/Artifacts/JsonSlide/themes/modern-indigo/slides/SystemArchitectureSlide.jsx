// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/SystemArchitectureSlide.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

/**
 * SystemArchitectureSlide - スキーマ主動型システム構成図レンダラー
 * 
 * デザイン意図:
 * 座標不要で、階層（Tiers）と構成要素（Nodes）、その接続（Connections）のセマンティック関係から
 * 完全に整列したエンタープライズ品質のシステム構成図を自動描画します。
 * 各ノードのDOM境界ボックスをリアルタイムで追跡し、背面のSVGで直角S字クランク線および矢印を同期描画。
 */
const SystemArchitectureSlide = ({ content, isStatic = false }) => {
    const { title, tiers = [], nodes = [], connections = [], annotations = [] } = content || {};

    const containerRef = useRef(null);
    const nodeRefs = useRef({});
    const [coords, setCoords] = useState({});

    // 1. 各ノードの絶対座標・サイズをリアルタイム追跡するロジック
    useEffect(() => {
        const updateCoordinates = () => {
            if (!containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();
            const newCoords = {};

            nodes.forEach(node => {
                const element = nodeRefs.current[node.id];
                if (element) {
                    const rect = element.getBoundingClientRect();
                    newCoords[node.id] = {
                        x: rect.left - containerRect.left,
                        y: rect.top - containerRect.top,
                        w: rect.width,
                        h: rect.height
                    };
                }
            });
            setCoords(newCoords);
        };

        // 初回実行およびウィンドウ変更・リサイズ時の追跡
        updateCoordinates();
        window.addEventListener('resize', updateCoordinates);

        // ResizeObserverでDOM変化を検知
        const observer = new ResizeObserver(updateCoordinates);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener('resize', updateCoordinates);
            observer.disconnect();
        };
    }, [nodes, tiers]);

    if (!tiers.length || !nodes.length) {
        return <div className="w-full h-full flex items-center justify-center text-[var(--slide-text-secondary)]">No data.</div>;
    }

    // スケマティックカラー設計 (バッジ、背景、線のセマンティック連動)
    const tierColors = {
        blue: { bg: 'rgba(219, 234, 254, 0.04)', border: 'rgba(59, 130, 246, 0.15)', text: '#2563EB', badgeBg: 'rgba(219, 234, 254, 0.2)' },
        indigo: { bg: 'rgba(224, 231, 255, 0.04)', border: 'rgba(99, 102, 241, 0.15)', text: '#4F46E5', badgeBg: 'rgba(224, 231, 255, 0.2)' },
        emerald: { bg: 'rgba(209, 250, 229, 0.04)', border: 'rgba(16, 185, 129, 0.15)', text: '#059669', badgeBg: 'rgba(209, 250, 229, 0.2)' },
        purple: { bg: 'rgba(250, 232, 255, 0.04)', border: 'rgba(168, 85, 247, 0.15)', text: '#7E22CE', badgeBg: 'rgba(250, 232, 255, 0.2)' }
    };

    const nodeTypeConfigs = {
        client: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', badge: '🖥️ CLIENT' },
        frontend: { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE', badge: '💻 WEB UI' },
        gateway: { bg: '#F1F5F9', text: '#334155', border: '#E2E8F0', badge: '⚙️ GATEWAY' },
        service: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', badge: '📦 SERVICE' },
        database: { bg: '#FAF5FF', text: '#6B21A8', border: '#E9D5FF', badge: '💾 DATABASE' },
        external: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', badge: '🌐 EXT API' }
    };

    const lineColors = {
        primary: 'var(--slide-primary)',
        blue: '#3B82F6',
        purple: '#8B5CF6',
        green: '#10B981',
        default: 'var(--slide-primary)'
    };

    // 動的スケーリング (階層の数に応じて文字サイズを調整)
    const tierCount = tiers.length;
    const tierScale = Math.max(0.45, 4 / Math.max(4, tierCount));
    const tierLabelFontSize = `${Math.max(0.6, 1.1 * tierScale)}cqi`;

    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col overflow-hidden">
            {/* 1. スライドアライメントヘッダー */}
            <motion.div
                className="indigo-slide-header flex-shrink-0"
                style={{
                    marginBottom: '2.0cqi',
                    borderBottom: '2.5px solid var(--slide-primary)',
                    paddingBottom: '1.0cqi'
                }}
                {...(!isStatic && { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } })}
            >
                <h2 style={{ fontSize: '2.5cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 800 }}>
                    <SlideMarkdown content={title || 'System Architecture'} />
                </h2>
            </motion.div>

            {/* 2. アーキテクチャ構成図の描画エリア */}
            <div 
                ref={containerRef}
                className="relative flex-1 flex flex-col min-height-0 select-none"
                style={{ position: 'relative' }}
            >
                {/* 2-A. 背面 SVG 接続線レイヤー (直角S字クランク＆矢印マーカー) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                    <defs>
                        {Object.entries(lineColors).map(([key, color]) => (
                            <marker
                                key={`arrow-${key}`}
                                id={`arrow-${key}`}
                                viewBox="0 0 10 10"
                                refX="8"
                                refY="5"
                                markerWidth="6"
                                markerHeight="6"
                                orient="auto-start-reverse"
                            >
                                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={color} />
                            </marker>
                        ))}
                    </defs>

                    {/* 各ノード間の接続線を引く */}
                    {connections.map((conn, idx) => {
                        const c1 = coords[conn.from];
                        const c2 = coords[conn.to];
                        if (!c1 || !c2) return null;

                        // 接続開始・終了の中心座標
                        const x1 = c1.x + c1.w / 2;
                        const y1 = c1.y + c1.h / 2;
                        const x2 = c2.x + c2.w / 2;
                        const y2 = c2.y + c2.h / 2;

                        const color = lineColors[conn.color] || lineColors.default;
                        const isDashed = conn.style === 'dashed';

                        // 階層間のS字直角クランクパスの生成
                        const midY = (y1 + y2) / 2;
                        const pathData = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;

                        return (
                            <g key={`conn-${idx}`}>
                                <path
                                    d={pathData}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth="1.5"
                                    strokeDasharray={isDashed ? "4,4" : "none"}
                                    markerEnd={`url(#arrow-${conn.color || 'default'})`}
                                />
                                {/* 白背景マスク付きのプロトコル名ラベル */}
                                {conn.label && (
                                    <g>
                                        <rect
                                            x={(x1 + x2) / 2 - 25}
                                            y={midY - 8}
                                            width="50"
                                            height="16"
                                            fill="#FFFFFF"
                                            rx="1"
                                            stroke={color}
                                            strokeWidth="0.5"
                                        />
                                        <text
                                            x={(x1 + x2) / 2}
                                            y={midY + 4}
                                            fontSize="0.55cqi"
                                            fontWeight="700"
                                            fill={color}
                                            textAnchor="middle"
                                        >
                                            {conn.label}
                                        </text>
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* 2-B. 前面レイヤー (Tiers ＆ Nodes) */}
                <div className="absolute inset-0 flex flex-col justify-between w-full h-full" style={{ zIndex: 2 }}>
                    {tiers.map((tier, tierIdx) => {
                        const tierColor = tierColors[tier.color] || tierColors.blue;
                        const tierNodes = nodes.filter(node => node.tier === tier.id);

                        return (
                            <div
                                key={tier.id}
                                className="flex items-center w-full relative"
                                style={{
                                    height: `${100 / tiers.length}%`,
                                    backgroundColor: tierColor.bg,
                                    borderBottom: tierIdx < tiers.length - 1 ? '1px solid var(--slide-border)' : 'none',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {/* 左端: レイヤー見出しバッジ */}
                                <div 
                                    className="flex items-center" 
                                    style={{ 
                                        width: '14cqi', 
                                        paddingLeft: '1.0cqi',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <span style={{
                                        fontSize: tierLabelFontSize,
                                        fontWeight: 800,
                                        color: tierColor.text,
                                        backgroundColor: tierColor.badgeBg,
                                        border: `1px solid ${tierColor.border}`,
                                        padding: '0.2cqi 0.8cqi',
                                        borderRadius: '4px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.02em'
                                    }}>
                                        {tier.label}
                                    </span>
                                </div>

                                {/* 右端: 所属するノードの等間隔等幅配置エリア */}
                                <div className="flex-1 flex justify-around items-center px-4 h-full">
                                    {tierNodes.map(node => {
                                        const typeInfo = nodeTypeConfigs[node.type] || { bg: '#FFFFFF', text: '#334155', border: '#E2E8F0', badge: 'NODE' };
                                        
                                        return (
                                            <div
                                                key={node.id}
                                                ref={el => nodeRefs.current[node.id] = el}
                                                className="bg-white border border-slate-200 rounded flex flex-col items-center justify-center text-center"
                                                style={{
                                                    width: '13cqi',
                                                    padding: '0.6cqi 0.8cqi',
                                                    boxSizing: 'border-box',
                                                    zIndex: 5
                                                }}
                                            >
                                                {/* ノードタイプバッジ */}
                                                <span style={{
                                                    fontSize: '0.5cqi',
                                                    fontWeight: 800,
                                                    color: typeInfo.text,
                                                    backgroundColor: typeInfo.bg,
                                                    border: `1px solid ${typeInfo.border}`,
                                                    padding: '0.05cqi 0.3cqi',
                                                    borderRadius: '3px',
                                                    marginBottom: '0.3cqi',
                                                    letterSpacing: '0.02em'
                                                }}>
                                                    {typeInfo.badge}
                                                </span>
                                                {/* ノード表示名 */}
                                                <span style={{
                                                    fontSize: '0.85cqi',
                                                    fontWeight: 700,
                                                    color: 'var(--slide-text-primary)',
                                                    lineHeight: 1.15
                                                }}>
                                                    {node.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3. 注釈フッター */}
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

export default SystemArchitectureSlide;
