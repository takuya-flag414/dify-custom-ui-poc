// src/components/SkeletonLoader.jsx
import React from 'react';
import './styles/SkeletonLoader.css';

const SkeletonLoader = () => {
    return (
        <div className="skeleton-loader">
            <div className="skeleton-line width-70"></div>
            <div className="skeleton-line width-90 delay-100"></div>
            <div className="skeleton-line width-40 delay-200"></div>
        </div>
    );
};

export default SkeletonLoader;