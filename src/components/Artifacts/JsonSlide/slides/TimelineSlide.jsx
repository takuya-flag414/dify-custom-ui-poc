// src/components/Artifacts/JsonSlide/slides/TimelineSlide.jsx
// タイムラインスライド: 時系列やステップを視覚的に表示
// レイアウト崩壊防止: イベント最大8件, line-clamp, overflow制御
import React from 'react';
import { motion } from 'framer-motion';

// レイアウト崩壊防止のハード制限
const MAX_EVENTS = 8;

/**
 * TimelineSlide - タイムライン/ステップ表示
 * @param {Object} content - { title, events: [{year|step, description}] }
 * @param {boolean} isStatic - アニメーション無効化
 */
const TimelineSlide = ({ content, isStatic = false }) => {
    const { title, events: rawEvents } = content || {};

    // 安全なデータ取得 + 制限
    const events = Array.isArray(rawEvents) ? rawEvents.slice(0, MAX_EVENTS) : [];

    if (events.length === 0) {
        return (
            <div className="json-slide-layout json-slide-content">
                <div className="content-slide-header">
                    <h2 className="slide-section-title">{title || 'タイムライン'}</h2>
                    <div className="slide-title-underline" />
                </div>
                <div className="content-slide-body">
                    <p className="slide-body-text">タイムラインデータがありません</p>
                </div>
            </div>
        );
    }

    return (
        <div className="json-slide-layout json-slide-timeline">
            {/* ヘッダー */}
            <div className="content-slide-header">
                <h2 className="slide-section-title">{title || 'タイムライン'}</h2>
                <div className="slide-title-underline" />
            </div>

            {/* タイムライン本体 */}
            <div className="timeline-slide-body">
                {events.map((event, idx) => {
                    const Item = isStatic ? 'div' : motion.div;
                    const label = event?.year || event?.step || `Step ${idx + 1}`;

                    return (
                        <Item
                            key={idx}
                            className="timeline-event"
                            {...(!isStatic && {
                                initial: { opacity: 0, x: -15 },
                                animate: { opacity: 1, x: 0 },
                                transition: { delay: idx * 0.08, duration: 0.3 }
                            })}
                        >
                            <div className="timeline-marker">
                                <div className="timeline-dot" />
                            </div>
                            <div className="timeline-content">
                                <span className="timeline-label">{label}</span>
                                <p className="timeline-description">
                                    {event?.description ?? ''}
                                </p>
                            </div>
                        </Item>
                    );
                })}
            </div>
        </div>
    );
};

export default TimelineSlide;
