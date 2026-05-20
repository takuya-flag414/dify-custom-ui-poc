import React from 'react';
import usePagination from './utils/usePagination';
import JsonDocParser from './JsonDocParser';
import DocPage from './components/DocPage';

/**
 * JsonDocRenderer
 * ページネーションを管理し、複数のDocPageを描画します。
 */
const JsonDocRenderer = ({ 
    blocks = [], 
    title, 
    meta,
    isGenerating,
    isEditMode = false,
    selectedBlockIndex = null,
    onBlockClick = () => {}
}) => {
    // 本文内のタイトル重複を避けるため、H1を除外（usePagination内部と同じロジック）
    const filteredBlocks = blocks.filter(b => !(b.type === 'heading' && b.level === 1));

    // 目次生成を含む2パス・ページネーション計算
    const { pages, tocEntries } = usePagination(blocks, meta);

    if (pages.length === 0 && isGenerating) {
        return (
            <div className="doc-generating-placeholder">
                <div className="doc-spinner"></div>
                <p>ドキュメントを構成中...</p>
            </div>
        );
    }

    return (
        <div className="json-doc-renderer">
            {pages.map((pageBlocks, index) => {
                // ページ開始時のオフセットを計算
                let blockOffset = 0;
                for (let i = 0; i < index; i++) {
                    blockOffset += pages[i].length;
                }

                // ページ番号の制御:
                // 通常: index 0 (表紙), index 1 (目次) は非表示
                // レター: 1ページ目 (index 0) は非表示、2ページ目 (index >= 1) から開始
                const isLetter = meta?.template === 'letter';
                const isMainContent = isLetter ? index >= 1 : index >= 2;
                const displayPageNumber = isLetter 
                    ? (index + 1) 
                    : (isMainContent ? index - 1 : 0);
                const displayTotalPages = isLetter 
                    ? pages.length 
                    : Math.max(0, pages.length - 2);
                const showPageNo = isLetter ? (index >= 1) : isMainContent;

                return (
                    <DocPage 
                        key={index} 
                        pageNumber={displayPageNumber} 
                        totalPages={displayTotalPages}
                        showPageNumber={showPageNo}
                        title={isMainContent ? title : null}
                        isCover={!isLetter && index === 0}
                        isLetter={isLetter}
                    >
                        <JsonDocParser 
                            blocks={pageBlocks} 
                            pageIndex={index}
                            isEditMode={isEditMode}
                            onBlockClick={(idx) => {
                                const globalIdx = idx + blockOffset;
                                const headerCount = isLetter ? 1 : 2;
                                if (globalIdx < headerCount) return; 
                                
                                const targetBlock = filteredBlocks[globalIdx - headerCount];
                                const originalIdx = blocks.indexOf(targetBlock);
                                if (originalIdx !== -1) {
                                    onBlockClick(originalIdx);
                                }
                            }}
                            selectedBlockIndex={(() => {
                                if (selectedBlockIndex === null) return null;
                                
                                // originalIdx -> filteredIdx
                                const selectedBlock = blocks[selectedBlockIndex];
                                const filteredIdx = filteredBlocks.indexOf(selectedBlock);
                                if (filteredIdx === -1) return null;

                                const headerCount = isLetter ? 1 : 2;
                                const targetIdxInFull = filteredIdx + headerCount;
                                const localIdx = targetIdxInFull - blockOffset;
                                return (localIdx >= 0 && localIdx < pageBlocks.length) ? localIdx : null;
                            })()}
                        />
                        {isGenerating && index === pages.length - 1 && (
                            <span className="typing-cursor-inline"></span>
                        )}
                    </DocPage>
                );
            })}
        </div>
    );
};

export default JsonDocRenderer;
