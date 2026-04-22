import React from 'react';
import PptxStructureView from './PptxStructureView';
import PptxVisualView from './PptxVisualView';

/**
 * PptxPreviewPane Component
 * ビジュアルビューとデータ構造ビューを切り替えるラッパーコンポーネント。
 * 編集機能の更新関数群（onUpdate）をデータ構造ビューに透過的に渡す。
 */
const PptxPreviewPane = ({ pptxSpec, viewMode = 'visual', onUpdate = null, originalSpec = null }) => {
    return (
        <div className="pptx-preview-wrapper" style={{ width: '100%' }}>
            {viewMode === 'visual' ? (
                <PptxVisualView pptxSpec={pptxSpec} />
            ) : (
                <PptxStructureView
                    pptxSpec={pptxSpec}
                    onUpdate={onUpdate}
                    originalSpec={originalSpec}
                />
            )}
        </div>
    );
};

export default PptxPreviewPane;
