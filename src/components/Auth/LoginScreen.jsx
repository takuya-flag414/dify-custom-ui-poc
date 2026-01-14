// src/components/Auth/LoginScreen.jsx
// ログイン画面 - DESIGN_RULE.md 準拠
// Phase A: Mock Emulation

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import FluidOrbBackground from '../Shared/FluidOrbBackground';
import SignupModal from './SignupModal';
import './Auth.css';

/**
 * ログイン画面コンポーネント
 * - FluidOrbBackground（Cyan/Magenta/Yellow/Blueオーブ）
 * - mat-hudマテリアルのパネル
 * - Framer Motionスプリングアニメーション
 */
const LoginScreen = () => {
    const { login, error, clearError, isLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSignupOpen, setIsSignupOpen] = useState(false);
    const [localError, setLocalError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // ★ローカルローディング

    // ログイン処理
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setLocalError('');
        clearError();

        if (!email.trim() || !password.trim()) {
            setLocalError('メールアドレスとパスワードを入力してください');
            return;
        }

        try {
            setIsSubmitting(true);
            await login(email, password);
        } catch (err) {
            // エラーはAuthContextで管理されるため、ここでは何もしない
        } finally {
            setIsSubmitting(false);
        }
    }, [email, password, login, clearError]);

    // キーボードショートカット（Enter）
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !isSubmitting) {
            handleSubmit(e);
        }
    }, [handleSubmit, isSubmitting]);

    // パネルアニメーション設定（Spring Physics）
    const panelVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            y: 20,
            filter: 'blur(8px)'
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: {
                type: 'spring',
                stiffness: 250,
                damping: 25,
                mass: 1,
            }
        },
        exit: {
            opacity: 0,
            scale: 0.98,
            filter: 'blur(4px)',
            transition: { duration: 0.2 }
        }
    };

    // エラーシェイクアニメーション
    const shakeVariants = {
        shake: {
            x: [0, -10, 10, -10, 10, 0],
            transition: { duration: 0.5 }
        }
    };

    const displayError = localError || error;

    return (
        <motion.div
            className="login-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* 背景オーブアニメーション */}
            <FluidOrbBackground />

            {/* 半透明オーバーレイ */}
            <div className="login-screen__backdrop" />

            {/* ログインパネル */}
            <motion.div
                className="login-panel"
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                {/* ヘッダー */}
                <div className="login-header">
                    <motion.div
                        className="login-header__icon"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {/* AI アイコン（Sparkle） */}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L12 6M12 18L12 22M2 12L6 12M18 12L22 12M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" />
                        </svg>
                    </motion.div>
                    <h1 className="login-header__title">ようこそ</h1>
                    <p className="login-header__subtitle">社内 AI チャットボットにログイン</p>
                </div>

                {/* フォーム */}
                <motion.form
                    className="login-form"
                    onSubmit={handleSubmit}
                    animate={displayError ? 'shake' : ''}
                    variants={shakeVariants}
                >
                    {/* エラーメッセージ */}
                    <AnimatePresence>
                        {displayError && (
                            <motion.div
                                className="login-error"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                {displayError}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* メールアドレス */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">
                            メールアドレス
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            placeholder="example@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isSubmitting}
                            autoComplete="email"
                            autoFocus
                        />
                    </div>

                    {/* パスワード */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">
                            パスワード
                        </label>
                        <div className="form-input-wrapper">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                placeholder="パスワードを入力"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isSubmitting}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                                aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* ログインボタン */}
                    <motion.button
                        type="submit"
                        className={`login-button ${isSubmitting ? 'login-button--loading' : ''}`}
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        {isLoading ? '' : 'ログイン'}
                    </motion.button>
                </motion.form>

                {/* フッター */}
                <div className="login-footer">
                    <p className="login-footer__text">
                        アカウントをお持ちでない方は{' '}
                        <button
                            type="button"
                            className="login-footer__link"
                            onClick={() => setIsSignupOpen(true)}
                        >
                            新規登録
                        </button>
                    </p>
                </div>
            </motion.div>

            {/* サインアップモーダル */}
            <AnimatePresence>
                {isSignupOpen && (
                    <SignupModal onClose={() => setIsSignupOpen(false)} />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default LoginScreen;
