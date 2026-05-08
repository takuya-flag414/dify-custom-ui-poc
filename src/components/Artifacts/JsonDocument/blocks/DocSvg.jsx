import React from 'react';

const DocSvg = ({ block }) => {
    // ストリーミング中などで content が空の場合は何も表示しない
    if (!block.content) return null;

    return (
        <div 
            className="doc-block-svg-container"
            dangerouslySetInnerHTML={{ __html: block.content }}
        />
    );
};

export default DocSvg;
