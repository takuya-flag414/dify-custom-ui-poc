// src/components/Onboarding/steps/StepNameInput.jsx
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// User Icon
const UserIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

// チェックアイコン
const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

/**
 * ステップ2: 名前入力
 * リアルタイムプレビューと成功フィードバック付き
 */
const StepNameInput = ({ name, onNameChange, onNext, onPrev }) => {
    const inputRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // 自動フォーカス
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 400);
        return () => clearTimeout(timer);
    }, []);

    // 名前入力時の成功フィードバック
    useEffect(() => {
        if (name.trim().length >= 2) {
            const timer = setTimeout(() => setShowSuccess(true), 300);
            return () => clearTimeout(timer);
        } else {
            setShowSuccess(false);
        }
    }, [name]);

    // Enterキーで次へ
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && name.trim()) {
            onNext();
        }
    };

    const hasValidName = name.trim().length >= 1;

    return (
        <div className="onboarding-step-new split-layout">
            <div className="onboarding-step-left">
                {/* アイコン */}
                <motion.div
                    className="onboarding-icon-new"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    style={{ width: '96px', height: '96px', marginBottom: '32px' }}
                >
                    <UserIcon />
                </motion.div>

                {/* タイトル */}
                <motion.h1
                    className="onboarding-title-new"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '24px' }}
                >
                    あなたのことを何と<br />呼べばいいですか？
                </motion.h1>
                <div className="title-decoration-line" style={{ marginBottom: 0 }} />
            </div>

            <div className="onboarding-step-right">
                {/* サブタイトル */}
                <motion.p
                    className="onboarding-subtitle-new"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    style={{ fontSize: '1.25rem', color: 'var(--color-text-sub)', marginBottom: '32px' }}
                >
                    AIがあなたの名前でお声かけします。
                </motion.p>

                {/* 入力フィールド */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                >
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            className={`onboarding-input-new ${showSuccess ? 'name-input-success' : ''}`}
                            placeholder="あなたのお名前"
                            value={name}
                            onChange={(e) => onNameChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            autoComplete="name"
                            maxLength={30}
                            style={{ width: '100%', height: '72px', fontSize: '1.5rem', textAlign: 'left', paddingLeft: '24px', borderRadius: 'var(--radius-2xl)' }}
                        />

                        {/* 成功チェックマーク */}
                        <AnimatePresence>
                            {showSuccess && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    style={{
                                        position: 'absolute',
                                        right: '20px',
                                        top: 0,
                                        bottom: 0,
                                        margin: 'auto 0',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: '#10B981',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white'
                                    }}
                                >
                                    <CheckIcon />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* リアルタイムプレビュー */}
                    <div className="name-preview-container" style={{ marginLeft: '12px', marginTop: '16px' }}>
                        <AnimatePresence mode="wait">
                            {hasValidName && (
                                <motion.p
                                    key="preview"
                                    className="name-preview"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ fontSize: '1.25rem' }}
                                >
                                    こんにちは、<span className="name-preview-highlight">{name.trim()}</span>さん
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <p className="onboarding-input-hint" style={{ marginLeft: '12px' }}>
                        後から設定で変更できます
                    </p>
                </motion.div>

                {/* ボタン */}
                <motion.div
                    className="onboarding-actions-new"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    style={{ flexDirection: 'row', maxWidth: 'none', justifyContent: 'flex-start', paddingTop: '32px' }}
                >
                    <button
                        type="button"
                        className="onboarding-btn-new onboarding-btn-secondary-new"
                        onClick={onPrev}
                        style={{ minWidth: '120px' }}
                    >
                        戻る
                    </button>
                    <motion.button
                        className="onboarding-btn-new onboarding-btn-primary-new"
                        onClick={onNext}
                        disabled={!name.trim()}
                        whileHover={name.trim() ? { scale: 1.02 } : {}}
                        whileTap={name.trim() ? { scale: 0.98 } : {}}
                        style={{ minWidth: '160px' }}
                    >
                        次へ
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
};

export default StepNameInput;
