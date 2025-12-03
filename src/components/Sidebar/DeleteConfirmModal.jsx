// src/components/Sidebar/DeleteConfirmModal.jsx
import React from 'react';
import './DeleteConfirmModal.css'; // 次のステップで作成

/**
 * 削除確認モーダル
 * @param {boolean} isOpen - 表示状態
 * @param {function} onClose - キャンセル時のハンドラ
 * @param {function} onConfirm - 削除実行時のハンドラ
 * @param {string} conversationName - 削除する会話のタイトル
 */
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, conversationName }) => {
    if (!isOpen) return null;

    // 背景クリックで閉じるためのハンドラ
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content">
                <h3 className="modal-title">会話を削除しますか？</h3>
                <p className="modal-description">
                    「{conversationName}」を削除してもよろしいですか？<br />
                    この操作は取り消すことができません。
                </p>

                <div className="modal-actions">
                    {/* Secondary Button: キャンセル */}
                    <button className="modal-btn-cancel" onClick={onClose}>
                        キャンセル
                    </button>

                    {/* Danger Button: 削除実行 */}
                    <button className="modal-btn-delete" onClick={onConfirm}>
                        削除する
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;