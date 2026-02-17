// src/components/Chat/SanitizeToast.tsx
/**
 * SanitizeToast - サニタイズ完了通知
 * 
 * 機密情報のトークン化完了をユーザーに通知するシンプルなトースト。
 * mat-hud マテリアル準拠。
 */

import React, { useEffect, useState } from 'react';
import './SanitizeToast.css';

interface SanitizeToastProps {
    /** サニタイズされた件数 */
    count: number;
    /** 表示トリガー（trueで表示開始） */
    visible: boolean;
    /** 消滅後コールバック */
    onDismissed?: () => void;
}

const SanitizeToast: React.FC<SanitizeToastProps> = ({ count, visible, onDismissed }) => {
    const [show, setShow] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        if (visible && count > 0) {
            setShow(true);
            setFadeOut(false);

            const fadeTimer = setTimeout(() => {
                setFadeOut(true);
            }, 1500);

            const dismissTimer = setTimeout(() => {
                setShow(false);
                setFadeOut(false);
                onDismissed?.();
            }, 2000);

            return () => {
                clearTimeout(fadeTimer);
                clearTimeout(dismissTimer);
            };
        }
    }, [visible, count, onDismissed]);

    if (!show) return null;

    return (
        <div className={`sanitize-toast ${fadeOut ? 'sanitize-toast--fade-out' : 'sanitize-toast--fade-in'}`}>
            <span className="sanitize-toast__icon">🔒</span>
            <span className="sanitize-toast__text">
                {count}件の機密情報を保護して送信しました
            </span>
        </div>
    );
};

export default SanitizeToast;
