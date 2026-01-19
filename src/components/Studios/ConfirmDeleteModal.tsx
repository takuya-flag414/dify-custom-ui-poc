/**
 * ConfirmDeleteModal - スタジオ削除確認ダイアログ
 * 
 * macOS風の警告ダイアログ。
 * mat-hud マテリアルを使用し、削除ボタンはdangerカラーで強調。
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';
import './ConfirmDeleteModal.css';

interface ConfirmDeleteModalProps {
    /** モーダルが開いているか */
    isOpen: boolean;
    /** 閉じるコールバック */
    onClose: () => void;
    /** 削除確定コールバック */
    onConfirm: () => void;
    /** スタジオ名 */
    studioName: string;
}

/**
 * ConfirmDeleteModal
 */
export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    studioName,
}) => {
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="confirm-delete-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="confirm-delete-modal"
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                        }}
                    >
                        {/* Icon */}
                        <div className="confirm-delete-modal__icon">
                            <AlertTriangle size={32} />
                        </div>

                        {/* Content */}
                        <div className="confirm-delete-modal__content">
                            <h3 className="confirm-delete-modal__title">
                                スタジオを削除しますか？
                            </h3>
                            <p className="confirm-delete-modal__message">
                                「{studioName}」を削除すると、この操作は取り消せません。
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="confirm-delete-modal__actions">
                            <motion.button
                                className="confirm-delete-modal__btn confirm-delete-modal__btn--cancel"
                                onClick={onClose}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                キャンセル
                            </motion.button>
                            <motion.button
                                className="confirm-delete-modal__btn confirm-delete-modal__btn--delete"
                                onClick={onConfirm}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Trash2 size={16} />
                                削除
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ConfirmDeleteModal;
