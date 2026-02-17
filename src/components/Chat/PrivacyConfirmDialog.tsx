// src/components/Chat/PrivacyConfirmDialog.tsx
import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import './PrivacyConfirmDialog.css';

/**
 * 検知項目の型
 */
export interface Detection {
    id: string;
    label: string;
    count: number;
}

/**
 * ファイル検知項目の型
 */
export interface FileDetection {
    fileName: string;
    detections: Detection[];
}

/**
 * PrivacyConfirmDialog のProps型
 */
interface PrivacyConfirmDialogProps {
    /** テキストから検知された項目リスト */
    detections?: Detection[];
    /** ファイルから検知された項目リスト */
    fileDetections?: FileDetection[];
    /** 送信確認時のコールバック（除外された検知タイプIDの配列を渡す） */
    onConfirm: (excludedTypes: string[]) => void;
    /** キャンセル時のコールバック */
    onCancel: () => void;
}

/**
 * 盾アイコン
 */
const ShieldIcon: React.FC = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
);

/**
 * 機密情報検知時の送信確認ダイアログ
 * 各検知項目のサニタイズON/OFF切替と平文送信の注意書きを含む
 */
const PrivacyConfirmDialog: React.FC<PrivacyConfirmDialogProps> = ({
    detections = [],
    fileDetections = [],
    onConfirm,
    onCancel
}) => {
    // 各検知項目のサニタイズ有効/無効状態（true = サニタイズ ON）
    const [sanitizeFlags, setSanitizeFlags] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        detections.forEach(d => { initial[d.id] = true; });
        return initial;
    });

    const toggleFlag = useCallback((id: string) => {
        setSanitizeFlags(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    // 除外された（OFF にした）検知タイプ ID のリスト
    const excludedTypes = Object.entries(sanitizeFlags)
        .filter(([, enabled]) => !enabled)
        .map(([id]) => id);

    const hasExcluded = excludedTypes.length > 0;

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onCancel]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleConfirm = () => {
        onConfirm(excludedTypes);
    };

    const hasTextDetections = detections.length > 0;
    const hasFileDetections = fileDetections.length > 0;

    return ReactDOM.createPortal(
        <div className="privacy-confirm-overlay" onClick={onCancel}>
            <div className="privacy-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="privacy-confirm-icon">
                    <ShieldIcon />
                </div>

                <h3 className="privacy-confirm-title">
                    機密情報が含まれている可能性があります
                </h3>

                <div className="privacy-confirm-detections-scroll">
                    {hasTextDetections && (
                        <div className="privacy-confirm-section">
                            <h4 className="privacy-confirm-section-title">入力テキスト</h4>
                            <ul className="privacy-confirm-list">
                                {detections.map((item) => (
                                    <li key={item.id} className="privacy-confirm-item">
                                        <span className="privacy-confirm-item-label">
                                            {item.label}（{item.count}件）
                                        </span>
                                        <button
                                            type="button"
                                            className={`privacy-toggle ${sanitizeFlags[item.id] ? 'privacy-toggle--on' : 'privacy-toggle--off'}`}
                                            onClick={() => toggleFlag(item.id)}
                                            title={sanitizeFlags[item.id] ? 'サニタイズ ON: トークン化して送信' : 'サニタイズ OFF: 平文のまま送信'}
                                            aria-label={`${item.label} のサニタイズ切替`}
                                        >
                                            <span className="privacy-toggle__icon">
                                                {sanitizeFlags[item.id] ? '🔒' : '🔓'}
                                            </span>
                                            <span className="privacy-toggle__label">
                                                {sanitizeFlags[item.id] ? '保護' : '除外'}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {hasFileDetections && (
                        <div className="privacy-confirm-section">
                            <h4 className="privacy-confirm-section-title">添付ファイル</h4>
                            {fileDetections.map((fileItem, idx) => (
                                <div key={idx} className="privacy-confirm-file-item">
                                    <span className="privacy-confirm-file-name">{fileItem.fileName}</span>
                                    <ul className="privacy-confirm-list">
                                        {fileItem.detections.map((item) => (
                                            <li key={item.id}>
                                                {item.label}（{item.count}件）
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 除外項目がある場合の注意書き */}
                {hasExcluded && (
                    <div className="privacy-confirm-warning">
                        <span className="privacy-confirm-warning__icon">⚠️</span>
                        <p className="privacy-confirm-warning__text">
                            🔓の項目は<strong>平文のまま</strong>送信されます。サーバーに元の値がそのまま記録され、第三者に閲覧される可能性があります。
                        </p>
                    </div>
                )}

                <p className="privacy-confirm-message">
                    このまま続行してもよろしいですか？
                </p>

                <div className="privacy-confirm-actions">
                    <button className="privacy-confirm-btn-cancel" onClick={onCancel}>
                        キャンセル
                    </button>
                    <button className="privacy-confirm-btn-send" onClick={handleConfirm}>
                        続行する
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PrivacyConfirmDialog;
