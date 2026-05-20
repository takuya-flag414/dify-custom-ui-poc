import React from 'react';

const DocPage = ({ pageNumber, totalPages, children, title, showPageNumber = true, isCover = false, isLetter = false }) => {
    return (
        <div className={`json-doc-page ${isCover ? 'cover-page' : ''} ${isLetter ? 'letter-page' : ''}`}>
            {/* Header (表紙の場合は非表示) */}
            {title && !isCover && (
                <div className="doc-page-header">
                    <span className="doc-header-title">{title}</span>
                </div>
            )}

            {/* Content Area (表紙の場合はパディング0の専用スタイルを適用) */}
            <div className={isCover ? 'doc-page-content-cover' : 'doc-page-content'}>
                {children}
            </div>

            {/* Footer (表紙の場合は非表示) */}
            {showPageNumber && !isCover && (
                <div className="doc-page-footer">
                    <span className="doc-page-number">- {pageNumber} -</span>
                </div>
            )}
        </div>
    );
};

export default DocPage;
