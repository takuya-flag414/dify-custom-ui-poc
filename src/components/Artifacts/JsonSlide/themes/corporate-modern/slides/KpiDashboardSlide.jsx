// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/slides/KpiDashboardSlide.jsx
// KPIダッシュボードスライド: 決算資料・経営ダッシュボード風の高度な指標表示
import React from 'react';
import { motion } from 'framer-motion';

/**
 * KpiDashboardSlide - プロフェッショナルKPIダッシュボード
 * @param {Object} content - { title, summary_kpis, detail_kpis, kpis, annotations }
 * @param {boolean} isStatic - アニメーション無効化
 */
const KpiDashboardSlide = ({ content, isStatic = false }) => {
    const { 
        title, 
        summary_kpis = [], 
        detail_kpis = [], 
        kpis = [], // Fallback用
        annotations = [] 
    } = content || {};

    // データの整理
    // 新形式のデータ（summary_kpis または detail_kpis）が一つでも存在すれば、それを優先する
    const hasNewStructure = (summary_kpis && summary_kpis.length > 0) || (detail_kpis && detail_kpis.length > 0);
    
    let activeSummary = summary_kpis;
    let activeDetails = detail_kpis;

    if (!hasNewStructure && kpis && kpis.length > 0) {
        // 旧形式（kpis配列のみ）の場合の自動分配
        activeSummary = kpis.slice(0, 2);
        activeDetails = kpis.slice(2, 8);
    }

    if (activeSummary.length === 0 && activeDetails.length === 0) {
        return (
            <div className="json-slide-layout json-slide-kpi-dashboard corporate-style">
                <div className="agenda-corporate-header">
                    <div className="agenda-accent-bar" />
                    <h2 className="agenda-corporate-title">{title || '業績サマリー'}</h2>
                </div>
                <div className="chart-corporate-body-area">
                    <p className="slide-body-text" style={{ padding: '4cqi', textAlign: 'center' }}>
                        KPIデータがありません
                    </p>
                </div>
            </div>
        );
    }

    // トレンド・YoYバッジのレンダリング
    const renderYoYBadge = (change, trend) => {
        if (!change) return null;
        
        let trendClass = 'up';
        let arrow = '▲';
        
        if (trend === 'down') {
            trendClass = 'down';
            arrow = '▼';
        } else if (trend === 'flat') {
            trendClass = 'flat';
            arrow = '→';
        }

        return (
            <div className={`kpi-corporate-yoy-badge ${trendClass}`}>
                {arrow} {change}
            </div>
        );
    };

    return (
        <div className="json-slide-layout json-slide-kpi-dashboard corporate-style">
            {/* ヘッダー */}
            <motion.div 
                className="agenda-corporate-header"
                {...(!isStatic && {
                    initial: { opacity: 0, x: -20 },
                    animate: { opacity: 1, x: 0 },
                    transition: { duration: 0.5 }
                })}
            >
                <div className="agenda-accent-bar" />
                <h2 className="agenda-corporate-title">{title || '業績サマリー'}</h2>
            </motion.div>

            {/* ボディエリア */}
            <div className="chart-corporate-body-area" style={{ overflow: 'hidden' }}>
                {/* トータル情報量に応じたスケーリング倍率の計算 */}
                {(() => {
                    const sCount = activeSummary.length;
                    const dCount = activeDetails.length;
                    const hCount = annotations.length;
                    
                    // 情報密度のスコア化 (サマリーは重み2、詳細は1、注釈は1)
                    const densityScore = (sCount * 2) + dCount + (hCount > 0 ? 1.5 : 0);
                    
                    // スコアに基づいた段階的なスケーリング (よりアグレッシブに)
                    const scaleFactor = densityScore > 12 ? 0.6 
                                      : densityScore > 9 ? 0.7 
                                      : densityScore > 6 ? 0.82 
                                      : densityScore > 4 ? 0.9 
                                      : 1.0;
                    
                    // 余白の計算 (スケールに連動)
                    const rowMargin = densityScore > 8 ? '1cqi' : '3cqi';
                    const gridGap = densityScore > 10 ? '1.2cqi' : '2.2cqi';
                    
                    return (
                        <div style={{ 
                            '--kpi-scale': scaleFactor, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            height: '100%',
                            justifyContent: 'space-between' 
                        }}>
                            {/* 上段: サマリーKPI */}
                            <div className="kpi-corporate-summary-row" style={{ 
                                marginBottom: rowMargin,
                                paddingBottom: `calc(${rowMargin} * 0.5)`,
                                flexShrink: 0
                            }}>
                                {activeSummary.map((kpi, idx) => (
                                    <motion.div 
                                        key={`summary-${idx}`}
                                        className="kpi-corporate-summary-item"
                                        {...(!isStatic && {
                                            initial: { opacity: 0, y: 15 },
                                            animate: { opacity: 1, y: 0 },
                                            transition: { delay: 0.2 + idx * 0.1, duration: 0.5 }
                                        })}
                                    >
                                        <div className="kpi-corporate-label-main">{kpi.label}</div>
                                        <div className="kpi-corporate-value-main-wrapper">
                                            <span className="kpi-corporate-value-main">{kpi.value}</span>
                                            {kpi.unit && <span className="kpi-corporate-unit-main">{kpi.unit}</span>}
                                        </div>
                                        {renderYoYBadge(kpi.change, kpi.trend)}
                                    </motion.div>
                                ))}
                            </div>

                            {/* 中段: 詳細KPIグリッド */}
                            <div className="kpi-corporate-details-grid" style={{
                                gap: gridGap,
                                flex: 1,
                                minHeight: 0
                            }}>
                                {activeDetails.map((kpi, idx) => (
                                    <motion.div 
                                        key={`detail-${idx}`}
                                        className="kpi-corporate-detail-item"
                                        style={{
                                            padding: densityScore > 10 ? '0.8cqi' : '1.2cqi'
                                        }}
                                        {...(!isStatic && {
                                            initial: { opacity: 0, scale: 0.98 },
                                            animate: { opacity: 1, scale: 1 },
                                            transition: { delay: 0.4 + idx * 0.05, duration: 0.4 }
                                        })}
                                    >
                                        <div className="kpi-corporate-label-sub">{kpi.label}</div>
                                        <div className="kpi-corporate-value-sub-wrapper">
                                            <span className="kpi-corporate-value-sub">{kpi.value}</span>
                                            {kpi.unit && <span className="kpi-corporate-unit-sub">{kpi.unit}</span>}
                                        </div>
                                        <div style={{ marginTop: '0.2cqi' }}>
                                            {renderYoYBadge(kpi.change, kpi.trend)}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* 下段: 注釈エリア (常に最下部に配置) */}
                            {annotations.length > 0 && (
                                <motion.div 
                                    className="kpi-corporate-annotations"
                                    style={{ 
                                        marginTop: 'auto', 
                                        paddingTop: densityScore > 10 ? '0.5cqi' : '1.5cqi',
                                        flexShrink: 0 
                                    }}
                                    {...(!isStatic && {
                                        initial: { opacity: 0 },
                                        animate: { opacity: 1 },
                                        transition: { delay: 0.6, duration: 0.5 }
                                    })}
                                >
                                    {annotations.map((note, idx) => (
                                        <div key={idx}>{note}</div>
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

export default KpiDashboardSlide;
