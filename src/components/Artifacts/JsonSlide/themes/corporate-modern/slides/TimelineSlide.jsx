// @deprecated - Phase 2: 動的スライドレイアウトエンジンへの移行に伴い、将来のリファクタリングで削除予定です。
// src/components/Artifacts/JsonSlide/slides/TimelineSlide.jsx
import React from 'react';
import { motion } from 'framer-motion';

/**
 * TimelineSlide - コーポレート・ロードマップ / 沿革スライド
 * @param {Object} content - { title, events: [{ label, title, description }], annotations }
 */
const TimelineSlide = ({ content, isStatic = false }) => {
    const { 
        title, 
        events: rawEvents = [], 
        annotations = [],
        layout_variation = 'vertical'
    } = content || {};

    const isHorizontal = layout_variation === 'horizontal';

    // データの正規化
    const events = Array.isArray(rawEvents) ? rawEvents.map(e => ({
        label: e.label || e.year || e.step || '',
        title: e.title || '',
        description: e.description || ''
    })) : [];

    // 項目数に応じたスケーリング
    const eCount = events.length;
    const scaleFactor = isHorizontal 
                      ? (eCount > 5 ? 0.75 : eCount > 3 ? 0.9 : 1.0)
                      : (eCount > 6 ? 0.7 : eCount > 4 ? 0.85 : 1.0);

    return (
        <div className={`json-slide-layout timeline-slide corporate-style ${isHorizontal ? 'horizontal' : ''}`}>
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
                <h2 className="agenda-corporate-title">{title || 'プロジェクトの進捗'}</h2>
            </motion.div>

            {/* ボディエリア */}
            <div className="chart-corporate-body-area">
                <div 
                    className={`corporate-timeline-container ${isHorizontal ? 'horizontal' : ''}`}
                    style={{ '--timeline-scale': scaleFactor }}
                >
                    {/* ライン */}
                    {isHorizontal ? (
                        <div className="corporate-timeline-horizontal-line" />
                    ) : (
                        <div className="corporate-timeline-vertical-line" />
                    )}

                    {events.map((event, idx) => (
                        <motion.div 
                            key={idx} 
                            className={`corporate-timeline-item ${isHorizontal ? 'horizontal' : ''}`}
                            {...(!isStatic && {
                                initial: { opacity: 0, [isHorizontal ? 'y' : 'x']: 20 },
                                animate: { opacity: 1, [isHorizontal ? 'y' : 'x']: 0 },
                                transition: { delay: 0.2 + idx * 0.1, duration: 0.5 }
                            })}
                        >
                            {/* 時期 */}
                            <div className="corporate-timeline-period">{event.label}</div>
                            
                            {/* ノード */}
                            <div className="corporate-timeline-node" />
                            
                            {/* コンテンツ */}
                            <div className="corporate-timeline-content">
                                {event.title && (
                                    <h4 className="corporate-timeline-event-title">{event.title}</h4>
                                )}
                                {event.description && (
                                    <p className="corporate-timeline-event-desc">{event.description}</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* 注釈エリア (最下部) */}
                {annotations.length > 0 && (
                    <motion.div 
                        className="kpi-corporate-annotations"
                        style={{ marginTop: 'auto', paddingTop: '2cqi' }}
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
        </div>
    );
};

export default TimelineSlide;
