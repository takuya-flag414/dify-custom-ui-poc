// src/components/Artifacts/JsonSlide/slides/AgendaSlide.jsx
// アジェンダ（目次）スライド: コーポレート・プロフェッショナルなリスト形式
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

    // 項目数に応じてレイアウトを切り替え (4件を超えたら2カラム)
    const isMultiColumn = items.length > 4;

    if (items.length === 0) {
        return (
            <div className="json-slide-layout json-slide-agenda corporate-style">
                <div className="agenda-corporate-header">
                    <div className="agenda-accent-bar" />
                    <h2 className="agenda-corporate-title">{title || 'アジェンダ'}</h2>
                </div>
                <div className="agenda-list-container">
                    <p className="slide-body-text">アジェンダデータがありません</p>
                </div>
            </div>
        );
    }

    return (
        <div className="json-slide-layout json-slide-agenda corporate-style">
            {/* ヘッダー: アクセントバー + タイトル */}
            <motion.div 
                className="agenda-corporate-header"
                {...(!isStatic && {
                    initial: { opacity: 0, x: -20 },
                    animate: { opacity: 1, x: 0 },
                    transition: { duration: 0.5 }
                })}
            >
                <div className="agenda-accent-bar" />
                <h2 className="agenda-corporate-title">{title || 'アジェンダ'}</h2>
            </motion.div>

            {/* アジェンダ・リスト領域 (項目数に応じてカラム数を変更) */}
            <div className={`agenda-list-container ${isMultiColumn ? 'columns-2' : ''}`}>
                {items.map((item, idx) => {
                    const ItemRow = isStatic ? 'div' : motion.div;
                    return (
                        <ItemRow
                            key={idx}
                            className="agenda-item-row"
                            {...(!isStatic && {
                                initial: { opacity: 0, y: 15 },
                                animate: { opacity: 1, y: 0 },
                                transition: { delay: 0.1 + idx * 0.08, duration: 0.4 }
                            })}
                        >
                            {/* 番号 */}
                            <span className="agenda-item-index">
                                {item?.number ?? String(idx + 1).padStart(2, '0')}
                            </span>

                            {/* メインコンテンツ */}
                            <div className="agenda-item-main">
                                <span className="agenda-item-label">{item?.label ?? ''}</span>
                                {item?.description && (
                                    <span className="agenda-item-description">
                                        {item.description}
                                    </span>
                                )}
                            </div>
                        </ItemRow>
                    );
                })}
            </div>
        </div>
    );
};

export default AgendaSlide;
