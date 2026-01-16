// src/components/Chat/PrivacyShieldButton.tsx
import React, { useState, useRef, useEffect, useLayoutEffect, CSSProperties } from 'react';
import ReactDOM from 'react-dom';
import './PrivacyShieldButton.css';

/**
 * 検知項目の詳細型
 */
export interface PrivacyDetection {
    id: string;
    label: string;
    count: number;
    matches?: string[];
}

/**
 * PrivacyShieldButton のProps型
 */
interface PrivacyShieldButtonProps {
    /** 検知結果 */
    detections?: PrivacyDetection[];
    /** ファイル名（ファイル検知の場合） */
    fileName?: string | null;
    /** ボタンサイズ */
    size?: 'small' | 'medium';
}

/**
 * シールドアイコン
 */
const ShieldIcon: React.FC = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
);

/**
 * 機密情報検知盾ボタン + ポップオーバー
 */
const PrivacyShieldButton: React.FC<PrivacyShieldButtonProps> = ({
    detections = [],
    fileName = null,
    size = 'medium'
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isPositioned, setIsPositioned] = useState<boolean>(false);
    const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const totalCount = detections.reduce((sum, d) => sum + d.count, 0);
    const POPOVER_WIDTH = 280;

    useLayoutEffect(() => {
        if (!isOpen) {
            setIsPositioned(false);
            return;
        }

        if (!buttonRef.current) {
            setIsPositioned(false);
            return;
        }

        setPopoverStyle({
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            visibility: 'hidden',
        });

        const rafId = requestAnimationFrame(() => {
            if (!buttonRef.current || !popoverRef.current) return;

            const rect = buttonRef.current.getBoundingClientRect();
            const popoverHeight = popoverRef.current.offsetHeight;

            setPopoverStyle({
                position: 'fixed',
                top: `${rect.top - popoverHeight - 10}px`,
                left: `${rect.right - POPOVER_WIDTH}px`,
            });
            setIsPositioned(true);
        });

        return () => cancelAnimationFrame(rafId);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent): void => {
            const isButtonClick = buttonRef.current && buttonRef.current.contains(event.target as Node);
            const isPopoverClick = popoverRef.current && popoverRef.current.contains(event.target as Node);

            if (!isButtonClick && !isPopoverClick) {
                setIsOpen(false);
            }
        };

        const timer = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleEsc = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = (): void => {
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
