// src/components/Chat/Wizard/WizardPrivacyTextarea.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { scanText } from '../../../utils/privacyDetector';
import './WizardPrivacyTextarea.css';

// --- Icons ---
const AlertTriangleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const ShieldAlertIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
    </svg>
);

/**
 * WizardPrivacyTextarea
 * 機密情報検知機能付きテキストエリア
 * - 警告バナー常時表示
 * - リアルタイム機密情報スキャン
 * - 検知結果の視覚的フィードバック
 * - オプションで件名入力欄を追加（showSubject=true）
 * 
 * @param {string|object} value - 文字列または { subject, message } オブジェクト
 * @param {function} onChange - 値変更時のコールバック
 * @param {string} placeholder - テキストエリアのプレースホルダー
 * @param {boolean} showSubject - trueの場合、件名入力欄を表示
 * @param {string} subjectPlaceholder - 件名入力欄のプレースホルダー
 */
const WizardPrivacyTextarea = ({
    value = '',
    onChange,
    placeholder,
    showSubject = false,
    subjectPlaceholder = '例: Re: プロジェクト進捗について'
}) => {
    const [privacyWarning, setPrivacyWarning] = useState({ hasWarning: false, detections: [] });

    // valueを正規化（文字列またはオブジェクトに対応）
    const normalizedValue = useMemo(() => {
        if (showSubject) {
            if (typeof value === 'object' && value !== null) {
                return { subject: value.subject || '', message: value.message || '' };
            }
            return { subject: '', message: typeof value === 'string' ? value : '' };
        }
        return typeof value === 'string' ? value : '';
    }, [value, showSubject]);

    // スキャン対象のテキストを取得
    const textToScan = useMemo(() => {
        if (showSubject && typeof normalizedValue === 'object') {
            return `${normalizedValue.subject}\n${normalizedValue.message}`;
        }
        return normalizedValue;
    }, [normalizedValue, showSubject]);

    // デバウンス付きでリアルタイムスキャン（件名+本文の両方をスキャン）
    useEffect(() => {
        const timer = setTimeout(() => {
            if (textToScan.trim()) {
                const result = scanText(textToScan);
                setPrivacyWarning(result);
            } else {
                setPrivacyWarning({ hasWarning: false, detections: [] });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [textToScan]);

    // 値の更新ハンドラ
    const handleSubjectChange = (e) => {
        const newSubject = e.target.value;
        onChange({ subject: newSubject, message: normalizedValue.message });
    };

    const handleMessageChange = (e) => {
        const newMessage = e.target.value;
        if (showSubject) {
            onChange({ subject: normalizedValue.subject, message: newMessage });
        } else {
            onChange(newMessage);
        }
    };

    return (
        <div className="wizard-privacy-textarea">
            {/* 警告バナー（常時表示） */}
            <div className="privacy-warning-banner">
                <AlertTriangleIcon />
                <div className="privacy-warning-banner-content">
                    <span className="privacy-warning-banner-title">
                        機密情報の取り扱いに注意
                    </span>
                    <span className="privacy-warning-banner-desc">
                        個人情報や社外秘情報の入力は避けてください。入力された内容はAIに送信されます。
                    </span>
                </div>
            </div>

            {/* 件名入力欄（showSubject=trueの場合のみ） */}
            {showSubject && (
                <div className="privacy-subject-wrapper">
                    <label className="privacy-subject-label">件名</label>
                    <input
                        type="text"
                        className={`privacy-subject-input ${privacyWarning.hasWarning ? 'has-warning' : ''}`}
                        value={normalizedValue.subject}
                        onChange={handleSubjectChange}
                        placeholder={subjectPlaceholder}
                    />
                </div>
            )}

            {/* テキストエリア */}
            <div className="privacy-textarea-wrapper">
                <label className="privacy-message-label">
                    {showSubject ? '本文' : ''}
                </label>
                <textarea
                    className={`privacy-textarea ${privacyWarning.hasWarning ? 'has-warning' : ''}`}
                    value={showSubject ? normalizedValue.message : normalizedValue}
                    onChange={handleMessageChange}
                    placeholder={placeholder || 'メールやメッセージの内容を貼り付けてください...'}
                    rows={6}
                    autoFocus={!showSubject}
                />
            </div>

            {/* 検知結果アラート */}
            <AnimatePresence>
                {privacyWarning.hasWarning && (
                    <motion.div
                        className="privacy-detection-alert"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        <ShieldAlertIcon />
                        <span>機密情報を検知:</span>
                        <div className="privacy-detection-list">
                            {privacyWarning.detections.map((detection) => (
                                <span key={detection.id} className="privacy-detection-tag">
                                    {detection.label} ({detection.count}件)
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WizardPrivacyTextarea;

