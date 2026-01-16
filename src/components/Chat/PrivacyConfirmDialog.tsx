// src/components/Chat/PrivacyConfirmDialog.tsx
import React, { useEffect } from 'react';
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
    /** 送信確認時のコールバック */
    onConfirm: () => void;
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
 */
const PrivacyConfirmDialog: React.FC<PrivacyConfirmDialogProps> = ({
    detections = [],
    fileDetections = [],
    onConfirm,
    onCancel
}) => {
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
                                    <li key={item.id}>
                                        {item.label}（{item.count}件）
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

                <p className="privacy-confirm-message">
                    このまま続行してもよろしいですか？
                </p>

                <div className="privacy-confirm-actions">
                    <button className="privacy-confirm-btn-cancel" onClick={onCancel}>
                        キャンセル
                    </button>
                    <button className="privacy-confirm-btn-send" onClick={onConfirm}>
                        続行する
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PrivacyConfirmDialog;
