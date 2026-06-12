import React, { useState } from 'react';

interface Props {
    label: string;
    prompt?: string;
    search_query?: string;
    aspect_ratio?: string;
    image_url?: string;
    fallback_text?: string;
}

export const SlideImagePlaceholder: React.FC<Props> = ({
    label,
    prompt,
    search_query,
    aspect_ratio = '16:9',
    image_url,
    fallback_text
}) => {
    const [showDebug, setShowDebug] = useState(false);
    
    // アスペクト比のスタイル値をマッピング (CSS の aspect-ratio プロパティ用)
    const getAspectRatioStyle = () => {
        if (aspect_ratio === '16:9') return '16 / 9';
        if (aspect_ratio === '4:3') return '4 / 3';
        if (aspect_ratio === '1:1') return '1 / 1';
        return '16 / 9';
    };

    if (image_url) {
        return (
            <div className="slide-block slide-image-container" style={{ aspectRatio: getAspectRatioStyle() }}>
                <img 
                    src={image_url} 
                    alt={fallback_text || label} 
                    className="slide-image-element"
                />
            </div>
        );
    }

    return (
        <div className="slide-block slide-image-placeholder" style={{ aspectRatio: getAspectRatioStyle() }}>
            {/* ワイヤーフレーム風の対角線 SVG バックグラウンド */}
            <div className="placeholder-wireframe-lines">
                <svg width="100%" height="100%">
                    <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="100%" x2="100%" y2="0" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
                </svg>
            </div>

            <div className="placeholder-content">
                <div className="placeholder-icon">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                </div>
                <div className="placeholder-label">{label}</div>
                <div className="placeholder-badge">ビジュアル挿入予定</div>
            </div>

            {/* 将来の画像生成・取得API連携を視野に入れたプロンプト・クエリ確認用のトグルフッター */}
            {(prompt || search_query) && (
                <div className="placeholder-api-metadata">
                    <button 
                        type="button" 
                        className="metadata-toggle-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDebug(!showDebug);
                        }}
                    >
                        <span className={`toggle-icon ${showDebug ? 'open' : ''}`}>▶</span> 
                        {showDebug ? '生成API設定を閉じる' : '生成API設定を表示 (Prompt / Query)'}
                    </button>
                    
                    {showDebug && (
                        <div className="metadata-details">
                            {prompt && (
                                <div className="metadata-field">
                                    <span className="field-name">画像生成 Prompt:</span>
                                    <code className="field-value">{prompt}</code>
                                </div>
                            )}
                            {search_query && (
                                <div className="metadata-field">
                                    <span className="field-name">ストック素材 Query:</span>
                                    <code className="field-value">{search_query}</code>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
