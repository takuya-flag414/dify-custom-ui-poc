// src/components/Artifacts/JsonSlide/slides/AgendaSlide.jsx
// アジェンダ（目次）スライド: 2カラムGridで各トピックをカード表示
// レイアウト崩壊防止: 最大8件, CSS Grid, line-clamp, 狭幅時1カラムフォールバック
import React from 'react';
import { motion } from 'framer-motion';

// レイアウト崩壊防止のハード制限
const MAX_ITEMS = 8;

/**
 * AgendaSlide - アジェンダ（目次）表示
 * @param {Object} content - { title, items: [{ number, label, description? }] }
 * @param {boolean} isStatic - アニメーション無効化
 */
const AgendaSlide = ({ content, isStatic = false }) => {
    const { title, items: rawItems } = content || {};

    // 安全なデータ取得 + 制限
    const items = Array.isArray(rawItems) ? rawItems.slice(0, MAX_ITEMS) : [];

    if (items.length === 0) {
        return (
            <div className="json-slide-layout json-slide-content">
                <div className="content-slide-header">
                    <h2 className="slide-section-title">{title || 'アジェンダ'}</h2>
                    <div className="slide-title-underline" />
                </div>
                <div className="content-slide-body">
                    <p className="slide-body-text">アジェンダデータがありません</p>
                </div>
            </div>
        );
    }

    return (
        <div className="json-slide-layout json-slide-agenda">
            {/* ヘッダー */}
            <div className="content-slide-header">
                <h2 className="slide-section-title">{title || 'アジェンダ'}</h2>
                <div className="slide-title-underline" />
            </div>

            {/* アジェンダカードGrid */}
            <div className="agenda-slide-body">
                {items.map((item, idx) => {
                    const Card = isStatic ? 'div' : motion.div;
                    return (
                        <Card
                            key={idx}
                            className="agenda-card"
                            {...(!isStatic && {
                                initial: { opacity: 0, y: 12 },
                                animate: { opacity: 1, y: 0 },
                                transition: { delay: idx * 0.06, duration: 0.35 }
                            })}
                        >
                            <span className="agenda-number">
                                {item?.number ?? String(idx + 1).padStart(2, '0')}
                            </span>
                            <div className="agenda-card-text">
                                <span className="agenda-label">{item?.label ?? ''}</span>
                                {item?.description && (
                                    <span className="agenda-description">{item.description}</span>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default AgendaSlide;
