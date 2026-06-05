// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/slides/StatsSlide.jsx
// 統計ハイライトスライド: コーポレート・プロフェッショナルな数値強調（マルチレイアウト対応）
import React from 'react';
import { motion } from 'framer-motion';

// レイアウト崩壊防止のハード制限
const MAX_STATS = 12;

/**
 * StatsSlide - 数値ハイライト表示 (+ 説明文)
 * @param {Object} content - { title, stats: [{value, unit, label, description?}], description, layout_variation }
 * @param {boolean} isStatic - アニメーション無効化
 */
const StatsSlide = ({ content, isStatic = false }) => {
    const { 
        title, 
        stats: rawStats, 
        description, 
        layout_variation = 'default' 
    } = content || {};

    // 安全なデータ取得 + 制限
    const stats = Array.isArray(rawStats) ? rawStats.slice(0, MAX_STATS) : [];

    if (stats.length === 0) {
        return (
            <div className="json-slide-layout json-slide-stats corporate-style">
                <div className="agenda-corporate-header">
                    <div className="agenda-accent-bar" />
                    <h2 className="agenda-corporate-title">{title || '主要指標'}</h2>
                </div>
                <div className="chart-corporate-body-area">
                    <p className="slide-body-text" style={{ padding: '4cqi', textAlign: 'center' }}>
                        統計データがありません
                    </p>
                </div>
            </div>
        );
    }

    const isSplit = layout_variation === 'two-column';
    
    // 項目数に応じた列数とスケーリングの決定
    let gridCols = 2;
    if (isSplit) {
        gridCols = stats.length >= 4 ? 2 : 1; // 4個以上なら2列に切り替えて高さを抑える
    } else {
        gridCols = stats.length > 4 ? 4 : stats.length >= 3 ? 3 : 2; // フルワイド時は柔軟に
    }

    const scaleFactor = stats.length > 9 ? 0.6
                      : stats.length > 6 ? 0.75
                      : 1.0;

    // 統計グリッド部分を共通化
    const StatsGrid = () => (
        <div 
            className={`stats-corporate-grid ${isSplit ? 'is-split' : ''} ${stats.length > 6 ? 'high-density' : ''}`}
            style={{ 
                '--grid-cols': gridCols,
                '--stats-scale': scaleFactor 
            }}
        >
            {stats.map((stat, idx) => (
                <motion.div
                    key={idx}
                    className="stats-corporate-item"
                    style={{ 
                        // 2カラムで項目数が多い場合、さらに余白を詰める
                        paddingLeft: isSplit && stats.length > 4 ? '1.5cqi' : '2.5cqi'
                    }}
                    {...(!isStatic && {
                        initial: { opacity: 0, x: 15 },
                        animate: { opacity: 1, x: 0 },
                        transition: { delay: idx * 0.1, duration: 0.5 }
                    })}
                >
                    <div className="stats-corporate-value-wrapper">
                        <span className="stats-corporate-value">{stat?.value ?? '—'}</span>
                        {stat?.unit && <span className="stats-corporate-unit">{stat.unit}</span>}
                    </div>
                    <div className="stats-corporate-label">{stat?.label ?? ''}</div>
                    {stat?.description && (
                        <div className="stats-corporate-description">{stat.description}</div>
                    )}
                </motion.div>
            ))}
        </div>
    );

    return (
        <div className="json-slide-layout json-slide-stats corporate-style">
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
                <h2 className="agenda-corporate-title">{title || '主要指標'}</h2>
            </motion.div>

            {/* ボディエリア */}
            <div className="chart-corporate-body-area">
                {isSplit ? (
                    <div className="stats-corporate-layout-two-column">
                        <div className="stats-corporate-desc-pane">
                            {description}
                        </div>
                        <div className="stats-corporate-stats-pane">
                            <StatsGrid />
                        </div>
                    </div>
                ) : (
                    <StatsGrid />
                )}
            </div>
        </div>
    );
};

export default StatsSlide;
