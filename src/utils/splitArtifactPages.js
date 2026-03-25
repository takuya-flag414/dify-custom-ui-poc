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

    const allElements = doc.body ? Array.from(doc.body.children) : [];
    const pages = [];
    let currentPage = [];
    const globalScripts = [];

    for (const el of allElements) {
        const tagName = el.tagName.toLowerCase();
        const styleAttr = el.getAttribute("style") || "";
        const isPageBreak =
            styleAttr.includes("page-break-after: always") ||
            styleAttr.includes("break-after: page");

        // scriptタグはページ構成要素から除外し、すべてのページに付与する対象とする
        if (tagName === 'script') {
            globalScripts.push(el.outerHTML);
            continue;
        }

        currentPage.push(el);
            
        if (isPageBreak) {
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

    // 各ページに <head> を付与して完全なHTMLとして再構築
    const headHtml = doc.head ? doc.head.outerHTML : '<head><meta charset="UTF-8"></head>';
    const globalScriptsHtml = globalScripts.join("\n");
    
    return pages.map((pageElements) => {
        const bodyContent = pageElements.map((el) => el.outerHTML).join("\n");
        return `<!DOCTYPE html>\n<html lang="ja">\n${headHtml}\n<body>\n${bodyContent}\n${globalScriptsHtml}\n</body>\n</html>`;
    });
}
