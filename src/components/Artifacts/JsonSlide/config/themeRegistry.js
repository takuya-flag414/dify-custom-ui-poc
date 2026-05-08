// src/components/Artifacts/JsonSlide/config/themeRegistry.js
// テーマのレジストリ: デザインカタログの登録場所

import { corporateModernMap } from '../themes/corporate-modern';
import { modernIndigoMap } from '../themes/modern-indigo';

export const themeRegistry = {
    'corporate-modern': corporateModernMap,
    'modern-indigo': modernIndigoMap,
    // 将来的に新しいデザインカタログをここに追加可能
    // 'vibrant-startup': vibrantStartupMap,
};

/**
 * 有効なテーマIDのリストを取得
 */
export const getAvailableThemeIds = () => Object.keys(themeRegistry);

/**
 * 指定されたテーマのコンポーネントセットを取得
 * @param {string} themeId 
 */
export const getThemeLayoutMap = (themeId) => {
    return themeRegistry[themeId] || themeRegistry['corporate-modern'];
};
