// src/components/Artifacts/JsonSlide/slides/ImageContentSlide.jsx
// 画像+テキストスライド: 左右分割で画像とコンテンツを並列表示
// レイアウト崩壊防止: 画像フォールバック, object-fit: cover, overflow制御
import React, { useState } from 'react';

/**
 * ImageContentSlide - 画像 + テキスト（左右分割）
 * @param {Object} content - { title, image_url, image_alt, body_text, bullet_points }
 * @param {boolean} isStatic - アニメーション無効化
 */
const ImageContentSlide = ({ content, isStatic = false }) => {
    const { title, key_message, image_url, image_alt, body_text, bullet_points } = content || {};
    const [imageError, setImageError] = useState(false);

    const safeBullets = Array.isArray(bullet_points) ? bullet_points.slice(0, 5) : [];

    return (
        <div className="json-slide-layout json-slide-image-content">
            {/* ヘッダー */}
            <div className="content-slide-header">
                <h2 className="slide-section-title">{title || 'イメージ'}</h2>
                <div className="slide-title-underline" />
            </div>

            {/* 画像+テキスト 2カラム */}
            <div className="image-content-body">
                {/* 画像エリア */}
                <div className="image-content-image-area">
                    {image_url && !imageError ? (
                        <img
                            src={image_url}
                            alt={image_alt || title || '画像'}
                            className="image-content-img"
                            onError={() => setImageError(true)}
                            loading="lazy"
                        />
                    ) : (
                        <div className="image-content-placeholder">
                            <span className="placeholder-icon">🖼️</span>
                            <span className="placeholder-text">画像を読み込めません</span>
                        </div>
                    )}
                </div>

                {/* テキストエリア */}
                <div className="image-content-text-area">
                    {key_message && (
                        <h3 className="key-message-text">{key_message}</h3>
                    )}
                    {body_text && (
                        <p className="slide-body-text">{body_text}</p>
                    )}
                    {safeBullets.length > 0 && (
                        <ul className="slide-bullet-list">
                            {safeBullets.map((point, idx) => (
                                <li key={idx} className="slide-bullet-item">
                                    <span className="bullet-marker" />
                                    <span className="bullet-text">{point}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageContentSlide;
