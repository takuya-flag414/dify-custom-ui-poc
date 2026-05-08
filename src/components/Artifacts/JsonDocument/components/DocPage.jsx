import React from 'react';

const DocPage = ({ pageNumber, totalPages, children, title, showPageNumber = true }) => {
    return (
        <div className="json-doc-page">
            {/* Header */}
            {title && (
                <div className="doc-page-header">
                    <span className="doc-header-title">{title}</span>
                </div>
            )}

            {/* Content Area */}
            <div className="doc-page-content">
                {children}
            </div>

            {/* Footer */}
            {showPageNumber && (
                <div className="doc-page-footer">
                    <span className="doc-page-number">Page {pageNumber} of {totalPages}</span>
                </div>
            )}
        </div>
    );
};

export default DocPage;
