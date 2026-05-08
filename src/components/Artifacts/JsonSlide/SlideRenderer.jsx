import { getThemeLayoutMap } from './config/themeRegistry';

/**
 * SlideRenderer - スライドデータを受け取り、themeIdとlayout_typeに応じたコンポーネントをレンダリング
 * @param {Object} slide - { id, layout_type, content }
 * @param {string} themeId - 現在選択されているテーマID
 * @param {number} slideIndex - スライド番号（0-indexed）
 * @param {number} totalSlides - 総スライド数
 * @param {boolean} isStatic - アニメーションを無効化するかどうか
 */
const SlideRenderer = ({ slide, themeId, slideIndex, totalSlides, isStatic = false }) => {
    if (!slide) {
        return (
            <div className="json-slide-layout json-slide-error">
                <p>スライドデータが読み込めませんでした</p>
            </div>
        );
    }

    // テーマに基づいたレイアウトマップを取得
    const layoutMap = getThemeLayoutMap(themeId);
    const LayoutComponent = layoutMap[slide.layout_type] || layoutMap['content_slide'];

    return (
        <div className="slide-renderer-wrapper" data-slide-id={slide.id}>
            <LayoutComponent content={slide.content || {}} isStatic={isStatic} />

            {/* スライド番号インジケーター */}
            <div className="slide-page-indicator">
                {slideIndex + 1} / {totalSlides}
            </div>
        </div>
    );
};

export default SlideRenderer;
