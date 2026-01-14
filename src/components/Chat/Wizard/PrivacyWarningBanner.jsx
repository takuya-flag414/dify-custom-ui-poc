// src/components/Chat/Wizard/PrivacyWarningBanner.jsx
import React from 'react';
import './PrivacyWarningBanner.css';

/**
 * 警告アイコン（AlertTriangle）
 */
const AlertTriangleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

/**
 * PrivacyWarningBanner - 機密情報取り扱い注意の警告バナー
 * 共通コンポーネントとして WizardPrivacyTextarea と WizardFileUploader で使用
 * 
 * @param {string} title - バナーのタイトル（デフォルト: "機密情報の取り扱いに注意"）
 * @param {string} description - バナーの説明文
 */
const PrivacyWarningBanner = ({
    title = '機密情報の取り扱いに注意',
    description = '個人情報や社外秘情報の入力は避けてください。入力された内容はAIに送信されます。'
}) => {
    return (
        <div className="privacy-warning-banner">
            <AlertTriangleIcon />
            <div className="privacy-warning-banner-content">
                <span className="privacy-warning-banner-title">
                    {title}
                </span>
                <span className="privacy-warning-banner-desc">
                    {description}
                </span>
            </div>
        </div>
    );
};

export default PrivacyWarningBanner;
