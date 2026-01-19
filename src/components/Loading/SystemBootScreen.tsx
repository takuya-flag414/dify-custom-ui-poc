// src/components/Loading/SystemBootScreen.tsx
import React from 'react';
// IntelligenceOrbはまだJSXファイルのため型を緩和
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import IntelligenceOrb from '../Shared/IntelligenceOrb';

/**
 * SystemBootScreen
 * 
 * アプリケーション初期起動時（セッション復元中）に表示されるスプラッシュスクリーン。
 * Apple Intelligence の "Glowing Orb" を使用し、システムが起動していることを
 * 視覚的にユーザーに伝えます。
 * 
 * DESIGN_RULE.md の "The Siri Orb Animation System" に準拠。
 */
const SystemBootScreen: React.FC = () => {
    return (
        <IntelligenceOrb
            mode="loading"
            label="システムを起動中..."
        />
    );
};

export default SystemBootScreen;
