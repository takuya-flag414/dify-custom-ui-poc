/**
 * AmbientGlow - 環境光エフェクトコンポーネント（超軽量版）
 * 
 * シンプルなグラデーション背景のみ（blur効果なし）
 */

import React from 'react';
import { IntelligenceColor } from '../../types/studio';
import { useAmbientTheme } from '../../hooks/useAmbientTheme';
import './AmbientGlow.css';

interface AmbientGlowProps {
    themeColor?: IntelligenceColor | null;
    opacity?: number;
}

export const AmbientGlow: React.FC<AmbientGlowProps> = ({
    themeColor = 'blue',
    opacity = 0.15,
}) => {
    useAmbientTheme({ themeColor });

    return (
        <div
            className="ambient-glow-container"
            style={{ '--ambient-opacity': opacity } as React.CSSProperties}
        />
    );
};

export default AmbientGlow;
