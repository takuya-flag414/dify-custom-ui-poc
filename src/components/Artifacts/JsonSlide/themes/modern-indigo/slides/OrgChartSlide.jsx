// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/OrgChartSlide.jsx
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

/**
 * OrgChartSlide - プロジェクト体制図・組織図スライド (React UI)
 * 
 * デザイン意図:
 * 他の標準スライドと完全に一致する美しい白背景、ヘッダー、フッター構造。
 * 影のない完全なフラット・モダンデザインをベースに、
 * 最大要素数に応じてカード幅と文字サイズを自動スリム化する高耐久スケーリングエンジンを搭載。
 */
export const OrgChartSlide = ({ content, isStatic = false }) => {
    const { title, members = [], annotations = [] } = content || {};

    const containerRef = useRef(null);
    const nodeRefs = useRef({});
    const [coords, setCoords] = useState({});

    // 1. メンバーの階層 (Level / Depth) 算出と親子関係のマッピング
    const memberMap = {};
    members.forEach(m => {
        memberMap[m.id] = { ...m, children: [], depth: 0 };
    });

    members.forEach(m => {
        if (m.parent && memberMap[m.parent]) {
            memberMap[m.parent].children.push(m.id);
        }
    });

    const calculateDepth = (id, currentDepth) => {
        const m = memberMap[id];
        if (!m) return;
        m.depth = currentDepth;
        m.children.forEach(childId => {
            calculateDepth(childId, currentDepth + 1);
        });
    };

    members.forEach(m => {
        if (!m.parent || !memberMap[m.parent]) {
            calculateDepth(m.id, 0);
        }
    });

    const levels = {};
    Object.values(memberMap).forEach(m => {
        if (!levels[m.depth]) levels[m.depth] = [];
        levels[m.depth].push(m);
    });

    const depths = Object.keys(levels).map(Number).sort((a, b) => a - b);

    // 👑 高密度自動スケーリング・セーフティ計算 (横並び限界を防ぐ)
    const maxMembersInLevel = Math.max(...depths.map(d => (levels[d] || []).length), 1);
    // 最大要素数が5を超える場合は、カード幅をさらに小さくし、文字サイズとカード内余白を極限まで減らしてホワイトスペース（隙間）を確保する
    const isHighDensity = maxMembersInLevel > 5;
    const cardWidthCqi = Math.max(5.8, Math.min(13.0, (isHighDensity ? 72 : 85) / maxMembersInLevel));
    const cardHeightCqi = Math.max(3.2, Math.min(5.2, cardWidthCqi * (isHighDensity ? 0.45 : 0.4)));
    const fontMultiplier = isHighDensity ? 0.76 : 1.0;

    // 2. DOM 境界の追跡 (ResizeObserver)
    useEffect(() => {
        if (!containerRef.current || members.length === 0) return;

        const updateCoords = () => {
            const containerRect = containerRef.current.getBoundingClientRect();
            const newCoords = {};

            members.forEach(member => {
                const el = nodeRefs.current[member.id];
                if (el) {
                    const rect = el.getBoundingClientRect();
                    newCoords[member.id] = {
                        cx: (rect.left + rect.right) / 2 - containerRect.left,
                        cy: (rect.top + rect.bottom) / 2 - containerRect.top,
                        top: rect.top - containerRect.top,
                        bottom: rect.bottom - containerRect.top,
                        left: rect.left - containerRect.left,
                        right: rect.right - containerRect.left,
                        w: rect.width,
                        h: rect.height
                    };
                }
            });
            setCoords(newCoords);
        };

        const observer = new ResizeObserver(() => {
            updateCoords();
        });

        observer.observe(containerRef.current);
        updateCoords();

        const timers = [
            setTimeout(updateCoords, 100),
            setTimeout(updateCoords, 300),
            setTimeout(updateCoords, 600)
        ];

        return () => {
            observer.disconnect();
            timers.forEach(t => clearTimeout(t));
        };
    }, [members, content]);

    // 階層（Level）ごとのカラースキーマ設計 (完全フラット・モダン)
    const levelColors = {
        0: { bg: '#EEF2FF', border: '#C7D2FE', text: '#4F46E5', label: '#312E81' }, // Top: インディゴ調
        1: { bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB', label: '#1E3A8A' }, // Middle: ブルー調
        2: { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A', label: '#14532D' }, // Member: グリーン調
        default: { bg: '#FFFFFF', border: '#E2E8F0', text: '#475569', label: '#1E293B' }
    };

    return (
        <div className="json-slide-layout indigo-style h-full flex flex-col">
            {/* A. ヘッダー: modern-indigo 一貫デザイン */}
            <motion.div
                className="indigo-slide-header flex-shrink-0"
                style={{
                    marginBottom: '2.5cqi',
                    borderBottom: '2.5px solid var(--slide-primary)',
                    paddingBottom: '1.2cqi'
                }}
                {...(!isStatic && { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } })}
            >
                <h2 style={{ fontSize: '2.6cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    <SlideMarkdown content={title || 'Project Organization'} />
                </h2>
            </motion.div>

            {/* B. 体制図メインエリア (等間隔ツリー配置) */}
            <div 
                ref={containerRef}
                className="relative flex-1 flex flex-col justify-around my-4 min-h-[22cqi]"
                style={{ boxSizing: 'border-box' }}
            >
                {/* B-1. 背面 SVG 接続線レイヤー */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    {members.map(member => {
                        if (!member.parent || !coords[member.id] || !coords[member.parent]) return null;

                        const parentCoord = coords[member.parent];
                        const childCoord = coords[member.id];

                        const px = parentCoord.cx;
                        const py = parentCoord.bottom; 
                        const cx = childCoord.cx;
                        const cy = childCoord.top;    

                        const midY = (py + cy) / 2;    

                        const pathD = `M ${px} ${py} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy}`;

                        return (
                            <path
                                key={`path-${member.id}`}
                                d={pathD}
                                fill="none"
                                stroke="#CBD5E1" 
                                strokeWidth="1.5"
                            />
                        );
                    })}
                </svg>

                {/* B-2. 前面 階層別メンバーカードグリッド */}
                {depths.map(depth => {
                    const levelMembers = levels[depth] || [];
                    return (
                        <div 
                            key={`level-${depth}`}
                            className="relative z-10 flex justify-around items-center w-full px-[2cqi] box-border"
                        >
                            {levelMembers.map(member => {
                                const col = levelColors[depth] || levelColors.default;

                                return (
                                    <motion.div
                                        key={member.id}
                                        ref={el => nodeRefs.current[member.id] = el}
                                        className={`bg-white border rounded flex flex-col justify-center text-center ${isHighDensity ? 'px-1 py-0.5' : 'px-2.5 py-1.5'}`}
                                        style={{
                                            borderColor: col.border,
                                            backgroundColor: col.bg,
                                            width: `${cardWidthCqi}cqi`,
                                            height: `${cardHeightCqi}cqi`,
                                            boxSizing: 'border-box'
                                        }}
                                        {...(!isStatic && {
                                            initial: { opacity: 0, scale: 0.95 },
                                            animate: { opacity: 1, scale: 1 },
                                            transition: { duration: 0.4, delay: 0.1 * depth }
                                        })}
                                    >
                                        <span 
                                            className="font-extrabold uppercase tracking-wider mb-0.5 truncate block"
                                            style={{ 
                                                color: col.text,
                                                fontSize: `${0.45 * fontMultiplier}cqi`
                                            }}
                                        >
                                            {member.role || 'ROLE'}
                                        </span>
                                        <span 
                                            className="font-bold truncate block"
                                            style={{ 
                                                color: col.label,
                                                fontSize: `${0.62 * fontMultiplier}cqi`
                                            }}
                                        >
                                            {member.name || 'NAME'}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* C. フッター注釈領域: modern-indigo 一貫デザイン */}
            {annotations?.length > 0 && (
                <div
                    className="flex-shrink-0"
                    style={{
                        fontSize: '1.1cqi',
                        color: '#64748B',
                        marginTop: '2cqi',
                        paddingTop: '1cqi',
                        borderTop: '1px solid #E2E8F0'
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
