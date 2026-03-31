/**
 * HTML文字列を page-break-after: always の区切りで分割し、
 * 各ページの完全なHTML文字列の配列を返す。
 * 区切りdivが存在しない場合は1ページとして扱う。
 * 
 * @param {string} html - 元のHTML文字列
 * @returns {string[]} 分割されたHTML文字列の配列
 */
export function splitArtifactPages(html) {
    if (!html) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    if (!doc.body) {
        return [];
    }

    // 1. ラッパーコンテナの検出 (<body> 直下に1つだけ重要な要素がある場合)
    const bodyChildren = Array.from(doc.body.children).filter(el => el.tagName.toLowerCase() !== 'script');
    let target = doc.body;
    let wrapper = null;

    if (bodyChildren.length === 1) {
        const wrapCandidate = bodyChildren[0];
        // 中に改ページが含まれているかチェック
        const hasBreaksInside = !!wrapCandidate.querySelector('[style*="page-break-after: always"], [style*="break-after: page"]');
        if (hasBreaksInside) {
            target = wrapCandidate;
            wrapper = {
                tagName: wrapCandidate.tagName.toLowerCase(),
                attributes: Array.from(wrapCandidate.attributes)
                    .map(a => `${a.name}="${a.value}"`)
                    .join(' ')
            };
        }
    }

    const allElements = Array.from(target.children);
    const pages = [];
    let currentPage = [];
    
    // 全てのページの共通スクリプトを収集 (body全体から)
    const globalScripts = Array.from(doc.body.querySelectorAll('script')).map(s => s.outerHTML);

    // スライド形式かどうかを判定（.slide クラスを持つ要素があるか）
    const hasSlides = allElements.some(el => el.classList.contains('slide'));

    for (const el of allElements) {
        const tagName = el.tagName.toLowerCase();

        // scriptタグは別途 globalScripts で処理するためスキップ
        if (tagName === 'script') {
            continue;
        }

        const isSlideElement = el.classList.contains('slide');
        const styleAttr = el.getAttribute("style") || "";
        const isPageBreak =
            styleAttr.includes("page-break-after: always") ||
            styleAttr.includes("break-after: page");

        // スライド形式の場合：新しい .slide が来たら、前のページを確定させて新しく始める
        if (hasSlides && isSlideElement && currentPage.length > 0) {
            pages.push(currentPage);
            currentPage = [];
        }

        currentPage.push(el);
            
        // 従来通りの属性ベースの分割（スライド形式でない場合や、明示的な改ページ用）
        if (isPageBreak && !isSlideElement) {
            pages.push(currentPage);
            currentPage = [];
        }
    }
    
    if (currentPage.length > 0) {
        pages.push(currentPage);
    }

    // ページが0件になる場合（区切りのみのHTML等）は全体を1ページとして返す
    if (pages.length === 0) {
        return [html];
    }

    const headHtml = doc.head ? doc.head.outerHTML : '<head><meta charset="UTF-8"></head>';
    const globalScriptsHtml = globalScripts.join("\n");
    
    return pages.map((pageElements) => {
        let bodyContent = pageElements.map((el) => el.outerHTML).join("\n");
        
        // ラッパーが存在した場合は復元する
        if (wrapper) {
            const attrStr = wrapper.attributes ? ' ' + wrapper.attributes : '';
            bodyContent = `<${wrapper.tagName}${attrStr}>\n${bodyContent}\n</${wrapper.tagName}>`;
        }
        
        return `<!DOCTYPE html>\n<html lang="ja">\n${headHtml}\n<body>\n${bodyContent}\n${globalScriptsHtml}\n</body>\n</html>`;
    });
}
