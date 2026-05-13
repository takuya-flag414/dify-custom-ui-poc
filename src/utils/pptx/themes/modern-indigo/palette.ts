import { PaletteName, ColorRoles } from '../../../../types/palette';

/**
 * modern-indigo テーマ用のカラーパレット定義
 */
export const MODERN_INDIGO_PALETTES: Record<PaletteName, ColorRoles> = {
  blue: {
    primary: '6366F1',      // Indigo-500
    primaryDark: '4F46E5',  // Indigo-600
    primaryLight: 'EEF2FF', // Indigo-50
    accent: 'F59E0B',       // Amber-500
    secondary: '8B5CF6',    // Violet-500
    darkBg: '0F172A',       // Slate-900
  },
  green: {
    primary: '10B981',      // Emerald-500
    primaryDark: '059669',  // Emerald-600
    primaryLight: 'ECFDF5', // Emerald-50
    accent: 'F59E0B',       // Amber-500
    secondary: '34D399',    // Emerald-400
    darkBg: '064E3B',       // Emerald-900
  },
  navy: {
    primary: '1E3A8A',      // Blue-900
    primaryDark: '1E293B',  // Slate-800
    primaryLight: 'EFF6FF', // Blue-50
    accent: '38BDF8',       // Sky-400
    secondary: '1E40AF',    // Blue-800
    darkBg: '172554',       // Blue-950
  },
  red: {
    primary: 'EF4444',      // Red-500
    primaryDark: 'DC2626',  // Red-600
    primaryLight: 'FEF2F2', // Red-50
    accent: 'F59E0B',       // Amber-500
    secondary: 'F87171',    // Red-400
    darkBg: '7F1D1D',       // Red-900
  },
  gray: {
    primary: '4B5563',      // Gray-600
    primaryDark: '1F2937',  // Gray-800
    primaryLight: 'F3F4F6', // Gray-50
    accent: '10B981',       // Emerald-500
    secondary: '6B7280',    // Gray-500
    darkBg: '1F2937',       // Gray-900
  }
};

/**
 * パレット名から具体的な色設定を取得する
 */
export const getPaletteColors = (name: PaletteName = 'blue'): ColorRoles => {
  return MODERN_INDIGO_PALETTES[name] || MODERN_INDIGO_PALETTES.blue;
};
