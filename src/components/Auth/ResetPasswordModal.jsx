// src/components/Auth/ResetPasswordModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const ResetPasswordModal = ({ onClose }) => {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setSuccessMsg('');

        if (!email.trim()) {
            setLocalError('メールアドレスを入力してください');
            return;
        }

        try {
            setIsSubmitting(true);
            await resetPassword(email);
            setSuccessMsg('再設定用のメールを送信しました。受信トレイをご確認ください。');
            setTimeout(() => {
                onClose();
            }, 3000); // 3秒後に自動的に閉じる
        } catch (err) {
            setLocalError(err.message || 'メールの送信に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: {
            opacity: 1, scale: 1, y: 0,
            transition: { type: 'spring', stiffness: 250, damping: 25 }
        },
        exit: {
            opacity: 0, scale: 0.98,
            transition: { duration: 0.15 }
        }
    };

    return (
        <motion.div
            className="signup-modal-overlay"
            variants={overlayVariants}
            initial="hidden" animate="visible" exit="exit"
            onClick={onClose}
        >
            <motion.div
                className="signup-modal"
                variants={modalVariants}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="signup-modal__header">
                    <h2 className="signup-modal__title">パスワード再設定</h2>
                    <button type="button" className="signup-modal__close" onClick={onClose} aria-label="閉じる">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <p className="form-hint" style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                        ご登録のメールアドレスを入力してください。<br />パスワード再設定用のリンクを送信します。
                    </p>

                    <AnimatePresence>
                        {localError && (
                            <motion.div className="login-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                {localError}
                            </motion.div>
                        )}
                        {successMsg && (
                            <motion.div className="login-error" style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                {successMsg}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label" htmlFor="reset-email">
                            メールアドレス <span className="form-required">*</span>
                        </label>
                        <input
                            id="reset-email" type="email" className="form-input" placeholder="example@company.com"
                            value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting || !!successMsg} autoFocus
                        />
                    </div>

                    <motion.button
                        type="submit" className={`login-button ${isSubmitting ? 'login-button--loading' : ''}`}
                        disabled={isSubmitting || !!successMsg}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        送信
                    </motion.button>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default ResetPasswordModal;
