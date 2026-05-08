import { useState, useEffect, useMemo } from 'react';

/**
 * A4ページの有効な高さ (px)
 * 1123px (A4) - Header/Footerの余白 = 約 900px
 */
const PAGE_HEIGHT_LIMIT = 900; 

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
            // 本文内のタイトル重複を避けるため、H1を除外
            const filteredBlocks = blocks.filter(b => !(b.type === 'heading' && b.level === 1));

            // --- Path 1: 暫定計算（本文のページ数を確認） ---
            let tempTocEntries = [];
            let currentHeight = 0;
            let currentContentPage = 1;

            filteredBlocks.forEach((block, index) => {
                const blockHeight = estimateBlockHeight(block);
                // 見出しの場合、孤立防止のためにバッファを追加して判定
                const checkHeight = block.type === 'heading' ? blockHeight + 150 : blockHeight;

                if (currentHeight + checkHeight > PAGE_HEIGHT_LIMIT) {
                    currentContentPage++;
                    currentHeight = blockHeight;
                } else {
                    currentHeight += blockHeight;
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

            // 1. 表紙ページ (独立)
            finalPages.push([{ type: 'cover', meta }]);

            // 2. 目次ページ (独立)
            const tocBlock = { type: 'toc', entries: tempTocEntries };
            finalPages.push([tocBlock]);

            // 3. 本文ページ
            let finalHeight = 0;
            let currentContentPageIndex = 2; // Pages[2] から本文

            filteredBlocks.forEach((block, index) => {
                const blockHeight = estimateBlockHeight(block);
                // 見出しの場合、孤立防止のためにバッファを追加して判定
                const checkHeight = block.type === 'heading' ? blockHeight + 150 : blockHeight;

                if (finalHeight + checkHeight > PAGE_HEIGHT_LIMIT || finalPages[currentContentPageIndex] === undefined) {
                    finalPages.push([block]);
                    if (finalPages.length > 3) {
                        currentContentPageIndex++;
                    }
                    finalHeight = blockHeight;
                } else {
                    finalPages[currentContentPageIndex].push(block);
                    finalHeight += blockHeight;
                }
            });

            // 目次内のページ番号は既に本文ベースで計算されているため、そのまま維持

            setPages(finalPages);
            setTocEntries(tempTocEntries);
        };

        calculateAll();
    }, [blocks, meta]);

    return { pages, tocEntries };
};

/**
 * 各ブロックの概算高さを計算
 */
const estimateBlockHeight = (block) => {
    switch (block.type) {
        case 'cover':
            return PAGE_HEIGHT_LIMIT; // 1ページ占有
        case 'heading':
            return block.level === 1 ? 80 : 60;
        case 'rich_text':
            const lineCount = Math.ceil((block.text?.length || 0) / 45);
            const newlineCount = (block.text?.match(/\n/g) || []).length;
            return (lineCount + newlineCount) * 25 + 20;
        case 'table':
            const rowCount = (block.rows?.length || 0);
            return rowCount * 45 + 60;
        case 'svg':
            return 200; 
        case 'list':
            return (block.items?.length || 0) * 30 + 20;
        case 'chart':
            return 350;
        case 'toc':
            return PAGE_HEIGHT_LIMIT; // 1ページ占有（独立ページ化）
        default:
            return 100;
    }
};

export default usePagination;
