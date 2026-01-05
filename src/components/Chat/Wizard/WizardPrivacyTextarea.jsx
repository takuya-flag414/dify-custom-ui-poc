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
 * - オプションで宛名入力欄を追加（showRecipient=true）
 * 
 * @param {string|object} value - 文字列または { recipient, subject, message } オブジェクト
 * @param {function} onChange - 値変更時のコールバック
 * @param {string} placeholder - テキストエリアのプレースホルダー
 * @param {boolean} showSubject - trueの場合、件名入力欄を表示
 * @param {string} subjectPlaceholder - 件名入力欄のプレースホルダー
 * @param {boolean} showRecipient - trueの場合、宛名入力欄を表示
 * @param {string} recipientPlaceholder - 宛名入力欄のプレースホルダー
 */
const ChevronDownIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const HONORIFIC_OPTIONS = ['様', 'さん', '君', 'その他'];

/**
 * WizardPrivacyTextarea
 * 機密情報検知機能付きテキストエリア
 * ... (existing docs)
 * 
 * @param {string|object} value - 文字列または { recipient, honorific, subject, message } オブジェクト
 * ...
 */
const WizardPrivacyTextarea = ({
    value = '',
    onChange,
    placeholder,
    showSubject = false,
    subjectPlaceholder = '例: Re: プロジェクト進捗について',
    showRecipient = false,
    recipientPlaceholder = '例: 田中 太郎'
}) => {
    const [privacyWarning, setPrivacyWarning] = useState({ hasWarning: false, detections: [] });
    // 敬称メニューの開閉状態
    const [isHonorificOpen, setIsHonorificOpen] = useState(false);

    // valueを正規化
    const normalizedValue = useMemo(() => {
        if (typeof value === 'object' && value !== null) {
            return {
                recipient: value.recipient || '',
                // undefinedのみデフォルト適用 (空文字＝手入力モードを許容)
                honorific: value.honorific !== undefined ? value.honorific : '様',
                subject: value.subject || '',
                message: value.message || ''
            };
        }
        return { recipient: '', honorific: '様', subject: '', message: typeof value === 'string' ? value : '' };
    }, [value]);

    // 値の更新ハンドラ
    const handleValueChange = (key, val) => {
        onChange({ ...normalizedValue, [key]: val });
    };

    // 敬称選択ハンドラ
    const handleHonorificSelect = (selected) => {
        // 「その他」が選ばれた場合は、一時的に空文字にして手入力モードへ（実装としてはテキスト入力と共有）
        // ここでは単純に文字列として保持する仕様にする
        if (selected === 'その他') {
            handleValueChange('honorific', '');
        } else {
            handleValueChange('honorific', selected);
        }
        setIsHonorificOpen(false);
    };

    // スキャン対象のテキストを取得
    const textToScan = useMemo(() => {
        const parts = [];
        if (showRecipient) {
            parts.push(normalizedValue.recipient);
            parts.push(normalizedValue.honorific);
        }
        if (showSubject) parts.push(normalizedValue.subject);
        parts.push(normalizedValue.message);
        return parts.join('\n');
    }, [normalizedValue, showSubject, showRecipient]);

    // デバウンス付きでリアルタイムスキャン
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

    // その他の手入力モードかどうか判定 (選択肢に含まれていない場合は手入力とみなす)
    const isCustomHonorific = !['様', 'さん', '君'].includes(normalizedValue.honorific);

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

            {/* 宛名入力欄（showRecipient=trueの場合のみ） */}
            {showRecipient && (
                <div className="privacy-recipient-group-wrapper">
                    <label className="privacy-subject-label">宛名</label>
                    <div className={`privacy-recipient-group ${privacyWarning.hasWarning ? 'has-warning' : ''}`}>
                        {/* 名前入力 */}
                        <input
                            type="text"
                            className="privacy-recipient-input"
                            value={normalizedValue.recipient}
                            onChange={(e) => handleValueChange('recipient', e.target.value)}
                            placeholder={recipientPlaceholder}
                        />

                        {/* 敬称セパレータ */}
                        <div className="privacy-recipient-separator" />

                        {/* 敬称セレクター / 入力 */}
                        <div className="privacy-honorific-wrapper">
                            {isCustomHonorific ? (
                                <div className="honorific-custom-input-wrapper">
                                    <input
                                        type="text"
                                        className="honorific-custom-input"
                                        value={normalizedValue.honorific}
                                        onChange={(e) => handleValueChange('honorific', e.target.value)}
                                        placeholder="敬称"
                                        autoFocus
                                    />
                                    <button
                                        className="honorific-reset-btn"
                                        onClick={() => handleValueChange('honorific', '様')}
                                        title="選択に戻る"
                                    >
                                        <ChevronDownIcon />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="honorific-selector-trigger"
                                    onClick={() => setIsHonorificOpen(!isHonorificOpen)}
                                    type="button"
                                >
                                    <span>{normalizedValue.honorific}</span>
                                    <motion.div
                                        animate={{ rotate: isHonorificOpen ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronDownIcon />
                                    </motion.div>
                                </button>
                            )}

                            {/* ドロップダウンメニュー */}
                            <AnimatePresence>
                                {isHonorificOpen && !isCustomHonorific && (
                                    <>
                                        {/* Backdrop for closing */}
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsHonorificOpen(false)}
                                            style={{ cursor: 'default' }}
                                        />
                                        <motion.div
                                            className="honorific-dropdown"
                                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        >
                                            {HONORIFIC_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt}
                                                    className="honorific-option"
                                                    onClick={() => handleHonorificSelect(opt)}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            )}

            {/* 件名入力欄（showSubject=trueの場合のみ） */}
            {showSubject && (
                <div className="privacy-subject-wrapper">
                    <label className="privacy-subject-label">件名</label>
                    <input
                        type="text"
                        className={`privacy-subject-input ${privacyWarning.hasWarning ? 'has-warning' : ''}`}
                        value={normalizedValue.subject}
                        onChange={(e) => handleValueChange('subject', e.target.value)}
                        placeholder={subjectPlaceholder}
                    />
                </div>
            )}

            {/* テキストエリア */}
            <div className="privacy-textarea-wrapper">
                <label className="privacy-message-label">
                    {showSubject || showRecipient ? '本文' : ''}
                </label>
                <textarea
                    className={`privacy-textarea ${privacyWarning.hasWarning ? 'has-warning' : ''}`}
                    value={normalizedValue.message}
                    onChange={(e) => handleValueChange('message', e.target.value)}
                    placeholder={placeholder || 'メールやメッセージの内容を貼り付けてください...'}
                    rows={6}
                    autoFocus={!(showSubject || showRecipient)}
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

