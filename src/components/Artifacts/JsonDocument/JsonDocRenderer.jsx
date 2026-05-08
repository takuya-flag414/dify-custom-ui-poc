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

                // ページ番号の制御: index 0 (表紙), index 1 (目次) は非表示
                const isMainContent = index >= 2;
                const isFirstMainPage = index === 2; // 本文1ページ目
                const displayPageNumber = isMainContent ? index - 1 : 0;
                const displayTotalPages = Math.max(0, pages.length - 2);

                return (
                    <DocPage 
                        key={index} 
                        pageNumber={displayPageNumber} 
                        totalPages={displayTotalPages}
                        showPageNumber={isMainContent}
                        title={isMainContent ? title : null}
                    >
                        <JsonDocParser 
                            blocks={pageBlocks} 
                            isEditMode={isEditMode}
                            onBlockClick={(idx) => {
                                // [Cover(0), TOC(1), FilteredBlock0(2), FilteredBlock1(3)...]
                                const globalIdx = idx + blockOffset;
                                if (globalIdx < 2) return; 
                                
                                const targetBlock = filteredBlocks[globalIdx - 2];
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

                                const targetIdxInFull = filteredIdx + 2;
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
