// src/components/Layout/Header.jsx
import React, { useState } from 'react';
import MockModeSelect from '../Chat/MockModeSelect';
import RoleSelect from '../Chat/RoleSelect';
import { SettingsIcon, ClipboardIcon, ReviewIcon } from '../Shared/SystemIcons';
import { IS_DEV_MODE } from '../../config/devMode';
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

// ★追加: Inspectorトグルアイコン
const PanelRightIcon = (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="15" y1="3" x2="15" y2="21"></line>
    </svg>
);

// ★追加: テストアイコン
const TestTubeIcon = (props) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2"></path>
        <path d="M8.5 2h7"></path>
        <path d="M14.5 16h-5"></path>
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
    currentUser,
    onRoleChange,
    isInspectorOpen,
    onToggleInspector,
    onOpenTestPanel   // ★追加: テストパネル開閉ハンドラ
}) => {
    const [isCopied, setIsCopied] = useState(false);

    const onCopyClick = () => {
        handleCopyLogs(messages);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    };

    // ユーザーの現在ロールを取得（RBAC対応）
    const currentRole = currentUser?.roles?.[0]?.roleCode || 'general';

    return (
        <header className="app-header">
            {/* Left: Context / Environment */}
            <div className="header-left">
                <MockModeSelect mockMode={mockMode} setMockMode={setMockMode} />
                {/* DevModeでのみRoleSelectを表示 */}
                {IS_DEV_MODE && (
                    <>
                        <div className="header-divider" />
                        <RoleSelect
                            currentRole={currentRole}
                            onRoleChange={onRoleChange}
                        />
                    </>
                )}
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

                {/* ★追加: 自動テストパネルボタン */}
                <button
                    className="header-btn"
                    onClick={onOpenTestPanel}
                    title="自動テストを実行"
                >
                    <TestTubeIcon width="16" height="16" />
                    テスト
                </button>

                <button
                    className={`header-btn ${isInspectorOpen ? 'active' : ''}`}
                    onClick={onToggleInspector}
                    title="詳細情報パネルを開閉"
                >
                    <PanelRightIcon width="16" height="16" />
                    詳細
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