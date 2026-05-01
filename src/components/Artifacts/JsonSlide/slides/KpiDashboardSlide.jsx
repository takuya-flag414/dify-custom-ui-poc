// src/components/Artifacts/JsonSlide/slides/KpiDashboardSlide.jsx
// KPIダッシュボードスライド: トレンドインジケータ付きのKPIカード表示
// レイアウト崩壊防止: 最大6件, auto-fit Grid, トレンド色分け, overflow制御
import React from 'react';
import { motion } from 'framer-motion';

// レイアウト崩壊防止のハード制限
const MAX_KPIS = 6;

// トレンドアイコンと配色のマッピング
const TREND_CONFIG = {
    up: { icon: '▲', className: 'trend-up' },
    down: { icon: '▼', className: 'trend-down' },
    flat: { icon: '→', className: 'trend-flat' },
};

/**
 * KpiDashboardSlide - KPIダッシュボード表示
 * @param {Object} content - { title, kpis: [{ value, unit, label, trend?, change? }] }
 * @param {boolean} isStatic - アニメーション無効化
 */
const KpiDashboardSlide = ({ content, isStatic = false }) => {
    const { title, kpis: rawKpis } = content || {};

    // 安全なデータ取得 + 制限
    const kpis = Array.isArray(rawKpis) ? rawKpis.slice(0, MAX_KPIS) : [];

    if (kpis.length === 0) {
        return (
            <div className="json-slide-layout json-slide-content">
                <div className="content-slide-header">
                    <h2 className="slide-section-title">{title || 'KPIダッシュボード'}</h2>
                    <div className="slide-title-underline" />
                </div>
                <div className="content-slide-body">
                    <p className="slide-body-text">KPIデータがありません</p>
                </div>
            </div>
        );
    }

    return (
        <div className="json-slide-layout json-slide-kpi-dashboard">
            {/* ヘッダー */}
            <div className="content-slide-header">
                <h2 className="slide-section-title">{title || 'KPIダッシュボード'}</h2>
                <div className="slide-title-underline" />
            </div>

            {/* KPIカードGrid */}
            <div className="kpi-dashboard-body">
                {kpis.map((kpi, idx) => {
                    const Card = isStatic ? 'div' : motion.div;
                    const trendKey = kpi?.trend ?? 'flat';
                    const trend = TREND_CONFIG[trendKey] || TREND_CONFIG.flat;

                    return (
                        <Card
                            key={idx}
                            className="kpi-card"
                            {...(!isStatic && {
                                initial: { opacity: 0, scale: 0.95 },
                                animate: { opacity: 1, scale: 1 },
                                transition: { delay: idx * 0.08, duration: 0.35 }
                            })}
                        >
                            {/* KPI値 */}
                            <div className="kpi-value-container">
                                <span className="kpi-value">{kpi?.value ?? '—'}</span>
                                {kpi?.unit && <span className="kpi-unit">{kpi.unit}</span>}
                            </div>

                            {/* KPIラベル */}
                            <span className="kpi-label">{kpi?.label ?? ''}</span>

                            {/* トレンドインジケータ */}
                            <div className={`kpi-trend ${trend.className}`}>
                                <span className="kpi-trend-icon">{trend.icon}</span>
                                <span className="kpi-trend-change">{kpi?.change ?? ''}</span>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default KpiDashboardSlide;
