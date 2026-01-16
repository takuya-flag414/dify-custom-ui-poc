// src/components/Message/SkeletonLoader.tsx
import React from 'react';
import './SkeletonLoader.css';

/**
 * スケルトンローダーコンポーネント
 * メッセージ読み込み中のプレースホルダー表示
 */
const SkeletonLoader: React.FC = () => {
    return (
        <div className="skeleton-loader">
            <div className="skeleton-line width-70"></div>
            <div className="skeleton-line width-90 delay-100"></div>
            <div className="skeleton-line width-40 delay-200"></div>
        </div>
    );
};

export default SkeletonLoader;
