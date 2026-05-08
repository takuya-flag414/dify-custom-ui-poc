// src/components/Artifacts/JsonSlide/slides/ImageContentSlide.jsx
// 画像+テキストスライド: 左右分割で画像とコンテンツを並列表示
// レイアウト崩壊防止: 画像フォールバック, object-fit: cover, overflow制御
import React from 'react';
import { motion } from 'framer-motion';


/**
 * ImageContentSlide - コーポレート画像コンテンツスライド
 * @param {Object} content - { title, body_text, bullet_points, image_url, image_alt, image_caption, layout_variation, annotations }
 */
const ImageContentSlide = ({ content, isStatic = false }) => {
    const { 
        title, 
        body_text, 
        bullet_points = [], 
        image_url, 
        image_alt, 
        image_caption,
        layout_variation = 'image-left',
        annotations = []
    } = content || {};

    const isImageRight = layout_variation === 'image-right';

    return (
        <div className="json-slide-layout image-content-slide corporate-style">
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
                <h2 className="agenda-corporate-title">{title}</h2>
            </motion.div>

            {/* ボディエリア */}
            <div className="chart-corporate-body-area">
                <div className={`image-content-corporate-grid ${isImageRight ? 'reverse' : ''}`}>
                    
                    {/* 画像エリア */}
                    <motion.div 
                        className="corporate-image-wrapper"
                        {...(!isStatic && {
                            initial: { opacity: 0, scale: 0.95 },
                            animate: { opacity: 1, scale: 1 },
                            transition: { delay: 0.2, duration: 0.6 }
                        })}
                    >
                        <div className="corporate-image-container">
                            {image_url ? (
                                <img src={image_url} alt={image_alt || title} className="corporate-image-main" />
                            ) : (
                                <div className="image-placeholder">画像が指定されていません</div>
                            )}
                        </div>
                        {image_caption && (
                            <div className="corporate-image-caption">
                                {image_caption}
                            </div>
                        )}
                    </motion.div>

                    {/* テキストエリア */}
                    <motion.div 
                        className="corporate-text-wrapper"
                        {...(!isStatic && {
                            initial: { opacity: 0, x: isImageRight ? -20 : 20 },
                            animate: { opacity: 1, x: 0 },
                            transition: { delay: 0.4, duration: 0.5 }
                        })}
                    >
                        {body_text && <p className="corporate-body-text">{body_text}</p>}
                        
                        {bullet_points.length > 0 && (
                            <ul className="corporate-bullet-list">
                                {bullet_points.map((point, idx) => (
                                    <li key={idx} className="corporate-bullet-item">
                                        <div className="corporate-bullet-icon" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </motion.div>
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

export default ImageContentSlide;
