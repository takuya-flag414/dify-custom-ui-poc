// src/components/Auth/SignupModal.jsx
// 新規ユーザー登録モーダル - DESIGN_RULE.md 準拠
// Phase A: Mock Emulation

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { SECURITY_QUESTIONS } from '../../mocks/mockUsers';
import './Auth.css';

/**
 * サインアップ（新規登録）モーダル
 * - バリデーション（メール形式、パスワード強度、表示名必須）
 * - セキュリティ情報（姓・名・生年月日・秘密の質問）
 * - Framer Motionアニメーション
 */
const SignupModal = ({ onClose }) => {
    const { signup, error, clearError, isLoading } = useAuth();

    // 基本情報
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // セキュリティ情報（Phase A追加）
    const [lastName, setLastName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // ★追加

    const [localError, setLocalError] = useState('');

    // パスワードバリデーション状態
    const passwordValidation = useMemo(() => {
        const hasMinLength = password.length >= 8;
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const matches = password === confirmPassword && password.length > 0;

        return {
            hasMinLength,
            hasLetter,
            hasNumber,
            isValid: hasMinLength && hasLetter && hasNumber,
            matches,
        };
    }, [password, confirmPassword]);

    // サインアップ処理
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setLocalError('');
        clearError();

        // バリデーション
        if (!lastName.trim() || !firstName.trim()) {
            setLocalError('姓・名を入力してください');
            return;
        }
        if (!email.trim()) {
            setLocalError('メールアドレスを入力してください');
            return;
        }
        if (!dateOfBirth) {
            setLocalError('生年月日を入力してください');
            return;
        }
        if (!securityQuestion) {
            setLocalError('秘密の質問を選択してください');
            return;
        }
        if (!securityAnswer.trim()) {
            setLocalError('秘密の質問の回答を入力してください');
            return;
        }
        if (!passwordValidation.isValid) {
            setLocalError('パスワードは8文字以上、英字と数字を含めてください');
            return;
        }
        if (!passwordValidation.matches) {
            setLocalError('パスワードが一致しません');
            return;
        }

        try {
            setIsSubmitting(true);
            // displayNameは姓+名から自動生成（Onboardingで変更可能）
            const generatedDisplayName = `${lastName} ${firstName}`;
            await signup(email, password, generatedDisplayName, {
                lastName,
                firstName,
                dateOfBirth,
                securityQuestion,
                securityAnswer,
            });
            // 成功時は自動的にログイン状態になるため、モーダルを閉じる
            onClose();
        } catch (err) {
            // エラーはAuthContextで管理される
        } finally {
            setIsSubmitting(false);
        }
    }, [
        lastName, firstName, email, password, dateOfBirth,
        securityQuestion, securityAnswer, passwordValidation, signup, clearError, onClose
    ]);


    // モーダルアニメーション
    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 250,
                damping: 25,
            }
        },
        exit: {
            opacity: 0,
            scale: 0.98,
            transition: { duration: 0.15 }
        }
    };

    const displayError = localError || error;

    return (
        <motion.div
            className="signup-modal-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
        >
            <motion.div
                className="signup-modal signup-modal--expanded"
                variants={modalVariants}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ヘッダー */}
                <div className="signup-modal__header">
                    <h2 className="signup-modal__title">アカウント作成</h2>
                    <button
                        type="button"
                        className="signup-modal__close"
                        onClick={onClose}
                        aria-label="閉じる"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* フォーム */}
                <form className="login-form" onSubmit={handleSubmit}>
                    {/* エラーメッセージ */}
                    {displayError && (
                        <motion.div
                            className="login-error"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                        >
                            {displayError}
                        </motion.div>
                    )}

                    {/* 姓・名（グリッドレイアウト） */}
                    <div className="form-group-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="signup-lastname">
                                姓 <span className="form-required">*</span>
                            </label>
                            <input
                                id="signup-lastname"
                                type="text"
                                className="form-input"
                                placeholder="山田"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                disabled={isSubmitting}
                                autoComplete="family-name"
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="signup-firstname">
                                名 <span className="form-required">*</span>
                            </label>
                            <input
                                id="signup-firstname"
                                type="text"
                                className="form-input"
                                placeholder="太郎"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                disabled={isSubmitting}
                                autoComplete="given-name"
                            />
                        </div>
                    </div>

                    {/* 生年月日 */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-dob">
                            生年月日 <span className="form-required">*</span>
                        </label>
                        <input
                            id="signup-dob"
                            type="date"
                            className="form-input form-input--date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            disabled={isSubmitting}
                            autoComplete="bday"
                        />
                        <span className="form-hint">本人確認に使用されます</span>
                    </div>

                    {/* メールアドレス */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-email">
                            メールアドレス <span className="form-required">*</span>
                        </label>
                        <input
                            id="signup-email"
                            type="email"
                            className="form-input"
                            placeholder="example@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isSubmitting}
                            autoComplete="email"
                        />
                    </div>

                    {/* パスワード */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-password">
                            パスワード <span className="form-required">*</span>
                        </label>
                        <div className="form-input-wrapper">
                            <input
                                id="signup-password"
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                placeholder="8文字以上、英字と数字を含む"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isSubmitting}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
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
                        {/* パスワード要件表示 */}
                        {password && (
                            <div className="password-requirements">
                                <span className={passwordValidation.hasMinLength ? 'password-requirements--valid' : 'password-requirements--invalid'}>
                                    ✓ 8文字以上
                                </span>
                                {' • '}
                                <span className={passwordValidation.hasLetter ? 'password-requirements--valid' : 'password-requirements--invalid'}>
                                    ✓ 英字
                                </span>
                                {' • '}
                                <span className={passwordValidation.hasNumber ? 'password-requirements--valid' : 'password-requirements--invalid'}>
                                    ✓ 数字
                                </span>
                            </div>
                        )}
                    </div>

                    {/* パスワード確認 */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-confirm">
                            パスワード（確認） <span className="form-required">*</span>
                        </label>
                        <input
                            id="signup-confirm"
                            type={showPassword ? 'text' : 'password'}
                            className="form-input"
                            placeholder="パスワードを再入力"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isSubmitting}
                            autoComplete="new-password"
                        />
                        {confirmPassword && !passwordValidation.matches && (
                            <div className="password-requirements password-requirements--invalid">
                                パスワードが一致しません
                            </div>
                        )}
                    </div>

                    {/* 秘密の質問 */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-security-question">
                            秘密の質問 <span className="form-required">*</span>
                        </label>
                        <div className="form-select-wrapper">
                            <select
                                id="signup-security-question"
                                className="form-input form-input--select"
                                value={securityQuestion}
                                onChange={(e) => setSecurityQuestion(e.target.value)}
                                disabled={isSubmitting}
                            >
                                <option value="">質問を選択してください</option>
                                {SECURITY_QUESTIONS.map((q) => (
                                    <option key={q.id} value={q.question}>
                                        {q.question}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <span className="form-hint">パスワードリセット時に使用されます</span>
                    </div>

                    {/* 秘密の質問の回答 */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-security-answer">
                            秘密の質問の回答 <span className="form-required">*</span>
                        </label>
                        <input
                            id="signup-security-answer"
                            type="text"
                            className="form-input"
                            placeholder="回答を入力"
                            value={securityAnswer}
                            onChange={(e) => setSecurityAnswer(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* 登録ボタン */}
                    <motion.button
                        type="submit"
                        className={`login-button ${isSubmitting ? 'login-button--loading' : ''}`}
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        {isLoading ? '' : 'アカウントを作成'}
                    </motion.button>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default SignupModal;
