// src/components/Chat/PrivacyShieldButton.jsx
/**
 * 機密情報検知盾ボタン + ポップオーバー
 * テキスト入力・添付ファイル両方で使用できる独立コンポーネント
 * React Portalを使用してoverflow制限を回避、opacityでちらつき防止
 */
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import './PrivacyShieldButton.css';

// 🛡️ Shield Icon
const ShieldIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
);

/**
 * PrivacyShieldButton
 * @param {Object} props
 * @param {Array<{id: string, label: string, count: number, matches: string[]}>} props.detections - 検知結果
 * @param {string} [props.fileName] - ファイル名（ファイル検知の場合）
 * @param {'small' | 'medium'} [props.size='medium'] - ボタンサイズ
 */
const PrivacyShieldButton = ({ detections = [], fileName = null, size = 'medium' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isPositioned, setIsPositioned] = useState(false);
    const [popoverStyle, setPopoverStyle] = useState({});
    const buttonRef = useRef(null);
    const popoverRef = useRef(null);

    // 検知件数合計
    const totalCount = detections.reduce((sum, d) => sum + d.count, 0);

    // ポップオーバーの幅（CSSと同期が必要）
    const POPOVER_WIDTH = 280;

    // ポップオーバー位置を計算（同期的に）
    // CSSアニメーションとの競合を避けるためtransformを使わず直接位置を計算
    useLayoutEffect(() => {
        if (!isOpen) {
            setIsPositioned(false);
            return;
        }

        if (!buttonRef.current) {
            setIsPositioned(false);
            return;
        }

        // 初期状態: 画面外に配置（ポップオーバーのサイズ測定用）
        setPopoverStyle({
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            visibility: 'hidden',
        });

        // requestAnimationFrameでDOMが描画された後に位置を計算
        const rafId = requestAnimationFrame(() => {
            if (!buttonRef.current || !popoverRef.current) return;

            const rect = buttonRef.current.getBoundingClientRect();
            const popoverHeight = popoverRef.current.offsetHeight;

            // ボタンの左上に表示（右端をボタンの右端に、下端をボタンの上に）
            setPopoverStyle({
                position: 'fixed',
                top: `${rect.top - popoverHeight - 10}px`,
                left: `${rect.right - POPOVER_WIDTH}px`,
            });
            // 位置計算完了後に表示
            setIsPositioned(true);
        });

        return () => cancelAnimationFrame(rafId);
    }, [isOpen]);

    // 外側クリックで閉じる
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            const isButtonClick = buttonRef.current && buttonRef.current.contains(event.target);
            const isPopoverClick = popoverRef.current && popoverRef.current.contains(event.target);

            if (!isButtonClick && !isPopoverClick) {
                setIsOpen(false);
            }
        };

        // 遅延させて現在のクリックイベントをスキップ
        const timer = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen]);

    // ESCキーで閉じる
    useEffect(() => {
        if (!isOpen) return;

        const handleEsc = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    // スクロール時に位置を更新
    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            if (buttonRef.current && popoverRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                const popoverHeight = popoverRef.current.offsetHeight || 200;

                setPopoverStyle({
                    position: 'fixed',
                    top: `${rect.top - popoverHeight - 10}px`,
                    left: `${rect.right - POPOVER_WIDTH}px`,
                });
            }
        };

        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    if (detections.length === 0) return null;

    const sizeClass = size === 'small' ? 'psb-small' : '';

    // ポップオーバーをPortalでbodyに描画
    const popoverContent = isOpen && ReactDOM.createPortal(
        <div
            className={`privacy-shield-popover-portal ${isPositioned ? 'visible' : ''}`}
            ref={popoverRef}
            style={popoverStyle}
        >
            <div className="privacy-shield-popover-header">
                <ShieldIcon />
                <span>機密情報の検知</span>
            </div>

            {fileName && (
                <div className="privacy-shield-popover-filename">{fileName}</div>
            )}

            <ul className="privacy-shield-popover-list">
                {detections.map((item) => (
                    <li key={item.id}>
                        <div className="privacy-shield-popover-item">
                            <div className="privacy-shield-popover-label-row">
                                <span className="privacy-shield-popover-label">{item.label}</span>
                                <span className="privacy-shield-popover-count">({item.count}件)</span>
                            </div>
                            <div className="privacy-shield-popover-matches">
                                {item.matches?.map((match, midx) => (
                                    <code key={midx} className="privacy-shield-popover-value">{match}</code>
                                ))}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            <div className="privacy-shield-popover-footer">
                <span>⚠️ 送信前に確認してください</span>
            </div>
        </div>,
        document.body
    );

    return (
        <div className={`privacy-shield-container ${sizeClass}`}>
            <button
                type="button"
                className="privacy-shield-btn"
                ref={buttonRef}
                onClick={() => setIsOpen(prev => !prev)}
                aria-label="検知された機密情報を表示"
                aria-expanded={isOpen}
                title="クリックして詳細を表示"
            >
                <ShieldIcon />
                <span className="privacy-shield-badge">{totalCount}</span>
            </button>

            {popoverContent}
        </div>
    );
};

export default PrivacyShieldButton;
