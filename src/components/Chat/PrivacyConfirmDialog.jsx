// src/components/Chat/PrivacyConfirmDialog.jsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import './PrivacyConfirmDialog.css';

/**
 * 盾アイコン（Shield）
 */
const ShieldIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
);

/**
 * 機密情報検知時の送信確認ダイアログ
 * React Portalで全画面オーバーレイとして表示
 * 
 * @param {Object} props
 * @param {Array<{id: string, label: string, count: number}>} props.detections - 検知された項目リスト
 * @param {Function} props.onConfirm - 送信確認時のコールバック
 * @param {Function} props.onCancel - キャンセル時のコールバック
 */
const PrivacyConfirmDialog = ({ detections, onConfirm, onCancel }) => {
    // ESCキーでキャンセル
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onCancel]);

    // 背景スクロールを無効化
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return ReactDOM.createPortal(
        <div className="privacy-confirm-overlay" onClick={onCancel}>
            <div className="privacy-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                {/* アイコン */}
                <div className="privacy-confirm-icon">
                    <ShieldIcon />
                </div>

                {/* タイトル */}
                <h3 className="privacy-confirm-title">
                    機密情報が含まれている可能性があります
                </h3>

                {/* 検知項目リスト */}
                <ul className="privacy-confirm-list">
                    {detections.map((item) => (
                        <li key={item.id}>
                            {item.label}（{item.count}件）
                        </li>
                    ))}
                </ul>

                {/* 確認メッセージ */}
                <p className="privacy-confirm-message">
                    このまま送信してもよろしいですか？
                </p>

                {/* アクションボタン */}
                <div className="privacy-confirm-actions">
                    <button className="privacy-confirm-btn-cancel" onClick={onCancel}>
                        キャンセル
                    </button>
                    <button className="privacy-confirm-btn-send" onClick={onConfirm}>
                        送信する
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PrivacyConfirmDialog;
