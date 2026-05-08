import React from 'react';

/**
 * EditableBlockWrapper
 * プレビュー上の各ブロックをラップし、選択・編集を可能にするコンポーネントです。
 */
const EditableBlockWrapper = ({ children, isSelected, onClick, isEditMode }) => {
    if (!isEditMode) return children;

    return (
        <div 
            className={`editable-block-wrapper ${isSelected ? 'selected' : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
        >
            {children}
        </div>
    );
};

export default EditableBlockWrapper;
