import { ThemeConfig } from '../../types';
import { PaletteName } from '../../../../types/palette';
import { getPaletteColors } from './palette';

export const getModernIndigoConfig = (palette: PaletteName = 'blue'): ThemeConfig => {
  const colors = getPaletteColors(palette);
  
  return {
    colors: {
      primary: colors.primary,
      primaryLight: colors.primaryLight,
      primaryDark: colors.primaryDark,
      secondary: colors.secondary || '8B5CF6',
      text: {
        header: '0F172A',     // Slate-900 (見出し)
        body: '1E293B',       // Slate-800 (本文 - Reactと同期)
        muted: '64748B',      // Slate-500 (注釈・補助)
        annotation: '94A3B8', // Slate-400 (フッター注釈)
        white: 'FFFFFF',      // 白
        accent: palette === 'blue' ? 'E0E7FF' : colors.primaryLight, // タイトルスライド用アクセント
      },
      bg: {
        main: 'FFFFFF',       // 白 (Reactと同期)
        dark: colors.darkBg || colors.primaryDark, // セクションスライド背景 (パレット連動)
        highlight: 'F1F5F9',  // Slate-100 (引用・表背景)
        highlightIndigo: colors.primaryLight, // パレット連動の薄い背景
        card: 'FFFFFF',       // カード背景
      },
      border: {
        main: colors.primary, // プライマリ線
        light: 'E2E8F0',      // 薄い区切り線
      },
      status: {
        success: '10B981',    // Emerald-500 (KPIトレンド上)
        warning: colors.accent, // アクセントカラーを使用
        error: 'FF0000',      // エラー/フォールバック
      }
    },
    fonts: {
      face: 'Yu Gothic',      // 游ゴシックを指定
      title: 38,
      header: 26,
      body: 16,
      bodySmall: 14,
      bodyTiny: 13,
      sub: 12,
      tag: 9,
      annotation: 10
    },
    layout: {
      baseX: 0.5,
      safeW: 9.0,
      headerY: 0.4,
      headerH: 0.7,      // タイトル部分の高さ
      headerBorderY: 1.0, // アンダーラインの位置
      headerTotalH: 1.1,  // 次の要素を開始して良い位置
      gutter: 0.3,       // 標準的な垂直余白
      footerY: 5.1,      // 注釈の固定位置
      titleSlide: {
        eyebrowY: 1.7,
        titleY: 2.05,
        subtitleY: 3.1,
        presenterY: 4.8,
        tagY: 0.5,
      }
    }
  };
};

// 後方互換性のためのデフォルトエクスポート
export const MODERN_INDIGO_CONFIG = getModernIndigoConfig('blue');
