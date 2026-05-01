// src/components/Chat/ShieldModeOverlay.tsx
/**
 * ShieldModeOverlay - シールドモード中のウォーターマーク表示
 *
 * シールド中の会話を表示している間、薄いウォーターマークを画面全体に重ねる。
 * pointer-events: none で操作を一切妨げない。
 */

import React from 'react';
import './ShieldModeOverlay.css';

interface ShieldModeOverlayProps {
    /** シールドモードが有効かどうか */
    isActive: boolean;
}

const ShieldModeOverlay: React.FC<ShieldModeOverlayProps> = ({ isActive }) => {
    if (!isActive) return null;

    return (
        <div
            className="shield-mode-overlay"
            aria-hidden="true"
        >
            <div className="shield-mode-watermark" />
        </div>
    );
};

export default ShieldModeOverlay;
