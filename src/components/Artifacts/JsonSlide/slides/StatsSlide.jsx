// src/components/Artifacts/JsonSlide/slides/StatsSlide.jsx
// 統計ハイライトスライド: KPIや数値を大きく強調表示
// レイアウト崩壊防止: カード数最大4, flex-wrap, フォント自動縮小
import React from 'react';
import { motion } from 'framer-motion';

// レイアウト崩壊防止のハード制限
const MAX_STATS = 4;

/**
 * StatsSlide - 数値ハイライトカード表示
 * @param {Object} content - { title, stats: [{value, unit, label, description?}] }
 * @param {boolean} isStatic - アニメーション無効化
 */
const StatsSlide = ({ content, isStatic = false }) => {
    const { title, stats: rawStats } = content || {};

    // 安全なデータ取得 + 制限
    const stats = Array.isArray(rawStats) ? rawStats.slice(0, MAX_STATS) : [];

    if (stats.length === 0) {
        return (
            <div className="json-slide-layout json-slide-content">
                <div className="content-slide-header">
                    <h2 className="slide-section-title">{title || '統計'}</h2>
                    <div className="slide-title-underline" />
                </div>
                <div className="content-slide-body">
                    <p className="slide-body-text">統計データがありません</p>
                </div>
            </div>
        );
    }

    return (
        <div className="json-slide-layout json-slide-stats">
            {/* ヘッダー */}
            <div className="content-slide-header">
                <h2 className="slide-section-title">{title || '主要指標'}</h2>
                <div className="slide-title-underline" />
            </div>

            {/* 統計カード群 */}
            <div className="stats-slide-body">
                {stats.map((stat, idx) => {
                    const Card = isStatic ? 'div' : motion.div;
                    return (
                        <Card
                            key={idx}
                            className="stats-card"
                            {...(!isStatic && {
                                initial: { opacity: 0, y: 15 },
                                animate: { opacity: 1, y: 0 },
                                transition: { delay: idx * 0.1, duration: 0.4 }
                            })}
                        >
                            <div className="stats-value-container">
                                <span className="stats-value">{stat?.value ?? '—'}</span>
                                {stat?.unit && <span className="stats-unit">{stat.unit}</span>}
                            </div>
                            <span className="stats-label">{stat?.label ?? ''}</span>
                            {stat?.description && (
                                <span className="stats-description">{stat.description}</span>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default StatsSlide;
