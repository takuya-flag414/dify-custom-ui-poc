// src/components/Layout/Header.jsx
import React, { useState } from 'react';
import MockModeSelect from '../Chat/MockModeSelect';
import RoleSelect from '../Chat/RoleSelect';
import { SettingsIcon, ClipboardIcon, ReviewIcon } from '../Shared/SystemIcons';
import './Header.css';

const REVIEW_URL = "https://www.notion.so/2cc8d90598a080e4b024e51b89bc7eaa";

// 完了アイコン
const CheckIcon = (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

// ★追加: ヘルプアイコン
const HelpIcon = (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

const Header = ({
    mockMode,
    setMockMode,
    onOpenConfig,
    handleCopyLogs,
    copyButtonText,
    messages,
    onStartTutorial,
    currentUser,      // ★追加
    onRoleChange      // ★追加
}) => {
    const [isCopied, setIsCopied] = useState(false);

    const onCopyClick = () => {
        handleCopyLogs(messages);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    };

    return (
        <header className="app-header">
            {/* Left: Context / Environment */}
            <div className="header-left">
                <MockModeSelect mockMode={mockMode} setMockMode={setMockMode} />
                <div className="header-divider" />
                <RoleSelect
                    currentRole={currentUser?.role || 'developer'}
                    onRoleChange={onRoleChange}
                />
            </div>

            {/* Right: Utilities */}
            <div className="header-right">
                <a
                    href={REVIEW_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="header-btn"
                    title="パイロット版のフィードバックを送る"
                    aria-label="レビューを書く（別タブで開きます）"
                >
                    <ReviewIcon width="14" height="14" />
                    レビュー
                </a>
                {/* ★追加: チュートリアル開始ボタン */}
                <button
                    className="header-btn"
                    onClick={onStartTutorial}
                    title="チュートリアルを開始"
                >
                    <HelpIcon width="16" height="16" />
                    ガイド
                </button>

                <div className="header-divider" />

                <button
                    className="header-btn"
                    onClick={onOpenConfig}
                    title="API接続設定を開く"
                    data-tutorial="api-config" // ★追加: ターゲット指定
                >
                    <SettingsIcon width="14" height="14" />
                    API設定
                </button>

                <div className="header-divider" />

                <button
                    className={`header-btn ${isCopied ? 'copied' : ''}`}
                    onClick={onCopyClick}
                    title="デバッグログをクリップボードにコピー"
                >
                    {isCopied ? <CheckIcon width="14" height="14" /> : <ClipboardIcon width="14" height="14" />}
                    {isCopied ? 'コピー完了' : copyButtonText}
                </button>
            </div>
        </header>
    );
};

export default Header;