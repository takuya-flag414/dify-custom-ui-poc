// src/components/Artifacts/JsonSlide/themes/modern-indigo/slides/KpiDashboardSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';
import SlideMarkdown from '../../../MarkdownRenderer';

const KpiDashboardSlide = ({ content, isStatic = false }) => {
    const { 
        title, 
        summary_kpis = [], 
        detail_kpis = [], 
        kpis = [], // Fallback
        body_text,
        annotations = [] 
    } = content || {};

    // データの整理（互換性維持）
    const hasNewStructure = (summary_kpis && summary_kpis.length > 0) || (detail_kpis && detail_kpis.length > 0);
    let activeSummary = summary_kpis;
    let activeDetails = detail_kpis;

    if (!hasNewStructure && kpis && kpis.length > 0) {
        activeSummary = kpis.slice(0, 2);
        activeDetails = kpis.slice(2, 8);
    }

    // トレンドバッジのレンダリング
    const renderTrendBadge = (change, trend) => {
        if (!change) return null;
        
        let color = '#94a3b8'; // flat
        let bg = 'rgba(148, 163, 184, 0.1)';
        let arrow = '→';
        
        if (trend === 'up') {
            color = '#10b981'; // success
            bg = 'rgba(16, 185, 129, 0.1)';
            arrow = '▲';
        } else if (trend === 'down') {
            color = '#f59e0b'; // warning/amber
            bg = 'rgba(245, 158, 11, 0.1)';
            arrow = '▼';
        }

        return (
            <div 
                className="kpi-trend-badge"
                style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.4cqi', 
                    padding: '0.3cqi 0.8cqi', 
                    borderRadius: '1cqi', 
                    fontSize: '1.1cqi', 
                    fontWeight: 700,
                    color: color,
                    background: bg,
                    whiteSpace: 'nowrap'
                }}
            >
                <span>{arrow}</span>
                <span>{change}</span>
            </div>
        );
    };

    return (
        <div className="json-slide-layout indigo-style" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* ヘッダー */}
            <motion.div 
                className="indigo-slide-header"
                style={{ flexShrink: 0 }}
                {...(!isStatic && { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } })}
            >
                <h2 style={{ fontSize: '2.8cqi', margin: 0, color: 'var(--slide-heading)', fontWeight: 700 }}>
                    <SlideMarkdown content={title || 'KPI ダッシュボード'} />
                </h2>
            </motion.div>

            {/* ボディエリア */}
            <div className="indigo-slide-body" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                minHeight: 0,
                justifyContent: 'flex-start' 
            }}>
                {(() => {
                    const sCount = activeSummary.length;
                    const dCount = activeDetails.length;
                    const aCount = annotations.length;
                    
                    // 情報密度のスコア化
                    const densityScore = (sCount * 3.5) + dCount + (body_text ? 3 : 0) + (aCount > 0 ? 1 : 0);
                    
                    // 動的な設定値
                    const isLowDensity = densityScore < 8;
                    const isHighDensity = densityScore > 14;

                    // スケーリング
                    const scaleFactor = densityScore > 20 ? 0.7 
                                      : densityScore > 16 ? 0.78
                                      : densityScore > 12 ? 0.85
                                      : 1.0;
                    
                    // 余白とフォントの動的設定
                    const gridGap = isLowDensity ? '3cqi' : isHighDensity ? '0.8cqi' : '1.8cqi';
                    const cardPaddingS = isLowDensity ? '3cqi 4cqi' : isHighDensity ? '1cqi 1.8cqi' : '1.8cqi 2.5cqi';
                    const cardPaddingD = isLowDensity ? '2cqi 2.5cqi' : isHighDensity ? '0.8cqi 1.2cqi' : '1.2cqi 1.8cqi';
                    
                    const valueSizeS = isLowDensity ? '4.8cqi' : isHighDensity ? '3.2cqi' : '3.8cqi';
                    const valueSizeD = isLowDensity ? '2.5cqi' : isHighDensity ? '1.8cqi' : '2.2cqi';
                    
                    const cardMinHeightS = isLowDensity ? '18cqi' : '0';

                    return (
                        <div style={{ 
                            transform: `scale(${scaleFactor})`, 
                            transformOrigin: 'top left',
                            width: `${100 / scaleFactor}%`,
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: gridGap,
                            flex: 1,
                            justifyContent: isLowDensity ? 'center' : 'flex-start' // 少ない時は中央寄せ気味に
                        }}>
                            {/* 上段: サマリーKPI */}
                            {activeSummary.length > 0 && (
                                <div style={{ 
                                    display: 'flex', 
                                    gap: gridGap,
                                    flexShrink: 0 
                                }}>
                                    {activeSummary.map((kpi, idx) => (
                                        <motion.div 
                                            key={`summary-${idx}`}
                                            className="indigo-highlight-card"
                                            style={{ 
                                                flex: 1, 
                                                textAlign: 'left', 
                                                padding: cardPaddingS,
                                                borderLeft: `${isLowDensity ? '6px' : '4px'} solid var(--slide-primary)`,
                                                background: 'linear-gradient(to right, rgba(99, 102, 241, 0.03), transparent)',
                                                minHeight: cardMinHeightS,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center'
                                            }}
                                            {...(!isStatic && {
                                                initial: { opacity: 0, y: 15 },
                                                animate: { opacity: 1, y: 0 },
                                                transition: { delay: 0.1 + idx * 0.1 }
                                            })}
                                        >
                                            <div style={{ fontSize: isLowDensity ? '1.6cqi' : '1.3cqi', color: 'var(--slide-muted)', fontWeight: 600, marginBottom: '0.6cqi', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                <SlideMarkdown content={kpi.label} />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6cqi', marginBottom: '0.6cqi' }}>
                                                <span style={{ fontSize: valueSizeS, fontWeight: 800, color: 'var(--slide-heading)' }}>{kpi.value}</span>
                                                {kpi.unit && <span style={{ fontSize: isLowDensity ? '1.8cqi' : '1.4cqi', color: 'var(--slide-muted)', fontWeight: 600 }}>{kpi.unit}</span>}
                                            </div>
                                            {renderTrendBadge(kpi.change, kpi.trend || kpi.trend_type)}
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* 中段: 詳細KPIグリッド */}
                            {activeDetails.length > 0 && (
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: `repeat(${activeDetails.length > 3 ? 3 : Math.max(dCount, 1)}, 1fr)`,
                                    gap: gridGap,
                                    flexShrink: 0
                                }}>
                                    {activeDetails.map((kpi, idx) => (
                                        <motion.div 
                                            key={`detail-${idx}`}
                                            className="indigo-panel"
                                            style={{ 
                                                padding: cardPaddingD,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                border: '1px solid var(--slide-border)',
                                                background: '#ffffff',
                                                minHeight: isLowDensity ? '12cqi' : '0'
                                            }}
                                            {...(!isStatic && {
                                                initial: { opacity: 0, scale: 0.98 },
                                                animate: { opacity: 1, scale: 1 },
                                                transition: { delay: 0.3 + idx * 0.05 }
                                            })}
                                        >
                                            <div style={{ fontSize: isLowDensity ? '1.3cqi' : '1.1cqi', color: 'var(--slide-muted)', fontWeight: 600, marginBottom: '0.4cqi' }}>
                                                <SlideMarkdown content={kpi.label} />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4cqi', marginBottom: '0.4cqi' }}>
                                                <span style={{ fontSize: valueSizeD, fontWeight: 700, color: 'var(--slide-heading)' }}>{kpi.value}</span>
                                                {kpi.unit && <span style={{ fontSize: isLowDensity ? '1.2cqi' : '0.9cqi', color: 'var(--slide-muted)' }}>{kpi.unit}</span>}
                                            </div>
                                            {renderTrendBadge(kpi.change, kpi.trend || kpi.trend_type)}
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* 下段: インサイト */}
                            {body_text && (
                                <motion.div 
                                    className="indigo-point-box" 
                                    style={{ 
                                        marginTop: isLowDensity ? '1cqi' : '0cqi', 
                                        flexShrink: 0, 
                                        padding: isLowDensity ? '2cqi 3cqi' : '1.2cqi 1.8cqi' 
                                    }}
                                    {...(!isStatic && { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.5 } })}
                                >
                                    <div style={{ fontSize: isLowDensity ? '1.6cqi' : '1.4cqi', margin: 0, color: '#475569', lineHeight: 1.6 }}>
                                        <SlideMarkdown content={body_text} />
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* フッター注釈 */}
            {annotations.length > 0 && (
                <div style={{ 
                    fontSize: '1.1cqi', 
                    color: 'var(--slide-muted, #94a3b8)', 
                    marginTop: '1.5cqi', 
                    paddingTop: '0.8cqi', 
                    borderTop: '1px solid var(--slide-border, #e2e8f0)',
                    flexShrink: 0
                }}>
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

export default KpiDashboardSlide;
