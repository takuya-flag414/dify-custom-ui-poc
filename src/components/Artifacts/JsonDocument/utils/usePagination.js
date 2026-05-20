import { useState, useEffect } from 'react';

/**
 * A4ページの有効な高さ (px)
 * 1123px (A4) - 余白。ビジネスレターや文書の密度を高めるため 960px に調整
 */
const PAGE_HEIGHT_LIMIT = 960; 

/**
 * usePagination
 * blocksを各ページに分配するカスタムフック
 */
const usePagination = (blocks, meta) => {
    const [pages, setPages] = useState([]);
    const [tocEntries, setTocEntries] = useState([]);

    useEffect(() => {
        if (!blocks || blocks.length === 0) {
            setPages([]);
            setTocEntries([]);
            return;
        }

        const calculateAll = () => {
            const isLetter = meta?.template === 'letter';

            // 本文内のタイトル重複（ドキュメント名と同一 of H1）を避けるため、メタのタイトルと同じテキストのH1のみを除外
            const filteredBlocks = blocks.filter(b => {
                if (b.type === 'heading' && b.level === 1) {
                    return b.text !== meta?.title;
                }
                return true;
            });

            // ページ分割が必要かを判定するヘルパー関数
            const shouldPageBreak = (block, currentIndex, currentHeight) => {
                if (block.type === 'page_break') {
                    return true;
                }

                const blockHeight = estimateBlockHeight(block);

                // 1. 見出しの場合 (孤立防止：見出し＋次のブロックがページに収まらない場合は改ページ)
                if (block.type === 'heading') {
                    const nextBlock = filteredBlocks[currentIndex + 1];
                    const nextBlockHeight = nextBlock ? estimateBlockHeight(nextBlock) : 0;
                    return (currentHeight + blockHeight + nextBlockHeight > PAGE_HEIGHT_LIMIT);
                }

                // 2. 非分割ブロックの場合 (Table, SVG, Chart, 装飾付きのお知らせブロック)
                const isNonSplittable = block.type === 'table' || 
                                        block.type === 'svg' || 
                                        block.type === 'chart' ||
                                        (block.type === 'rich_text' && block.variant && block.variant !== 'default');

                if (isNonSplittable) {
                    return (currentHeight + blockHeight > PAGE_HEIGHT_LIMIT);
                }

                // 3. 分割可能ブロックの場合 (通常のテキスト, リスト)
                // 限界まで詰め込むため、ブロックの高さの半分（50%）を足しても限界値を超える場合のみ改ページを判定
                return (currentHeight + (blockHeight * 0.5) > PAGE_HEIGHT_LIMIT);
            };

            // --- Path 1: 暫定計算（本文のページ数を確認） ---
            let tempTocEntries = [];
            let currentHeight = isLetter ? 380 : 0; // レターヘッダーの概算高さを考慮
            let currentContentPage = 1;

            filteredBlocks.forEach((block, index) => {
                if (shouldPageBreak(block, index, currentHeight)) {
                    currentContentPage++;
                    currentHeight = (block.type === 'page_break') ? 0 : estimateBlockHeight(block);
                } else {
                    if (block.type !== 'page_break') {
                        currentHeight += estimateBlockHeight(block);
                    }
                }

                if (block.type === 'heading') {
                    tempTocEntries.push({
                        text: block.text,
                        level: block.level,
                        page: currentContentPage // 本文内のページ
                    });
                }
            });

            // --- Path 2: ページ構成の組み立て ---
            const finalPages = [];
            let currentContentPageIndex = 0;

            if (!isLetter) {
                // 1. 表紙ページ (独立)
                finalPages.push([{ type: 'cover', meta }]);

                // 2. 目次ページ (独立)
                const tocBlock = { type: 'toc', entries: tempTocEntries };
                finalPages.push([tocBlock]);

                currentContentPageIndex = 2; // Pages[2] から本文
            } else {
                // ビジネスレターのヘッダーブロックを先頭に入れる
                finalPages.push([{ type: 'letter_header', meta }]);
                currentContentPageIndex = 0; // Pages[0] から本文開始
            }

            // 3. 本文ページ
            let finalHeight = isLetter ? 380 : 0; // レターヘッダーの概算高さを考慮

            filteredBlocks.forEach((block, index) => {
                // 対象ページがまだ作られていない場合は強制改ページ
                const isPageMissing = finalPages[currentContentPageIndex] === undefined;

                if (isPageMissing || shouldPageBreak(block, index, finalHeight)) {
                    if (block.type === 'page_break') {
                        finalPages.push([]);
                        currentContentPageIndex = finalPages.length - 1;
                        finalHeight = 0;
                    } else {
                        const blockHeight = estimateBlockHeight(block);
                        // 現在のページが空ならそこに配置、そうでなければ新規ページを作成
                        if (finalPages[currentContentPageIndex] && finalPages[currentContentPageIndex].length === 0) {
                            finalPages[currentContentPageIndex].push(block);
                            finalHeight = blockHeight;
                        } else {
                            finalPages.push([block]);
                            currentContentPageIndex = finalPages.length - 1; // 常に最新のページインデックスを指す
                            finalHeight = blockHeight;
                        }
                    }
                } else {
                    if (block.type !== 'page_break') {
                        finalPages[currentContentPageIndex].push(block);
                        finalHeight += estimateBlockHeight(block);
                    }
                }
            });

            setPages(finalPages);
            setTocEntries(tempTocEntries);
        };

        calculateAll();
    }, [blocks, meta]);

    return { pages, tocEntries };
};

/**
 * 各ブロックの概算高さを計算（より詰めて表示できるように最適化）
 */
const estimateBlockHeight = (block) => {
    switch (block.type) {
        case 'cover':
            return PAGE_HEIGHT_LIMIT; // 1ページ占有
        case 'page_break':
            return 0;
        case 'letter_header':
            return 380; // レターヘッダーの概算高さ
        case 'heading':
            return block.level === 1 ? 100 : 80; // 見出しの高さをコンパクトに
        case 'rich_text':
            const lineCount = Math.ceil((block.text?.length || 0) / 48); // 1行あたりの文字数を多めに見積もる
            const newlineCount = (block.text?.match(/\n/g) || []).length;
            let richTextHeight = (lineCount + newlineCount) * 26 + 24; // 行高とマージンを抑える
            if (block.variant && block.variant !== 'default') {
                richTextHeight += 50; // 装飾ボックスのパディング
            }
            return richTextHeight;
        case 'table':
            const rowCount = (block.rows?.length || 0);
            return rowCount * 44 + 60; // テーブル行の高さをスリムに
        case 'svg':
            return 240;
        case 'list':
            return (block.items?.length || 0) * 32 + 30; // リストの項目間隔をスリムに
        case 'chart':
            return 360;
        case 'toc':
            return PAGE_HEIGHT_LIMIT; // 1ページ占有（独立ページ化）
        default:
            return 80;
    }
};

export default usePagination;
