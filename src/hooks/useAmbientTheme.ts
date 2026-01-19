/**
 * useAmbientTheme - テーマカラー遷移ロジック
 * 
 * 現在のStudioのthemeColorを監視し、
 * CSS Variablesを動的に更新して環境光の色を制御する
 */

import { useEffect, useCallback, useMemo } from 'react';
import { IntelligenceColor } from '../types/studio';

/**
 * Apple Intelligence カラーパレット定義
 * 
 * 各テーマカラーに対応するプライマリ・セカンダリ・アクセントカラーを定義
 */
const INTELLIGENCE_COLORS: Record<IntelligenceColor, {
    primary: string;
    secondary: string;
    accent: string;
}> = {
    cyan: {
        primary: '#00FFFF',
        secondary: '#0088FF',
        accent: '#FFFFFF',
    },
    magenta: {
        primary: '#FF00FF',
        secondary: '#8800FF',
        accent: '#FFCCCC',
    },
    yellow: {
        primary: '#FFD60A',
        secondary: '#FF9F0A',
        accent: '#FFFACD',
    },
    blue: {
        primary: '#007AFF',
        secondary: '#0055FF',
        accent: '#E0F0FF',
    },
    orange: {
        primary: '#FF9500',
        secondary: '#FF6B00',
        accent: '#FFE4CC',
    },
    green: {
        primary: '#30D158',
        secondary: '#00C853',
        accent: '#E0FFE0',
    },
    purple: {
        primary: '#BF5AF2',
        secondary: '#8944AB',
        accent: '#F0E0FF',
    },
};

interface UseAmbientThemeOptions {
    /** テーマカラー */
    themeColor: IntelligenceColor | null;
    /** トランジション時間 (ms) - デフォルト: 1500ms */
    transitionDuration?: number;
}

interface UseAmbientThemeReturn {
    /** 現在のカラーパレット */
    colors: {
        primary: string;
        secondary: string;
        accent: string;
    };
    /** CSS変数を手動で適用する関数 */
    applyTheme: () => void;
}

/**
 * useAmbientTheme
 * 
 * Studioのテーマカラーに基づいてCSS変数を動的に更新し、
 * 環境光（Ambient Glow）の色を滑らかに遷移させる
 * 
 * @example
 * ```tsx
 * const { colors } = useAmbientTheme({ themeColor: 'cyan' });
 * ```
 */
export const useAmbientTheme = ({
    themeColor,
    transitionDuration = 1500,
}: UseAmbientThemeOptions): UseAmbientThemeReturn => {

    // デフォルトカラー（themeColorがnullの場合）
    const colors = useMemo(() => {
        if (!themeColor) {
            return INTELLIGENCE_COLORS.blue;
        }
        return INTELLIGENCE_COLORS[themeColor] || INTELLIGENCE_COLORS.blue;
    }, [themeColor]);

    /**
     * CSS変数を適用する
     */
    const applyTheme = useCallback(() => {
        const root = document.documentElement;

        // トランジション設定
        root.style.setProperty('--glow-transition-duration', `${transitionDuration}ms`);

        // カラー設定
        root.style.setProperty('--glow-primary', colors.primary);
        root.style.setProperty('--glow-secondary', colors.secondary);
        root.style.setProperty('--glow-accent', colors.accent);

        // 半透明バージョン（Shadow用）
        root.style.setProperty('--glow-primary-alpha', `${colors.primary}40`);
        root.style.setProperty('--glow-secondary-alpha', `${colors.secondary}40`);
    }, [colors, transitionDuration]);

    // テーマカラーが変更されたら自動的にCSS変数を更新
    useEffect(() => {
        applyTheme();

        console.log(`[useAmbientTheme] Applied theme: ${themeColor || 'default (blue)'}`);
    }, [applyTheme, themeColor]);

    return {
        colors,
        applyTheme,
    };
};

/**
 * テーマカラーに基づくグラデーションCSSを生成する
 */
export const getGradientCSS = (themeColor: IntelligenceColor): string => {
    const colors = INTELLIGENCE_COLORS[themeColor];
    return `conic-gradient(
    from 0deg,
    ${colors.primary},
    ${colors.secondary},
    ${colors.accent},
    ${colors.primary}
  )`;
};

export default useAmbientTheme;
