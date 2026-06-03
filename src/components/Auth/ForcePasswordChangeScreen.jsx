import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Lock, AlertTriangle, CheckCircle, LogOut } from 'lucide-react';
import './ForcePasswordChangeScreen.css';

const ForcePasswordChangeScreen = () => {
    const { updateInitialPassword, error, clearError, logout, isLoading } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();

        if (password.length < 6) {
            // Local validation matching Firebase Auth requirements
            return;
        }

        if (password !== confirmPassword) {
            return;
        }

        try {
            setIsSubmitting(true);
            await updateInitialPassword(password);
            setSuccessMessage('パスワードの変更が完了しました。システムに接続しています...');
            // App.jsx will automatically unmount this component when requirePasswordChange becomes false
        } catch (err) {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    if (isLoading) {
        return (
            <div className="force-pw-loading">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="force-pw-container">
            <div className="force-pw-overlay"></div>
            <motion.div 
                className="force-pw-card"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
            >
                <div className="force-pw-header">
                    <div className="force-pw-icon-wrapper">
                        <Lock className="force-pw-icon" size={24} />
                    </div>
                    <h2>初期パスワードの変更</h2>
                    <p>
                        セキュリティ保護のため、システムを利用する前に
                        新しいパスワードを設定してください。
                    </p>
                    <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'left', border: '1px solid rgba(234, 179, 8, 0.2)', lineHeight: '1.5' }}>
                        <strong>⚠️ パスワードの保管について</strong><br/>
                        ここで設定したパスワードは次回以降のログインで必要となります。忘れないように必ず安全な場所に保存してください。
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div 
                            className="force-pw-alert error"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <AlertTriangle size={18} />
                            <span>{error}</span>
                        </motion.div>
                    )}
                    {successMessage && (
                        <motion.div 
                            className="force-pw-alert success"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <CheckCircle size={18} />
                            <span>{successMessage}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="force-pw-form">
                    <div className="force-pw-input-group">
                        <label htmlFor="new-password">新しいパスワード (6文字以上)</label>
                        <input
                            id="new-password"
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                clearError();
                            }}
                            placeholder="新しいパスワードを入力"
                            required
                            minLength={6}
                            disabled={isSubmitting || !!successMessage}
                        />
                    </div>

                    <div className="force-pw-input-group">
                        <label htmlFor="confirm-password">新しいパスワード (確認用)</label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                clearError();
                            }}
                            placeholder="もう一度入力してください"
                            required
                            minLength={6}
                            disabled={isSubmitting || !!successMessage}
                        />
                        {confirmPassword && password !== confirmPassword && (
                            <div className="force-pw-validation-error">
                                パスワードが一致しません
                            </div>
                        )}
                    </div>

                    <div className="force-pw-actions">
                        <button 
                            type="submit" 
                            className={`force-pw-btn-primary ${isSubmitting || !!successMessage ? 'loading' : ''}`}
                            disabled={isSubmitting || !!successMessage || password.length < 6 || password !== confirmPassword}
                        >
                            {isSubmitting || successMessage ? '更新中...' : 'パスワードを変更して開始'}
                        </button>
                        
                        <button 
                            type="button" 
                            className="force-pw-btn-secondary" 
                            onClick={handleLogout}
                            disabled={isSubmitting || !!successMessage}
                        >
                            <LogOut size={18} />
                            ログアウト
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ForcePasswordChangeScreen;
